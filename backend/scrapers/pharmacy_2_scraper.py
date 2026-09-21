import sys
from pathlib import Path

# Agregar la raíz del proyecto al sys.path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(BASE_DIR))

from typing import List, Dict, Any
from playwright.async_api import async_playwright
from backend.models.product_model import SupplierOffer

async def get_pharmacy_2_offers() -> List[Dict[str, Any]]:
    """Extrae productos del Proveedor 2 mediante web scraping con Playwright."""
    processed_items = []
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.goto("https://proveedor2.com/catalogo", timeout=30000)
            # elementos = await page.query_selector_all(".producto-card")
            
            await browser.close()
    except Exception as e:
        print(f"Aviso en Proveedor 2 (Playwright): {e}")

    return processed_items

if __name__ == "__main__":
    import asyncio
    resultados = asyncio.run(get_pharmacy_2_offers())
    print(f"Total Proveedor 2: {len(resultados)}")