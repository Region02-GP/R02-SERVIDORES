// ========================================================
// BLOQUE 1: CONFIGURACIÓN INICIAL Y VISTAS
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz8DgfEUyjfzexnKyi-kRBhpjiuApJq-P_WMxPH5UsL1pQ10ghHpIiqAb9v1L2BTHwCqA/exec";

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
        if (datos.existe) {
            const nom = String(datos.nombre || "").trim(); 
            const mun = String(datos.municipio || "").trim();
            const pue = String(datos.puesto || "").trim();
            const tel = String(datos.telefono || "").trim();
            const zon = String(datos.zona || "").trim(); 
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
// ====================================================================
// BLOQUE 4 (PARTE 1): CAPTURA DE VARIABLES Y CONTROL DE RECURSOS HD
// ====================================================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Dibujando credencial en alta densidad gráfica...");

    // Se capturan los datos dinámicos exactamente en el momento de hacer clic
    const curp = document.getElementById('credIdentificacion').innerText;
    const nombre = document.getElementById('credCompleto').innerText;
    const puesto = document.getElementById('credPuesto').innerText;
    const zona = document.getElementById('credZona').innerText;
    const fotoSrc = document.getElementById('credFoto').src;
    const municipio = document.getElementById('municipio').value.trim().toUpperCase() || "NO ESPECIFICADO";

    const canvas = document.createElement('canvas');
    canvas.width = 1276;   
    canvas.height = 2020;  
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Esquinar redondeado general (PVC Card style)
    const cardRadius = 60; 
    ctx.beginPath();
    ctx.moveTo(cardRadius, 0);
    ctx.lineTo(canvas.width - cardRadius, 0);
    ctx.quadraticCurveTo(canvas.width, 0, canvas.width, cardRadius);
    ctx.lineTo(canvas.width, canvas.height - cardRadius);
    ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - cardRadius, canvas.height);
    ctx.lineTo(cardRadius, canvas.height);
    ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - cardRadius);
    ctx.lineTo(0, cardRadius);
    ctx.quadraticCurveTo(0, 0, cardRadius, 0);
    ctx.closePath();
    ctx.clip(); 

    // Fondo base del gafete
    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 1276, 2020);

    const imgBanner = new Image();
    const imgFoto = new Image();
    const imgFirma = new Image();
    const imgFooter = new Image(); // Nueva instancia agregada para el procesamiento asíncrono

    let descargasExitosas = 0;
    const totalImagenes = 4; // Cambiado a 4 recursos gráficos obligatorios

    function verificarCargas() {
        descargasExitosas++;
        if (descargasExitosas === totalImagenes) {
            setTimeout(construirGraficosGafete, 100);
        }
    }

    imgBanner.onload = verificarCargas;
    imgFoto.onload = verificarCargas;
    imgFirma.onload = verificarCargas;
    imgFooter.onload = verificarCargas;

    imgBanner.onerror = function() {
        console.warn("⚠️ Fallo al cargar el Banner remoto. Aplicando contingencia de color institucional.");
        ctx.fillStyle = "#611232";
        ctx.fillRect(0, 0, 1276, 280);
        verificarCargas();
    };
    
    imgFoto.onerror = function() {
        console.warn("⚠️ La foto del brigadista falló. Aplicando silueta de contingencia.");
        imgFoto.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADAEYAAACl6ZIsAAAAFElEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCXA80AAAG67v3fAAAAAElFTkSuQmCC";
    };

    imgFirma.onerror = function() {
        console.warn("⚠️ No se localizó firma digital o falló la carga. Saltando renderizado.");
        verificarCargas();
    };

    imgFooter.onerror = function() {
        console.error("⚠️ Fallo crítico al cargar el Footer remoto.");
        verificarCargas();
    };

    imgBanner.crossOrigin = "anonymous";
    imgFoto.crossOrigin = "anonymous";
    imgFirma.crossOrigin = "anonymous";
    imgFooter.crossOrigin = "anonymous";

    // Enlaces de imágenes de recursos
    imgBanner.src = "https://i.postimg.cc/bwFBd3ch/Servidores-de-la-Nacion-Region-02.png";
    imgFoto.src = fotoSrc;
    imgFirma.src = firmaBase64 || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    
    // REEMPLAZA ESTA URL CON EL ENLACE DE TU NUEVA IMAGEN DE FOOTER
    imgFooter.src = "https://i.postimg.cc/vZgg4vyj/Banner-tricolor-mexicano-con-escudo-central.png";
// ====================================================================
// BLOQUE 4 (PARTE 2): ALGORITMO OBJECT-FIT, DIBUJO Y DESCARGA PNG HD
// ====================================================================

    function construirGraficosGafete() {
        try {
            // Banner superior
            try {
                ctx.drawImage(imgBanner, 0, 0, 1276, 280); 
            } catch(e) {
                ctx.fillStyle = "#611232";
                ctx.fillRect(0, 0, 1276, 280);
            }

            // Encuadre de fotografía (Object-fit: Cover)
            const targetX = 458, targetY = 350, targetW = 360, targetH = 480;
            const fotoRadius = 24; 

            ctx.save(); 
            ctx.beginPath();
            ctx.moveTo(targetX + fotoRadius, targetY);
            ctx.lineTo(targetX + targetW - fotoRadius, targetY);
            ctx.quadraticCurveTo(targetX + targetW, targetY, targetX + targetW, targetY + fotoRadius);
            ctx.lineTo(targetX + targetW, targetY + targetH - fotoRadius);
            ctx.quadraticCurveTo(targetX + targetW, targetY + targetH, targetX + targetW - fotoRadius, targetY + targetH);
            ctx.lineTo(targetX + fotoRadius, targetY + targetH);
            ctx.quadraticCurveTo(targetX, targetY + targetH, targetX, targetY + targetH - fotoRadius);
            ctx.lineTo(targetX, targetY + fotoRadius);
            ctx.quadraticCurveTo(targetX, targetY, targetX + fotoRadius, targetY);
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = "#e5e7eb";
            ctx.fillRect(targetX, targetY, targetW, targetH);

            let imgW = imgFoto.width;
            let imgH = imgFoto.height;
            let srcX = 0, srcY = 0, srcW = imgW, srcH = imgH;

            const aspectoImagen = imgW / imgH;
            const aspectoContenedor = targetW / targetH;

            if (aspectoImagen > aspectoContenedor) {
                srcW = imgH * aspectoContenedor;
                srcX = (imgW - srcW) / 2;
            } else {
                srcH = imgW / aspectoContenedor;
                srcY = (imgH - srcH) / 2;
            }

            ctx.drawImage(imgFoto, srcX, srcY, srcW, srcH, targetX, targetY, targetW, targetH);
            ctx.restore(); 

            // Filete dorado decorativo exterior de foto
            ctx.strokeStyle = "#ddc9a3";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(targetX + fotoRadius, targetY);
            ctx.lineTo(targetX + targetW - fotoRadius, targetY);
            ctx.quadraticCurveTo(targetX + targetW, targetY, targetX + targetW, targetY + fotoRadius);
            ctx.lineTo(targetX + targetW, targetY + targetH - fotoRadius);
            ctx.quadraticCurveTo(targetX + targetW, targetY + targetH, targetX + targetW - fotoRadius, targetY + targetH);
            ctx.lineTo(targetX + fotoRadius, targetY + targetH);
            ctx.quadraticCurveTo(targetX, targetY + targetH, targetX, targetY + targetH - fotoRadius);
            ctx.lineTo(targetX, targetY + fotoRadius);
            ctx.quadraticCurveTo(targetX, targetY, targetX + fotoRadius, targetY);
            ctx.closePath();
            ctx.stroke();

            // Dibujo de datos e información textual nominativa
            ctx.fillStyle = "#1f2937"; 
            ctx.textAlign = "center";   

            ctx.font = "bold 46px sans-serif";
            ctx.fillText(nombre, canvas.width / 2, 980); 

            ctx.strokeStyle = "#e5e7eb";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(200, 1040);
            ctx.lineTo(1076, 1040);
            ctx.stroke();

            ctx.fillStyle = "#6b7280"; 
            ctx.font = "600 28px sans-serif";
            ctx.fillText("PUESTO O CARGO", (canvas.width / 2) - 250, 1100);
            ctx.fillText("ZONA / REGIÓN", (canvas.width / 2) + 250, 1100);

            ctx.fillStyle = "#1f2937";
            ctx.font = "bold 36px sans-serif";
            ctx.fillText(puesto, (canvas.width / 2) - 250, 1160);
            ctx.fillText(zona, (canvas.width / 2) + 250, 1180);

            ctx.fillStyle = "#6b7280";
            ctx.font = "600 28px sans-serif";
            ctx.fillText("MUNICIPIO ADSCRITO", canvas.width / 2, 1265);
            
            ctx.fillStyle = "#1f2937";
            ctx.font = "bold 36px sans-serif";
            ctx.fillText(municipio, canvas.width / 2, 1320);

            ctx.fillStyle = "#6b7280";
            ctx.font = "600 28px sans-serif";
            ctx.fillText("CURP OFICIAL DEL BRIGADISTA", canvas.width / 2, 1415);

            ctx.fillStyle = "#111827";
            ctx.font = "bold 38px monospace";
            ctx.fillText(curp, canvas.width / 2, 1475);

            // Estampado asíncrono de firma digital
            if (firmaBase64 && firmaBase64.startsWith("data:image")) {
                ctx.fillStyle = "#6b7280";
                ctx.font = "600 24px sans-serif";
                ctx.fillText("FIRMA DIGITAL AUTORIZADA", canvas.width / 2, 1565);
                
                const firmaW = 340;
                const firmaH = 140;
                const firmaX = (canvas.width / 2) - (firmaW / 2);
                const firmaY = 1585;
                
                ctx.drawImage(imgFirma, firmaX, firmaY, firmaW, firmaH);
            }

            // DIBUJO E INTEGRACIÓN GRÁFICA DEL NUEVO FOOTER HD REMOTO EN LA BASE DEL CANVAS
            const footerHeight = 220; // Espacio asignado en píxeles HD
            const footerY = canvas.height - footerHeight; // Ubicación exacta (Y: 1800)
            
            try {
                ctx.drawImage(imgFooter, 0, footerY, canvas.width, footerHeight);
            } catch(eFooter) {
                console.warn("Fallo el estampado de contingencia gráfica, aplicando color base.");
                ctx.fillStyle = "#611232";
                ctx.fillRect(0, footerY, canvas.width, footerHeight);
            }

            // Descarga automatizada PNG
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
// ========================================================
// BLOQUE EXTRA: INICIALIZACIÓN DE FIRMA DIGITAL Y CAPTURA
// ========================================================

// Botones de Modificación y Sesión
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    document.getElementById('fotoAviso').classList.remove('hidden');
    document.getElementById('firmaAviso').classList.remove('hidden');
    irAPantalla(2);
});

document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    firmaBase64 = "";
    fotoCompletaBase64 = "";
    fotoUrlActual = "";
    document.getElementById('fotoAviso').classList.add('hidden');
    document.getElementById('firmaAviso').classList.add('hidden');
    irAPantalla(1);
});

let canvasFirma, ctxFirma;
let enTrazo = false;

function inicializarCanvasFirma() {
    canvasFirma = document.getElementById('canvasFirma');
    if (!canvasFirma) return;
    
    ctxFirma = canvasFirma.getContext('2d');

    const rect = canvasFirma.parentElement.getBoundingClientRect();
    canvasFirma.width = rect.width > 0 ? rect.width : window.innerWidth * 0.9;
    canvasFirma.height = rect.height > 0 ? rect.height : window.innerHeight * 0.6;

    ctxFirma.strokeStyle = "#1e293b"; 
    ctxFirma.lineWidth = 4;           
    ctxFirma.lineCap = "round";       
    ctxFirma.lineJoin = "round";      

    if (canvasFirma.dataset.isInit === "true") return;
    canvasFirma.dataset.isInit = "true";

    function obtenerPosicion(e) {
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        const cRect = canvasFirma.getBoundingClientRect();
        return {
            x: (clientX - cRect.left) * (canvasFirma.width / cRect.width),
            y: (clientY - cRect.top) * (canvasFirma.height / cRect.height)
        };
    }

    function iniciarDibujo(e) {
        e.preventDefault(); 
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

    canvasFirma.addEventListener('touchstart', iniciarDibujo, { passive: false });
    canvasFirma.addEventListener('touchmove', dibujar, { passive: false });
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
