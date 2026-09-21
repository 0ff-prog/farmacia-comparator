"""
Conector / Scraper para Proveedor 3 (Farmacia Locatel).
Permite extraer u homologar ofertas hacia el modelo estandarizado SupplierOffer.
"""
from typing import List, Dict, Any
from backend.models.product_model import SupplierOffer

def get_pharmacy_3_offers() -> List[Dict[str, Any]]:
    """
    Retorna las ofertas disponibles de Farmacia Locatel.
    """
    sample_locatel_items = [
        {"sku": "SKU-1001", "name": "Atorvastatina 20mg x 30 Tab", "price": 3.95, "stock": True},
        {"sku": "SKU-1002", "name": "Losartán Potásico 50mg x 30 Tab", "price": 3.40, "stock": True},
        {"sku": "SKU-1003", "name": "Amlodipina 10mg x 30 Tab", "price": 2.65, "stock": True},
        {"sku": "SKU-1004", "name": "Carvedilol 25mg x 30 Tab", "price": 5.85, "stock": False},
        {"sku": "SKU-1005", "name": "Enalapril Maleato 20mg x 30 Tab", "price": 2.50, "stock": True},
        {"sku": "SKU-2001", "name": "Acetaminofén 500mg x 20 Tab", "price": 1.60, "stock": True},
        {"sku": "SKU-2002", "name": "Ibuprofeno 400mg x 20 Cápsulas", "price": 2.50, "stock": True},
        {"sku": "SKU-2003", "name": "Ketoprofeno 100mg x 20 Comprimidos", "price": 5.10, "stock": True},
        {"sku": "SKU-2004", "name": "Diclofenac Sódico 50mg x 20 Grageas", "price": 1.95, "stock": True},
        {"sku": "SKU-3001", "name": "Amoxicilina + Clavulánico 875/125mg x 14", "price": 10.80, "stock": True},
        {"sku": "SKU-3002", "name": "Azitromicina 500mg x 3 Tab", "price": 4.90, "stock": True},
        {"sku": "SKU-3003", "name": "Ciprofloxacina 500mg x 10 Tab", "price": 5.00, "stock": True},
        {"sku": "SKU-4001", "name": "Omeprazol 20mg x 28 Cápsulas", "price": 2.95, "stock": True},
        {"sku": "SKU-4002", "name": "Pantoprazol 40mg x 28 Comprimidos", "price": 7.10, "stock": True},
        {"sku": "SKU-5001", "name": "Loratadina 10mg x 10 Tab", "price": 1.95, "stock": True},
        {"sku": "SKU-5002", "name": "Cetirizina 10mg x 10 Tab", "price": 2.15, "stock": True},
        {"sku": "SKU-6001", "name": "Metformina 850mg x 30 Tab", "price": 3.80, "stock": True},
        {"sku": "SKU-7001", "name": "Sertralina 50mg x 30 Comprimidos", "price": 7.40, "stock": True},
        {"sku": "SKU-8001", "name": "Betametasona Crema 0.05% x 30g", "price": 3.15, "stock": True},
        {"sku": "SKU-9001", "name": "Vitamina C 1000mg x 10 Tab Efervescentes", "price": 3.60, "stock": True}
    ]

    offers = []
    for item in sample_locatel_items:
        offer = SupplierOffer(
            supplier_id="prov_3",
            supplier_name="Farmacia Locatel",
            raw_name=item["name"],
            base_price=item["price"],
            in_stock=item["stock"],
            product_url="https://locatel.com.ve"
        )
        offers.append({"sku": item["sku"], "offer": offer})

    return offers

if __name__ == "__main__":
    results = get_pharmacy_3_offers()
    print(f"Farmacia Locatel: {len(results)} ofertas cargadas.")
