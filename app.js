// ==========================================
// BLOQUE 1: CONFIGURACIÓN Y CONTROL DE VISTAS
// ==========================================

// CONFIGURACIÓN: Coloca aquí tu URL /exec de Google Apps Script pública
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw71Jk6eChY3hQlNRpqEBfCJyyji7Y5j1BkhHov8akRtSKaAmy6b-mRypqmcGoxGtn35A/exec";

let fotoCompletaBase64 = "";
let fotoUrlActual = "";

// Función para cambiar de pantalla de forma fluida
function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}

// Funciones de control para activar y desactivar la pantalla de carga flotante
function mostrarCarga(texto) {
    document.getElementById('textoCarga').innerText = texto || "Procesando...";
    document.getElementById('pantallaCarga').classList.remove('hidden');
}

function ocultarCarga() {
    document.getElementById('pantallaCarga').classList.add('hidden');
}
// ==========================================
// BLOQUE 2: CONTROLADOR DE ACCESO Y BÚSQUEDA
// ==========================================

document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    mostrarCarga("Validando identidad con el servidor...");

    try {
        const payloadBuscar = { action: 'buscar', curp: curp };
        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payloadBuscar)
        });
        
        const datos = await res.json();
        document.getElementById('nombre_curp').value = curp;

        if (datos.existe) {
            // Aseguramos el casteo de variables string para prevenir fallas de toUpperCase()
            const nom = String(datos.nombre || "");
            const pat = String(datos.ap_paterno || "");
            const mat = String(datos.ap_materno || "");
            const pue = String(datos.puesto || "");
            const zon = String(datos.zona || "");

            // Inyectar datos en la vista visual de la tarjeta
            document.getElementById('credCompleto').innerText = `${nom} ${pat} ${mat}`.trim().toUpperCase();
            document.getElementById('credPuesto').innerText = pue.toUpperCase();
            document.getElementById('credZona').innerText = zon.toUpperCase();
            document.getElementById('credIdentificacion').innerText = String(datos.curp || curp).toUpperCase();
            
            // Renderizado seguro de imagen
            fotoUrlActual = datos.foto_url || "";
            document.getElementById('credFoto').src = (fotoUrlActual.startsWith('data:image') || fotoUrlActual.startsWith('http')) ? fotoUrlActual : "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='100' height='100' viewBox='0 0 24 24' fill='%236b7280'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 2 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";

            // Pre-llenar el formulario de registro oculto por si pulsa modificar perfil
            document.getElementById('nombre').value = datos.nombre || "";
            document.getElementById('ap_paterno').value = datos.ap_paterno || "";
            document.getElementById('ap_materno').value = datos.ap_materno || "";
            document.getElementById('municipio').value = datos.municipio || "";
            document.getElementById('puesto').value = datos.puesto || "";
            document.getElementById('telefono').value = datos.telefono || "";
            document.getElementById('zona').value = datos.zona || "";
            document.getElementById('correo').value = datos.correo || "";

            irAPantalla(3);
        } else {
            // Brigadista nuevo: Limpiar formulario y forzar re-llenado
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            fotoUrlActual = "";
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(2);
        }
    } catch (err) {
        console.error(err);
        alert('Error al procesar la respuesta del servidor.');
    } finally {
        ocultarCarga();
    }
});
// ==========================================
// BLOQUE 3: COMPRESIÓN DE IMAGEN EN TIEMPO REAL
// ==========================================

document.getElementById('inputFoto').addEventListener('change', (e) => {
    const files = e.target.files; 
    if (files && files[0]) {
        mostrarCarga("Optimizando fotografía...");
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; 
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Exportar como string Base64 ligero
                fotoCompletaBase64 = canvas.toDataURL('image/jpeg', 0.85);
                document.getElementById('fotoAviso').classList.remove('hidden');
                ocultarCarga();
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(files[0]);
    }
});
// ==========================================
// BLOQUE 4: ENVÍO DE DATOS Y SINCRONIZACIÓN
// ==========================================

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const curp = document.getElementById('nombre_curp').value;
    mostrarCarga("Sincronizando y guardando en la nube...");

    const payloadCompleto = {
        action: 'guarda',
        curp: curp,
        nombre: document.getElementById('nombre').value,
        ap_paterno: document.getElementById('ap_paterno').value,
        ap_materno: document.getElementById('ap_materno').value,
        municipio: document.getElementById('municipio').value,
        puesto: document.getElementById('puesto').value,
        telefono: document.getElementById('telefono').value,
        zona: document.getElementById('zona').value,
        correo: document.getElementById('correo').value,
        foto_url: fotoUrlActual,
        fotoCompletaBase64: fotoCompletaBase64
    };

    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payloadCompleto)
        });
        const resultado = await res.json();
        
        if (resultado.status === "success") {
            ocultarCarga();
            alert('🎉 ¡Perfil guardado y sincronizado correctamente en la nube!');
            
            // Actualizar interfaz final
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            
            fotoUrlActual = resultado.foto_url || fotoCompletaBase64;
            document.getElementById('credFoto').src = fotoUrlActual;
            
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(3);
        } else {
            ocultarCarga();
            alert('Error: ' + resultado.message);
        }
    } catch (err) {
        console.error(err);
        ocultarCarga();
        alert('Error al sincronizar el envío de datos con Google.');
    }
});
// ==========================================
// BLOQUE 5: DIBUJO MATEMÁTICO CANVAS Y COMPARTICIÓN TÁCTIL
// ==========================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Estructurando imagen de la credencial...");

    const curp = document.getElementById('credIdentificacion').innerText;
    const nombre = document.getElementById('credCompleto').innerText;
    const puesto = document.getElementById('credPuesto').innerText;
    const zona = document.getElementById('credZona').innerText;
    const fotoSrc = document.getElementById('credFoto').src;

    // Inicialización del lienzo virtual con proporciones físicas exactas ID-1
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');

    // 1. Fondo de la tarjeta PVC
    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 400, 620);

    // 2. Encabezado Institucional Guinda
    ctx.fillStyle = "#611232";
    ctx.fillRect(0, 0, 400, 95);

    // 3. Franja Divisoria Dorada
    ctx.fillStyle = "#ddc9a3";
    ctx.fillRect(0, 95, 400, 5);

    // 4. Inyección de Leyendas del Encabezado
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText("SERVICIO UNIVERSAL DE SALUD", 200, 42);
    
    ctx.fillStyle = "#ddc9a3";
    ctx.font = "600 11px sans-serif";
    ctx.fillText("ESTADOS UNIDOS MEXICANOS", 200, 70);

    // 5. Cargar e Integrar la Fotografía del Brigadista
    const imgFoto = new Image();
    imgFoto.onload = function() {
        // Marco contenedor blanco
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(116, 126, 168, 208);
        
        // Estampado de fotografía real
        ctx.drawImage(imgFoto, 120, 130, 160, 200);

        ctx.textAlign = "center";
        
        // Renderizado del Nombre Completo
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("NOMBRE COMPLETO", 200, 365);
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(nombre, 200, 392);

        // Renderizado del Puesto
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("PUESTO", 110, 435);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 15px sans-serif";
        ctx.fillText(puesto, 110, 460);

        // Renderizado de la Zona
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("ZONA", 290, 435);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 15px sans-serif";
        ctx.fillText(zona, 290, 460);

        // Renderizado de la Identificación CURP Monoespaciada
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("CURP OFICIAL", 200, 505);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 15px monospace";
        ctx.fillText(curp, 200, 530);

        // 6. Pie de Gafete: Franja de Logotipos
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 555, 400, 50);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, 555, 400, 1); // Línea sutil de contorno

        ctx.fillStyle = "#166534";
        ctx.font = "bold 11px serif";
        ctx.fillText("IMSS", 50, 585);

        ctx.fillStyle = "#831843";
        ctx.font = "bold 11px serif";
        ctx.fillText("ISSSTE", 160, 585);

        ctx.fillStyle = "#064e3b";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("IMSS BIENESTAR", 300, 585);

        // 7. Listón de la Bandera Nacional Inferior
        ctx.fillStyle = "#15803d"; // Tramo Verde
        ctx.fillRect(0, 610, 133, 10);
        ctx.fillStyle = "#ffffff"; // Tramo Blanco
        ctx.fillRect(133, 610, 134, 10);
        ctx.fillStyle = "#b91c1c"; // Tramo Rojo
        ctx.fillRect(267, 610, 133, 10);

        // 8. Conversión Final del Lienzo a Imagen JPEG Líquida
        const urlImagenFinal = canvas.toDataURL('image/jpeg', 0.9);

        // 9. Levantar Modal de Retención Táctil Inmune a Bloqueos
        const modal = document.createElement('div');
        modal.className = 'modal-foto-celular';
        
        const img = document.createElement('img');
        img.src = urlImagenFinal;
        img.className = 'imagen-renderizada';
        
        const texto = document.createElement('p');
        texto.className = 'instrucciones-foto';
        texto.innerHTML = "☝️ MANTÉN PRESIONADA LA CREDENCIAL<br>para guardarla en tu galería o compartirla por WhatsApp.<br><br><span style='font-weight:400; font-size:0.85rem; background:#6b7280; padding:0.5rem 1rem; border-radius:0.5rem; cursor:pointer;'>Toca aquí para regresar</span>";
        
        modal.appendChild(img);
        modal.appendChild(texto);
        document.body.appendChild(modal);

        // Listener para remover la vista flotante
        texto.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        ocultarCarga();
    };
    imgFoto.src = fotoSrc;
});

// Controladores de botones auxiliares de Navegación de Flujo
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});

