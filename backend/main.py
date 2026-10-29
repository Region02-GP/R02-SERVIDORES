from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
import database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Arranca de forma automática la estructura SQLite
database.init_db()

@app.get("/api/perfil/{identificacion}")
def obtener_perfil(identificacion: str):
    row = database.buscar_brigadista(identificacion)
    if not row:
        return {"existe": False}
    return {
        "existe": True,
        "nombre": row[0],
        "telefono": row[1],
        "sangre": row[2],
        "region": row[3],
        "brigada": row[4],
        "foto_url": row[5]
    }

@app.post("/api/perfil/guardar")
async def guardar_perfil(
    nombre: str = Form(...),
    identificacion: str = Form(...),
    telefono: str = Form(...),
    sangre: str = Form(...),
    region: str = Form(...),
    brigada: str = Form(...),
    foto: UploadFile = File(None)
):
    row = database.buscar_brigadista(identificacion)
    foto_url = row[5] if row else "https://placeholder.com"
    
    if foto:
        ext = os.path.splitext(foto.filename)[1]
        nombre_archivo = f"{identificacion}{ext}"
        file_path = os.path.join(UPLOAD_DIR, nombre_archivo)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(foto.file, buffer)
        foto_url = f"http://127.0.0{nombre_archivo}"

    database.guardar_o_actualizar_brigadista(
        identificacion, nombre, telefono, sangre, region, brigada, foto_url
    )
    return {"status": "success", "message": "Procesado correctamente", "foto_url": foto_url}
# Asegurar que se cree la tabla de reportes al iniciar el backend
database.init_db_reportes()

@app.post("/api/reporte/guardar")
async def guardar_reporte(
    identificacion: str = Form(...),
    actividad: str = Form(...),
    observaciones: str = Form(None)
):
    # Validar primero si el brigadista existe en el sistema
    row = database.buscar_brigadista(identificacion)
    if not row:
        raise HTTPException(status_code=404, detail="El brigadista no está registrado")
        
    database.guardar_reporte_campo(identificacion, actividad, observaciones)
    return {"status": "success", "message": "Reporte de campo guardado exitosamente"}
