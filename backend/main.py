from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os, shutil, database

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
database.init_db()

@app.get("/api/perfil/{identificacion}")
def obtener_perfil(identificacion: str):
    row = database.buscar_brigadista(identificacion)
    return {"existe": True, "nombre": row[0], "telefono": row[1], "sangre": row[2], "region": row[3], "brigada": row[4], "foto_url": row[5]} if row else {"existe": False}

@app.post("/api/perfil/guardar")
async def guardar_perfil(nombre: str = Form(...), identificacion: str = Form(...), telefono: str = Form(...), sangre: str = Form(...), region: str = Form(...), brigada: str = Form(...), foto: UploadFile = File(None)):
    row = database.buscar_brigadista(identificacion)
    foto_url = row[5] if row else "https://placeholder.com"
    if foto:
        nombre_archivo = f"{identificacion}{os.path.splitext(foto.filename)[1]}"
        with open(os.path.join(UPLOAD_DIR, nombre_archivo), "wb") as b: shutil.copyfileobj(foto.file, b)
        foto_url = f"http://127.0.0{nombre_archivo}"
    database.guardar_o_actualizar_brigadista(identificacion, nombre, telefono, sangre, region, brigada, foto_url)
    return {"status": "success", "foto_url": foto_url}
