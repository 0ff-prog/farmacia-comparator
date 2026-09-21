"""
Servicio de Firebase Admin para el Backend en Python.
Permite sincronizar y publicar el catálogo maestro consolidado de las 4 farmacias
y los escenarios de negociación directamente en Cloud Firestore.
"""
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

_db = None

def init_firebase(cred_path: Optional[str] = None):
    """Inicializa Firebase Admin SDK si no ha sido inicializado previamente."""
    global _db
    if not FIREBASE_AVAILABLE:
        print("⚠️ Advertencia: firebase_admin no está instalado en el entorno Python.")
        return None

    if _db is not None:
        return _db

    try:
        if not firebase_admin._apps:
            # Buscar archivo de credenciales de servicio o usar Application Default Credentials
            cert_file = cred_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if cert_file and Path(cert_file).exists():
                cred = credentials.Certificate(cert_file)
                firebase_admin.initialize_app(cred)
            else:
                # Inicialización por defecto para entornos Cloud / Emulador
                firebase_admin.initialize_app()

        _db = firestore.client()
        return _db
    except Exception as e:
        print(f"ℹ️ Firebase Admin en modo local/offline: {e}")
        return None

def publish_catalog_to_firestore(catalog_data: Dict[str, Any], collection_name: str = "master_catalog") -> bool:
    """Publica los productos del catálogo consolidado en Cloud Firestore."""
    db = init_firebase()
    if not db:
        print("⚠️ No se pudo conectar a Firestore. Los datos se mantienen en el catálogo JSON local.")
        return False

    try:
        items = catalog_data.get("items", [])
        batch = db.batch()
        count = 0

        for item in items:
            sku = item.get("sku", "UNKNOWN")
            doc_ref = db.collection(collection_name).document(sku)
            batch.set(doc_ref, item, merge=True)
            count += 1

            # Firestore permite un máximo de 500 escrituras por batch
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()

        batch.commit()
        print(f"✓ {count} SKUs sincronizados exitosamente con Cloud Firestore ({collection_name}).")
        return True
    except Exception as e:
        print(f"⚠️ Error al publicar en Firestore: {e}")
        return False
