// ========================================================
// BLOQUE 1: CONFIGURACIÓN INICIAL Y VISTAS
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyW83ucO62nFH0t4sSC6qhPiLAC_emeMvoVM0GcB-AgxRB6cYpfK8-nwfmdXTSH0lrvSg/exec";

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
            const pat = String(datos.ap_paterno || "").trim();
            const mat = String(datos.ap_materno || "").trim(); 
            const mun = String(datos.municipio || "").trim();
            const pue = String(datos.puesto || "").trim();
            const tel = String(datos.telefono || "").trim();
            const zon = String(datos.zona || "").trim();
            const cor = String(datos.correo || "").trim();
            
            fotoUrlActual = String(datos.foto_url || "").trim();
            firmaBase64 = String(datos.firma_url || "").trim(); // Recuperación desde la columna 11

            // Inyectar datos en el formulario
            document.getElementById('nombre').value = nom;
            document.getElementById('ap_paterno').value = pat;
            document.getElementById('ap_materno').value = mat;
            document.getElementById('municipio').value = mun;
            document.getElementById('puesto').value = pue;
            document.getElementById('telefono').value = tel;
            document.getElementById('zona').value = zon;
            document.getElementById('correo').value = cor;

            // Inicializar el lienzo y pintar la firma recuperada si es válida
            setTimeout(() => {
                inicializarCanvasFirma();
                if (firmaBase64 && firmaBase64.startsWith("data:image")) {
                    const imgFirmaPrevia = new Image();
                    imgFirmaPrevia.onload = function() {
                        ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
                        ctxFirma.drawImage(imgFirmaPrevia, 0, 0);
                    };
                    imgFirmaPrevia.src = firmaBase64;
                }
            }, 150);

            // Validación interna de datos requeridos
            let camposFaltantes = [];
            if (!nom) camposFaltantes.push("Nombre");
            if (!pat) camposFaltantes.push("Primer Apellido");
            if (!mun) camposFaltantes.push("Municipio");
            if (!pue) camposFaltantes.push("Puesto");
            if (!tel) camposFaltantes.push("Teléfono");
            if (!zon) camposFaltantes.push("Zona");
            if (!cor) camposFaltantes.push("Correo");
            if (!fotoUrlActual || fotoUrlActual.startsWith('data:image/svg+xml') || fotoUrlActual.includes('placeholder')) {
                camposFaltantes.push("Fotografía Oficial");
            }
            // 🖋️ AUDITORÍA DE FIRMA: Si está vacío en Sheets, lo mandamos a firmar
            if (!firmaBase64 || firmaBase64 === "" || firmaBase64 === "null") {
                camposFaltantes.push("Firma Digital Obligatoria");
            }

            if (camposFaltantes.length > 0) {
                ocultarCarga();
                alert(`⚠️ PERFIL INCOMPLETO.\n\nCompleta los campos pendientes para desbloquear tu credencial:\n• ${camposFaltantes.join('\n• ')}`);
                document.getElementById('p2_titulo').innerText = "Completar Registro";
                document.getElementById('fotoAviso').classList.add('hidden');
                irAPantalla(2); 
                return; 
            }

            // Perfil completo: Ir a la credencial directa
            document.getElementById('credCompleto').innerText = `${nom} ${pat} ${mat}`.trim().toUpperCase();
            document.getElementById('credPuesto').innerText = pue.toUpperCase();
            document.getElementById('credZona').innerText = zon.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = fotoUrlActual;
            
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
    
    // Bloquear envío si no hay firma en el canvas local
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
        ap_paterno: document.getElementById('ap_paterno').value,
        ap_materno: document.getElementById('ap_materno').value,
        municipio: document.getElementById('municipio').value,
        puesto: document.getElementById('puesto').value,
        telefono: document.getElementById('telefono').value,
        zona: document.getElementById('zona').value,
        correo: document.getElementById('correo').value,
        foto_url: fotoParaEnviar,
        fotoCompletaBase64: fotoCompletaBase64,
        firmaBase64: firmaBase64 // Enviamos la firma actual en formato Base64
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
            
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
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
// BLOQUE 4: MOTOR DE RENDERIZADO HD CON FIRMA INTEGRADA
// ========================================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Dibujando credencial en alta densidad gráfica...");

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

    // Fondo y cintillo superior institucional
    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 1276, 2020);
    ctx.fillStyle = "#611232";
    ctx.fillRect(0, 0, 1276, 320);
    ctx.fillStyle = "#ddc9a3";
    ctx.fillRect(0, 320, 1276, 16);

    // Textos de cabecera
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("SERVICIO UNIVERSAL DE SALUD", 638, 140);
    ctx.fillStyle = "#ddc9a3";
    ctx.font = "600 32px sans-serif";
    ctx.fillText("ESTADOS UNIDOS MEXICANOS", 638, 230);

    const imgFoto = new Image();
    imgFoto.crossOrigin = "anonymous"; // Seguridad antibloqueo CORS

    imgFoto.onload = function() {
        const marcoX = 358;
        const marcoY = 420;
        const marcoAncho = 560;
        const marcoAlto = 700;

        // Dibujar marco blanco de fotografía
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(marcoX - 20, marcoY - 20, marcoAncho + 40, marcoAlto + 40);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 4;
        ctx.strokeRect(marcoX - 20, marcoY - 20, marcoAncho + 40, marcoAlto + 40);
        
        let fuenteX = 0, fuenteY = 0, fuenteAncho = imgFoto.width, fuenteAlto = imgFoto.height;
        const relacionAspectoImagen = imgFoto.width / imgFoto.height;
        const relacionAspectoMarco = marcoAncho / marcoAlto;
        
        if (relacionAspectoImagen > relacionAspectoMarco) {
            fuenteAncho = imgFoto.height * relacionAspectoMarco;
            fuenteX = (imgFoto.width - fuenteAncho) / 2;
        } else {
            fuenteAlto = imgFoto.width / relacionAspectoMarco;
            fuenteY = (imgFoto.height - fuenteAlto) / 2;
        }

        ctx.drawImage(imgFoto, fuenteX, fuenteY, fuenteAncho, fuenteAlto, marcoX, marcoY, marcoAncho, marcoAlto);
        ctx.textAlign = "center";
        
        // Estampar los datos del Brigadista en la estructura del Canvas
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("NOMBRE COMPLETO", 638, 1250);
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 52px sans-serif";
        if (nombre.length > 25) ctx.font = "bold 40px sans-serif";
        ctx.fillText(nombre, 638, 1330);

        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("PUESTO", 340, 1470);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 44px sans-serif";
        ctx.fillText(puesto, 340, 1550);

        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("ZONA", 936, 1470);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 44px sans-serif";
        ctx.fillText(zona, 936, 1550);

        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("CURP OFICIAL", 638, 1690);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 48px monospace";
        ctx.fillText(curp, 638, 1770);

        // Barra inferior de logotipos institucionales
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 1840, 1276, 150);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, 1840, 1276, 4); 

        ctx.fillStyle = "#166534";
        ctx.font = "bold 36px serif";
        ctx.fillText("IMSS", 180, 1930);
        ctx.fillStyle = "#831843";
        ctx.font = "bold 36px serif";
        ctx.fillText("ISSSTE", 540, 1930);
        ctx.fillStyle = "#064e3b";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("IMSS BIENESTAR", 980, 1930);

        ctx.fillStyle = "#15803d"; 
        ctx.fillRect(0, 1990, 425, 30);
        ctx.fillStyle = "#ffffff"; 
        ctx.fillRect(425, 1990, 426, 30);
        ctx.fillStyle = "#b91c1c"; 
        ctx.fillRect(851, 1990, 425, 30);

        // Inserción asíncrona de la firma si existe un dibujo válido
        if (firmaBase64 && firmaBase64.startsWith("data:image")) {
            const imgFirma = new Image();
            imgFirma.onload = function() {
                ctx.drawImage(imgFirma, 438, 1430, 400, 150);
                
                ctx.strokeStyle = "#6b7280";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(438, 1570);
                ctx.lineTo(838, 1570);
                ctx.stroke();
                
                ctx.fillStyle = "#6b7280";
                ctx.font = "bold 20px sans-serif";
                ctx.fillText("FIRMA AUTORIZADA", 638, 1600);
                
                finalizarRenderizadoCredencial(canvas);
            };
            imgFirma.src = firmaBase64;
        } else {
            finalizarRenderizadoCredencial(canvas);
        }
    };
    
    imgFoto.onerror = function() {
        ocultarCarga();
        alert("⚠️ Error de procesamiento: Google Drive denegó la transmisión de la imagen o expiró. Intenta de nuevo.");
    };
    imgFoto.src = fotoSrc;
});

// Invoca el modal contenedor flotante con la imagen lista en HD para guardado celular
function finalizarRenderizadoCredencial(canvas) {
    const urlImagenFinal = canvas.toDataURL('image/jpeg', 1.0);
    const modal = document.createElement('div');
    modal.className = 'modal-foto-celular';
    
    const img = document.createElement('img');
    img.src = urlImagenFinal;
    img.className = 'imagen-renderizada';
    img.style.width = "auto";
    img.style.height = "75vh";
    
    const texto = document.createElement('p');
    texto.className = 'instrucciones-foto';
    texto.innerHTML = "☝️ MANTÉN PRESIONADA LA CREDENCIAL<br>para guardarla o compartirla.<br><br><span id='btnCerrarModalFirma' style='font-weight:400; font-size:0.85rem; background:#6b7280; padding:0.5rem 1rem; border-radius:0.5rem; cursor:pointer;'>Regresar</span>";
    
    modal.appendChild(img);
    modal.appendChild(texto);
    document.body.appendChild(modal);

    document.getElementById('btnCerrarModalFirma').addEventListener('click', () => { 
        document.body.removeChild(modal); 
    });
    ocultarCarga();
}
// ========================================================
// BLOQUE 5: NAVEGACIÓN Y CONTROLES SECUNDARIOS
// ========================================================

// Botón "✏️ Modificar" de la pantalla de la credencial
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2); // Te regresa al formulario
    setTimeout(inicializarCanvasFirma, 150); // Reactiva el área de dibujo de la firma
});

// Botón "◀ Salir" de la pantalla de la credencial
document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = ""; // Limpia el buscador
    irAPantalla(1); // Te regresa al inicio de sesión
});
// ========================================================
// BLOQUE 6: MOTOR DE CAPTURA TÁCTIL PARA FIRMA
// ========================================================
const canvasFirma = document.getElementById('canvasFirma');
const ctxFirma = canvasFirma.getContext('2d');
let dibujando = false;

// Ajusta el ancho interno relativo del canvas al contenedor real en pantalla
function inicializarCanvasFirma() {
    const rect = canvasFirma.getBoundingClientRect();
    canvasFirma.width = rect.width;
    canvasFirma.height = 150; 
    ctxFirma.strokeStyle = "#1f2937"; 
    ctxFirma.lineWidth = 3;
    ctxFirma.lineCap = "round";
    ctxFirma.lineJoin = "round";
}

window.addEventListener('resize', inicializarCanvasFirma);

// Calcula coordenadas normalizadas sin importar el scroll del dispositivo
function obtenerPosicion(e) {
    const rect = canvasFirma.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function empezarDibujo(e) {
    dibujando = true;
    const pos = obtenerPosicion(e);
    ctxFirma.beginPath();
    ctxFirma.moveTo(pos.x, pos.y);
    if(e.cancelable) e.preventDefault();
}

function dibujar(e) {
    if (!dibujando) return;
    const pos = obtenerPosicion(e);
    ctxFirma.lineTo(pos.x, pos.y);
    ctxFirma.stroke();
    if(e.cancelable) e.preventDefault();
}

function detenerDibujo() {
    if (dibujando) {
        dibujando = false;
        firmaBase64 = canvasFirma.toDataURL('image/png'); // Guarda el trazo actual en Base64
    }
}

// Escuchadores para periféricos tradicionales (PC/Mouse)
canvasFirma.addEventListener('mousedown', empezarDibujo);
canvasFirma.addEventListener('mousemove', dibujar);
window.addEventListener('mouseup', detenerDibujo);

// Escuchadores con prevención de scroll nativo para móviles (Táctil)
canvasFirma.addEventListener('touchstart', empezarDibujo, { passive: false });
canvasFirma.addEventListener('touchmove', dibujar, { passive: false });
canvasFirma.addEventListener('touchend', detenerDibujo);

// Botón Limpiar Lienzo
document.getElementById('btnLimpiarFirma').addEventListener('click', () => {
    ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
    firmaBase64 = "";
});
