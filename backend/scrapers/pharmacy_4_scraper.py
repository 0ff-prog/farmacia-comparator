"""
Conector / Scraper para Proveedor 4 (Farmacia Farmatodo).
Permite extraer u homologar ofertas hacia el modelo estandarizado SupplierOffer.
"""
from typing import List, Dict, Any
from backend.models.product_model import SupplierOffer

def get_pharmacy_4_offers() -> List[Dict[str, Any]]:
    """
    Retorna las ofertas disponibles de Farmacia Farmatodo.
    """
    sample_farmatodo_items = [
        {"sku": "SKU-1001", "name": "Atorvastatina 20mg x 30 Tab", "price": 4.80, "stock": True},
        {"sku": "SKU-1002", "name": "Losartán Potásico 50mg x 30 Tab", "price": 3.65, "stock": True},
        {"sku": "SKU-1003", "name": "Amlodipina 10mg x 30 Tab", "price": 3.25, "stock": True},
        {"sku": "SKU-1004", "name": "Carvedilol 25mg x 30 Tab", "price": 6.10, "stock": True},
        {"sku": "SKU-1005", "name": "Enalapril Maleato 20mg x 30 Tab", "price": 2.70, "stock": True},
        {"sku": "SKU-2001", "name": "Acetaminofén 500mg x 20 Tab", "price": 1.85, "stock": True},
        {"sku": "SKU-2002", "name": "Ibuprofeno 400mg x 20 Cápsulas", "price": 3.10, "stock": True},
        {"sku": "SKU-2003", "name": "Ketoprofeno 100mg x 20 Comprimidos", "price": 5.40, "stock": False},
        {"sku": "SKU-2004", "name": "Diclofenac Sódico 50mg x 20 Grageas", "price": 2.45, "stock": True},
        {"sku": "SKU-3001", "name": "Amoxicilina + Clavulánico 875/125mg x 14", "price": 12.90, "stock": True},
        {"sku": "SKU-3002", "name": "Azitromicina 500mg x 3 Tab", "price": 5.20, "stock": True},
        {"sku": "SKU-3003", "name": "Ciprofloxacina 500mg x 10 Tab", "price": 5.90, "stock": True},
        {"sku": "SKU-4001", "name": "Omeprazol 20mg x 28 Cápsulas", "price": 3.60, "stock": True},
        {"sku": "SKU-4002", "name": "Pantoprazol 40mg x 28 Comprimidos", "price": 7.50, "stock": True},
        {"sku": "SKU-5001", "name": "Loratadina 10mg x 10 Tab", "price": 2.10, "stock": True},
        {"sku": "SKU-5002", "name": "Cetirizina 10mg x 10 Tab", "price": 2.80, "stock": True},
        {"sku": "SKU-6001", "name": "Metformina 850mg x 30 Tab", "price": 4.10, "stock": True},
        {"sku": "SKU-7001", "name": "Sertralina 50mg x 30 Comprimidos", "price": 8.90, "stock": True},
        {"sku": "SKU-8001", "name": "Betametasona Crema 0.05% x 30g", "price": 3.85, "stock": True},
        {"sku": "SKU-9001", "name": "Vitamina C 1000mg x 10 Tab Efervescentes", "price": 4.50, "stock": True}
    ]

    offers = []
    for item in sample_farmatodo_items:
        offer = SupplierOffer(
            supplier_id="prov_4",
            supplier_name="Farmacia Farmatodo",
            raw_name=item["name"],
            base_price=item["price"],
            in_stock=item["stock"],
            product_url="https://farmatodo.com.ve"
        )
        offers.append({"sku": item["sku"], "offer": offer})

    return offers

if __name__ == "__main__":
    results = get_pharmacy_4_offers()
    print(f"Farmacia Farmatodo: {len(results)} ofertas cargadas.")
