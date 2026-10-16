import requests, json

l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
r = requests.post("https://comparadores.drogueriascobeca.com/api/articulos/drogueria", headers={"Authorization": tok, "Content-Type": "application/json"}, json={"drogueria": "7"}, timeout=30)
raw_items = r.json()

print(f"Total raw items: {len(raw_items)}")

sample = raw_items[0]
print("All keys in Cobeca article:")
for k in sorted(sample.keys()):
    print(f"  {k}: {sample[k]}")

# Analizar campos numéricos / booleanos en todos los items
print("\n--- Analisis de campos en 6862 items ---")
for field in ["destacado", "principal_destacado", "entrada_mercancia", "existencia", "minimo", "maximo", "porc_utilidad", "producto_estreno", "cod_marca_sanidad"]:
    non_zero = [i.get(field) for i in raw_items if i.get(field) not in (0, 0.0, False, None, "")]
    print(f"  {field}: {len(non_zero)} items con valor > 0")

# Probar endpoints alternativos
print("\n--- Probando posibles endpoints de IMS o rotación ---")
base = "https://comparadores.drogueriascobeca.com/api"
for ep in ["/articulos/top", "/articulos/ims", "/articulos/destacados", "/ims", "/top800", "/comparador", "/comparadores"]:
    try:
        res = requests.get(base + ep, headers={"Authorization": tok}, timeout=4)
        print(f"GET {ep} -> {res.status_code}")
    except:
        pass
