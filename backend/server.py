"""
Backend seguro para el Comparador de Farmacias.
Login via credenciales reales de Cobeca API.
El JWT de Cobeca se almacena en servidor, nunca llega al frontend.
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / "backend" / "config" / ".env"

from dotenv import load_dotenv
load_dotenv(dotenv_path=ENV_PATH)

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import requests
from jose import JWTError, jwt

# ── Constantes JWT propias de la app ──────────────────────────────────────────
APP_SECRET = os.getenv("JWT_SECRET_KEY", "farmacia-comparator-secret-2025-cambiar-en-prod")
ALGORITHM  = "HS256"
TOKEN_MINS = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# ── Cobeca API ─────────────────────────────────────────────────────────────────
COBECA_LOGIN_URL  = "https://comparadores.drogueriascobeca.com/api/Login"
COBECA_CATALOG_URL = os.getenv("COBECA_API_URL", "https://comparadores.drogueriascobeca.com/api/articulos/drogueria")
COBECA_DROGUERIA  = os.getenv("COBECA_DROGUERIA_ID", "7")

# ── Store en memoria para JWT Cobeca (por sesion de app) ─────────────────────
# { app_token_sub: { "cobeca_jwt": str, "expires_at": datetime, "drogueria": str } }
_cobeca_sessions: dict = {}

UPLOADS_DIR = BASE_DIR / "backend" / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Comparador de Farmacias — API Segura",
    description="Login via Cobeca. JWT almacenado en servidor.",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "https://farmacia-comparator.web.app",
        "https://farmacia-comparator.firebaseapp.com",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bearer_scheme = HTTPBearer(auto_error=False)


# ── Helpers JWT propios ────────────────────────────────────────────────────────
def _create_app_token(sub: str, extra: dict = None) -> str:
    payload = {"sub": sub, "iat": datetime.now(timezone.utc)}
    if extra:
        payload.update(extra)
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINS)
    return jwt.encode(payload, APP_SECRET, algorithm=ALGORITHM)


def _verify_app_token(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Token requerido.")
    try:
        payload = jwt.decode(creds.credentials, APP_SECRET, algorithms=[ALGORITHM])
        if "sub" not in payload:
            raise HTTPException(status_code=401, detail="Token invalido.")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o invalido. Inicia sesion nuevamente.")


def _get_cobeca_jwt(sub: str) -> Optional[str]:
    """Devuelve el JWT de Cobeca guardado para este usuario de app."""
    session = _cobeca_sessions.get(sub)
    if not session:
        return None
    # Verificar si el JWT de Cobeca ha expirado (tipicamente 24h)
    if datetime.now(timezone.utc) > session.get("expires_at", datetime.min.replace(tzinfo=timezone.utc)):
        return None
    return session.get("cobeca_jwt")


# ── Modelos Pydantic ───────────────────────────────────────────────────────────
class CobecaLoginRequest(BaseModel):
    usuario: str
    clave:   str

class LoginResponse(BaseModel):
    access_token:   str
    token_type:     str = "bearer"
    user_name:      str
    user_code:      str
    drogueria_id:   str
    drogueria_name: str
    expires_in_minutes: int


class ConnectionStatusItem(BaseModel):
    provider_id:   str
    provider_name: str
    status:        str
    label:         str
    last_checked:  Optional[str] = None
    catalog_size:  Optional[int] = None


# ── RUTAS ──────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "3.0.0", "time": datetime.now(timezone.utc).isoformat()}


@app.post("/api/auth/login", response_model=LoginResponse)
def login(body: CobecaLoginRequest, background_tasks: BackgroundTasks):
    """
    Autentica al usuario contra la API real de Cobeca.
    Guarda el JWT de Cobeca en memoria del servidor.
    Actualiza el catálogo consolidado en segundo plano con datos en vivo.
    Devuelve un app_token propio de duracion configurada.
    """
    try:
        resp = requests.post(
            COBECA_LOGIN_URL,
            json={"Usuario": body.usuario, "Clave": body.clave},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=12
        )
        data = resp.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=503, detail="Cobeca no respondio (timeout). Intentalo de nuevo.")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Error de red con Cobeca: {str(e)[:80]}")

    if not data.get("success"):
        msg = data.get("message", "Usuario o clave incorrectos.")
        raise HTTPException(status_code=401, detail=msg)

    cobeca_jwt = data["token"]
    usuario    = data.get("usuario", body.usuario)
    desc       = data.get("desc_usuario", usuario)

    # Extraer info de drogueria
    droguerias = data.get("droguerias", [])
    if droguerias:
        drog = droguerias[0]
        drog_id   = str(drog.get("cod_drogueria", COBECA_DROGUERIA))
        drog_name = drog.get("desc_drogueria", "Cobeca")
    else:
        drog_id   = COBECA_DROGUERIA
        drog_name = "Cobeca"

    # Guardamos el JWT de Cobeca en memoria (expira en 24h aprox segun su exp)
    sub = f"{usuario}@cobeca"
    _cobeca_sessions[sub] = {
        "cobeca_jwt":  cobeca_jwt,
        "drogueria_id": drog_id,
        "drogueria_name": drog_name,
        "desc_usuario": desc,
        "expires_at":  datetime.now(timezone.utc) + timedelta(hours=23),
    }

    # Lanzar sincronización del catálogo real en segundo plano
    def _bg_sync():
        try:
            from backend.main import run_pipeline
            run_pipeline(token=cobeca_jwt, drogueria_id=drog_id)
        except Exception as e:
            print(f"Aviso en sincronización en background: {e}")

    background_tasks.add_task(_bg_sync)

    app_token = _create_app_token(sub=sub, extra={
        "desc": desc,
        "drog_id": drog_id,
        "drog_name": drog_name,
    })

    return LoginResponse(
        access_token=app_token,
        user_name=desc,
        user_code=usuario,
        drogueria_id=drog_id,
        drogueria_name=drog_name,
        expires_in_minutes=TOKEN_MINS
    )


@app.post("/api/auth/refresh")
def refresh_token(current: dict = Depends(_verify_app_token)):
    """Renueva el app_token si el JWT de Cobeca sigue activo."""
    sub = current["sub"]
    cobeca_jwt = _get_cobeca_jwt(sub)
    if not cobeca_jwt:
        raise HTTPException(status_code=401, detail="Sesion Cobeca expirada. Inicia sesion nuevamente.")
    session = _cobeca_sessions[sub]
    new_token = _create_app_token(sub=sub, extra={
        "desc": session["desc_usuario"],
        "drog_id": session["drogueria_id"],
        "drog_name": session["drogueria_name"],
    })
    return {"access_token": new_token, "expires_in_minutes": TOKEN_MINS}


@app.post("/api/auth/logout")
def logout(current: dict = Depends(_verify_app_token)):
    sub = current.get("sub", "")
    _cobeca_sessions.pop(sub, None)
    return {"message": "Sesion cerrada."}


@app.get("/api/connections/status")
def connections_status(current: dict = Depends(_verify_app_token)):
    sub = current.get("sub", "")
    cobeca_jwt = _get_cobeca_jwt(sub)
    session    = _cobeca_sessions.get(sub, {})

    if cobeca_jwt:
        drog_name = session.get("drogueria_name", "Cobeca")
        drog_id   = session.get("drogueria_id", "?")
        cobeca_status = "connected"
        cobeca_label  = f"Sesion activa — {drog_name} (#{drog_id})"
    else:
        cobeca_status = "error"
        cobeca_label  = "Sesion expirada. Cerrar e iniciar sesion nuevamente."

    def doc_status(stem_list, name):
        for stem in stem_list:
            for ext in [".xlsx", ".xls", ".csv"]:
                if (UPLOADS_DIR / (stem + ext)).exists():
                    p = UPLOADS_DIR / (stem + ext)
                    return "connected", f"Archivo cargado: {p.name}"
        return "unconfigured", f"{name}: ningun archivo cargado aun"

    d1s, d1l = doc_status(["drogueria1_pricelist","drogueria1","lista_d1"], "Drogueria 1")
    d2s, d2l = doc_status(["drogueria2_pricelist","drogueria2","lista_d2"], "Drogueria 2")
    d3s, d3l = doc_status(["drogueria3_pricelist","drogueria3","lista_d3"], "Drogueria 3")

    return {"providers": [
        {"provider_id":"prov_1","provider_name":"Cobeca",      "status":cobeca_status,"label":cobeca_label},
        {"provider_id":"prov_2","provider_name":"Drogueria 1", "status":d1s,"label":d1l},
        {"provider_id":"prov_3","provider_name":"Drogueria 2", "status":d2s,"label":d2l},
        {"provider_id":"prov_4","provider_name":"Drogueria 3", "status":d3s,"label":d3l},
    ]}


@app.post("/api/connections/test/prov_1")
def test_cobeca(current: dict = Depends(_verify_app_token)):
    """Prueba la conexion con Cobeca usando el JWT de sesion activa."""
    sub = current.get("sub", "")
    cobeca_jwt = _get_cobeca_jwt(sub)
    if not cobeca_jwt:
        return {"success": False, "message": "Sesion Cobeca expirada. Vuelve a iniciar sesion."}
    session  = _cobeca_sessions.get(sub, {})
    drog_id  = session.get("drogueria_id", COBECA_DROGUERIA)
    try:
        r = requests.post(
            COBECA_CATALOG_URL,
            json={"drogueria": drog_id},
            headers={"Authorization": cobeca_jwt, "Content-Type": "application/json"},
            timeout=15
        )
        if r.status_code == 200:
            items = r.json()
            count = len(items) if isinstance(items, list) else "?"
            return {"success": True, "message": f"API Cobeca activa. {count} articulos disponibles.", "catalog_size": count}
        elif r.status_code == 401:
            return {"success": False, "message": "JWT Cobeca expirado. Cierra sesion e ingresa nuevamente."}
        else:
            return {"success": False, "message": f"Error HTTP {r.status_code} desde Cobeca."}
    except Exception as e:
        return {"success": False, "message": f"Error de red: {str(e)[:80]}"}


@app.post("/api/upload/{prov_id}")
async def upload_pricelist(
    prov_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current: dict = Depends(_verify_app_token)
):
    """
    Sube una lista de precios para Drogueria 1, 2 o 3.
    Acepta .xlsx, .xls, .csv unicamente.
    Consolida automaticamente el catalogo tras la carga.
    """
    name_map = {"prov_2": "drogueria1", "prov_3": "drogueria2", "prov_4": "drogueria3"}
    if prov_id not in name_map:
        raise HTTPException(status_code=400, detail=f"prov_id invalido: {prov_id}. Use prov_2, prov_3 o prov_4.")

    ext = Path(file.filename).suffix.lower()
    if ext not in (".xlsx", ".xls", ".csv"):
        raise HTTPException(status_code=400, detail=f"Formato no soportado: {ext}. Solo .xlsx, .xls o .csv.")

    stem      = name_map[prov_id]
    dest_name = f"{stem}_pricelist{ext}"
    dest_path = UPLOADS_DIR / dest_name

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    # Actualizar catálogo en segundo plano
    sub = current.get("sub", "")
    cobeca_jwt = _get_cobeca_jwt(sub)
    session = _cobeca_sessions.get(sub, {})
    drog_id = session.get("drogueria_id", COBECA_DROGUERIA)

    def _sync():
        try:
            from backend.main import run_pipeline
            run_pipeline(token=cobeca_jwt, drogueria_id=drog_id)
        except Exception as e:
            print(f"Error consolidando tras subida: {e}")

    background_tasks.add_task(_sync)

    # Parsear para contar filas y preview
    try:
        from backend.scrapers.document_parser import parse_price_list
        items = parse_price_list(dest_path)
        preview = items[:5]
        return {
            "success":       True,
            "filename":      dest_name,
            "rows_detected": len(items),
            "preview":       preview,
        }
    except Exception as e:
        return {
            "success":  True,
            "filename": dest_name,
            "rows_detected": 0,
            "preview":  [],
            "parse_warning": str(e)
        }


_catalog_cache: dict = {"mtime": 0.0, "data": None}

def _get_cached_catalog_data(path: Path) -> dict:
    try:
        mtime = path.stat().st_mtime
        if _catalog_cache["data"] is not None and _catalog_cache["mtime"] == mtime:
            return _catalog_cache["data"]
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        _catalog_cache["mtime"] = mtime
        _catalog_cache["data"] = data
        return data
    except Exception as e:
        print(f"Aviso leyendo cache de catalogo: {e}")
        if _catalog_cache["data"] is not None:
            return _catalog_cache["data"]
        return {"items": [], "total_skus": 0, "provider_benchmarks": {}}


@app.get("/api/catalog")
def get_catalog(
    page: int = 1,
    page_size: int = 100,
    ims_only: bool = False,
    full: bool = False,
    current: dict = Depends(_verify_app_token)
):
    sub = current.get("sub", "")
    cobeca_jwt = _get_cobeca_jwt(sub)
    session = _cobeca_sessions.get(sub, {})
    drog_id = session.get("drogueria_id", COBECA_DROGUERIA)

    # Buscar catálogo consolidado o generarlo en vivo
    cons_path = BASE_DIR / "backend" / "data" / "consolidated_catalog.json"
    if not cons_path.exists() and cobeca_jwt:
        try:
            from backend.main import run_pipeline
            run_pipeline(token=cobeca_jwt, drogueria_id=drog_id)
        except Exception as e:
            print(f"Aviso generando catálogo bajo demanda: {e}")

    for fname in ["consolidated_catalog.json", "real_catalog.json"]:
        p = BASE_DIR / "backend" / "data" / fname
        if p.exists():
            data = _get_cached_catalog_data(p)
            items = data.get("items", [])
            if ims_only:
                items = [i for i in items if i.get("is_ims")]
            total = len(items)

            if full:
                return {
                    "items": items,
                    "total": total,
                    "page": 1,
                    "total_pages": 1,
                    "source": fname
                }

            start = (page - 1) * page_size
            return {
                "items": items[start: start + page_size],
                "total": total,
                "page": page,
                "total_pages": max(1, (total + page_size - 1) // page_size),
                "source": fname
            }
    return {"items": [], "total": 0, "page": 1, "total_pages": 1, "source": "empty"}


@app.post("/api/sync")
def sync_data(current: dict = Depends(_verify_app_token)):
    """Ejecuta el pipeline completo unificando Cobeca y las Droguerías 1, 2 y 3."""
    sub = current.get("sub", "")
    cobeca_jwt = _get_cobeca_jwt(sub)
    session = _cobeca_sessions.get(sub, {})
    drog_id = session.get("drogueria_id", COBECA_DROGUERIA)

    try:
        from backend.main import run_pipeline
        result = run_pipeline(token=cobeca_jwt, drogueria_id=drog_id)
        return {
            "success": True,
            "message": f"Sincronización completada. {result.get('total_skus', 0)} SKUs procesados.",
            "total_skus": result.get("total_skus", 0),
            "benchmarks": result.get("provider_benchmarks", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la sincronización: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=True)
