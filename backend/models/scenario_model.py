from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field

class SimulationScenario(BaseModel):
    """Escenario de simulación de negociación guardado por el usuario."""
    scenario_id: Optional[str] = Field(default=None, description="ID autogenerado")
    name: str = Field(..., description="Nombre de la simulación")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    supplier_adjustments: Dict[str, float] = Field(
        default_factory=dict,
        description="Ajustes porcentuales aplicados (ej: {'prov_1': -5.0})"
    )
    preferred_supplier_id: Optional[str] = Field(
        default=None, 
        description="ID del proveedor preferido"
    )
    notes: Optional[str] = Field(default=None, description="Notas sobre la negociación")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }