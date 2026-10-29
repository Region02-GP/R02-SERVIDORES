import sqlite3

DB_FILE = "brigadistas.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brigadistas (
            identificacion TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            telefono TEXT,
            sangre TEXT,
            region TEXT,
            brigada TEXT,
            foto_url TEXT
        )
    """)
    conn.commit()
    conn.close()

def buscar_brigadista(identificacion: str):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT nombre, telefono, sangre, region, brigada, foto_url 
        FROM brigadistas WHERE identificacion = ?
    """, (identificacion,))
    row = cursor.fetchone()
    conn.close()
    return row

def guardar_o_actualizar_brigadista(identificacion, nombre, telefono, sangre, region, brigada, foto_url):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO brigadistas (identificacion, nombre, telefono, sangre, region, brigada, foto_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(identificacion) DO UPDATE SET
            nombre = excluded.nombre,
            telefono = excluded.telefono,
            sangre = excluded.sangre,
            region = excluded.region,
            brigada = excluded.brigada,
            foto_url = ?
    """, (identificacion, nombre, telefono, sangre, region, brigada, foto_url, foto_url))
    conn.commit()
    conn.close()
