import sys
from pathlib import Path
sys.path.insert(0, str(Path(".").resolve()))

from backend.scrapers.pharmacy_1_api import get_pharmacy_1_offers
from backend.scrapers.pharmacy_2_scraper import get_pharmacy_2_offers
from backend.services.normalizer import generate_master_id
import requests

l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
drog = str(l.get("droguerias", [{}])[0].get("cod_drogueria", "7"))

p1_offers = get_pharmacy_1_offers(drogueria_id=drog, token=tok)
p2_offers = get_pharmacy_2_offers()

# Simular matching con barcode y slug
matrix = {}
barcode_to_key = {}
slug_to_key = {}

for entry in p1_offers + p2_offers:
    sku = str(entry.get("sku", "")).strip().upper()
    bar = str(entry.get("barcode") or "").strip()
    if bar in ("0", "0.0", "None", "", "NAN"): bar = None
    
    raw_name = entry["offer"].raw_name
    slug = generate_master_id(raw_name)
    
    # 1. Match por código de barra
    match_key = None
    if bar and bar in barcode_to_key:
        match_key = barcode_to_key[bar]
    elif slug and slug in slug_to_key:
        match_key = slug_to_key[slug]
    elif sku in matrix:
        match_key = sku
        
    mkey = match_key if match_key else sku
    if mkey not in matrix:
        matrix[mkey] = {
            "sku": sku,
            "barcode": bar,
            "display_name": raw_name,
            "suppliers": {}
        }
        if bar: barcode_to_key[bar] = mkey
        if slug: slug_to_key[slug] = mkey
        
    matrix[mkey]["suppliers"][entry["offer"].supplier_id] = entry["offer"]
    if bar and not matrix[mkey].get("barcode"):
        matrix[mkey]["barcode"] = bar
        barcode_to_key[bar] = mkey

both = [i for i in matrix.values() if "prov_1" in i["suppliers"] and "prov_2" in i["suppliers"]]
print(f"Total productos en catálogo unificado: {len(matrix)}")
print(f"TOTAL PRODUCTOS COMPARADOS LADO A LADO: {len(both)}")
print("\nPrimeros 5 productos comparados lado a lado:")
for idx, p in enumerate(both[:5], 1):
    c_p = p["suppliers"]["prov_1"].base_price
    d_p = p["suppliers"]["prov_2"].base_price
    diff = ((d_p - c_p) / c_p) * 100 if c_p > 0 else 0
    winner = "Cobeca" if c_p <= d_p else "Droguería 1"
    print(f"  #{idx} {p['display_name'][:45]} | Cobeca: ${c_p:.2f} | Drog 1: ${d_p:.2f} | Ganador: {winner} ({diff:+.1f}%)")
