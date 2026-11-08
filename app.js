// ========================================================
// BLOQUE 1: CONFIGURACIÓN INICIAL Y VISTAS
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxd5X8JYe7-aheiPhE9p-6s1AS2B-zL9McryRmK5oPViX7yOQtjej0aDZaCen5ASZ0dUw/exec";


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
            
            fotoUrlActual = resultado.foto_url || fotoParaEnviar;
            if (document.getElementById('credFoto')) document.getElementById('credFoto').src = fotoUrlActual;
            
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
// BLOQUE 4: CAPTURA DE VARIABLES, RENDER CANVAS HD Y DESCARGA
// ====================================================================

document.getElementById('btnDescargarPDF').addEventListener('click', () => {
    mostrarCarga("Dibujando credencial en alta densidad gráfica...");

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
    imgFoto.onerror = () => { verificarCargas(); };
    imgFirma.onerror = () => { verificarCargas(); };

    imgPlantillaFondo.crossOrigin = "anonymous";
    imgFoto.crossOrigin = "anonymous";
    imgFirma.crossOrigin = "anonymous";

    // Enlace de imagen procesado por puente CORS seguro
    imgPlantillaFondo.src = "https://i.postimg.cc/269Fp7Df/Cartel-oficial-Servidores-de-la-Nacion.png";
    imgFoto.src = fotoSrc;
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

// ========================================================
// BLOQUE EXTRA: MÓDULO DE CONSULTA ESTADÍSTICA REAL (VCXC)
// ========================================================

// 1. Variables de enlace con tu documento real verificado
const GOOGLE_SHEET_ID = "1mxbvJz65T6qudx_vZmG6-cS8t4ZpW3d03Y01dNMCMz8";
const NOMBRE_PESTANA = "VCXC"; 

// Disparador para la navegación hacia la Pantalla 4
document.getElementById('btnVerEstadisticas').addEventListener('click', cargarEstadisticasDirectas);

// Botones de salida de la Pantalla 4
document.getElementById('btnEstVolver').addEventListener('click', () => irAPantalla(3));
document.getElementById('btnEstSalir').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});

async function cargarEstadisticasDirectas() {
    mostrarCarga("Estructurando indicadores consolidados...");
    
    // Petición directa usando formato de codificación universal para evitar rupturas por caracteres especiales
    const urlConsulta = `https://google.com{GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(NOMBRE_PESTANA)}`;
    
    try {
        const respuesta = await fetch(urlConsulta);
        if (!respuesta.ok) throw new Error("Rechazo de comunicación con el servidor de Google");
        
        const textoCSV = await respuesta.text();
        
        // Expresión regular avanzada para segmentar filas respetando las comas de coordenadas y fechas
        const filas = textoCSV.split("\n").map(fila => {
            if (!fila) return [];
            return fila.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || fila.split(",");
        });

        // Limpieza de caracteres de escape y filtrado de registros reales (omitir cabecera)
        const registrosLimpios = filas.slice(1).map(f => {
            return f.map(celda => celda.replace(/^"(.*)"$/, '$1').trim());
        }).filter(f => f.length > 5 && f[4] !== ""); // Valida registros que tengan cargado al brigadista

        // Captura del total general consolidado
        const totalRegistrados = registrosLimpios.length;
        document.getElementById('estTotal').innerText = totalRegistrados;

        // Conteo y agrupación por el Nombre del Brigadista (Columna E -> Índice 4 del arreglo)
        const conteoPorBrigadista = {};
        registrosLimpios.forEach(fila => {
            const brigadista = fila[4] ? fila[4].toUpperCase() : "NO ESPECIFICADO";
            if (brigadista !== "SERVIDOR" && brigadista !== "") {
                conteoPorBrigadista[brigadista] = (conteoPorBrigadista[brigadista] || 0) + 1;
            }
        });

        // Dibujado dinámico de indicadores en la interfaz
        const contenedor = document.getElementById('contenedorMunicipios');
        if (contenedor) {
            contenedor.innerHTML = "";

            Object.keys(conteoPorBrigadista).sort().forEach(nombreBrigadista => {
                const cantidadRegistros = conteoPorBrigadista[nombreBrigadista];
                const renglon = document.createElement('div');
                renglon.style.cssText = "display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(97, 18, 50, 0.2); padding: 0.6rem 0.8rem; border-radius: 0.4rem; background-color: rgba(255,255,255,0.85); box-sizing: border-box; width: 100%;";
                renglon.innerHTML = `
                    <span style="font-size: 0.82rem; font-weight: 700; color: #1f2937; text-transform: uppercase;">${nombreBrigadista}</span>
                    <span style="font-size: 0.9rem; font-weight: 800; color: var(--color-guinda); background-color: rgba(97, 18, 50, 0.1); padding: 2px 8px; border-radius: 10px;">${cantidadRegistros}</span>
                `;
                contenedor.appendChild(renglon);
            });
        }

        ocultarCarga();
        irAPantalla(4);

    } catch (error) {
        console.error("Error consultando la API de Google Sheets:", error);
        ocultarCarga();
        alert("No se pudieron extraer los indicadores estadísticos. Verifica la conexión de red.");
    }
}


