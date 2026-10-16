"""
Drogueria 2 — Lector de lista de precios por documento (Excel / CSV).
Reemplaza el scraper B2B anterior.
Archivo esperado: backend/data/uploads/drogueria2_pricelist.xlsx  (o .csv)
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from typing import List, Dict, Any
from backend.models.product_model import SupplierOffer
from backend.scrapers.document_parser import parse_price_list

SUPPLIER_ID   = "prov_3"
SUPPLIER_NAME = "Drogueria 2"
UPLOADS_DIR   = BASE_DIR / "backend" / "data" / "uploads"
FILE_STEMS    = ["drogueria2_pricelist", "drogueria2", "pricelist_d2", "lista_d2"]


def _find_file() -> Path | None:
    for stem in FILE_STEMS:
        for ext in [".xlsx", ".xls", ".csv"]:
            candidate = UPLOADS_DIR / (stem + ext)
            if candidate.exists():
                return candidate
    return None


def get_pharmacy_3_offers() -> List[Dict[str, Any]]:
    file_path = _find_file()
    if file_path is None:
        print(f"  [Drogueria 2] No se encontro archivo en uploads/. Usando datos demo.")
        return _get_demo_offers()
    print(f"  [Drogueria 2] Leyendo: {file_path.name}")
    try:
        items = parse_price_list(file_path)
        print(f"  [Drogueria 2] {len(items)} productos parseados desde {file_path.name}")
        return _map_to_offers(items)
    except Exception as e:
        print(f"  [Drogueria 2] Error al parsear {file_path.name}: {e}")
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
        {"sku": "D2-001", "name": "Atorvastatina 20mg x30", "price": 3.95},
        {"sku": "D2-002", "name": "Losartan 50mg x30",      "price": 3.40},
        {"sku": "D2-003", "name": "Amoxicilina 500mg x12",  "price": 6.10},
        {"sku": "D2-004", "name": "Omeprazol 20mg x28",     "price": 3.10},
        {"sku": "D2-005", "name": "Metformina 850mg x30",   "price": 3.80},
    ]
    return [
        {"sku": d["sku"], "offer": SupplierOffer(
            supplier_id=SUPPLIER_ID, supplier_name=SUPPLIER_NAME,
            raw_name=d["name"], base_price=d["price"], in_stock=True
        )}
        for d in demo
    ]


if __name__ == "__main__":
    offers = get_pharmacy_3_offers()
    print(f"Total Drogueria 2: {len(offers)}")
    for o in offers[:3]:
        print(f"  SKU={o['sku']} | {o['offer'].raw_name} | ${o['offer'].base_price}")
