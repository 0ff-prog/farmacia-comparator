from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field

class PharmacyOffer(BaseModel):
    """Representa la oferta individual de una farmacia específica."""
    pharmacy_name: str = Field(..., description="Nombre comercial de la farmacia")
    raw_name: str = Field(..., description="Nombre del producto tal como figura en la farmacia")
    price: float = Field(..., ge=0.0, description="Precio del producto (debe ser mayor o igual a 0)")
    in_stock: bool = Field(default=True, description="Disponibilidad de inventario")
    product_url: Optional[str] = Field(default=None, description="Enlace directo al producto")

class ProductMaster(BaseModel):
    """Representa un producto consolidado que agrupa las ofertas de múltiples farmacias."""
    master_id: str = Field(..., description="Slug único normalizado (ej: paracetamol-500mg)")
    display_name: str = Field(..., description="Nombre limpio para mostrar en el frontend")
    category: str = Field(default="General", description="Categoría del medicamento")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Fecha de última sincronización")
    pharmacies: Dict[str, PharmacyOffer] = Field(
        default_factory=dict, 
        description="Diccionario de ofertas indexado por el ID de cada farmacia"
    )

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }