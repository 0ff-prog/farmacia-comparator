import sys
from pathlib import Path
sys.path.insert(0, str(Path(".").resolve()))

from backend.scrapers.pharmacy_1_api import get_pharmacy_1_offers
from backend.scrapers.pharmacy_2_scraper import get_pharmacy_2_offers
from backend.services.price_comparator import consolidate_and_compare
import requests

l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
drog = str(l.get("droguerias", [{}])[0].get("cod_drogueria", "7"))

p1_offers = get_pharmacy_1_offers(drogueria_id=drog, token=tok)
p2_offers = get_pharmacy_2_offers()

print(f"Cobeca offers: {len(p1_offers)}")
print(f"Drogueria 1 offers: {len(p2_offers)}")

res = consolidate_and_compare(p1_offers + p2_offers)
print("\nMatriz consolidada total SKUs:", res["total_skus"])

# Cuántos productos tienen ofertas de AMBOS (Cobeca y Droguería 1)?
both = [i for i in res["items"] if "prov_1" in i["suppliers"] and "prov_2" in i["suppliers"]]
print(f"PRODUCTOS HOMOLOGADOS ENTRE COBECA Y DROGUERIA 1: {len(both)}")

bench = res["provider_benchmarks"]
print("\n--- BENCHMARKS ---")
print("Cobeca:", bench["prov_1"])
print("Droguería 1:", bench["prov_2"])
