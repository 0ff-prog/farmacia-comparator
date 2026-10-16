"""
Drogueria 3 — Lector de lista de precios por documento (Excel / CSV).
Reemplaza el scraper B2B anterior.
Archivo esperado: backend/data/uploads/drogueria3_pricelist.xlsx  (o .csv)
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from typing import List, Dict, Any
from backend.models.product_model import SupplierOffer
from backend.scrapers.document_parser import parse_price_list

SUPPLIER_ID   = "prov_4"
SUPPLIER_NAME = "Drogueria 3"
UPLOADS_DIR   = BASE_DIR / "backend" / "data" / "uploads"
FILE_STEMS    = ["drogueria3_pricelist", "drogueria3", "pricelist_d3", "lista_d3"]


def _find_file() -> Path | None:
    for stem in FILE_STEMS:
        for ext in [".xlsx", ".xls", ".csv"]:
            candidate = UPLOADS_DIR / (stem + ext)
            if candidate.exists():
                return candidate
    return None


def get_pharmacy_4_offers() -> List[Dict[str, Any]]:
    file_path = _find_file()
    if file_path is None:
        print(f"  [Drogueria 3] No se encontro archivo en uploads/. Usando datos demo.")
        return _get_demo_offers()
    print(f"  [Drogueria 3] Leyendo: {file_path.name}")
    try:
        items = parse_price_list(file_path)
        print(f"  [Drogueria 3] {len(items)} productos parseados desde {file_path.name}")
        return _map_to_offers(items)
    except Exception as e:
        print(f"  [Drogueria 3] Error al parsear {file_path.name}: {e}")
        return _get_demo_offers()


def _map_to_offers(items: List[Dict]) -> List[Dict[str, Any]]:
    return [
        {
            "sku": item["sku"],
            "barcode": item.get("barcode"),
            "category": item.get("category", "General"),
            "active_ingredient": item.get("ingredient"),
            "offer": SupplierOffer(
                supplier_id=SUPPLIER_ID, supplier_name=SUPPLIER_NAME,
                raw_name=item["name"], base_price=item["price"],
                in_stock=item.get("in_stock", True)
            )
        }
        for item in items
    ]


def _get_demo_offers() -> List[Dict[str, Any]]:
    demo = [
        {"sku": "D3-001", "name": "Atorvastatina 20mg x30", "price": 4.80},
        {"sku": "D3-002", "name": "Losartan 50mg x30",      "price": 3.65},
        {"sku": "D3-003", "name": "Amoxicilina 500mg x12",  "price": 6.50},
        {"sku": "D3-004", "name": "Omeprazol 20mg x28",     "price": 3.55},
        {"sku": "D3-005", "name": "Metformina 850mg x30",   "price": 4.10},
    ]
    return [
        {"sku": d["sku"], "offer": SupplierOffer(
            supplier_id=SUPPLIER_ID, supplier_name=SUPPLIER_NAME,
            raw_name=d["name"], base_price=d["price"], in_stock=True
        )}
        for d in demo
    ]


if __name__ == "__main__":
    offers = get_pharmacy_4_offers()
    print(f"Total Drogueria 3: {len(offers)}")
    for o in offers[:3]:
        print(f"  SKU={o['sku']} | {o['offer'].raw_name} | ${o['offer'].base_price}")
