import requests, json

l = requests.post("https://comparadores.drogueriascobeca.com/api/Login", json={"Usuario": "F29990", "Clave": "Diana2109*"}, timeout=15).json()
tok = l.get("token")
base = "https://comparadores.drogueriascobeca.com/api"

for ep in ["/articulos/top", "/articulos/ims", "/articulos/rotacion", "/articulos/destacados"]:
    r = requests.post(base + ep, headers={"Authorization": tok, "Content-Type": "application/json"}, json={"drogueria": "7"}, timeout=10)
    print(f"\n=== {ep} ===")
    d = r.json()
    if isinstance(d, dict):
        print("Keys:", list(d.keys()))
        for k in d.keys():
            val = d[k]
            if isinstance(val, list):
                print(f"  Key '{k}': list of {len(val)} items")
                if len(val) > 0:
                    print(f"  Sample 0 in '{k}': {json.dumps(val[0], ensure_ascii=False)[:350]}")
            else:
                print(f"  Key '{k}': {str(val)[:100]}")
    elif isinstance(d, list):
        print(f"List of {len(d)} items")
        if len(d) > 0:
            print(f"Sample 0: {json.dumps(d[0], ensure_ascii=False)[:350]}")
