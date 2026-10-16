import json
from collections import Counter
import requests

l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
r = requests.post("https://comparadores.drogueriascobeca.com/api/articulos/drogueria", headers={"Authorization": tok, "Content-Type": "application/json"}, json={"drogueria": "7"}, timeout=30)
raw = r.json()

meds = []
for i in raw:
    tipo = (i.get("tipoArticulo") or {}).get("codigo", "").strip()
    cat = (i.get("categoria") or {}).get("descripcion", "")
    if tipo == "MED" or cat == "Salud":
        meds.append(i)

print(f"Total medicamentos (tipo MED o cat Salud): {len(meds)}")

# Ordenar por entrada_mercancia (volumen de reposición/rotación)
meds_by_entrada = sorted(meds, key=lambda x: (x.get("entrada_mercancia") or 0), reverse=True)
print("\nTop 15 medicamentos con mayor volumen de rotación (entrada_mercancia):")
for idx, m in enumerate(meds_by_entrada[:15], 1):
    comp = (m.get("componenteBase") or {}).get("descripcion", "")
    print(f"  #{idx} [{m.get('cod_articulo')}] {m.get('desc_articulo')} | Componente: {comp} | Entrada: {m.get('entrada_mercancia')} | Existencia: {m.get('existencia')} | Precio: ${m.get('monto_final_referencial')}")

# Cuántos tienen entrada_mercancia > 0?
con_movimiento = [m for m in meds if (m.get("entrada_mercancia") or 0) > 0 or (m.get("existencia") or 0) > 0]
print(f"\nMedicamentos con inventario/movimiento activo: {len(con_movimiento)}")
