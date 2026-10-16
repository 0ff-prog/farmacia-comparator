import sys, os
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import json, requests
from backend.main import run_pipeline

l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
drog = str(l.get("droguerias", [{}])[0].get("cod_drogueria", "7"))

res = run_pipeline(token=tok, drogueria_id=drog)
items = res.get("items", [])
ims_items = [i for i in items if i.get("is_ims")]

print(f"\n==========================================")
print(f"Total productos en catálogo: {len(items)}")
print(f"Total productos Top 800 IMS identificados: {len(ims_items)}")
print(f"==========================================")
print("\nMuestra de los primeros 5 productos Top 800 IMS:")
for idx, item in enumerate(ims_items[:5], 1):
    print(f"  #{idx} [{item['sku']}] {item['display_name']} | Precio: ${item['min_price']} | Activo: {item.get('active_ingredient')}")

bench = res.get("provider_benchmarks", {}).get("prov_1", {})
print("\nBenchmark Cobeca para Top 800 IMS:")
print(f"  Artículos cotizados en IMS: {bench.get('ims_quoted_count')}")
print(f"  Canasta Top 800 IMS: ${bench.get('ims_basket_total'):.2f}")
print(f"  Win Rate IMS: {bench.get('ims_win_rate')}%")
