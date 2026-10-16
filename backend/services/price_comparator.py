import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from rapidfuzz import fuzz
from backend.models.product_model import SupplierOffer, ProductMaster
from backend.services.normalizer import check_is_ims, generate_master_id, clean_text

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROVIDER_NAMES_FILE = BASE_DIR / "backend" / "data" / "provider_names.json"

DEFAULT_PROVIDERS = [
    {"id": "prov_1", "name": "Cobeca", "short_name": "Cobeca"},
    {"id": "prov_2", "name": "Droguería 1", "short_name": "Droguería 1"},
    {"id": "prov_3", "name": "Droguería 2", "short_name": "Droguería 2"},
    {"id": "prov_4", "name": "Droguería 3", "short_name": "Droguería 3"},
]

def get_provider_definitions() -> List[Dict[str, str]]:
    """Carga los nombres de proveedores personalizados o los valores por defecto."""
    defs = [dict(p) for p in DEFAULT_PROVIDERS]
    if PROVIDER_NAMES_FILE.exists():
        try:
            with open(PROVIDER_NAMES_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
            for p in defs:
                if p["id"] in saved:
                    p["name"] = saved[p["id"]].get("name", p["name"])
                    p["short_name"] = saved[p["id"]].get("short_name", p["short_name"])
        except Exception:
            pass
    return defs

def calculate_adjusted_price(base_price: float, adjustment_percent: float = 0.0) -> float:
    """Calcula el precio ajustado según el porcentaje dinámico de negociación."""
    if base_price is None or base_price <= 0:
        return 0.0
    factor = 1.0 + (adjustment_percent / 100.0)
    return max(0.0, round(base_price * factor, 2))

def consolidate_and_compare(
    all_supplier_items: List[Dict[str, Any]],
    adjustments: Optional[Dict[str, float]] = None,
    preferred_provider_id: str = "prov_1"
) -> Dict[str, Any]:
    """
    Consolida las ofertas de las 4 farmacias en un catálogo matricial unificado,
    aplica ajustes porcentuales dinámicos y genera métricas de competitividad,
    desviaciones del proveedor preferido y análisis de rotación IMS (Top 800).
    """
    providers_list = get_provider_definitions()
    if adjustments is None:
        adjustments = {p["id"]: 0.0 for p in providers_list}

    # ── Identificar Top 800 IMS por Rotación Real de Medicamentos ──────────
    # Extraemos medicamentos con volumen de rotación (entrada_mercancia o existencia)
    med_candidates = []
    seen_skus = set()
    for entry in all_supplier_items:
        sku = str(entry.get("sku", "")).strip().upper()
        if not sku or sku in seen_skus:
            continue
        seen_skus.add(sku)

        tipo = str(entry.get("tipo_articulo") or "").upper()
        cat = str(entry.get("category") or "").upper()
        vol = float(entry.get("rotation_volume") or 0.0)

        # Considerar si es medicina o categoría salud
        is_medicine = ("MED" in tipo) or ("SALUD" in cat) or (vol > 0 and cat not in ("ALIMENTOS", "HOGAR", "VARIOS"))
        if is_medicine and vol > 0:
            med_candidates.append((sku, vol))

    # Ordenar de mayor a menor rotación
    med_candidates.sort(key=lambda x: x[1], reverse=True)

    # Tomar los 800 SKUs con mayor rotación
    top_800_skus = set([item[0] for item in med_candidates[:800]])

    # Persistir los 800 SKUs en ims_catalog.json si se detectaron suficientes
    if len(top_800_skus) >= 100:
        try:
            ims_cat_path = BASE_DIR / "backend" / "data" / "ims_catalog.json"
            ims_cat_path.parent.mkdir(parents=True, exist_ok=True)
            with open(ims_cat_path, "w", encoding="utf-8") as f:
                json.dump({"ims_skus": list(top_800_skus), "total": len(top_800_skus)}, f, indent=2)
        except Exception as e:
            print(f"Aviso guardando ims_catalog.json: {e}")

    def normalize_barcode(raw: Any) -> Optional[str]:
        if raw is None:
            return None
        s = str(raw).strip()
        if s in ('0', '0.0', 'None', '', 'NAN', 'null'):
            return None
        if '.' in s:
            s = s.split('.')[0]
        stripped = s.lstrip('0')
        if len(stripped) < 6:
            return None
        return stripped

    # ── ARQUITECTURA COBECA-MASTER ───────────────────────────────────────────
    # Cobeca es la droguería principal y base única del catálogo.
    # Los productos de archivos subidos (Droguería 1, 2, 3) solo se reflejan
    # como precios dentro de la fila del producto de Cobeca correspondiente.
    # Si un producto de un archivo no existe en Cobeca, NO se añade al catálogo.

    cobeca_items = []
    other_supplier_items = []

    for entry in all_supplier_items:
        offer = entry.get("offer")
        if not offer:
            continue
        offer_dict = offer.model_dump() if isinstance(offer, SupplierOffer) else dict(offer)
        if offer_dict.get("supplier_id") == "prov_1":
            cobeca_items.append(entry)
        else:
            other_supplier_items.append(entry)

    # Si no se obtuvieron datos de Cobeca, usar todos los ítems como respaldo
    if not cobeca_items:
        cobeca_items = all_supplier_items
        other_supplier_items = []

    matrix: Dict[str, Dict[str, Any]] = {}
    barcode_to_key: Dict[str, str] = {}
    slug_to_key: Dict[str, str] = {}
    cobeca_lookup_helpers = []

    # 1. Poblar la matriz EXCLUSIVAMENTE con los productos de Cobeca
    for entry in cobeca_items:
        raw_sku = str(entry.get("sku", "SKU-DESCONOCIDO")).strip().upper()
        raw_barcode = str(entry.get("barcode") or "").strip()
        if raw_barcode in ('0', '0.0', 'None', '', 'NAN', 'null'):
            raw_barcode = None
        norm_barcode = normalize_barcode(raw_barcode)

        offer = entry.get("offer")
        offer_dict = offer.model_dump() if isinstance(offer, SupplierOffer) else dict(offer)
        raw_name = offer_dict.get("raw_name", "Producto sin nombre")
        name_slug = generate_master_id(raw_name)

        matrix_key = raw_sku
        is_ims = (raw_sku in top_800_skus) or entry.get("is_ims", False) or check_is_ims(raw_sku)

        matrix[matrix_key] = {
            "master_id": name_slug,
            "sku": raw_sku,
            "barcode": raw_barcode,
            "display_name": raw_name,
            "active_ingredient": entry.get("active_ingredient", ""),
            "category": entry.get("category", "General"),
            "unit_of_measure": entry.get("unit_of_measure", "Unidad"),
            "is_ims": is_ims,
            "suppliers": {
                "prov_1": offer_dict
            }
        }

        if norm_barcode:
            barcode_to_key[norm_barcode] = matrix_key
        if name_slug:
            slug_to_key[name_slug] = matrix_key

        clean_n = clean_text(raw_name)
        cobeca_lookup_helpers.append({
            "key": matrix_key,
            "clean": clean_n,
            "numbers": set(re.findall(r'\d+', clean_n)),
            "first_word": clean_n.split()[0] if clean_n else ""
        })

    # 2. Homologar ofertas de otras droguerías (Droguería 1, 2, 3) sobre los productos de Cobeca
    # Si un producto de otra droguería no coincide con ningún ítem de Cobeca, se descarta.
    for entry in other_supplier_items:
        offer = entry.get("offer")
        if not offer:
            continue
        offer_dict = offer.model_dump() if isinstance(offer, SupplierOffer) else dict(offer)
        prov_id = offer_dict.get("supplier_id")
        if not prov_id or prov_id == "prov_1":
            continue

        raw_barcode = str(entry.get("barcode") or "").strip()
        norm_barcode = normalize_barcode(raw_barcode)
        raw_name = offer_dict.get("raw_name", "Producto sin nombre")
        name_slug = generate_master_id(raw_name)

        matched_key = None

        # A. Prioridad 1: Coincidencia por Código de Barras (EAN / GTIN / UPC)
        if norm_barcode and norm_barcode in barcode_to_key:
            matched_key = barcode_to_key[norm_barcode]
        # B. Prioridad 2: Coincidencia por Slug de Nombre
        elif name_slug and name_slug != "producto-sin-nombre" and name_slug in slug_to_key:
            matched_key = slug_to_key[name_slug]
        # C. Prioridad 3: Coincidencia Difusa para productos con variaciones de nombre
        else:
            clean_n = clean_text(raw_name)
            words = clean_n.split()
            if words and len(words[0]) >= 4:
                first_w = words[0]
                d_nums = set(re.findall(r'\d+', clean_n))
                best_k = None
                best_score = 0.0

                for cand in cobeca_lookup_helpers:
                    if cand["first_word"] == first_w:
                        # Asegurar que las dosis o cantidades no choquen (evita comparar 25g con 50g)
                        if d_nums and cand["numbers"] and not (d_nums & cand["numbers"]):
                            continue
                        score = fuzz.token_sort_ratio(clean_n, cand["clean"])
                        if score > best_score:
                            best_score = score
                            best_k = cand["key"]

                if best_score >= 85 and best_k:
                    matched_key = best_k

        # Si encontramos el producto correspondiente en Cobeca, agregamos el precio en su columna
        if matched_key and matched_key in matrix:
            matrix[matched_key]["suppliers"][prov_id] = offer_dict

    # Evaluar colorimetría, mínimos y desviaciones para cada producto
    evaluated_list = []
    for sku, prod in matrix.items():
        valid_prices = []
        evaluations = {}

        for p_info in providers_list:
            pid = p_info["id"]
            p_offer = prod["suppliers"].get(pid)
            adj = adjustments.get(pid, 0.0)

            if not p_offer or not p_offer.get("in_stock", True) or p_offer.get("base_price", 0) <= 0:
                evaluations[pid] = {
                    "has_offer": bool(p_offer),
                    "in_stock": bool(p_offer.get("in_stock", False)) if p_offer else False,
                    "base_price": p_offer.get("base_price") if p_offer else None,
                    "adjusted_price": None,
                    "color": "gray",
                    "status": "Sin Stock" if p_offer else "No Cotizado"
                }
            else:
                base_p = float(p_offer["base_price"])
                adj_p = calculate_adjusted_price(base_p, adj)
                evaluations[pid] = {
                    "has_offer": True,
                    "in_stock": True,
                    "base_price": base_p,
                    "adjusted_price": adj_p,
                    "adj_percent": adj,
                    "color": "normal",
                    "status": "Disponible"
                }
                valid_prices.append({"provider_id": pid, "price": adj_p})

        min_price = min([v["price"] for v in valid_prices]) if valid_prices else None
        max_price = max([v["price"] for v in valid_prices]) if valid_prices else None

        # Asignar colorimetría (Verde = Mínimo, Rojo = Máximo, Amarillo = Intermedio)
        for v in valid_prices:
            pid = v["provider_id"]
            price = v["price"]
            if price == min_price:
                evaluations[pid]["color"] = "green"
                evaluations[pid]["status"] = "Mejor Precio"
            elif price == max_price and max_price > min_price:
                evaluations[pid]["color"] = "red"
                evaluations[pid]["status"] = "Más Alto"
            else:
                evaluations[pid]["color"] = "yellow"
                evaluations[pid]["status"] = "Intermedio"

        winner_id = min(valid_prices, key=lambda x: x["price"])["provider_id"] if valid_prices else None

        # Desviación del Proveedor Preferido
        preferred_metrics = None
        pref_eval = evaluations.get(preferred_provider_id)

        if pref_eval and pref_eval.get("adjusted_price") is not None:
            pref_p = pref_eval["adjusted_price"]
            delta_min = round(((pref_p - min_price) / min_price) * 100, 1) if min_price and min_price > 0 else 0.0

            competitor_prices = [v["price"] for v in valid_prices if v["provider_id"] != preferred_provider_id]
            if competitor_prices:
                avg_comp = sum(competitor_prices) / len(competitor_prices)
                delta_media = round(((pref_p - avg_comp) / avg_comp) * 100, 1) if avg_comp > 0 else 0.0
            else:
                avg_comp = None
                delta_media = 0.0

            preferred_metrics = {
                "price": pref_p,
                "is_winner": (pref_p == min_price),
                "delta_min": delta_min,
                "delta_media": delta_media,
                "competitor_avg": round(avg_comp, 2) if avg_comp else None
            }

        prod_record = {
            **prod,
            "min_price": min_price,
            "max_price": max_price,
            "winner_id": winner_id,
            "evaluations": evaluations,
            "preferred_metrics": preferred_metrics
        }
        evaluated_list.append(prod_record)

    # Ordenar productos de forma lógica y estructurada:
    # 1. Medicamentos Top 800 IMS primero (Alta Rotación)
    # 2. Productos con múltiples droguerías cotizando (comparaciones activas)
    # 3. Nombre alfabético A-Z
    evaluated_list.sort(
        key=lambda x: (
            not x.get("is_ims", False),
            -len(x.get("suppliers", {})),
            x.get("display_name", "").lower()
        )
    )

    # Métricas Globales de Proveedores
    provider_stats = {}
    for p_info in providers_list:
        pid = p_info["id"]
        provider_stats[pid] = {
            "id": pid,
            "name": p_info["name"],
            "short_name": p_info["short_name"],
            "quoted_count": 0,
            "missing_count": 0,
            "win_count": 0,
            "win_rate": 0.0,
            "basket_total": 0.0,
            "ims_quoted_count": 0,
            "ims_win_count": 0,
            "ims_win_rate": 0.0,
            "ims_basket_total": 0.0,
            "icc": 1.0
        }

    for item in evaluated_list:
        for p_info in providers_list:
            pid = p_info["id"]
            ev = item["evaluations"].get(pid, {})
            stats = provider_stats[pid]

            if ev.get("adjusted_price") is not None:
                stats["quoted_count"] += 1
                stats["basket_total"] += ev["adjusted_price"]
                if ev.get("color") == "green":
                    stats["win_count"] += 1

                if item.get("is_ims"):
                    stats["ims_quoted_count"] += 1
                    stats["ims_basket_total"] += ev["adjusted_price"]
                    if ev.get("color") == "green":
                        stats["ims_win_count"] += 1

    total_catalog = len(evaluated_list)
    for pid, stats in provider_stats.items():
        stats["missing_count"] = total_catalog - stats["quoted_count"]
        stats["completeness_rate"] = round((stats["quoted_count"] / total_catalog * 100), 1) if total_catalog > 0 else 0.0
        stats["win_rate"] = round((stats["win_count"] / stats["quoted_count"] * 100), 1) if stats["quoted_count"] > 0 else 0.0
        stats["ims_win_rate"] = round((stats["ims_win_count"] / stats["ims_quoted_count"] * 100), 1) if stats["ims_quoted_count"] > 0 else 0.0
        stats["icc"] = round(stats["ims_win_rate"] / stats["win_rate"], 2) if stats["win_rate"] > 0 else 1.0
        stats["basket_total"] = round(stats["basket_total"], 2)
        stats["ims_basket_total"] = round(stats["ims_basket_total"], 2)

    return {
        "total_skus": total_catalog,
        "items": evaluated_list,
        "provider_benchmarks": provider_stats,
        "preferred_provider_id": preferred_provider_id
    }