"""
Motor universal y adaptativo de parseo de listas de precios (Excel / CSV).
Diseñado para admitir variaciones en el diseño de documentos:
- Delimitadores múltiples (; , \t |) con detección automática por frecuencia.
- Búsqueda inteligente de la fila de encabezados (ignora logos, títulos de empresa o filas vacías).
- Mapeo prioritario de columnas (Precios USD vs Moneda Local, Código/Barra, Descripción, etc.).
- Soporte para formatos numéricos con coma o punto decimal y conversión por tasa de cambio.
- Soporte para múltiples hojas de Excel (.xlsx, .xls) y encodings comunes (UTF-8, Latin-1, CP1252).
"""
import re
import csv
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False


# ---------------------------------------------------------------------------
# Normalización de cadenas para emparejamiento insensible
# ---------------------------------------------------------------------------

def _normalize(s: str) -> str:
    """Convierte a minúsculas, elimina acentos y caracteres especiales."""
    if s is None:
        return ""
    s = str(s).lower().strip()
    for a, b in [
        ('á', 'a'), ('é', 'e'), ('í', 'i'), ('ó', 'o'), ('ú', 'u'),
        ('ñ', 'n'), ('ü', 'u'), ('\xe1', 'a'), ('\xe9', 'e'), ('\xed', 'i'),
        ('\xf3', 'o'), ('\xfa', 'u'), ('\xf1', 'n'), ('\xfc', 'u')
    ]:
        s = s.replace(a, b)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s


# ---------------------------------------------------------------------------
# Detección inteligente de columnas por conceptos
# ---------------------------------------------------------------------------

def _detect_columns(headers: List[str]) -> Dict[str, Optional[int]]:
    """
    Identifica los índices de columnas relevantes con priorización:
    - price_usd: Columna explícita en USD/Divisas/Neto USD.
    - price_gen: Columna de precio general (PVP, Precio, Neto, etc.).
    - tasa: Tasa de cambio de divisa si está presente.
    - sku: Código de artículo o código de barra.
    - name: Descripción o nombre del producto.
    - stock: Existencia o cantidad disponible.
    - category: Departamento, categoría, línea o familia.
    - ingredient: Principio activo, molécula o componente.
    - brand: Marca, laboratorio o fabricante.
    """
    norm = [_normalize(h) for h in headers]
    col = {
        'price_usd': None,
        'price_gen': None,
        'tasa': None,
        'sku': None,
        'name': None,
        'stock': None,
        'category': None,
        'ingredient': None,
        'brand': None
    }

    # 1. Precio explícito en USD
    for i, n in enumerate(norm):
        if any(k in n for k in ['preciousd', 'netousd', 'dvnetousd', 'usd', 'dolar', 'divisa', 'preciodolar']):
            col['price_usd'] = i
            break

    # 2. Precio general
    for i, n in enumerate(norm):
        if col['price_usd'] != i and any(k in n for k in ['precio', 'neto', 'pvp', 'costo', 'valor', 'monto', 'price', 'importe']):
            col['price_gen'] = i
            break

    # 3. Tasa de cambio (para convertir precios en Bs a USD si es necesario)
    for i, n in enumerate(norm):
        if 'tasa' in n or 'tasadivisa' in n or 'cambio' in n:
            col['tasa'] = i
            break

    # 4. Nombre / Descripción del producto
    for i, n in enumerate(norm):
        if any(k in n for k in ['descripcion', 'nombre', 'producto', 'articulo', 'detalle', 'denominacion', 'itemdesc']):
            col['name'] = i
            break

    # 5. SKU / Código Interno
    for i, n in enumerate(norm):
        if i != col['name'] and any(k in n for k in ['codigo', 'sku', 'codart', 'cod', 'item', 'ref', 'codarticulo']):
            col['sku'] = i
            break

    # 5.1 Código de Barra (EAN / UPC / GTIN / BARRA)
    for i, n in enumerate(norm):
        if any(k in n for k in ['barra', 'codbarra', 'cod_barra', 'ean', 'upc', 'gtin', 'barcode']):
            col['barcode'] = i
            break

    # 6. Existencia / Stock
    for i, n in enumerate(norm):
        if any(k in n for k in ['existencia', 'stock', 'disponible', 'cantidad', 'cant', 'unidades', 'saldo', 'inventario']):
            col['stock'] = i
            break

    # 7. Categoría / Departamento
    for i, n in enumerate(norm):
        if any(k in n for k in ['departamento', 'categoria', 'category', 'linea', 'grupo', 'clase', 'familia', 'division']):
            col['category'] = i
            break

    # 8. Principio Activo
    for i, n in enumerate(norm):
        if any(k in n for k in ['principio', 'activo', 'molecula', 'componente', 'formula', 'droga', 'generico', 'principioactivo']):
            col['ingredient'] = i
            break

    # 9. Marca / Laboratorio
    for i, n in enumerate(norm):
        if any(k in n for k in ['marca', 'laboratorio', 'proveedor', 'fabricante', 'lab']):
            col['brand'] = i
            break

    return col


# ---------------------------------------------------------------------------
# Limpieza de valores numéricos y texto
# ---------------------------------------------------------------------------

def _clean_price(raw) -> float:
    """Convierte cadenas numéricas con diferentes formatos (1.234,56 o 1,234.56 o $4.20) a float."""
    if raw is None:
        return 0.0
    if isinstance(raw, (int, float)):
        return float(raw)

    s = str(raw).strip()
    s = s.replace('$', '').replace('Bs.', '').replace('Bs', '').replace('\xa0', '').strip()
    if not s or s in ('-', '0,00', '0.00', '0'):
        return 0.0

    # Determinar si la coma o el punto es el separador decimal
    if ',' in s and '.' in s:
        # e.g. 11.155,68 (formato latino: punto miles, coma decimal)
        if s.rfind(',') > s.rfind('.'):
            s = s.replace('.', '').replace(',', '.')
        else:
            # e.g. 11,155.68 (formato anglosajón: coma miles, punto decimal)
            s = s.replace(',', '')
    elif ',' in s:
        s = s.replace(',', '.')

    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0


def _clean_stock(raw) -> Tuple[bool, float]:
    """Retorna (in_stock, numeric_stock)."""
    if raw is None:
        return True, 1.0
    if isinstance(raw, (int, float)):
        return bool(raw > 0), float(raw)

    s = str(raw).strip().lower()
    if s in ('0', 'false', 'no', 'n', 'sin stock', 'agotado', 'no disponible', '', '-'):
        return False, 0.0

    val = _clean_price(raw)
    return bool(val > 0), val


def _make_sku(name: str, index: int) -> str:
    h = hashlib.md5(name.encode('utf-8')).hexdigest()[:6].upper()
    return f"DOC-{index:04d}-{h}"


# ---------------------------------------------------------------------------
# Búsqueda inteligente de la fila de encabezados
# ---------------------------------------------------------------------------

def _find_header_row(rows: List[List[Any]]) -> Tuple[int, List[str]]:
    """
    Examina las primeras 20 filas para encontrar la fila real de encabezados,
    ignorando membretes de empresa, fechas o líneas en blanco.
    """
    best_idx = 0
    best_score = -1

    for idx, row in enumerate(rows[:20]):
        if not row:
            continue
        row_str = " ".join(_normalize(str(c)) for c in row if c is not None)
        
        score = 0
        if any(k in row_str for k in ['descripcion', 'nombre', 'producto', 'articulo']):
            score += 4
        if any(k in row_str for k in ['precio', 'neto', 'pvp', 'costo', 'usd']):
            score += 4
        if any(k in row_str for k in ['codigo', 'sku', 'codart', 'barra']):
            score += 3
        if any(k in row_str for k in ['existencia', 'stock', 'cantidad']):
            score += 2
        if any(k in row_str for k in ['departamento', 'categoria', 'marca', 'laboratorio']):
            score += 2

        if score > best_score and score >= 6:
            best_score = score
            best_idx = idx

    headers = [str(c).strip() if c is not None else "" for c in rows[best_idx]]
    return best_idx, headers


# ---------------------------------------------------------------------------
# Conversión de filas normalizadas a Diccionarios de Productos
# ---------------------------------------------------------------------------

def _rows_to_dicts(headers: List[str], data_rows: List[List[Any]]) -> List[Dict[str, Any]]:
    col = _detect_columns(headers)
    results = []

    for i, row in enumerate(data_rows):
        if not any(cell is not None and str(cell).strip() != '' for cell in row):
            continue  # Fila vacía

        def get(idx):
            if idx is None or idx >= len(row):
                return None
            return row[idx]

        raw_name = str(get(col['name']) or '').strip()
        raw_sku = str(get(col['sku']) or '').strip()

        # Si no hay nombre ni SKU, descartar fila
        if not raw_name and not raw_sku:
            continue
        if not raw_name:
            raw_name = raw_sku

        # Cálculo de precio (priorizar USD, o convertir Bs con Tasa)
        p_usd = _clean_price(get(col['price_usd'])) if col['price_usd'] is not None else 0.0
        p_gen = _clean_price(get(col['price_gen'])) if col['price_gen'] is not None else 0.0
        tasa = _clean_price(get(col['tasa'])) if col['tasa'] is not None else 0.0

        if p_usd > 0:
            price = p_usd
        elif tasa > 0 and p_gen > 0 and p_gen > 100:
            # Si el precio general es alto y hay tasa, está en Bolívares -> convertir a USD
            price = round(p_gen / tasa, 2)
        else:
            price = p_gen

        if price <= 0:
            continue  # No cotizado o precio inválido

        sku = raw_sku if raw_sku else _make_sku(raw_name, i)

        # Stock
        in_stock, stock_num = _clean_stock(get(col['stock']))

        # Categoría
        category = str(get(col['category']) or 'General').strip()
        if not category or category.lower() in ('none', 'null', 'nan'):
            category = 'General'

        # Principio Activo
        ingred = str(get(col['ingredient']) or '').strip()
        if not ingred or ingred.lower() in ('no aplica', 'none', 'null', 'nan'):
            ingred = None

        # Marca / Laboratorio
        brand = str(get(col['brand']) or '').strip()
        if brand and brand.lower() not in ('none', 'null', 'nan'):
            if ingred is None:
                ingred = f"Marca: {brand}"

        # Código de Barra
        raw_barcode = str(get(col['barcode']) or '').strip() if col['barcode'] is not None else None
        if raw_barcode in ('0', '0.0', 'None', '', 'NaN'):
            raw_barcode = None

        results.append({
            'sku': sku,
            'barcode': raw_barcode,
            'name': raw_name,
            'price': price,
            'in_stock': in_stock,
            'stock_quantity': stock_num,
            'ingredient': ingred,
            'category': category,
        })

    return results


# ---------------------------------------------------------------------------
# Parsers por formato (.xlsx / .csv)
# ---------------------------------------------------------------------------

def _detect_csv_delimiter(raw_lines: List[str]) -> str:
    """Detecta el delimitador con análisis de frecuencias robusto."""
    delims = [';', ',', '\t', '|']
    best_delim = ','
    max_count = -1

    for d in delims:
        counts = [line.count(d) for line in raw_lines if line.strip()]
        if counts:
            total = sum(counts)
            if total > max_count:
                max_count = total
                best_delim = d

    return best_delim


def _parse_csv(path: Path) -> List[Dict[str, Any]]:
    encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252', 'utf-16-le', 'utf-16']

    for enc in encodings:
        try:
            with open(path, 'r', encoding=enc) as f:
                raw_lines = [f.readline() for _ in range(30)]
            if not any(raw_lines):
                continue

            delimiter = _detect_csv_delimiter(raw_lines)

            with open(path, 'r', encoding=enc, newline='') as f:
                reader = csv.reader(f, delimiter=delimiter)
                all_rows = list(reader)

            if len(all_rows) >= 2:
                header_idx, headers = _find_header_row(all_rows)
                data_rows = all_rows[header_idx + 1:]
                items = _rows_to_dicts(headers, data_rows)
                if items:
                    return items
        except (UnicodeDecodeError, csv.Error, Exception):
            continue

    return []


def _parse_xlsx(path: Path) -> List[Dict[str, Any]]:
    if not HAS_OPENPYXL:
        raise ImportError("openpyxl no instalado. Ejecuta: python -m pip install openpyxl")

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    all_items = []

    # Buscar en todas las hojas disponibles si la activa no tiene datos
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if len(rows) < 2:
            continue

        clean_rows = [[c for c in r] for r in rows]
        header_idx, headers = _find_header_row(clean_rows)
        data_rows = clean_rows[header_idx + 1:]

        items = _rows_to_dicts(headers, data_rows)
        if len(items) > len(all_items):
            all_items = items

    wb.close()
    return all_items


# ---------------------------------------------------------------------------
# Función pública principal
# ---------------------------------------------------------------------------

def parse_price_list(path: Path) -> List[Dict[str, Any]]:
    """
    Parsea de forma adaptativa cualquier archivo de lista de precios (.xlsx, .xls, .csv).
    Devuelve una lista de diccionarios normalizados con:
    { sku, name, price, in_stock, stock_quantity, ingredient, category }
    """
    path = Path(path)
    ext = path.suffix.lower()

    if ext in ('.xlsx', '.xls'):
        return _parse_xlsx(path)
    elif ext in ('.csv', '.txt', '.tsv'):
        return _parse_csv(path)
    else:
        # Intentar CSV como fallback
        try:
            return _parse_csv(path)
        except Exception:
            raise ValueError(f"Formato no soportado: {ext}. Use .xlsx, .xls o .csv")


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print("Uso: python document_parser.py <archivo>")
    else:
        items = parse_price_list(Path(sys.argv[1]))
        print(f"Total articulos detectados: {len(items)}")
        for it in items[:5]:
            print(it)
