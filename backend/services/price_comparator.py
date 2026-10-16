import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.models.product_model import SupplierOffer, ProductMaster
from backend.services.normalizer import check_is_ims, generate_master_id

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DEFAULT_PROVIDERS = [
    {"id": "prov_1", "name": "Cobeca", "short_name": "Cobeca"},
    {"id": "prov_2", "name": "Droguería 1", "short_name": "Droguería 1"},
    {"id": "prov_3", "name": "Droguería 2", "short_name": "Droguería 2"},
    {"id": "prov_4", "name": "Droguería 3", "short_name": "Droguería 3"},
]

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
    if adjustments is None:
        adjustments = {p["id"]: 0.0 for p in DEFAULT_PROVIDERS}

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

    matrix: Dict[str, Dict[str, Any]] = {}
    barcode_to_key: Dict[str, str] = {}
    slug_to_key: Dict[str, str] = {}

    for entry in all_supplier_items:
        raw_sku = str(entry.get("sku", "SKU-DESCONOCIDO")).strip().upper()
        raw_barcode = str(entry.get("barcode") or "").strip()
        if raw_barcode in ('0', '0.0', 'None', '', 'NAN'):
            raw_barcode = None

        offer = entry.get("offer")
        category = entry.get("category", "General")
        unit = entry.get("unit_of_measure", "Unidad")
        active_ing = entry.get("active_ingredient", "")

        if not offer:
            continue

        if isinstance(offer, SupplierOffer):
            offer_dict = offer.model_dump()
        else:
            offer_dict = dict(offer)

        raw_name = offer_dict.get("raw_name", "Producto sin nombre")
        name_slug = generate_master_id(raw_name)

        # 1. Buscar coincidencia por código de barra (prioridad máxima)
        matched_key = None
        if raw_barcode and raw_barcode in barcode_to_key:
            matched_key = barcode_to_key[raw_barcode]
        # 2. Buscar por slug de nombre normalizado
        elif name_slug and name_slug in slug_to_key:
            matched_key = slug_to_key[name_slug]
        # 3. Buscar por SKU
        elif raw_sku and raw_sku != "SKU-DESCONOCIDO" and raw_sku in matrix:
            matched_key = raw_sku

        matrix_key = matched_key if matched_key else (raw_sku if raw_sku != "SKU-DESCONOCIDO" else name_slug)

        if matrix_key not in matrix:
            is_ims = (raw_sku in top_800_skus) or entry.get("is_ims", False) or check_is_ims(raw_sku)
            matrix[matrix_key] = {
                "master_id": name_slug,
                "sku": raw_sku,
                "barcode": raw_barcode,
                "display_name": raw_name,
                "active_ingredient": active_ing,
                "category": category,
                "unit_of_measure": unit,
                "is_ims": is_ims,
                "suppliers": {}
            }
            if raw_barcode:
                barcode_to_key[raw_barcode] = matrix_key
            if name_slug:
                slug_to_key[name_slug] = matrix_key
        else:
            if (raw_sku in top_800_skus) or entry.get("is_ims", False):
                matrix[matrix_key]["is_ims"] = True
            if raw_barcode and not matrix[matrix_key].get("barcode"):
                matrix[matrix_key]["barcode"] = raw_barcode
                barcode_to_key[raw_barcode] = matrix_key
            if not matrix[matrix_key].get("active_ingredient") and active_ing:
                matrix[matrix_key]["active_ingredient"] = active_ing

        matrix[matrix_key]["suppliers"][offer_dict["supplier_id"]] = offer_dict

    # Evaluar colorimetría, mínimos y desviaciones para cada producto
    evaluated_list = []
    for sku, prod in matrix.items():
        valid_prices = []
        evaluations = {}

        for p_info in DEFAULT_PROVIDERS:
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

    # Métricas Globales de Proveedores
    provider_stats = {}
    for p_info in DEFAULT_PROVIDERS:
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
        for p_info in DEFAULT_PROVIDERS:
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