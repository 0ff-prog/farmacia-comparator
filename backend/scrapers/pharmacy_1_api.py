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

API_URL = os.getenv("COBECA_API_URL") or os.getenv("API_URL", "https://comparadores.drogueriascobeca.com/api/articulos/drogueria")
API_KEY = os.getenv("COBECA_API_KEY") or os.getenv("API_KEY")
DEFAULT_DROGUERIA_ID = os.getenv("COBECA_DROGUERIA_ID") or os.getenv("DROGUERIA_ID", "7")

def fetch_pharmacy_1_data(drogueria_id: Optional[str] = None, token: Optional[str] = None) -> List[Dict[str, Any]]:
    """Ejecuta una petición HTTP POST enviando la 'drogueria' como STRING en el JSON payload."""
    if not API_URL:
        print("Error: API_URL no está configurada")
        return []

    active_token = token or API_KEY
    if not active_token:
        print("Aviso: No se proporcionó token para la API de Cobeca.")
        return []

    headers = {
        "Authorization": active_token,
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
        print(f"Error al consumir la API de Cobeca: {e}")
        return []

def get_pharmacy_1_offers(drogueria_id: Optional[str] = None, token: Optional[str] = None) -> List[Dict[str, Any]]:
    """Mapea las ofertas obtenidas por POST hacia SupplierOffer con el esquema real de Cobeca."""
    raw_items = fetch_pharmacy_1_data(drogueria_id=drogueria_id, token=token)
    processed_items = []

    for item in raw_items:
        if not isinstance(item, dict):
            continue

        raw_name = str(
            item.get("desc_articulo") or 
            item.get("descripcion") or 
            item.get("product_name") or 
            item.get("nombre") or 
            item.get("title") or 
            "Producto sin nombre"
        ).strip()

        # Extraer precio en USD (monto_final_referencial o monto_mayor_referencial)
        price = 0.0
        if item.get("monto_final_referencial") is not None and float(item.get("monto_final_referencial", 0)) > 0:
            price = round(float(item["monto_final_referencial"]), 2)
        elif item.get("monto_mayor_referencial") is not None and float(item.get("monto_mayor_referencial", 0)) > 0:
            price = round(float(item["monto_mayor_referencial"]), 2)
        elif item.get("precio") is not None and float(item.get("precio", 0)) > 0:
            price = round(float(item["precio"]), 2)
        elif item.get("monto_final") and item.get("tasa_divisa") and float(item.get("tasa_divisa", 0)) > 0:
            price = round(float(item["monto_final"]) / float(item["tasa_divisa"]), 2)

        sku = str(
            item.get("cod_articulo") or 
            item.get("codigoArticulo") or 
            item.get("sku") or 
            item.get("codigo") or 
            item.get("id") or 
            "SKU-DESCONOCIDO"
        ).strip()

        # Categoría
        cat_data = item.get("categoria")
        category = "General"
        if isinstance(cat_data, dict):
            category = cat_data.get("descripcion") or "General"
        elif cat_data:
            category = str(cat_data)

        # Principio Activo
        active_ing = None
        comp = item.get("componenteBase")
        if isinstance(comp, dict):
            desc = comp.get("descripcion", "")
            if desc and desc.upper() not in ("NO APLICA", "NONE", ""):
                active_ing = desc

        # Existencia
        existencia = item.get("existencia")
        in_stock = bool(existencia is None or (isinstance(existencia, (int, float)) and existencia > 0))

        # Tipo de Artículo y Volumen de Rotación Real (entrada de mercancía / existencia)
        tipo_data = item.get("tipoArticulo")
        tipo_articulo = tipo_data.get("codigo", "").strip() if isinstance(tipo_data, dict) else str(tipo_data or "")
        rotation_vol = float(item.get("entrada_mercancia") or item.get("existencia") or 0.0)

        image_url = item.get("imagen")

        offer = SupplierOffer(
            supplier_id="prov_1",
            supplier_name="Cobeca",
            raw_name=raw_name,
            base_price=price,
            in_stock=in_stock,
            product_url=image_url
        )
        
        processed_items.append({
            "sku": sku,
            "offer": offer,
            "category": category,
            "active_ingredient": active_ing,
            "unit_of_measure": "Unidad",
            "tipo_articulo": tipo_articulo,
            "rotation_volume": rotation_vol,
            "barcode": str(item.get("cod_barra") or "").strip() or None,
        })

    return processed_items

if __name__ == "__main__":
    print("--- Probando Conexión a la API del Proveedor 1 (Cobeca) ---")
    resultados = get_pharmacy_1_offers()
    
    print(f"Total de ofertas obtenidas: {len(resultados)}")
    for item in resultados[:3]:
        print(f"SKU: {item['sku']} | Oferta: {item['offer'].model_dump()}")