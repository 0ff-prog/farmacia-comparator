from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field

class SupplierOffer(BaseModel):
    """Oferta individual enviada por un proveedor."""
    supplier_id: str = Field(..., description="ID único del proveedor")
    supplier_name: str = Field(..., description="Nombre comercial del proveedor")
    raw_name: str = Field(..., description="Descripción del producto según el proveedor")
    base_price: float = Field(..., ge=0.0, description="Precio base de lista")
    in_stock: bool = Field(default=True, description="Disponibilidad en inventario")
    product_url: Optional[str] = Field(default=None, description="Enlace directo al producto")

class ProductMaster(BaseModel):
    """Matriz Central de Productos (Catálogo Unificado)."""
    master_id: str = Field(..., description="Slug único normalizado (ej: paracetamol-500mg)")
    sku: str = Field(..., description="Código SKU de identificación comercial")
    display_name: str = Field(..., description="Nombre limpio para la interfaz")
    category: str = Field(default="General", description="Categoría del medicamento")
    unit_of_measure: str = Field(default="Unidad", description="Unidad de medida (ej: Caja x10)")
    is_ims: bool = Field(default=False, description="Flag indicador del segmento Top 800 IMS")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    suppliers: Dict[str, SupplierOffer] = Field(
        default_factory=dict,
        description="Diccionario de ofertas indexado por supplier_id"
    )

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }