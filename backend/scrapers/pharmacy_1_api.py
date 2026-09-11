import sys
from pathlib import Path

# Agregar la raíz del proyecto al sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

import os
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from backend.models.product_model import SupplierOffer

# Cargar .env desde backend/config/.env
ENV_PATH = Path(__file__).resolve().parent.parent / "config" / ".env"
load_dotenv(dotenv_path=ENV_PATH)

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")
DEFAULT_DROGUERIA_ID = os.getenv("DROGUERIA_ID", "7")

def fetch_pharmacy_1_data(drogueria_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Ejecuta una petición HTTP POST enviando la 'drogueria' como STRING en el JSON payload."""
    if not API_URL:
        print("Error: API_URL no está configurada en .env")
        return []

    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json"
    }

    # Asegurar que drogueria siempre se envíe como string ("7")
    target_drogueria = str(drogueria_id if drogueria_id is not None else DEFAULT_DROGUERIA_ID)

    payload = {
        "drogueria": target_drogueria
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()

        if isinstance(data, list):
            return data
        
        if isinstance(data, dict):
            for key in ["articulos", "products", "items", "data", "results"]:
                if key in data and isinstance(data[key], list):
                    return data[key]
            return [data]
            
        return []

    except requests.RequestException as e:
        print(f"Error al consumir la API del Proveedor 1: {e}")
        return []

def get_pharmacy_1_offers(drogueria_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Mapea las ofertas obtenidas por POST hacia SupplierOffer."""
    raw_items = fetch_pharmacy_1_data(drogueria_id=drogueria_id)
    processed_items = []

    for item in raw_items:
        if not isinstance(item, dict):
            continue

        raw_name = str(
            item.get("descripcion") or 
            item.get("product_name") or 
            item.get("nombre") or 
            item.get("title") or 
            "Producto sin nombre"
        )
        price = float(
            item.get("precio") or 
            item.get("precioBase") or 
            item.get("price") or 
            0.0
        )
        sku = str(
            item.get("codigoArticulo") or 
            item.get("sku") or 
            item.get("codigo") or 
            item.get("id") or 
            "SKU-DESCONOCIDO"
        )

        offer = SupplierOffer(
            supplier_id="prov_1",
            supplier_name="Proveedor 1 (API Cobeca)",
            raw_name=raw_name,
            base_price=price,
            in_stock=bool(item.get("existencia") or item.get("available") or item.get("stock") or True),
            product_url=item.get("url")
        )
        
        processed_items.append({
            "sku": sku,
            "offer": offer
        })

    return processed_items

if __name__ == "__main__":
    print("--- Probando Conexión a la API del Proveedor 1 (Cobeca) ---")
    resultados = get_pharmacy_1_offers()
    
    print(f"Total de ofertas obtenidas: {len(resultados)}")
    for item in resultados[:3]:
        print(f"SKU: {item['sku']} | Oferta: {item['offer'].model_dump()}")