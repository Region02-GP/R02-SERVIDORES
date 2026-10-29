def init_db_reportes():
    """Crea la tabla de reportes diarios de campo"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reportes_campo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brigadista_id TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            actividad TEXT NOT NULL,
            observaciones TEXT,
            FOREIGN KEY(brigadista_id) REFERENCES brigadistas(identificacion)
        )
    """)
    conn.commit()
    conn.close()

def guardar_reporte_campo(brigadista_id, actividad, observaciones):
    """Inserta una nueva bitácora de trabajo diario"""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reportes_campo (brigadista_id, actividad, observaciones)
        VALUES (?, ?, ?)
    """, (brigadista_id, actividad, observaciones))
    conn.commit()
    conn.close()
