"""
Drogueria 1 — Lector de lista de precios por documento (Excel / CSV).
Reemplaza el scraper B2B anterior.
Archivo esperado: backend/data/uploads/drogueria1_pricelist.xlsx  (o .csv)
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from typing import List, Dict, Any
from backend.models.product_model import SupplierOffer
from backend.scrapers.document_parser import parse_price_list

SUPPLIER_ID   = "prov_2"
SUPPLIER_NAME = "Drogueria 1"
UPLOADS_DIR   = BASE_DIR / "backend" / "data" / "uploads"
FILE_STEMS    = ["drogueria1_pricelist", "drogueria1", "pricelist_d1", "lista_d1"]


def _find_file() -> Path | None:
    """Busca el archivo de precios de Drogueria 1 en la carpeta uploads (el más reciente)."""
    candidates = []
    for stem in FILE_STEMS:
        for ext in [".xlsx", ".xls", ".csv"]:
            c = UPLOADS_DIR / (stem + ext)
            if c.exists():
                candidates.append(c)
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def get_pharmacy_2_offers() -> List[Dict[str, Any]]:
    """
    Lee el archivo de lista de precios de Drogueria 1 y retorna ofertas normalizadas.
    Si no existe el archivo, retorna datos demo minimos.
    """
    file_path = _find_file()

    if file_path is None:
        return []

    print(f"  [Drogueria 1] Leyendo: {file_path.name}")
    try:
        items = parse_price_list(file_path)
        print(f"  [Drogueria 1] {len(items)} productos parseados desde {file_path.name}")
        return _map_to_offers(items)
    except Exception as e:
        print(f"  [Drogueria 1] Error al parsear {file_path.name}: {e}")
        return []


def _map_to_offers(items: List[Dict]) -> List[Dict[str, Any]]:
    result = []
    for item in items:
        offer = SupplierOffer(
            supplier_id=SUPPLIER_ID,
            supplier_name=SUPPLIER_NAME,
            raw_name=item["name"],
            base_price=item["price"],
            in_stock=item.get("in_stock", True),
        )
        result.append({
            "sku": item["sku"],
            "barcode": item.get("barcode"),
            "category": item.get("category", "General"),
            "active_ingredient": item.get("ingredient"),
            "offer": offer
        })
    return result


def _get_demo_offers() -> List[Dict[str, Any]]:
    """Datos de muestra cuando no hay archivo cargado."""
    demo = [
        {"sku": "D1-001", "name": "Atorvastatina 20mg x30", "price": 4.45},
        {"sku": "D1-002", "name": "Losartan 50mg x30",      "price": 2.90},
        {"sku": "D1-003", "name": "Amoxicilina 500mg x12",  "price": 5.80},
        {"sku": "D1-004", "name": "Omeprazol 20mg x28",     "price": 3.30},
        {"sku": "D1-005", "name": "Metformina 850mg x30",   "price": 3.60},
    ]
    return [
        {"sku": d["sku"], "offer": SupplierOffer(
            supplier_id=SUPPLIER_ID, supplier_name=SUPPLIER_NAME,
            raw_name=d["name"], base_price=d["price"], in_stock=True
        )}
        for d in demo
    ]


if __name__ == "__main__":
    offers = get_pharmacy_2_offers()
    print(f"Total Drogueria 1: {len(offers)}")
    for o in offers[:3]:
        print(f"  SKU={o['sku']} | {o['offer'].raw_name} | ${o['offer'].base_price}")
