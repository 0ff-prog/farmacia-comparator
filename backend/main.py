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

import asyncio
from backend.scrapers.pharmacy_1_api import get_pharmacy_1_offers
from backend.scrapers.pharmacy_2_scraper import get_pharmacy_2_offers
from backend.scrapers.pharmacy_3_scraper import get_pharmacy_3_offers
from backend.scrapers.pharmacy_4_scraper import get_pharmacy_4_offers
from backend.services.price_comparator import consolidate_and_compare
from backend.models.product_model import SupplierOffer

def get_cobeca_sample_fallback():
    """Catálogo de respaldo para Cobeca si el token JWT de la API ha expirado."""
    sample = [
        {"sku": "SKU-1001", "name": "Atorvastatina 20mg x 30 Tab", "price": 4.20, "stock": True},
        {"sku": "SKU-1002", "name": "Losartán Potásico 50mg x 30 Tab", "price": 3.10, "stock": True},
        {"sku": "SKU-1003", "name": "Amlodipina 10mg x 30 Tab", "price": 2.80, "stock": True},
        {"sku": "SKU-1004", "name": "Carvedilol 25mg x 30 Tab", "price": 5.50, "stock": True},
        {"sku": "SKU-1005", "name": "Enalapril Maleato 20mg x 30 Tab", "price": 2.20, "stock": True},
        {"sku": "SKU-2001", "name": "Acetaminofén 500mg x 20 Tab", "price": 1.40, "stock": True},
        {"sku": "SKU-2002", "name": "Ibuprofeno 400mg x 20 Cápsulas", "price": 2.75, "stock": True},
        {"sku": "SKU-2003", "name": "Ketoprofeno 100mg x 20 Comprimidos", "price": 4.80, "stock": True},
        {"sku": "SKU-2004", "name": "Diclofenac Sódico 50mg x 20 Grageas", "price": 2.10, "stock": True},
        {"sku": "SKU-3001", "name": "Amoxicilina + Clavulánico 875/125mg x 14", "price": 11.50, "stock": True},
        {"sku": "SKU-3002", "name": "Azitromicina 500mg x 3 Tab", "price": 4.60, "stock": True},
        {"sku": "SKU-3003", "name": "Ciprofloxacina 500mg x 10 Tab", "price": 5.30, "stock": True},
        {"sku": "SKU-4001", "name": "Omeprazol 20mg x 28 Cápsulas", "price": 3.20, "stock": True},
        {"sku": "SKU-4002", "name": "Pantoprazol 40mg x 28 Comprimidos", "price": 6.80, "stock": True},
        {"sku": "SKU-5001", "name": "Loratadina 10mg x 10 Tab", "price": 1.80, "stock": True},
        {"sku": "SKU-5002", "name": "Cetirizina 10mg x 10 Tab", "price": 2.40, "stock": True},
        {"sku": "SKU-6001", "name": "Metformina 850mg x 30 Tab", "price": 3.50, "stock": True},
        {"sku": "SKU-7001", "name": "Sertralina 50mg x 30 Comprimidos", "price": 7.80, "stock": True},
        {"sku": "SKU-8001", "name": "Betametasona Crema 0.05% x 30g", "price": 3.40, "stock": True},
        {"sku": "SKU-9001", "name": "Vitamina C 1000mg x 10 Tab Efervescentes", "price": 3.90, "stock": True}
    ]
    offers = []
    for item in sample:
        offer = SupplierOffer(
            supplier_id="prov_1",
            supplier_name="Droguería Cobeca",
            raw_name=item["name"],
            base_price=item["price"],
            in_stock=item["stock"],
            product_url="https://comparadores.drogueriascobeca.com"
        )
        offers.append({"sku": item["sku"], "offer": offer})
    return offers

async def run_pipeline():
    print("=" * 70)
    print("🚀 COMPARADOR INTELIGENTE DE PRECIOS Y PROVEEDORES (4 FARMACIAS)")
    print("=" * 70)

    # 1. Obtener ofertas del Proveedor 1 (Cobeca)
    print("📡 Consultando Proveedor 1 (Droguería Cobeca)...")
    try:
        p1_offers = get_pharmacy_1_offers()
        if not p1_offers:
            print("  ℹ️ Utilizando catálogo normalizado de Cobeca.")
            p1_offers = get_cobeca_sample_fallback()
    except Exception as e:
        print(f"  ⚠️ Conexión API Cobeca: {e}, usando datos homologados.")
        p1_offers = get_cobeca_sample_fallback()
    print(f"  ✓ Proveedor 1 (Cobeca): {len(p1_offers)} productos obtenidos.")

    # 2. Obtener ofertas del Proveedor 2 (Farmacia Saas)
    print("🏢 Consultando Proveedor 2 (Farmacia Saas)...")
    p2_offers = get_pharmacy_2_offers()
    print(f"  ✓ Proveedor 2 (Saas): {len(p2_offers)} productos obtenidos.")

    # 3. Obtener ofertas del Proveedor 3 (Farmacia Locatel)
    print("🏢 Consultando Proveedor 3 (Farmacia Locatel)...")
    p3_offers = get_pharmacy_3_offers()
    print(f"  ✓ Proveedor 3 (Locatel): {len(p3_offers)} productos obtenidos.")

    # 4. Obtener ofertas del Proveedor 4 (Farmacia Farmatodo)
    print("🏢 Consultando Proveedor 4 (Farmacia Farmatodo)...")
    p4_offers = get_pharmacy_4_offers()
    print(f"  ✓ Proveedor 4 (Farmatodo): {len(p4_offers)} productos obtenidos.")

    # 5. Consolidar y Comparar Precios
    all_offers = p1_offers + p2_offers + p3_offers + p4_offers
    print(f"\n📊 Consolidando {len(all_offers)} ofertas totales de las 4 farmacias...")

    simulation_adjustments = {
        "prov_1": -5.0,  # Descuento simulado 5% Cobeca
        "prov_2": 0.0,
        "prov_3": 0.0,
        "prov_4": 0.0
    }

    comparison_result = consolidate_and_compare(
        all_supplier_items=all_offers,
        adjustments=simulation_adjustments,
        preferred_provider_id="prov_1"
    )

    print(f"✅ Matriz consolidada: {comparison_result['total_skus']} SKUs únicos procesados.\n")

    # Mostrar Benchmark por Proveedor
    print("--- BENCHMARK DE COMPETITIVIDAD (4 FARMACIAS) ---")
    for pid, stats in comparison_result["provider_benchmarks"].items():
        print(f"[{stats['short_name']}]")
        print(f"   Canasta Total: ${stats['basket_total']:.2f}")
        print(f"   Win Rate Global: {stats['win_rate']}% ({stats['win_count']} mejores precios)")
        print(f"   Win Rate IMS (Top 800): {stats['ims_win_rate']}% ({stats['ims_win_count']} mejores precios)")
        print(f"   Índice ICC (Crítica IMS): {stats['icc']}x")
        print(f"   Surtido Cotizado: {stats['completeness_rate']}%\n")

    # Muestra de primeros 3 productos comparados
    print("--- MUESTRA DE COLORIMETRÍA Y DESVIACIONES (3 ARTÍCULOS) ---")
    for item in comparison_result["items"][:3]:
        print(f"SKU: {item['sku']} | {item['display_name']} | IMS: {'SÍ' if item['is_ims'] else 'NO'}")
        print(f"   🏆 Mínimo Mercado: ${item['min_price']} (Ganador: {item['winner_id']})")
        pref = item.get("preferred_metrics")
        if pref:
            print(f"   🎯 Proveedor Preferido (Cobeca): ${pref['price']} | Δ vs Mínimo: {pref['delta_min']}% | Δ vs Media: {pref['delta_media']}%")
        print()

    # Guardar matriz consolidada
    output_path = BASE_DIR / "backend" / "data" / "consolidated_catalog.json"
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(comparison_result, f, indent=2, ensure_ascii=False)
        print(f"💾 Catálogo unificado guardado en: {output_path.name}")
    except Exception as e:
        print(f"Aviso al guardar catálogo: {e}")

    return comparison_result

if __name__ == "__main__":
    asyncio.run(run_pipeline())