// ========================================================
// BLOQUE 1: CONFIGURACIÓN INICIAL Y VISTAS
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxnyeH4ua3RigrzT5M8ga0I5m5WpN6pDoQd_7DUD-ByxSGWJnxgpfvoZAXfZAApIwqt2w/exec";

let firmaBase64 = ""; // Almacenará el trazo de la firma en formato Base64
let fotoCompletaBase64 = ""; // Foto local capturada
let fotoUrlActual = ""; // URL de la foto en la base de datos

// Función para alternar entre las tres pantallas principales
function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}

// Muestra el overlay de procesamiento
function mostrarCarga(texto) {
    document.getElementById('textoCarga').innerText = texto || "Procesando...";
    document.getElementById('pantallaCarga').classList.remove('hidden');
}

// Oculta el overlay de procesamiento
function ocultarCarga() {
    document.getElementById('pantallaCarga').classList.add('hidden');
}
// ========================================================
// BLOQUE 2: VALIDADOR DE IDENTIDAD (ACCESO)
// ========================================================

document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    mostrarCarga("Verificando identidad en el padrón autorizado...");

    try {
        const payloadBuscar = { action: 'buscar', curp: curp };
        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payloadBuscar)
        });
        
        const datos = await res.json();

        // Control de brigadistas rechazados por el padrón
        if (datos.status === "denied") {
            ocultarCarga();
            alert(`⛔ ACCESO DENEGADO\n\n${datos.message}`);
            return;
        }

        document.getElementById('nombre_curp').value = curp;

        // Caso A: El brigadista ya tiene registros previos en Sheets
               // Caso A: El brigadista ya tiene registros previos en Sheets
        if (datos.existe) {
            const nom = String(datos.nombre || "").trim(); 
            const mun = String(datos.municipio || "").trim();
            const pue = String(datos.puesto || "").trim();
            const tel = String(datos.telefono || "").trim();
            const zon = String(datos.zona || "").trim(); // El servidor ya entrega la propiedad mapeada correctamente
            const cor = String(datos.correo || "").trim();
            
            fotoUrlActual = String(datos.foto_url || "").trim();
            firmaBase64 = String(datos.firma_url || "").trim();

            // Inyectar datos en el formulario por si decide modificar
            document.getElementById('nombre').value = nom;
            document.getElementById('municipio').value = mun;
            document.getElementById('puesto').value = pue;
            document.getElementById('telefono').value = tel;
            document.getElementById('zona').value = zon;
            document.getElementById('correo').value = cor;


            // Validación interna de datos requeridos (Sin apellidos)
            let camposFaltantes = [];
            if (!nom) camposFaltantes.push("Nombre Completo");
            if (!mun) camposFaltantes.push("Municipio");
            if (!pue) camposFaltantes.push("Puesto");
            if (!tel) camposFaltantes.push("Teléfono");
            if (!zon) camposFaltantes.push("Zona");
            if (!cor) camposFaltantes.push("Correo");
            if (!fotoUrlActual || fotoUrlActual.startsWith('data:image/svg+xml') || fotoUrlActual.includes('placeholder')) {
                camposFaltantes.push("Fotografía Oficial");
            }
            if (!firmaBase64 || firmaBase64 === "" || firmaBase64 === "null") {
                camposFaltantes.push("Firma Digital Obligatoria");
            }

            if (camposFaltantes.length > 0) {
                ocultarCarga();
                alert(`⚠️ PERFIL INCOMPLETO.\n\nCompleta los campos pendientes para desbloquear tu credencial:\n• ${camposFaltantes.join('\n• ')}`);
                document.getElementById('p2_titulo').innerText = "Completar Registro";
                document.getElementById('fotoAviso').classList.add('hidden');
                
                setTimeout(() => {
                    inicializarCanvasFirma();
                }, 150);
                
                irAPantalla(2); 
                return; 
            }

            // Perfil completo: Ir a la credencial directa
            document.getElementById('credCompleto').innerText = nom.toUpperCase();
            document.getElementById('credPuesto').innerText = pue.toUpperCase();
            document.getElementById('credZona').innerText = zon.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = fotoUrlActual;
            
            setTimeout(() => {
                inicializarCanvasFirma();
                if (firmaBase64 && firmaBase64.startsWith("data:image")) {
                    document.getElementById('firmaAviso').classList.remove('hidden');
                    const imgFirmaPrevia = new Image();
                    imgFirmaPrevia.onload = function() {
                        ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
                        ctxFirma.drawImage(imgFirmaPrevia, 0, 0);
                    };
                    imgFirmaPrevia.src = firmaBase64;
                }
            }, 150);

            ocultarCarga();
            irAPantalla(3);

        } else {
            // Caso B: El brigadista accede por primera vez al sistema
            ocultarCarga();
            alert(`🎉 ¡Validación Exitosa!\n\nCURP localizada en el padrón oficial. Complementa tu perfil para emitir tu credencial.`);
            
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            
            document.getElementById('nombre').value = String(datos.nombre_oficial || "").toUpperCase();
            document.getElementById('municipio').value = String(datos.municipio_oficial || "").toUpperCase();
            
            fotoUrlActual = "";
            fotoCompletaBase64 = "";
            firmaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            document.getElementById('firmaAviso').classList.add('hidden');
            
            setTimeout(inicializarCanvasFirma, 150);
            irAPantalla(2);
        }
    } catch (err) {
        console.error(err);
        ocultarCarga();
        alert('Error en el enlace de red con el módulo de acceso. Verifica que la URL del servidor sea correcta.');
    }
});
// ========================================================
// BLOQUE 3: COMPRESIÓN FOTOGRÁFICA Y ENVÍO SINCRO
// ========================================================

document.getElementById('inputFoto').addEventListener('change', (e) => {
    const files = e.target.files; 
    if (files && files.length > 0) {
        mostrarCarga("Comprimiendo fotografía a escala celular...");
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = 180; 
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                
                let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;
                const aspectImg = img.width / img.height;
                const aspectCanv = 180 / 240;
                
                if (aspectImg > aspectCanv) {
                    srcW = img.height * aspectCanv;
                    srcX = (img.width - srcW) / 2;
                } else {
                    srcH = img.width / aspectCanv;
                    srcY = (img.height - srcH) / 2;
                }

                ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 180, 240);
                fotoCompletaBase64 = canvas.toDataURL('image/jpeg', 0.6);
                
                document.getElementById('fotoAviso').classList.remove('hidden');
                ocultarCarga();
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(files[0]);
    }
});

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!firmaBase64 || firmaBase64 === "") {
        alert("⚠️ CAMPOS REQUERIDOS:\n\nEs obligatorio estampar tu firma en el recuadro blanco antes de guardar el registro.");
        return false;
    }

    const curp = document.getElementById('nombre_curp').value;
    mostrarCarga("Sincronizando información de brigadista...");

    let fotoParaEnviar = fotoUrlActual;
    if (fotoCompletaBase64) {
        fotoParaEnviar = fotoCompletaBase64;
    }

    const payloadCompleto = {
        action: 'guardar',
        curp: curp,
        nombre: document.getElementById('nombre').value,
        municipio: document.getElementById('municipio').value,
        puesto: document.getElementById('puesto').value,
        telefono: document.getElementById('telefono').value,
        zona: document.getElementById('zona').value,
        correo: document.getElementById('correo').value,
        foto_url: fotoParaEnviar,
        fotoCompletaBase64: fotoCompletaBase64,
        firmaBase64: firmaBase64 
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
            alert('🎉 ¡Perfil sincronizado correctamente!');
            
            document.getElementById('credCompleto').innerText = document.getElementById('nombre').value.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            
            fotoUrlActual = resultado.foto_url || fotoParaEnviar;
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
        alert('Fallo de sincronización con la base de datos central.');
    }
});
// ========================================================
// BLOQUE 4: MOTOR DE RENDERIZADO HD FINAL (CANVAS GRÁFICO)
// ========================================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Dibujando credencial en alta densidad gráfica...");

    // Se capturan los datos dinámicos exactamente en el momento de hacer clic
    const curp = document.getElementById('credIdentificacion').innerText;
    const nombre = document.getElementById('credCompleto').innerText;
    const puesto = document.getElementById('credPuesto').innerText;
    const zona = document.getElementById('credZona').innerText;
    const fotoSrc = document.getElementById('credFoto').src;

    const canvas = document.createElement('canvas');
    canvas.width = 1276;   
    canvas.height = 2020;  
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fondo base del gafete
    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 1276, 2020);

    const imgBanner = new Image();
    const imgFoto = new Image();

    let descargasExitosas = 0;
    function verificarCargas() {
        descargasExitosas++;
        if (descargasExitosas === 2) {
            setTimeout(construirGraficosGafete, 100);
        }
    }

    imgBanner.onload = verificarCargas;
    imgFoto.onload = verificarCargas;

    imgBanner.onerror = function() {
        console.warn("⚠️ Fallo al cargar el Banner. Aplicando contingencia de color.");
        verificarCargas();
    };
    
    imgFoto.onerror = function() {
        console.warn("⚠️ La foto del brigadista falló. Aplicando silueta de contingencia.");
        imgFoto.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADAEYAAACl6ZIsAAAAFElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCXA80AAAG67v3fAAAAAElFTkSuQmCC";
    };

    imgBanner.crossOrigin = "anonymous";
    imgFoto.crossOrigin = "anonymous";

    // Asignación de rutas de origen (Banner Base64 Reparado)
    imgBanner.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACHwAAALUCAIAAAD8byAGAABVeWNhQlgAAFV5anVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAVVNqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOmQzOTE2OGIyLTcyMTItNGVjYi1hMzY0LTczMmUxZmY0OTA3ZQAAAAx8anVtYgAAAClqdW1kYzJhcwARABCAAACqADibcQNjMnBhLmFzc2VydGlvbnMAAAAJ0Wp1bWIAAAA7anVtZEDLDDK7ikidpwsq1vR/Q2kTYzJwYS5pY29uAAAAABhjMnNo3a9MTCYv/nwYI2VR7N0CuwAAABdiZmRiAGltYWdlL3N2Zyt4bWwAAAAJd2JpZGI8c3ZnIHdpZHRoPSI3MTYiIGhlaWdodD0iNzE2IiB2aWV3Qm94PSIwIDAgNzE2IDcxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUwOC43NDkgMzE3LjM5OUM1MTYuNzc3IDI4Ny4zMTQgNTA4LjkuYwYBAAFAyBhA2AIEAAsYyAxgAAQGAAgMAIHAQCAsAAsAghACwEIAmGcCwEDIXGEA/wDREpYREgBAICQkCYHAPJMB/wEDAJLMBP8AAA==";
    imgFoto.src = fotoSrc;

    function construirGraficosGafete() {
        try {
            try {
                ctx.drawImage(imgBanner, 0, 0, 1276, 280); 
            } catch(e) {
                ctx.fillStyle = "#611232";
                ctx.fillRect(0, 0, 1276, 280);
            }

            try {
                ctx.drawImage(imgFoto, 458, 350, 360, 480); 
            } catch(e) {
                ctx.fillStyle = "#e5e7eb";
                ctx.fillRect(458, 350, 360, 480);
            }

            ctx.fillStyle = "#1f2937"; 
            ctx.textAlign = "center";   

            ctx.font = "bold 46px sans-serif";
            ctx.fillText(nombre, canvas.width / 2, 980); 

            ctx.strokeStyle = "#e5e7eb";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(200, 1050);
            ctx.lineTo(1076, 1050);
            ctx.stroke();

            ctx.fillStyle = "#6b7280"; 
            ctx.font = "600 28px sans-serif";
            ctx.fillText("PUESTO O CARGO", (canvas.width / 2) - 250, 1120);
            ctx.fillText("ZONA / REGIÓN", (canvas.width / 2) + 250, 1120);

            ctx.fillStyle = "#1f2937";
            ctx.font = "bold 36px sans-serif";
            ctx.fillText(puesto, (canvas.width / 2) - 250, 1180);
            ctx.fillText(zona, (canvas.width / 2) + 250, 1180);

            ctx.fillStyle = "#6b7280";
            ctx.font = "600 28px sans-serif";
            ctx.fillText("CURP OFICIAL DEL BRIGADISTA", canvas.width / 2, 1310);

            ctx.fillStyle = "#111827";
            ctx.font = "bold 38px monospace";
            ctx.fillText(curp, canvas.width / 2, 1370);

            ctx.fillStyle = "#166534";
            ctx.font = "bold 26px serif";
            ctx.fillText("IMSS", 250, 1850);

            ctx.fillStyle = "#831843";
            ctx.fillText("ISSSTE", 638, 1850);

            ctx.fillStyle = "#064e3b";
            ctx.font = "bold 26px sans-serif";
            ctx.fillText("IMSS BIENESTAR", 1026, 1850);

            ctx.fillStyle = "#15803d";
            ctx.fillRect(0, 1980, 425, 40);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(425, 1980, 426, 40);
            ctx.fillStyle = "#b91c1c";
            ctx.fillRect(851, 1980, 425, 40);

            // CORRECCIÓN: Se removió la propiedad duplicada 'toToDataURL' que rompía el script
            const link = document.createElement('a');
            link.download = `CREDENCIAL_${curp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch(errorFatal) {
            console.error("Error en renderizado:", errorFatal);
        } finally {
            ocultarCarga();
        }
    }
});

// ✏️ BOTÓN MODIFICAR PERFIL (REPARADO Y OPERATIVO)
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    document.getElementById('fotoAviso').classList.remove('hidden');
    document.getElementById('firmaAviso').classList.remove('hidden');
    irAPantalla(2);
});

// ◀ BOTÓN SALIR / CERRAR SESIÓN (REPARADO Y OPERATIVO)
document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    firmaBase64 = "";
    fotoCompletaBase64 = "";
    fotoUrlActual = "";
    document.getElementById('fotoAviso').classList.add('hidden');
    document.getElementById('firmaAviso').classList.add('hidden');
    irAPantalla(1);
});

// ========================================================
// BLOQUE EXTRA: INICIALIZACIÓN DE FIRMA DIGITAL Y CAPTURA
// ========================================================

let canvasFirma, ctxFirma;
let enTrazo = false;

function inicializarCanvasFirma() {
    canvasFirma = document.getElementById('canvasFirma');
    if (!canvasFirma) return;
    
    ctxFirma = canvasFirma.getContext('2d');

    const rect = canvasFirma.parentElement.getBoundingClientRect();
    canvasFirma.width = rect.width;
    canvasFirma.height = rect.height;

    ctxFirma.strokeStyle = "#1e293b"; 
    ctxFirma.lineWidth = 3;           
    ctxFirma.lineCap = "round";       
    ctxFirma.lineJoin = "round";      

    if (canvasFirma.dataset.isInit === "true") return;
    canvasFirma.dataset.isInit = "true";

    function obtenerPosicion(e) {
        const clientX = e.touches ? e.touches.clientX : e.clientX;
        const clientY = e.touches ? e.touches.clientY : e.clientY;
        const cRect = canvasFirma.getBoundingClientRect();
        return {
            x: (clientX - cRect.left) * (canvasFirma.width / cRect.width),
            y: (clientY - cRect.top) * (canvasFirma.height / cRect.height)
        };
    }

    function iniciarDibujo(e) {
        enTrazo = true;
        const pos = obtenerPosicion(e);
        ctxFirma.beginPath();
        ctxFirma.moveTo(pos.x, pos.y);
    }

    function dibujar(e) {
        if (!enTrazo) return;
        e.preventDefault();
        const pos = obtenerPosicion(e);
        ctxFirma.lineTo(pos.x, pos.y);
        ctxFirma.stroke();
    }

    function detenerDibujo() {
        if (enTrazo) {
            enTrazo = false;
            ctxFirma.closePath();
            firmaBase64 = canvasFirma.toDataURL('image/png');
        }
    }

    canvasFirma.addEventListener('mousedown', iniciarDibujo);
    canvasFirma.addEventListener('mousemove', dibujar);
    canvasFirma.addEventListener('mouseup', detenerDibujo);
    canvasFirma.addEventListener('mouseleave', detenerDibujo);

    canvasFirma.addEventListener('touchstart', iniciarDibujo);
    canvasFirma.addEventListener('touchmove', dibujar);
    canvasFirma.addEventListener('touchend', detenerDibujo);
}

document.getElementById('btnAbrirFirmaModal').addEventListener('click', () => {
    document.getElementById('modalFirmaPantallaCompleta').classList.remove('hidden');
    setTimeout(inicializarCanvasFirma, 100);
});

document.getElementById('btnLimpiarFirma').addEventListener('click', () => {
    if (ctxFirma && canvasFirma) {
        ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
        firmaBase64 = "";
        document.getElementById('firmaAviso').classList.add('hidden');
    }
});

document.getElementById('btnAceptarFirma').addEventListener('click', () => {
    if (!firmaBase64 || firmaBase64 === "") {
        alert("Por favor, estampe su firma antes de aceptar.");
        return;
    }
    document.getElementById('firmaAviso').classList.remove('hidden');
    document.getElementById('modalFirmaPantallaCompleta').classList.add('hidden');
});
