import re, csv
from pathlib import Path

p = Path("backend/data/uploads/drogueria1_pricelist.csv")

def robust_parse(path):
    # Probar encodings
    for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
        try:
            with open(path, "r", encoding=enc) as f:
                raw_lines = [f.readline() for _ in range(30)]
            if any(raw_lines):
                break
        except:
            continue

    # Detectar delimitador contando frecuencias
    delims = [";", ",", "\t", "|"]
    best_delim = ";"
    max_count = 0
    for d in delims:
        c = sum(line.count(d) for line in raw_lines if line.strip())
        if c > max_count:
            max_count = c
            best_delim = d

    print(f"Delimitador detectado: {repr(best_delim)} (con {max_count} ocurrencias)")

    # Leer todo el CSV con el delimitador detectado
    with open(path, "r", encoding=enc) as f:
        reader = csv.reader(f, delimiter=best_delim)
        all_rows = list(reader)

    print(f"Total filas leidas: {len(all_rows)}")
    if not all_rows:
        return []

    # Detectar la fila de encabezados buscando palabras clave
    header_idx = 0
    for idx, row in enumerate(all_rows[:15]):
        row_str = " ".join(str(c).lower() for c in row)
        has_name = any(k in row_str for k in ["descripcion", "nombre", "producto", "articulo"])
        has_price = any(k in row_str for k in ["precio", "neto", "pvp", "costo", "usd"])
        if has_name and has_price:
            header_idx = idx
            break

    headers = [str(c).strip() for c in all_rows[header_idx]]
    data_rows = all_rows[header_idx + 1:]
    print(f"Fila de encabezado #{header_idx}: {headers[:8]}...")
    print(f"Filas de datos: {len(data_rows)}")
    return headers, data_rows

headers, data = robust_parse(p)
