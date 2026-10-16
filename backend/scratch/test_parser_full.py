import re, csv
from pathlib import Path

p = Path("backend/data/uploads/drogueria1_pricelist.csv")

def _normalize(s: str) -> str:
    s = s.lower().strip()
    for a, b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n'),('ü','u')]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

def _detect_columns(headers):
    norm = [_normalize(h) for h in headers]
    col = {
        'price_usd': None, 'price_gen': None, 'tasa': None,
        'sku': None, 'name': None, 'stock': None,
        'category': None, 'ingredient': None, 'brand': None
    }
    
    # 1. USD Price
    for i, n in enumerate(norm):
        if any(k in n for k in ['preciousd', 'netousd', 'dvnetousd', 'usd', 'dolar', 'divisa']):
            col['price_usd'] = i
            break

    # 2. General Price
    for i, n in enumerate(norm):
        if col['price_usd'] != i and any(k in n for k in ['precio', 'neto', 'pvp', 'costo', 'valor', 'monto']):
            col['price_gen'] = i
            break

    # 3. Tasa
    for i, n in enumerate(norm):
        if 'tasa' in n:
            col['tasa'] = i
            break

    # 4. Name / Descripcion
    for i, n in enumerate(norm):
        if any(k in n for k in ['descripcion', 'nombre', 'producto', 'articulo', 'detalle']):
            col['name'] = i
            break

    # 5. SKU / Codigo
    for i, n in enumerate(norm):
        if i != col['name'] and any(k in n for k in ['codigo', 'sku', 'codart', 'cod', 'item', 'ref', 'barra']):
            col['sku'] = i
            break

    # 6. Stock / Existencia
    for i, n in enumerate(norm):
        if any(k in n for k in ['existencia', 'stock', 'disponible', 'cantidad', 'cant', 'unidades']):
            col['stock'] = i
            break

    # 7. Categoria / Departamento
    for i, n in enumerate(norm):
        if any(k in n for k in ['departamento', 'categoria', 'linea', 'grupo', 'clase', 'familia', 'division']):
            col['category'] = i
            break

    # 8. Marca / Laboratorio
    for i, n in enumerate(norm):
        if any(k in n for k in ['marca', 'laboratorio', 'proveedor', 'fabricante', 'lab']):
            col['brand'] = i
            break

    return col

def _clean_price(raw):
    if raw is None:
        return 0.0
    s = str(raw).strip().replace('$', '').replace('\xa0', '').strip()
    if ',' in s and '.' in s:
        # e.g. 11.155,68 -> 11155.68
        s = s.replace('.', '').replace(',', '.')
    elif ',' in s:
        s = s.replace(',', '.')
    try:
        return float(s)
    except:
        return 0.0

with open(p, "r", encoding="utf-8") as f:
    reader = csv.reader(f, delimiter=';')
    rows = list(reader)

headers = rows[0]
cols = _detect_columns(headers)
print("Detected column mapping:")
for k, v in cols.items():
    print(f"  {k}: index {v} -> '{headers[v] if v is not None else 'None'}'")

# Probar extracción de los primeros 5 items
print("\nPrimeros 5 items parseados:")
for idx, r in enumerate(rows[1:6], 1):
    name = r[cols['name']]
    sku = r[cols['sku']]
    # Precio prioritario USD
    p_usd = _clean_price(r[cols['price_usd']]) if cols['price_usd'] is not None else 0.0
    p_gen = _clean_price(r[cols['price_gen']]) if cols['price_gen'] is not None else 0.0
    tasa = _clean_price(r[cols['tasa']]) if cols['tasa'] is not None else 0.0
    
    price = p_usd if p_usd > 0 else (round(p_gen / tasa, 2) if (tasa > 0 and p_gen > 0) else p_gen)
    stock_val = _clean_price(r[cols['stock']]) if cols['stock'] is not None else 0
    cat = r[cols['category']] if cols['category'] is not None else 'General'
    brand = r[cols['brand']] if cols['brand'] is not None else ''

    print(f"  #{idx} [{sku}] {name} | Marca: {brand} | Cat: {cat} | Stock: {stock_val} | Precio USD: ${price:.2f}")

# Contar cuántos items válidos de 3334 se obtienen
valid_items = 0
for r in rows[1:]:
    name = str(r[cols['name']] if cols['name'] is not None else '').strip()
    p_usd = _clean_price(r[cols['price_usd']]) if cols['price_usd'] is not None else 0.0
    p_gen = _clean_price(r[cols['price_gen']]) if cols['price_gen'] is not None else 0.0
    tasa = _clean_price(r[cols['tasa']]) if cols['tasa'] is not None else 0.0
    price = p_usd if p_usd > 0 else (round(p_gen / tasa, 2) if (tasa > 0 and p_gen > 0) else p_gen)
    if name and price > 0:
        valid_items += 1

print(f"\nTotal items válidos parseados con precio y nombre: {valid_items} de {len(rows)-1}")
