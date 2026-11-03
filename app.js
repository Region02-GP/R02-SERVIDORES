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

           // ========================================================
// BLOQUE 2: VALIDADOR DE IDENTIDAD (FRAGMENTO)
// ========================================================
// ... (dentro del flujo de datos.existe, localiza el setTimeout anterior y reemplázalo con este)
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
                } else {
                    document.getElementById('firmaAviso').classList.add('hidden');
                }
            }, 150);
// ...

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
// BLOQUE 4: MOTOR DE RENDERIZADO HD CON DIBUJO DE BANNER DIRECTO (A PRUEBA DE FALLOS)
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

    // 1. Fondo base de la credencial
    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 1276, 2020);

    // 2. 🛡️ DIBUJO DIRECTO DEL BANNER CORPORATIVO POR CÓDIGO (Inmune a CORS y caídas de red)
    // Creamos el degradado guinda institucional en el área superior (De 0 a Y:280)
    const degradadoGuinda = ctx.createLinearGradient(0, 0, 1276, 280);
    degradadoGuinda.addColorStop(0, "#611232");
    degradadoGuinda.addColorStop(0.5, "#7a1c43");
    degradadoGuinda.addColorStop(1, "#4a0d25");
    
    ctx.fillStyle = degradadoGuinda;
    ctx.fillRect(0, 0, 1276, 280);

    // Dibujamos las texturas y ondas abstractas doradas y blancas del banner por vectores
    ctx.fillStyle = "rgba(221, 201, 163, 0.15)"; // Ondas doradas
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.quadraticCurveTo(300, 90, 638, 180);
    ctx.quadraticCurveTo(950, 270, 1276, 120);
    ctx.lineTo(1276, 280);
    ctx.lineTo(0, 280);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)"; // Ondas blancas de brillo
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.quadraticCurveTo(400, 240, 700, 140);
    ctx.quadraticCurveTo(1000, 50, 1276, 220);
    ctx.lineTo(1276, 280);
    ctx.lineTo(0, 280);
    ctx.closePath();
    ctx.fill();

    // 3. CONTENEDOR BLANCO INSTITUCIONAL DEBAJO DEL BANNER (De Y:280 a Y:470)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 280, 1276, 190);
    
    ctx.fillStyle = "#ddc9a3";
    ctx.fillRect(0, 470, 1276, 14); // Cintillo divisorio dorado

    // 4. TEXTOS DEL ENCABEZADO (Sobre el recuadro blanco limpio)
    ctx.fillStyle = "#611232"; // Letras en color guinda institucional
    ctx.textAlign = "center";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("SERVICIO UNIVERSAL DE SALUD", 638, 360);
    
    ctx.fillStyle = "#6b7280";
    ctx.font = "700 28px sans-serif";
    ctx.fillText("ESTADOS UNIDOS MEXICANOS", 638, 425);

    // 5. CARGA EXCLUSIVA DE LA FOTOGRAFÍA DEL BRIGADISTA
    const imgFoto = new Image();
    imgFoto.crossOrigin = "anonymous";

    imgFoto.onload = function() {
        const marcoX = 358;
        const marcoY = 540; 
        const marcoAncho = 560;
        const marcoAlto = 660;

        // Dibujo de marco de contención de la foto
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(marcoX - 15, marcoY - 15, marcoAncho + 30, marcoAlto + 30);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.strokeRect(marcoX - 15, marcoY - 15, marcoAncho + 30, marcoAlto + 30);
        
        let fSrcX = 0, fSrcY = 0, fSrcW = imgFoto.width, fSrcH = imgFoto.height;
        const aspectImagen = imgFoto.width / imgFoto.height;
        const aspectMarco = marcoAncho / marcoAlto;
        
        if (aspectImagen > aspectMarco) {
            fSrcW = imgFoto.height * aspectMarco;
            fSrcX = (imgFoto.width - fSrcW) / 2;
        } else {
            fSrcH = imgFoto.width / aspectMarco;
            fSrcY = (imgFoto.height - fSrcH) / 2;
        }

        ctx.drawImage(imgFoto, fSrcX, fSrcY, fSrcW, fSrcH, marcoX, marcoY, marcoAncho, marcoAlto);
        
        // 6. DATOS DEL PERSONAL BRIGADISTA
        ctx.fillStyle = "#1f2937";
        ctx.textAlign = "center";
        
        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("NOMBRE COMPLETO", 638, 1275);
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 44px sans-serif";
        if (nombre.length > 25) ctx.font = "bold 36px sans-serif";
        ctx.fillText(nombre, 638, 1335);

        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("PUESTO", 340, 1420);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 36px sans-serif";
        ctx.fillText(puesto, 340, 1480);

        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("ZONA", 936, 1420);
        ctx.fillStyle = "#1f2937";
        ctx.font = "600 36px sans-serif";
        ctx.fillText(zona, 936, 1480);

        ctx.fillStyle = "#6b7280";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("CURP OFICIAL", 638, 1560);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 38px monospace";
        ctx.fillText(curp, 638, 1615);

        // Barra Inferior de Logos de Salud
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 1870, 1276, 120);
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, 1870, 1276, 4); 

        ctx.fillStyle = "#166534";
        ctx.font = "bold 32px serif";
        ctx.fillText("IMSS", 180, 1940);
        ctx.fillStyle = "#831843";
        ctx.font = "bold 32px serif";
        ctx.fillText("ISSSTE", 540, 1940);
        ctx.fillStyle = "#064e3b";
        ctx.font = "bold 28px sans-serif";
        ctx.fillText("IMSS BIENESTAR", 980, 1940);

        ctx.fillStyle = "#15803d"; 
        ctx.fillRect(0, 1990, 425, 30);
        ctx.fillStyle = "#ffffff"; 
        ctx.fillRect(425, 1990, 426, 30);
        ctx.fillStyle = "#b91c1c"; 
        ctx.fillRect(851, 1990, 425, 30);

        // 7. PROCESAMIENTO E IMPRESIÓN DE LA FIRMA DIGITAL
        if (firmaBase64 && firmaBase64.startsWith("data:image")) {
            const imgFirma = new Image();
            imgFirma.onload = function() {
                ctx.drawImage(imgFirma, 473, 1675, 330, 110);
                
                ctx.strokeStyle = "#9ca3af";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(438, 1795);
                ctx.lineTo(838, 1795);
                ctx.stroke();
                
                ctx.fillStyle = "#6b7280";
                ctx.font = "bold 20px sans-serif";
                ctx.fillText("FIRMA AUTORIZADA", 638, 1830);
                
                finalizarRenderizadoCredencial(canvas);
            };
            imgFirma.src = firmaBase64;
        } else {
            finalizarRenderizadoCredencial(canvas);
        }
    };
    
    imgFoto.onerror = function() {
        ocultarCarga();
        alert("⚠️ Error: La foto del brigadista no pudo ser integrada por restricciones del navegador móvil.");
    };

    imgFoto.src = fotoSrc;
});

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
// BLOQUE 6: MOTOR MÓVIL PANTALLA COMPLETA PARA FIRMA
// ========================================================
const canvasFirma = document.getElementById('canvasFirma');
const ctxFirma = canvasFirma.getContext('2d');
let dibujando = false;

// Ajusta dinámicamente las dimensiones internas según el modal completo abierto
function inicializarCanvasFirma() {
    const contenedor = canvasFirma.parentElement;
    canvasFirma.width = contenedor.clientWidth;
    canvasFirma.height = contenedor.clientHeight;
    
    ctxFirma.strokeStyle = "#111827"; // Tinta oscura de alta densidad
    ctxFirma.lineWidth = 4; // Trazado más visible
    ctxFirma.lineCap = "round";
    ctxFirma.lineJoin = "round";
}

// Controladores para abrir y cerrar la ventana flotante de firma
document.getElementById('btnAbrirFirmaModal').addEventListener('click', () => {
    document.getElementById('modalFirmaPantallaCompleta').classList.remove('hidden');
    setTimeout(inicializarCanvasFirma, 100);
});

document.getElementById('btnAceptarFirma').addEventListener('click', () => {
    // Si el usuario realizó trazos, se captura el estado
    if (dibujando === false) {
        firmaBase64 = canvasFirma.toDataURL('image/png');
    }
    
    // Si el canvas tiene datos, encendemos el aviso de éxito
    if (firmaBase64 && firmaBase64.length > 1000) {
        document.getElementById('firmaAviso').classList.remove('hidden');
    } else {
        firmaBase64 = "";
        document.getElementById('firmaAviso').classList.add('hidden');
    }
    document.getElementById('modalFirmaPantallaCompleta').classList.add('hidden');
});

// Evento de redimensionamiento de pantalla
window.addEventListener('resize', () => {
    if(!document.getElementById('modalFirmaPantallaCompleta').classList.contains('hidden')) {
        inicializarCanvasFirma();
    }
});

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
    dibujando = false;
}

// Registros de escucha periférica mouse de escritorio
canvasFirma.addEventListener('mousedown', empezarDibujo);
canvasFirma.addEventListener('mousemove', dibujar);
window.addEventListener('mouseup', detenerDibujo);

// Registros táctiles directos con bloqueo de arrastre nativo en pantallas móviles
canvasFirma.addEventListener('touchstart', empezarDibujo, { passive: false });
canvasFirma.addEventListener('touchmove', dibujar, { passive: false });
canvasFirma.addEventListener('touchend', detenerDibujo);

// Botón Limpiador de Trazo
document.getElementById('btnLimpiarFirma').addEventListener('click', () => {
    ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
    firmaBase64 = "";
    document.getElementById('firmaAviso').classList.add('hidden');
});
