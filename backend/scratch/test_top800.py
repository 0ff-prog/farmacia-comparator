import json

# Cargar los raw items o hacer la prueba sobre el catalogo de Cobeca
import requests
l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
r = requests.post("https://comparadores.drogueriascobeca.com/api/articulos/drogueria", headers={"Authorization": tok, "Content-Type": "application/json"}, json={"drogueria": "7"}, timeout=30)
raw = r.json()

# Filtrar medicinas / salud
meds = []
for i in raw:
    tipo = (i.get("tipoArticulo") or {}).get("codigo", "").strip()
    cat = (i.get("categoria") or {}).get("descripcion", "")
    # Volumen de rotación = entrada_mercancia (prioridad) o existencia
    vol = float(i.get("entrada_mercancia") or i.get("existencia") or 0)
    sku = str(i.get("cod_articulo") or "").strip()
    name = str(i.get("desc_articulo") or "").strip()
    price = float(i.get("monto_final_referencial") or 0)
    
    if (tipo == "MED" or cat == "Salud") and sku and vol > 0:
        meds.append({"sku": sku, "name": name, "vol": vol, "price": price})

# Ordenar de mayor a menor volumen
meds_sorted = sorted(meds, key=lambda x: x["vol"], reverse=True)

top_800 = meds_sorted[:800]
print(f"Total medicamentos con rotación: {len(meds_sorted)}")
print(f"Top 800 seleccionados: {len(top_800)}")
print(f"Volumen del #1: {top_800[0]['name']} -> {top_800[0]['vol']} unidades")
print(f"Volumen del #400: {top_800[399]['name']} -> {top_800[399]['vol']} unidades")
print(f"Volumen del #800: {top_800[-1]['name']} -> {top_800[-1]['vol']} unidades")
