// ========================================================
// BLOQUE 1: CONFIGURACIÓN INICIAL Y VISTAS
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxd5X8JYe7-aheiPhE9p-6s1AS2B-zL9McryRmK5oPViX7yOQtjej0aDZaCen5ASZ0dUw/exec";

// Añade esta variable global arriba en tu app.js junto a las demás variables globales:
let nombreGlobalSesion = ""; 

let firmaBase64 = ""; // Almacenará el trazo de la firma en formato Base64
let fotoCompletaBase64 = ""; // Foto local capturada
let fotoUrlActual = ""; // URL de la foto en la base de datos

// REEMPLAZAR LA FUNCIÓN EN TU app.js (BLOQUE 1)
function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla4').classList.add('hidden'); // <-- Nueva línea agregada
    
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
// BLOQUE 2: VALIDADOR DE IDENTIDAD (ACCESO) - RESTAURADO Y CORREGIDO
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
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify(payloadBuscar)
        });

        const datos = await res.json();

        if (datos.status === "denied") {
            ocultarCarga();
            alert(`⛔ ACCESO DENEGADO\n\n${datos.message}`);
            return;
        }

        if (document.getElementById('nombre_curp')) {
            document.getElementById('nombre_curp').value = curp;
        }

               if (datos.existe) {
            const nom = datos.nombre ? String(datos.nombre).trim() : ""; 
            
            // => CORRECCIÓN CRÍTICA DE PERSISTENCIA:
            // Guardamos el nombre verificado oficial en la memoria permanente de la sesión
            nombreGlobalSesion = nom;
 
            const mun = datos.municipio ? String(datos.municipio).trim() : "";
            const pue = datos.puesto ? String(datos.puesto).trim() : "";
            const tel = datos.telefono ? String(datos.telefono).trim() : "";
            const zon = datos.zona ? String(datos.zona).trim() : ""; 
            const cor = datos.correo ? String(datos.correo).trim() : "";
            
            fotoUrlActual = datos.foto_url ? String(datos.foto_url).trim() : "";
            firmaBase64 = datos.firma_url ? String(datos.firma_url).trim() : "";

            if (document.getElementById('nombre')) document.getElementById('nombre').value = nom;
            if (document.getElementById('municipio')) document.getElementById('municipio').value = mun;
            if (document.getElementById('puesto')) document.getElementById('puesto').value = pue;
            if (document.getElementById('telefono')) document.getElementById('telefono').value = tel;
            if (document.getElementById('zona')) document.getElementById('zona').value = zon;
            if (document.getElementById('correo')) document.getElementById('correo').value = cor;

            let camposFaltantes = [];
            if (!nom) camposFaltantes.push("Nombre Completo");
            if (!mun) camposFaltantes.push("Municipio");
            if (!pue) camposFaltantes.push("Puesto");
            if (!tel) camposFaltantes.push("Teléfono");
            if (!zon) camposFaltantes.push("Zona");
            if (!cor) camposFaltantes.push("Correo");
            
            if (!fotoUrlActual || fotoUrlActual.length < 50) {
                camposFaltantes.push("Fotografía Oficial");
            }
            if (!firmaBase64 || firmaBase64.length < 50) {
                camposFaltantes.push("Firma Digital Obligatoria");
            }

            if (camposFaltantes.length > 0) {
                ocultarCarga();
                alert(`⚠️ PERFIL INCOMPLETO.\n\nCompleta los campos pendientes para desbloquear tu credencial:\n• ${camposFaltantes.join('\n• ')}`);
                
                if (document.getElementById('p2_titulo')) {
                    document.getElementById('p2_titulo').innerText = "Completar Registro";
                }
                document.getElementById('fotoAviso')?.classList.add('hidden');
                
                setTimeout(() => {
                    if (typeof inicializarCanvasFirma === 'function') inicializarCanvasFirma();
                }, 150);
                
                irAPantalla(2); 
                return; 
            }

            if (document.getElementById('credCompleto')) document.getElementById('credCompleto').innerText = nom.toUpperCase();
            if (document.getElementById('credPuesto')) document.getElementById('credPuesto').innerText = mun.toUpperCase();
            if (document.getElementById('credZona')) document.getElementById('credZona').innerText = zon.toUpperCase();
            if (document.getElementById('credIdentificacion')) document.getElementById('credIdentificacion').innerText = curp;
            if (document.getElementById('credFoto')) document.getElementById('credFoto').src = fotoUrlActual;
            
            if (document.getElementById('credTelefono')) {
                document.getElementById('credTelefono').innerText = tel;
            }

            if (tel && tel.trim() !== "") {
                const numeroLimpio = tel.replace(/\s+/g, '');
                if (document.getElementById('btnLlamarBrigadista')) {
                    document.getElementById('btnLlamarBrigadista').href = "tel:" + numeroLimpio;
                    document.getElementById('btnLlamarBrigadista').style.display = "inline-flex";
                }
                if (document.getElementById('btnWhatsappBrigadista')) {
                    document.getElementById('btnWhatsappBrigadista').href = "whatsapp://send?phone=52" + numeroLimpio;
                    document.getElementById('btnWhatsappBrigadista').style.display = "inline-flex";
                }
            } else {
                if (document.getElementById('btnLlamarBrigadista')) document.getElementById('btnLlamarBrigadista').style.display = "none";
                if (document.getElementById('btnWhatsappBrigadista')) document.getElementById('btnWhatsappBrigadista').style.display = "none";
            }
            
            setTimeout(() => {
                if (typeof inicializarCanvasFirma === 'function') inicializarCanvasFirma();
                if (firmaBase64 && firmaBase64.startsWith("data:image")) {
                    document.getElementById('firmaAviso')?.classList.remove('hidden');
                    const imgFirmaPrevia = new Image();
                    imgFirmaPrevia.onload = function() {
                        if (ctxFirma && canvasFirma) {
                            ctxFirma.clearRect(0, 0, canvasFirma.width, canvasFirma.height);
                            ctxFirma.drawImage(imgFirmaPrevia, 0, 0);
                        }
                    };
                    imgFirmaPrevia.src = firmaBase64;
                }
            }, 150);

            ocultarCarga();
            irAPantalla(3);

        } else {
            ocultarCarga();
            alert(`🎉 ¡Validación Exitosa!\n\nCURP localizada en el padrón oficial. Complementa tu perfil para emitir tu credencial.`);
            
            if (document.getElementById('p2_titulo')) {
                document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            }
            document.getElementById('perfilForm')?.reset();
            if (document.getElementById('nombre_curp')) {
                document.getElementById('nombre_curp').value = curp;
            }
            
            if (document.getElementById('nombre')) document.getElementById('nombre').value = datos.nombre_oficial ? String(datos.nombre_oficial).toUpperCase() : "";
            if (document.getElementById('municipio')) document.getElementById('municipio').value = datos.municipio_oficial ? String(datos.municipio_oficial).toUpperCase() : "";
            
            fotoUrlActual = "";
            fotoCompletaBase64 = "";
            firmaBase64 = "";
            document.getElementById('fotoAviso')?.classList.add('hidden');
            document.getElementById('firmaAviso')?.classList.add('hidden');
            
            setTimeout(() => {
                if (typeof inicializarCanvasFirma === 'function') inicializarCanvasFirma();
            }, 150);
            irAPantalla(2);
        }
    } catch (err) {
        console.error(err);
        ocultarCarga();
        alert('Error en el enlace de red con el módulo de acceso. Verifica que la URL del servidor sea correcta.');
    }
});

// ========================================================
// BLOQUE 3: COMPRESIÓN FOTOGRÁFICA Y ENVÍO SINCRO (CORREGIDO)
// ========================================================

// --- EVENTO DE CAPTURA Y COMPRESIÓN DE LA FOTO ---
document.getElementById('inputFoto').addEventListener('change', (e) => {
    const files = e.target.files; 
    
    if (!files || files.length === 0) {
        console.warn("Selección de fotografía cancelada por el usuario.");
        return; 
    }

    mostrarCarga("Comprimiendo fotografía a escala celular...");
    const reader = new FileReader();
    
    reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 180; 
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
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

            try {
                ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 180, 240);
                fotoCompletaBase64 = canvas.toDataURL('image/jpeg', 0.6);
                
                const aviso = document.getElementById('fotoAviso');
                if (aviso) aviso.classList.remove('hidden');
                
                const previsualizarFotoForm = document.getElementById('credFoto');
                if (previsualizarFotoForm) {
                    previsualizarFotoForm.src = fotoCompletaBase64;
                }
            } catch (canvasError) {
                console.error("Fallo preventivo en render de canvas:", canvasError);
                fotoCompletaBase64 = evt.target.result;
            } finally {
                ocultarCarga();
            }
        };
        
        img.onerror = function() {
            console.error("Error al configurar objeto de imagen.");
            ocultarCarga();
        };
        img.src = evt.target.result;
    };
    
    reader.onerror = function() {
        console.error("Error leyendo archivo físico.");
        ocultarCarga();
    };
    
    // Inyecta el primer archivo indexado válido en lugar de la lista completa
    reader.readAsDataURL(files[0]);
});

// --- EVENTO SUBMIT DEL FORMULARIO (GUARDAR REGISTRO) ---
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

    const txtNombre = document.getElementById('nombre')?.value || "";
    const txtMunicipio = document.getElementById('municipio')?.value || "";
    const txtPuesto = document.getElementById('puesto')?.value || "";
    const txtTelefono = document.getElementById('telefono')?.value || "";
    const txtZona = document.getElementById('zona')?.value || "";
    const txtCorreo = document.getElementById('correo')?.value || "";

    const payloadCompleto = {
        action: 'guardar',
        curp: curp,
        nombre: txtNombre,
        municipio: txtMunicipio,
        puesto: txtPuesto,
        telefono: txtTelefono,
        zona: txtZona,
        correo: txtCorreo,
        foto_url: fotoParaEnviar,
        fotoCompletaBase64: fotoCompletaBase64,
        firmaBase64: firmaBase64 
    };

    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payloadCompleto)
        });
        const resultado = await res.json();

        if (resultado.status === "success") {
            ocultarCarga();
            alert('🎉 ¡Perfil sincronizado correctamente!');
            
            if (document.getElementById('credCompleto')) document.getElementById('credCompleto').innerText = txtNombre.toUpperCase();
            if (document.getElementById('credPuesto')) document.getElementById('credPuesto').innerText = txtMunicipio.toUpperCase();
            if (document.getElementById('credZona')) document.getElementById('credZona').innerText = txtZona.toUpperCase();
            if (document.getElementById('credIdentificacion')) document.getElementById('credIdentificacion').innerText = curp;
            
            if (document.getElementById('credTelefono')) {
                document.getElementById('credTelefono').innerText = txtTelefono;
            }

            if (txtTelefono && txtTelefono.trim() !== "") {
                const numeroLimpio = txtTelefono.replace(/\s+/g, '');
                if (document.getElementById('btnLlamarBrigadista')) {
                    document.getElementById('btnLlamarBrigadista').href = "tel:" + numeroLimpio;
                    document.getElementById('btnLlamarBrigadista').style.display = "inline-flex";
                }
                if (document.getElementById('btnWhatsappBrigadista')) {
                    document.getElementById('btnWhatsappBrigadista').href = "whatsapp://send?phone=52" + numeroLimpio;
                    document.getElementById('btnWhatsappBrigadista').style.display = "inline-flex";
                }
            } else {
                if (document.getElementById('btnLlamarBrigadista')) document.getElementById('btnLlamarBrigadista').style.display = "none";
                if (document.getElementById('btnWhatsappBrigadista')) document.getElementById('btnWhatsappBrigadista').style.display = "none";
            }
            
            // => CORRECCIÓN DEFINITIVA DE LA IMAGEN EN PANTALLA:
            // Sincronizamos la foto en la credencial ANTES de vaciar la variable de memoria
            if (document.getElementById('credFoto')) {
                if (fotoCompletaBase64 && fotoCompletaBase64.startsWith("data:image")) {
                    document.getElementById('credFoto').src = fotoCompletaBase64;
                } else {
                    document.getElementById('credFoto').src = resultado.foto_url || fotoParaEnviar;
                }
            }
            
            // Una vez inyectado en el HTML, actualizamos y limpiamos las variables globales de forma segura
            fotoUrlActual = resultado.foto_url || fotoParaEnviar;
            fotoCompletaBase64 = ""; 
            
            document.getElementById('fotoAviso')?.classList.add('hidden');
            irAPantalla(3);
        } else {
            ocultarCarga();
            alert('Error: ' + resultado.message);
        }
    } catch (err) {
        console.error(err);
        ocultarCarga();
        alert('Fallo de sincronización con la base de datos central. Verifica tu Deploy en Google Sheets.');
    }
});

// ====================================================================
// BLOQUE 4: CAPTURA DE VARIABLES, RENDER CANVAS HD Y DESCARGA (CORREGIDO)
// ====================================================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Dibujando credencial en alta densidad gráfica...");

    const curp = document.getElementById('credIdentificacion').innerText;
    const nombre = document.getElementById('credCompleto').innerText;
    const puesto = document.getElementById('credPuesto').innerText;
    const zona = document.getElementById('credZona').innerText;
    const fotoSrc = document.getElementById('credFoto').src;
    
    // CORRECCIÓN: Captura el valor del Municipio directo de la interfaz del gafete (credPuesto) 
    // para evitar buscar inputs desalineados en el DOM tras el registro.
    const municipio = document.getElementById('credPuesto').innerText.trim().toUpperCase() || "NO ESPECIFICADO";

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

    const imgPlantillaFondo = new Image();
    const imgFoto = new Image();
    const imgFirma = new Image();

    let descargasExitosas = 0;
    const totalImagenes = 3;

    function verificarCargas() {
        descargasExitosas++;
        if (descargasExitosas === totalImagenes) {
            setTimeout(construirGraficosGafete, 100);
        }
    }

    imgPlantillaFondo.onload = verificarCargas;
    imgFoto.onload = verificarCargas;
    imgFirma.onload = verificarCargas;

    imgPlantillaFondo.onerror = function() {
        console.error("⚠️ Error cargando plantilla base.");
        ctx.fillStyle = "#611232";
        ctx.fillRect(0, 0, 1276, 2020);
        verificarCargas();
    };
    imgFoto.onerror = function() { 
        console.error("⚠️ Error cargando fotografía en Canvas.");
        verificarCargas(); 
    };
    imgFirma.onerror = function() { 
        verificarCargas(); 
    };

    imgPlantillaFondo.crossOrigin = "anonymous";
    imgFoto.crossOrigin = "anonymous";
    imgFirma.crossOrigin = "anonymous";

    // Enlace de imagen procesado por puente CORS seguro
    imgPlantillaFondo.src = "https://i.postimg.cc/269Fp7Df/Cartel-oficial-Servidores-de-la-Nacion.png";
    
    // CORRECCIÓN CLAVE: Si la variable local fotoCompletaBase64 contiene la imagen, 
    // úsala prioritariamente para saltar el bloqueo de seguridad de internet (CORS).
    if (typeof fotoCompletaBase64 !== 'undefined' && fotoCompletaBase64 && fotoCompletaBase64.startsWith("data:image")) {
        imgFoto.src = fotoCompletaBase64;
    } else {
        imgFoto.src = fotoSrc;
    }
    
    imgFirma.src = firmaBase64 || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    function construirGraficosGafete() {
        try {
            // 1. Estampar plantilla de fondo completa
            ctx.drawImage(imgPlantillaFondo, 0, 0, 1276, 2020);

            // 2. Encuadre exacto de la fotografía
            const targetX = 394, targetY = 412, targetW = 490, targetH = 612;
            const fotoRadius = 40; 

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

            let imgW = imgFoto.width || 100;
            let imgH = imgFoto.height || 100;
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

            // 3. Renderizado de Datos Nominativos e Impresión Centrada
            ctx.textAlign = "center";   

            // NOMBRE COMPLETO: Encajado perfectamente en la barra guinda
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 44px sans-serif";
            ctx.fillText(nombre, canvas.width / 2, 1152); 

            // DATOS DESCRIPTIVOS REORGANIZADOS Y SUBIDOS SIMÉTRICAMENTE
            ctx.fillStyle = "#1f2937"; 

            // Fila de Municipio (Elevada a coordenada Y: 1300)
            ctx.font = "bold 34px sans-serif";
            ctx.fillText(`MUNICIPIO: ${municipio}`, canvas.width / 2, 1300);

            // Fila de Zona - CORREGIDO: Extrae de forma limpia la variable 'zona' independiente (Y: 1400)
            ctx.font = "bold 34px sans-serif";
            ctx.fillText(`ZONA: ${zona}`, canvas.width / 2, 1400);

            // Fila de CURP (Elevada a coordenada Y: 1500)
            ctx.font = "bold 38px monospace";
            ctx.fillText(curp, canvas.width / 2, 1500);

            // Estampado de Firma Digital Autorizada - REACOMODADA MÁS ARRIBA (Y: 1600)
            if (firmaBase64 && firmaBase64.startsWith("data:image")) {
                const firmaW = 320;
                const firmaH = 130;
                // Colocada de forma segura arriba del escudo base
                ctx.drawImage(imgFirma, (canvas.width / 2) - (firmaW / 2), 1600, firmaW, firmaH);
            }

            // Disparador de descarga PNG
            const link = document.createElement('a');
            link.download = `CREDENCIAL_${curp}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch(errorFatal) {
            console.error("Fallo de renderizado:", errorFatal);
        } finally {
            ocultarCarga();
        }
    }
});

// ========================================================
// BLOQUE EXTRA: CONTROLES INTERNOS Y ÁREA DE FIRMA
// ========================================================

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

// ========================================================================
// BLOQUE EXTRA: MÓDULO DE CONSULTA ESTADÍSTICA REAL (VCXC)
// ========================================================================
// BUSCA EL INICIO DE TU MÓDULO ESTADÍSTICO EN app.js Y PEGA TU NUEVA URL:
const SCRIPT_ESTADISTICAS_PROPIO = "https://script.google.com/macros/s/AKfycbyWj2xAXmEr5Ox_UapZEFAFM5vhveZkBODlbwN4Up_t9ZPQckLlzzoj3Yz2zSMZeBa34g/exec";

// 📊 NUEVA CONSTANTE: URL de la Web App del libro exclusivo de "Estadísticas" (Pestaña Etapa1)
const SCRIPT_ETAPA1_URL = "https://script.google.com/macros/s/AKfycbyWj2xAXmEr5Ox_UapZEFAFM5vhveZkBODlbwN4Up_t9ZPQckLlzzoj3Yz2zSMZeBa34g/exec";

// BUSCA ESTAS LÍNEAS E INYECTA EL ID DE TU HOJA NUEVA PROPIA:
const GOOGLE_SHEET_ID_PROPIA = "1jkrUSWSOOawoOHz8L9-3A1AH7V0jdmdABEkSYM-GGqM";
const NOMBRE_PESTANA_PROPIA = "Estadisticas"; 


// Disparador esencial para la navegación hacia la Pantalla 4
document.getElementById('btnVerEstadisticas').addEventListener('click', cargarEstadisticasDirectas);

// Botones de salida de la Pantalla 4
document.getElementById('btnEstVolver').addEventListener('click', () => irAPantalla(3));
document.getElementById('btnEstSalir').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});

// REEMPLAZAR COMPLETAMENTE TU FUNCIÓN AL FINAL DE TU app.js
async function cargarEstadisticasDirectas() {
    mostrarCarga("Solicitando consolidación interna a tu Apps Script...");
    
    const nombreFijoGafete = document.getElementById('credCompleto')?.innerText || "";
    
    if (!nombreFijoGafete || nombreFijoGafete === "-" || nombreFijoGafete.length < 5) {
        ocultarCarga();
        alert("⚠️ Identidad de brigadista no localizada. Por favor reingresa desde el módulo de acceso inicial.");
        return;
    }

    const urlConsulta = `${SCRIPT_ESTADISTICAS_PROPIO}?nombre=${encodeURIComponent(nombreFijoGafete)}`;
    
    try {
        const respuesta = await fetch(urlConsulta);
        if (!respuesta.ok) throw new Error("Fallo de comunicación con el Apps Script privado");
        
        const datosJSON = await respuesta.json();
        
        // 1. Extrae el conteo lineal de encuestas (Etapa 2) con el método exacto de ayer
        const totalMisEncuestas = datosJSON.total || 0;
        const elemTotal = document.getElementById('estTotal');
        if (elemTotal) {
            elemTotal.innerText = totalMisEncuestas;
        }

        // 2. Extrae el total acumulado mapeado de la tabla de la Etapa 1
        const totalVisitasEtapa1 = datosJSON.visitas_etapa1 || 0;
        const elemEtapa1 = document.getElementById('p4_totalVisitasEtapa1');
        if (elemEtapa1) {
            elemEtapa1.innerText = totalVisitasEtapa1;
        }

        const contenedor = document.getElementById('contenedorMunicipios');
        if (contenedor) {
            contenedor.innerHTML = `
                <div style="text-align: center; padding: 2rem 1rem; color: var(--color-texto-mutado); font-family: sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                    📊 Resumen Personal Sincronizado con Éxito
                </div>
            `;
        }

        ocultarCarga();
        irAPantalla(4);

    } catch (error) {
        console.error("Error consultando el Apps Script propio:", error);
        ocultarCarga();
        alert("No se pudieron extraer las estadísticas. Verifica que el URL_PROPIO esté implementado como 'Cualquiera'.");
    }
}
