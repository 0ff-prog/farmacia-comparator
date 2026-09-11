import re
import json
from pathlib import Path
from unicodedata import normalize
from rapidfuzz import fuzz

# Ruta al catálogo estático IMS (Top 800)
IMS_CATALOG_PATH = Path(__file__).parent.parent / "data" / "ims_catalog.json"

def clean_text(text: str) -> str:
    """Normaliza texto: minúsculas, remueve acentos y caracteres especiales."""
    if not text:
        return ""
    text = text.lower().strip()
    text = normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return re.sub(r'\s+', ' ', text).strip()

def generate_master_id(name: str) -> str:
    """Genera un identificador uniforme en formato slug (ej. 'paracetamol-500mg')."""
    cleaned = clean_text(name)
    return cleaned.replace(" ", "-")

def calculate_similarity(name_a: str, name_b: str) -> float:
    """
    Calcula la similitud (0 a 100) entre dos nombres de productos.
    Usa token_sort_ratio para ignorar el orden de las palabras.
    """
    clean_a = clean_text(name_a)
    clean_b = clean_text(name_b)
    return float(fuzz.token_sort_ratio(clean_a, clean_b))

def load_ims_skus() -> set:
    """Carga en memoria los SKUs pertenecientes al segmento Top 800 IMS."""
    if not IMS_CATALOG_PATH.exists():
        return set()
    try:
        with open(IMS_CATALOG_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return set(data.get("ims_skus", []))
    except Exception:
        return set()

def check_is_ims(sku: str, ims_skus_set: set = None) -> bool:
    """Verifica si un SKU pertenece al catálogo maestro de productos Top 800 IMS."""
    if not sku:
        return False
    if ims_skus_set is None:
        ims_skus_set = load_ims_skus()
    return sku.strip().upper() in ims_skus_set