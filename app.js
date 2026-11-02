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
// BLOQUE 4: ENVÍO DE DATOS Y SINCRONIZACIÓN (CORREGIDO)
// ==========================================

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const curp = document.getElementById('nombre_curp').value;
    mostrarCarga("Sincronizando y guardando en la nube...");

    const payloadCompleto = {
        action: 'guardar', // CORREGIDO: Se añadió la 'r' para que Google reciba la acción exacta
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
            
            // Actualizar interfaz final de la tarjeta
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
// BLOQUE 5: DIBUJO MATEMÁTICO CANVAS (RESOLUCIÓN 2K ULTRA HD)
// ==========================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Generando credencial en Ultra HD (Calidad de Impresión)...");

    const curp = document.getElementById('credIdentificacion').innerText;
    const nombre = document.getElementById('credCompleto').innerText;
    const puesto = document.getElementById('credPuesto').innerText;
    const zona = document.getElementById('credZona').innerText;
    const fotoSrc = document.getElementById('credFoto').src;

    // 1. Inicialización del lienzo en resolución 2K (Doble de densidad de píxeles)
    const canvas = document.createElement('canvas');
    canvas.width = 1276;   // Resolución duplicada para nitidez absoluta
    canvas.height = 2020;  // Proporción vertical ID-1 Perfecta
    const ctx = canvas.getContext('2d');

    // Forzar al navegador a usar los mejores algoritmos de suavizado de imagen
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo base de la tarjeta
    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 1276, 2020);

    // 2. Encabezado Institucional Guinda
    ctx.fillStyle = "#611232";
    ctx.fillRect(0, 0, 1276, 320);

    // Franja Divisoria Dorada
    ctx.fillStyle = "#ddc9a3";
    ctx.fillRect(0, 320, 1276, 16);

    // Textos del Encabezado (Tamaños duplicados para acompañar la resolución)
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("SERVICIO UNIVERSAL DE SALUD", 638, 140);
    
    ctx.fillStyle = "#ddc9a3";
    ctx.font = "600 32px sans-serif";
    ctx.fillText("ESTADOS UNIDOS MEXICANOS", 638, 230);

    // 3. Cargar la Fotografía con Algoritmo de Proporción HD
    const imgFoto = new Image();
    imgFoto.onload = function() {
        // Coordenadas proporcionales escaladas
        const marcoX = 358;
        const marcoY = 420;
        const marcoAncho = 560;
        const marcoAlto = 700;

        // Dibujar el fondo y contorno blanco del marco de la fotografía
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(marcoX - 20, marcoY - 20, marcoAncho + 40, marcoAlto + 40);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 4;
        ctx.strokeRect(marcoX - 20, marcoY - 20, marcoAncho + 40, marcoAlto + 40);
        
        // Algoritmo de encuadre proporcional ("Object-fit: cover")
        let fuenteX = 0;
        let fuenteY = 0;
        let fuenteAncho = imgFoto.width;
        let fuenteAlto = imgFoto.height;
        
        const relacionAspectoImagen = imgFoto.width / imgFoto.height;
        const relacionAspectoMarco = marcoAncho / marcoAlto;
        
        if (relacionAspectoImagen > relacionAspectoMarco) {
            fuenteAncho = imgFoto.height * relacionAspectoMarco;
            fuenteX = (imgFoto.width - fuenteAncho) / 2;
        } else {
            fuenteAlto = imgFoto.width / relacionAspectoMarco;
            fuenteY = (imgFoto.height - fuenteAlto) / 2;
        }

        // Estampar la fotografía con el suavizado de alta calidad activo
        ctx.drawImage(imgFoto, fuenteX, fuenteY, fuenteAncho, fuenteAlto, marcoX, marcoY, marcoAncho, marcoAlto);

        // 4. Renderizado de Datos del Gafete en Alta Densidad
        ctx.textAlign = "center";
        
        // Nombre Completo
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("NOMBRE COMPLETO", 638, 1250);
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 52px sans-serif";
        if (nombre.length > 25) ctx.font = "bold 40px sans-serif";
        ctx.fillText(nombre, 638, 1330);

        // Puesto
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("PUESTO", 340, 1470);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 44px sans-serif";
        ctx.fillText(puesto, 340, 1550);

        // Zona
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("ZONA", 936, 1470);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 44px sans-serif";
        ctx.fillText(zona, 936, 1550);

        // CURP Oficial
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("CURP OFICIAL", 638, 1690);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 48px monospace";
        ctx.fillText(curp, 638, 1770);

        // 5. Pie de Gafete: Bloque Blanco de Logotipos
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 1840, 1276, 150);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, 1840, 1276, 4); // Línea divisoria

        ctx.fillStyle = "#166534";
        ctx.font = "bold 36px serif";
        ctx.fillText("IMSS", 180, 1930);

        ctx.fillStyle = "#831843";
        ctx.font = "bold 36px serif";
        ctx.fillText("ISSSTE", 540, 1930);

        ctx.fillStyle = "#064e3b";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("IMSS BIENESTAR", 980, 1930);

        // 6. Barra de la Bandera Nacional Inferior
        ctx.fillStyle = "#15803d"; // Verde
        ctx.fillRect(0, 1990, 425, 30);
        ctx.fillStyle = "#ffffff"; // Blanco
        ctx.fillRect(425, 1990, 426, 30);
        ctx.fillStyle = "#b91c1c"; // Rojo
        ctx.fillRect(851, 1990, 425, 30);

        // 7. Conversión a JPG al 100% de calidad sin compresión destructiva
        const urlImagenFinal = canvas.toDataURL('image/jpeg', 1.0);

        const modal = document.createElement('div');
        modal.className = 'modal-foto-celular';
        
        const img = document.createElement('img');
        img.src = urlImagenFinal;
        img.className = 'imagen-renderizada';
        img.style.width = "auto";
        img.style.height = "75vh";
        img.style.aspectRatio = "1276 / 2020";
        
        const texto = document.createElement('p');
        texto.className = 'instrucciones-foto';
        texto.innerHTML = "☝️ MANTÉN PRESIONADA LA CREDENCIAL<br>para guardarla en tu galería o compartirla por WhatsApp.<br><br><span style='font-weight:400; font-size:0.85rem; background:#6b7280; padding:0.5rem 1rem; border-radius:0.5rem; cursor:pointer;'>Toca aquí para regresar</span>";
        
        modal.appendChild(img);
        modal.appendChild(texto);
        document.body.appendChild(modal);

        texto.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        ocultarCarga();
    };
    imgFoto.src = fotoSrc;
});

// Controladores auxiliares de navegación de flujo
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});

