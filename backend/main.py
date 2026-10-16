import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from typing import Optional
from backend.scrapers.pharmacy_1_api import get_pharmacy_1_offers
from backend.scrapers.pharmacy_2_scraper import get_pharmacy_2_offers
from backend.scrapers.pharmacy_3_scraper import get_pharmacy_3_offers
from backend.scrapers.pharmacy_4_scraper import get_pharmacy_4_offers
from backend.services.price_comparator import consolidate_and_compare
from backend.models.product_model import SupplierOffer


def get_cobeca_sample_fallback():
    """Catalogo de respaldo para Cobeca si el token JWT ha expirado."""
    sample = [
        {"sku": "SKU-1001", "name": "Atorvastatina 20mg x 30 Tab",         "price": 4.20},
        {"sku": "SKU-1002", "name": "Losartan Potasico 50mg x 30 Tab",      "price": 3.10},
        {"sku": "SKU-1003", "name": "Amlodipina 10mg x 30 Tab",             "price": 2.80},
        {"sku": "SKU-1004", "name": "Carvedilol 25mg x 30 Tab",             "price": 5.50},
        {"sku": "SKU-1005", "name": "Enalapril Maleato 20mg x 30 Tab",      "price": 2.20},
        {"sku": "SKU-2001", "name": "Acetaminofen 500mg x 20 Tab",          "price": 1.40},
        {"sku": "SKU-2002", "name": "Ibuprofeno 400mg x 20 Capsulas",       "price": 2.75},
        {"sku": "SKU-3001", "name": "Amoxicilina+Clavulanico 875mg x 14",   "price": 11.50},
        {"sku": "SKU-3002", "name": "Azitromicina 500mg x 3 Tab",           "price": 4.60},
        {"sku": "SKU-4001", "name": "Omeprazol 20mg x 28 Capsulas",         "price": 3.20},
        {"sku": "SKU-5001", "name": "Loratadina 10mg x 10 Tab",             "price": 1.80},
        {"sku": "SKU-6001", "name": "Metformina 850mg x 30 Tab",            "price": 3.50},
    ]
    return [
        {"sku": item["sku"], "offer": SupplierOffer(
            supplier_id="prov_1",
            supplier_name="Cobeca",
            raw_name=item["name"],
            base_price=item["price"],
            in_stock=True,
            product_url="https://comparadores.drogueriascobeca.com"
        )}
        for item in sample
    ]


def run_pipeline(token: Optional[str] = None, drogueria_id: Optional[str] = None):
    print("=" * 70)
    print("  COMPARADOR INTELIGENTE DE PRECIOS (COBECA + 3 DROGUERIAS)")
    print("=" * 70)

    # 1. Cobeca (API)
    print("\n[Cobeca] Consultando API REST...")
    try:
        p1_offers = get_pharmacy_1_offers(drogueria_id=drogueria_id, token=token)
        if not p1_offers:
            print("  Cobeca: API sin datos. Usando catalogo de respaldo.")
            p1_offers = get_cobeca_sample_fallback()
    except Exception as e:
        print(f"  Cobeca: Error de conexion ({e}). Usando catalogo de respaldo.")
        p1_offers = get_cobeca_sample_fallback()
    print(f"  Cobeca: {len(p1_offers)} productos.")

    # 2. Drogueria 1 (documento)
    print("\n[Drogueria 1] Leyendo lista de precios...")
    p2_offers = get_pharmacy_2_offers()
    print(f"  Drogueria 1: {len(p2_offers)} productos.")

    # 3. Drogueria 2 (documento)
    print("\n[Drogueria 2] Leyendo lista de precios...")
    p3_offers = get_pharmacy_3_offers()
    print(f"  Drogueria 2: {len(p3_offers)} productos.")

    # 4. Drogueria 3 (documento)
    print("\n[Drogueria 3] Leyendo lista de precios...")
    p4_offers = get_pharmacy_4_offers()
    print(f"  Drogueria 3: {len(p4_offers)} productos.")

    # 5. Consolidar
    all_offers = p1_offers + p2_offers + p3_offers + p4_offers
    print(f"\nConsolidando {len(all_offers)} ofertas totales...")

    adjustments = {"prov_1": 0.0, "prov_2": 0.0, "prov_3": 0.0, "prov_4": 0.0}
    result = consolidate_and_compare(
        all_supplier_items=all_offers,
        adjustments=adjustments,
        preferred_provider_id="prov_1"
    )
    print(f"Matriz consolidada: {result['total_skus']} SKUs unicos procesados.\n")

    # Benchmark
    print("--- BENCHMARK DE COMPETITIVIDAD ---")
    for pid, stats in result["provider_benchmarks"].items():
        print(f"[{stats['short_name']}] Canasta=${stats['basket_total']:.2f} | "
              f"WinRate={stats['win_rate']}% | ICC={stats['icc']}x | "
              f"Surtido={stats['completeness_rate']}%")

    # Guardar
    # Guardar atómicamente para evitar lecturas concurrentes corruptas
    output_path = BASE_DIR / "backend" / "data" / "consolidated_catalog.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = output_path.with_suffix(".tmp")
    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)
        temp_path.replace(output_path)
        print(f"\nCatalogo guardado atomicamente: {output_path.name}")
    except Exception as e:
        print(f"Aviso al guardar catalogo: {e}")
        if temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

    return result


if __name__ == "__main__":
    run_pipeline()
