// ========================================================
// BLOQUE 1: CONFIGURACIÓN INICIAL Y VISTAS
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz7IARJFGt6xH_oGZgPfUHP5WowHtZ7p_dxsr8e67djPd3ewX78S5GetGW2yiFCq4xopg/exec";

// Añade esta variable global arriba en tu app.js junto a las demás variables globales:
let nombreGlobalSesion = ""; 
let urlMapaZonaGlobal = ""; // 🗺️ Almacena la URL de navegación territorial

let firmaBase64 = ""; // Almacenará el trazo de la firma en formato Base64
let fotoCompletaBase64 = ""; // Foto local capturada
let fotoUrlActual = ""; // URL de la foto en la base de datos

let esModoSuperusuario = false;
let listaBrigadistasGlobal = [];
const FOTO_PLACEHOLDER = "https://postimg.cc";

function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla4').classList.add('hidden');
    document.getElementById('pantalla5').classList.add('hidden');
    document.getElementById('pantalla6')?.classList.add('hidden');
    
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

    mostrarCarga("Verificando identidad en el padrón...");

    try {
                // Reemplaza la línea const payloadBuscar = { action: 'buscar', curp: curp }; por:
        const clavesSuper = ["SUPERUSUARIO001", "SUPERUSUARIO002"]; // Mismas claves que en Code.gs
        const esSuper = clavesSuper.includes(curp);
        const payloadBuscar = { action: esSuper ? 'buscar_todos' : 'buscar', curp: curp };

        
        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            redirect: 'follow', 
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify(payloadBuscar)
        });

        const datos = await res.json();
        if (datos.is_superuser) {
            esModoSuperusuario = true;
            listaBrigadistasGlobal = datos.brigadistas || [];
            document.getElementById('p5_buscador').value = "";
            renderizarListaSuperusuario(listaBrigadistasGlobal);
            ocultarCarga();
            irAPantalla(5);
            return;
        } else {
            esModoSuperusuario = false;
            configurarBotoneraPantalla3(false);
        }

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
// Captura el mapa zonal enviado desde Google Sheets
urlMapaZonaGlobal = datos.url_mapa_zona ? String(datos.url_mapa_zona).trim() : "";

// Configura y condiciona la visibilidad del botón de mapa en la barra inferior
const btnMapaNav = document.getElementById('btnVerMapaZona');
if (btnMapaNav) {
    if (urlMapaZonaGlobal && urlMapaZonaGlobal.startsWith("http")) {
        btnMapaNav.style.display = "flex"; // Se muestra si tiene un enlace válido
    } else {
        btnMapaNav.style.display = "none"; // Se esconde si está vacío
    }
}


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

    mostrarCarga("Comprimiendo fotografía...");
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
        alert("⚠️ CAMPOS REQUERIDOS:\n\nEs obligatorio escribir tu firma en el recuadro blanco antes de guardar el registro.");
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
    mostrarCarga("Dibujando credencial...");

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
// Manejador para abrir el mapa geográfico de la región asignada
document.getElementById('btnVerMapaZona')?.addEventListener('click', () => {
    if (urlMapaZonaGlobal && urlMapaZonaGlobal.startsWith("http")) {
        window.open(urlMapaZonaGlobal, '_blank');
    } else {
        alert("⚠️ No se encuentra asignada una URL geográfica para esta zona de trabajo.");
    }
});

document.getElementById('btnAceptarFirma').addEventListener('click', () => {
    if (!firmaBase64 || firmaBase64 === "") {
        alert("Por favor, escriba su firma antes de aceptar.");
        return;
    }
    document.getElementById('firmaAviso').classList.remove('hidden');
    document.getElementById('modalFirmaPantallaCompleta').classList.add('hidden');
});

// ========================================================================
// BLOQUE EXTRA: MÓDULO DE CONSULTA ESTADÍSTICA REAL (VCXC)
// ========================================================================
// BUSCA EL INICIO DE TU MÓDULO ESTADÍSTICO EN app.js Y PEGA TU NUEVA URL:
const SCRIPT_ESTADISTICAS_PROPIO = "https://script.google.com/macros/s/AKfycbxYOEm0X4ikmga7naCx4zQZXmGjwOcNU1HL1sGZhde-EWyjPNZqhh-VU11T8JXrSX6YIQ/exec";

// 📊 NUEVA CONSTANTE: URL de la Web App del libro exclusivo de "Estadísticas" (Pestaña Etapa1)
const SCRIPT_ETAPA1_URL = "https://script.google.com/macros/s/AKfycbxYOEm0X4ikmga7naCx4zQZXmGjwOcNU1HL1sGZhde-EWyjPNZqhh-VU11T8JXrSX6YIQ/exec";

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

async function cargarEstadisticasDirectas() {
    mostrarCarga("Solicitando descarga de información...");
    
    const rawNombre = document.getElementById('credCompleto')?.innerText || "";
    const nombreFijoGafete = rawNombre.replace(/\s+/g, ' ').trim();
    
    if (!nombreFijoGafete || nombreFijoGafete === "-" || nombreFijoGafete.length < 5) {
        ocultarCarga();
        alert("⚠️ Identidad de brigadista no localizada. Por favor reingresa desde el módulo de acceso inicial.");
        return;
    }

    // Inyectar el nombre del brigadista en el encabezado de la Pantalla 4
    const lblNombreP4 = document.getElementById('p4_nombreBrigadista');
    if (lblNombreP4) {
        lblNombreP4.innerText = nombreFijoGafete.toUpperCase();
    }

    try {
        const respuesta = await fetch(SCRIPT_ESTADISTICAS_PROPIO, {
            method: 'POST',
            redirect: 'follow',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'metricas',
                nombre: nombreFijoGafete
            })
        });

        if (!respuesta.ok) throw new Error("Fallo de comunicación con el Apps Script privado");
        
        const datosJSON = await respuesta.json();
        
        // 1. Extraer los 4 valores numéricos base de campo de forma segura
        const vEtapa1 = Number(datosJSON.visitas_etapa1) || 0;
        const vEtapa2 = Number(datosJSON.total) || 0;
        const vDerecho = Number(datosJSON.conteo_derechohabientes) || 0;
        const vActualiz = Number(datosJSON.conteo_actualizacion) || 0;
        
        // 2. Extraer el valor base de la AppSN
        const vAppSN = Number(datosJSON.visitas_appsn) || 0;

        // 3. Calcular la suma del grupo de campo
        const sumaTotalCampo = vEtapa1 + vEtapa2 + vDerecho + vActualiz;

        // 4. Calcular la resta (conservando tu lógica actual)
        let restaDiferencia = sumaTotalCampo - vAppSN;
        if (restaDiferencia < 0) {
            restaDiferencia = 0;
        }

        // 5. Inyectar y renderizar de forma exacta cada elemento en el DOM
        if (document.getElementById('p4_totalVisitasEtapa1')) {
            document.getElementById('p4_totalVisitasEtapa1').innerText = vEtapa1;
        }
        if (document.getElementById('estTotal')) {
            document.getElementById('estTotal').innerText = vEtapa2;
        }
        if (document.getElementById('p4_totalDerechohabientes')) {
            document.getElementById('p4_totalDerechohabientes').innerText = vDerecho;
        }
        if (document.getElementById('p4_totalActualizacion')) {
            document.getElementById('p4_totalActualizacion').innerText = vActualiz;
        }
        
        // Inyectar cálculos dinámicos acumulados
        if (document.getElementById('p4_sumaTotalCampo')) {
            document.getElementById('p4_sumaTotalCampo').innerText = sumaTotalCampo;
        }
        if (document.getElementById('p4_totalVisitasAppSN')) {
            document.getElementById('p4_totalVisitasAppSN').innerText = vAppSN;
        }
        if (document.getElementById('p4_restaDiferencia')) {
            document.getElementById('p4_restaDiferencia').innerText = restaDiferencia;
        }

        // Renderizado del pie de resumen (si el contenedor existe)
        const contenedor = document.getElementById('contenedorMunicipios');
        if (contenedor) {
            contenedor.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--color-texto-mutado); font-family: sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">
                    📊 Balance Operativo Sincronizado
                </div>
            `;
        }

        ocultarCarga();
        irAPantalla(4);

    } catch (error) {
        console.error("Error consultando el Apps Script propio:", error);
        ocultarCarga();
        irAPantalla(4);
        alert("Se mostraron los datos locales. Algunas métricas remotas no se pudieron extraer en este momento.");
    }
}

// ========================================================================
// MÓDULO SUPERUSUARIO: DIRECTORIO Y VISTA DE PERFIL (PANTALLA 5 -> 3)
// ========================================================================

// Configurar visibilidad de botones en Pantalla 3 según el tipo de usuario
function configurarBotoneraPantalla3(modoSuper) {
    const btnRegresar = document.getElementById('btnRegresarSuperusuario');
    const btnDescargar = document.getElementById('btnDescargarPDF');
    const btnEditar = document.getElementById('btnEditarPerfil');
    const btnCerrar = document.getElementById('btnCerrar');
    const btnMapa = document.getElementById('btnVerMapaZona');
    const btnEst = document.getElementById('btnVerEstadisticas');

    if (modoSuper) {
        // Mostrar: Regresar (a P5), Mapa (si tiene URL) y Estadísticas
        btnRegresar?.classList.remove('hidden');
        btnEst?.classList.remove('hidden');
        
        // Ocultar: Descargar, Modificar Perfil y Salir
        btnDescargar?.classList.add('hidden');
        btnEditar?.classList.add('hidden');
        btnCerrar?.classList.add('hidden');
    } else {
        // Restaurar botonera normal de brigadista
        btnRegresar?.classList.add('hidden');
        btnDescargar?.classList.remove('hidden');
        btnEditar?.classList.remove('hidden');
        btnCerrar?.classList.remove('hidden');
        btnEst?.classList.remove('hidden');
    }

    // El botón de mapa siempre depende de si existe URL válida
    if (btnMapa) {
        if (urlMapaZonaGlobal && urlMapaZonaGlobal.startsWith("http")) {
            btnMapa.style.display = "flex";
        } else {
            btnMapa.style.display = "none";
        }
    }
}

// Renderizar tarjetas en Pantalla 5
function renderizarListaSuperusuario(lista) {
    const contenedor = document.getElementById('p5_listaBrigadistas');
    const contador = document.getElementById('p5_contador');
    if (!contenedor) return;

    contenedor.innerHTML = "";
    if (contador) contador.innerText = lista.length;

    if (lista.length === 0) {
        contenedor.innerHTML = `<p style="text-align: center; color: var(--color-texto-mutado); font-size: 0.85rem; margin-top: 1rem;">No se encontraron coincidencias.</p>`;
        return;
    }

    lista.forEach(brigadista => {
        const item = document.createElement('div');
        item.style.cssText = "background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid var(--color-guinda); border-radius: 0.5rem; padding: 0.75rem 1rem; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: transform 0.15s;";
        
        const estatusColor = (brigadista.foto_url && brigadista.foto_url.length > 50) ? "#059669" : "#d97706";
        const estatusTexto = (brigadista.foto_url && brigadista.foto_url.length > 50) ? "Perfil Completo" : "Datos Incompletos";

        item.innerHTML = `
            <div style="font-size: 0.88rem; font-weight: 800; color: var(--color-texto-oscuro); text-transform: uppercase;">${brigadista.nombre}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem; font-size: 0.72rem; color: var(--color-texto-mutado);">
                <span>📍 ${brigadista.municipio || "SIN MUNICIPIO"} | Zona: ${brigadista.zona || "N/A"}</span>
                <span style="color: ${estatusColor}; font-weight: 700;">● ${estatusTexto}</span>
            </div>
        `;

        item.addEventListener('click', () => abrirPerfilDesdeSuperusuario(brigadista));
        contenedor.appendChild(item);
    });
}

// Filtro en tiempo real en Pantalla 5
document.getElementById('p5_buscador')?.addEventListener('input', (e) => {
    const termino = e.target.value.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtrados = listaBrigadistasGlobal.filter(b => {
        const nom = (b.nombre || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const mun = (b.municipio || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nom.includes(termino) || mun.includes(termino);
    });
    renderizarListaSuperusuario(filtrados);
});

// Cargar datos del brigadista en Pantalla 3 sin exigir campos completos
function abrirPerfilDesdeSuperusuario(b) {
    nombreGlobalSesion = b.nombre || "";
    urlMapaZonaGlobal = b.url_mapa_zona ? String(b.url_mapa_zona).trim() : "";
    fotoUrlActual = (b.foto_url && b.foto_url.length > 50) ? b.foto_url : FOTO_PLACEHOLDER;

    document.getElementById('credCompleto').innerText = (b.nombre || "SIN NOMBRE").toUpperCase();
    document.getElementById('credPuesto').innerText = (b.municipio || "SIN MUNICIPIO").toUpperCase();
    document.getElementById('credZona').innerText = (b.zona || "SIN ZONA").toUpperCase();
    document.getElementById('credIdentificacion').innerText = b.curp || "-";
    document.getElementById('credFoto').src = fotoUrlActual;

    const tel = b.telefono ? String(b.telefono).trim() : "";
    document.getElementById('credTelefono').innerText = tel || "SIN TELÉFONO";

    if (tel !== "") {
        const numeroLimpio = tel.replace(/\s+/g, '');
        document.getElementById('btnLlamarBrigadista').href = "tel:" + numeroLimpio;
        document.getElementById('btnLlamarBrigadista').style.display = "inline-flex";
        document.getElementById('btnWhatsappBrigadista').href = "whatsapp://send?phone=52" + numeroLimpio;
        document.getElementById('btnWhatsappBrigadista').style.display = "inline-flex";
    } else {
        document.getElementById('btnLlamarBrigadista').style.display = "none";
        document.getElementById('btnWhatsappBrigadista').style.display = "none";
    }

    configurarBotoneraPantalla3(true);
    irAPantalla(3);
}

// Botón Regresar (Pantalla 3 -> Pantalla 5)
document.getElementById('btnRegresarSuperusuario')?.addEventListener('click', () => {
    irAPantalla(5);
});

// Botón Cerrar Sesión Superusuario (Pantalla 5 -> Pantalla 1)
document.getElementById('btnP5Salir')?.addEventListener('click', () => {
    esModoSuperusuario = false;
    listaBrigadistasGlobal = [];
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});
// ========================================================================
// BLOQUE 1 (PANTALLA 6): VARIABLES, NORMALIZACIÓN Y NAVEGACIÓN
// ========================================================================

let listaEstadisticasGeneralesGlobal = [];
let ordenActualP6 = { columna: 'pendientes', direccion: 'desc' };
let pantallaOrigenSuperusuario = 5; // Controla si el botón "Regresar" de P3 vuelve a P5 o P6

function normalizarCadenaP6(txt) {
    return (txt || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

// Botón en Pantalla 5 para abrir Pantalla 6
document.getElementById('btnIrPantalla6')?.addEventListener('click', cargarEstadisticasGenerales);

// Botones de navegación inferior de Pantalla 6
document.getElementById('btnP6Volver')?.addEventListener('click', () => {
    pantallaOrigenSuperusuario = 5;
    irAPantalla(5);
});

document.getElementById('btnP6Salir')?.addEventListener('click', () => {
    esModoSuperusuario = false;
    listaBrigadistasGlobal = [];
    listaEstadisticasGeneralesGlobal = [];
    pantallaOrigenSuperusuario = 5;
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});

// Ajustar el botón "Regresar" de Pantalla 3 para volver a P5 o P6 según corresponda
const btnRegresarP3 = document.getElementById('btnRegresarSuperusuario');
if (btnRegresarP3) {
    const nuevoBtnRegresar = btnRegresarP3.cloneNode(true);
    btnRegresarP3.parentNode.replaceChild(nuevoBtnRegresar, btnRegresarP3);
    nuevoBtnRegresar.addEventListener('click', () => {
        irAPantalla(pantallaOrigenSuperusuario);
    });
}
// ========================================================================
// BLOQUE 2 (PANTALLA 6): CONSULTA REMOTA Y TABLA DE MUNICIPIOS (D:I)
// ========================================================================

async function cargarEstadisticasGenerales() {
    mostrarCarga("Descargando estadísticas regionales y por brigadista...");

    try {
        const res = await fetch(SCRIPT_ESTADISTICAS_PROPIO, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'estadisticas_generales' })
        });

        if (!res.ok) throw new Error("Error al conectar con el servidor de estadísticas.");
        const datos = await res.json();

        if (datos.status !== "success") {
            throw new Error(datos.message || "No se pudieron obtener las estadísticas generales.");
        }

        // 1. Renderizar tabla municipal (Columnas D:I de AppSN)
        renderizarTablaMunicipiosP6(datos.municipios || []);

        // 2. Mostrar rango de fechas de Lunes a Sábado en el encabezado semanal
        const lblRangoSem = document.getElementById('p6_rangoSemanaTexto');
        if (lblRangoSem && datos.rango_semana) {
            lblRangoSem.innerText = datos.rango_semana;
        }

        // 3. Cruzar con listaBrigadistasGlobal para incluir a todos los del padrón aunque tengan 0
        const mapaRemoto = {};
        (datos.brigadistas || []).forEach(b => {
            mapaRemoto[normalizarCadenaP6(b.nombre)] = b;
        });

        if (listaBrigadistasGlobal.length > 0) {
            listaEstadisticasGeneralesGlobal = listaBrigadistasGlobal.map(bPadron => {
                const norm = normalizarCadenaP6(bPadron.nombre);
                const metrica = mapaRemoto[norm];
                return {
                    nombre: (bPadron.nombre || "").toUpperCase(),
                    total_campo: metrica ? Number(metrica.total_campo) || 0 : 0,
                    appsn: metrica ? Number(metrica.appsn) || 0 : 0,
                    pendientes: metrica ? Number(metrica.pendientes) || 0 : 0,
                    sem_estadisticas: metrica ? Number(metrica.sem_estadisticas) || 0 : 0,
                    sem_derechohabientes: metrica ? Number(metrica.sem_derechohabientes) || 0 : 0,
                    sem_actualizacion: metrica ? Number(metrica.sem_actualizacion) || 0 : 0,
                    sem_total: metrica ? Number(metrica.sem_total) || 0 : 0,
                    perfilCompleto: bPadron
                };
            });
        } else {
            listaEstadisticasGeneralesGlobal = (datos.brigadistas || []).map(b => ({
                nombre: (b.nombre || "").toUpperCase(),
                total_campo: Number(b.total_campo) || 0,
                appsn: Number(b.appsn) || 0,
                pendientes: Number(b.pendientes) || 0,
                sem_estadisticas: Number(b.sem_estadisticas) || 0,
                sem_derechohabientes: Number(b.sem_derechohabientes) || 0,
                sem_actualizacion: Number(b.sem_actualizacion) || 0,
                sem_total: Number(b.sem_total) || 0,
                perfilCompleto: null
            }));
        }

        // 4. Limpiar buscadores y reiniciar ordenamientos de ambas tablas
        const inputBuscadorP6 = document.getElementById('p6_buscador');
        if (inputBuscadorP6) inputBuscadorP6.value = "";

        const inputBuscadorSem = document.getElementById('p6_buscadorSemanal');
        if (inputBuscadorSem) inputBuscadorSem.value = "";

        ordenActualP6 = { columna: 'pendientes', direccion: 'desc' };
        ordenSemanalP6 = { columna: 'sem_total', direccion: 'desc' };

        actualizarIconosOrdenP6();
        actualizarIconosOrdenSemanalP6();

        aplicarFiltroYOrdenP6();
        aplicarFiltroYOrdenSemanalP6();

        ocultarCarga();
        irAPantalla(6);

    } catch (error) {
        console.error("Error en Pantalla 6:", error);
        ocultarCarga();
        alert("⚠️ No se pudieron cargar las estadísticas generales. Verifica la implementación del Apps Script.");
    }
}


function renderizarTablaMunicipiosP6(filasMunicipios) {
    const thead = document.getElementById('p6_theadMunicipios');
    const tbody = document.getElementById('p6_tbodyMunicipios');
    if (!thead || !tbody) return;

    thead.innerHTML = "";
    tbody.innerHTML = "";

    if (!filasMunicipios || filasMunicipios.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 0.75rem; color: var(--color-texto-mutado);">Sin datos municipales en columnas D:I de AppSN.</td></tr>`;
        return;
    }

    const encabezados = filasMunicipios[0];
    if (!Array.isArray(encabezados)) return;

    // 1. Detectar columnas visibles (excluyendo "Clave municipio" y "Meta SN") e índice de "Porcentaje visitas"
    const indicesVisibles = [];
    let idxPorcentaje = -1;

    encabezados.forEach((col, idx) => {
        const nombreCol = normalizarCadenaP6(col);
        const esClaveMun = nombreCol.includes("CLAVE") && nombreCol.includes("MUNICIPIO");
        const esMetaSN = nombreCol.includes("META") && nombreCol.includes("SN");

        if (nombreCol.includes("PORCENTAJE") && nombreCol.includes("VISITA")) {
            idxPorcentaje = idx;
        }

        if (!esClaveMun && !esMetaSN) {
            indicesVisibles.push(idx);
        }
    });

    // 2. Renderizar encabezado con el mismo diseño original
    const trHead = document.createElement('tr');
    indicesVisibles.forEach((origIdx, visiblePos) => {
        const th = document.createElement('th');
        th.innerText = encabezados[origIdx] || `Col ${origIdx + 1}`;
        th.style.cssText = `padding: 0.45rem 0.35rem; text-align: ${visiblePos === 0 ? 'left' : 'center'}; white-space: nowrap;`;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // 3. Separar filas normales y fila de TOTAL (para dejar TOTAL siempre al final)
    const filasDatos = [];
    const filasTotales = [];

    for (let i = 1; i < filasMunicipios.length; i++) {
        const fila = filasMunicipios[i];
        if (!Array.isArray(fila)) continue;

        const esFilaTotal = fila.some(celda => normalizarCadenaP6(celda).includes("TOTAL"));
        if (esFilaTotal) {
            filasTotales.push(fila);
        } else {
            filasDatos.push(fila);
        }
    }

    // 4. Ordenar de menor a mayor (ascendente) por "Porcentaje visitas"
    if (idxPorcentaje !== -1) {
        filasDatos.sort((a, b) => {
            const valA = parseFloat(String(a[idxPorcentaje] || "0").replace(/[^0-9.-]/g, "")) || 0;
            const valB = parseFloat(String(b[idxPorcentaje] || "0").replace(/[^0-9.-]/g, "")) || 0;
            return valA - valB; // Ascendente (menor a mayor)
        });
    }

    // 5. Renderizar filas ordenadas y al final la fila de TOTAL
    const filasFinales = [...filasDatos, ...filasTotales];

    filasFinales.forEach((fila, i) => {
        const esFilaTotal = fila.some(celda => normalizarCadenaP6(celda).includes("TOTAL"));
        const tr = document.createElement('tr');
        tr.style.cssText = esFilaTotal
            ? "background-color: #fdf2f8; font-weight: 800; color: var(--color-guinda); border-top: 2px solid var(--color-guinda);"
            : `background-color: ${i % 2 === 0 ? '#f9fafb' : '#ffffff'}; border-bottom: 1px solid #e5e7eb;`;

        indicesVisibles.forEach((origIdx, visiblePos) => {
            const td = document.createElement('td');
            td.innerText = fila[origIdx] !== undefined ? fila[origIdx] : "";
            td.style.cssText = `padding: 0.45rem 0.35rem; text-align: ${visiblePos === 0 ? 'left' : 'center'}; font-weight: ${visiblePos === 0 || esFilaTotal ? '700' : '500'};`;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}


// ========================================================================
// BLOQUE 3 (PANTALLA 6): TABLA INDIVIDUAL, FILTRO, ORDENAMIENTO Y PERFIL
// ========================================================================

function aplicarFiltroYOrdenP6() {
    const termino = normalizarCadenaP6(document.getElementById('p6_buscador')?.value || "");

    let filtrados = listaEstadisticasGeneralesGlobal.filter(item =>
        normalizarCadenaP6(item.nombre).includes(termino)
    );

    const { columna, direccion } = ordenActualP6;
    const factor = direccion === 'asc' ? 1 : -1;

    filtrados.sort((a, b) => {
        if (columna === 'nombre') {
            return a.nombre.localeCompare(b.nombre) * factor;
        }
        return (a[columna] - b[columna]) * factor;
    });

    renderizarTablaBrigadistasP6(filtrados);
}

function renderizarTablaBrigadistasP6(lista) {
    const tbody = document.getElementById('p6_tbodyBrigadistas');
    const contador = document.getElementById('p6_contadorBrigadistas');
    if (!tbody) return;

    tbody.innerHTML = "";
    if (contador) contador.innerText = lista.length;

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 1rem; text-align: center; color: var(--color-texto-mutado);">No se encontraron coincidencias.</td></tr>`;
        return;
    }

    lista.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.cssText = `background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background-color 0.15s;`;

        tr.innerHTML = `
            <td style="padding: 0.5rem 0.4rem; text-align: left; font-weight: 700; color: var(--color-guinda); text-decoration: underline;">
                ${item.nombre}
            </td>
            <td style="padding: 0.5rem 0.35rem; text-align: center; font-family: monospace; font-weight: 700; color: var(--color-texto-oscuro);">
                ${item.total_campo}
            </td>
            <td style="padding: 0.5rem 0.35rem; text-align: center; font-family: monospace; font-weight: 700; color: #059669;">
                ${item.appsn}
            </td>
            <td style="padding: 0.5rem 0.35rem; text-align: center; font-family: monospace; font-weight: 800; color: ${item.pendientes > 0 ? '#dc2626' : '#6b7280'};">
                ${item.pendientes}
            </td>
        `;

        tr.addEventListener('click', () => {
            pantallaOrigenSuperusuario = 6;
            const perfil = item.perfilCompleto || listaBrigadistasGlobal.find(
                b => normalizarCadenaP6(b.nombre) === normalizarCadenaP6(item.nombre)
            );

            if (perfil) {
                abrirPerfilDesdeSuperusuario(perfil);
            } else {
                abrirPerfilDesdeSuperusuario({
                    nombre: item.nombre,
                    municipio: "SIN MUNICIPIO",
                    zona: "SIN ZONA",
                    curp: "-",
                    telefono: "",
                    foto_url: "",
                    url_mapa_zona: ""
                });
            }
        });

        tbody.appendChild(tr);
    });
}

// Evento de búsqueda en tiempo real en Pantalla 6
document.getElementById('p6_buscador')?.addEventListener('input', aplicarFiltroYOrdenP6);

// Eventos de ordenamiento en los encabezados de la tabla de Pantalla 6
document.querySelectorAll('.p6-th-sort').forEach(th => {
    th.addEventListener('click', () => {
        const col = th.getAttribute('data-col');
        if (ordenActualP6.columna === col) {
            ordenActualP6.direccion = ordenActualP6.direccion === 'asc' ? 'desc' : 'asc';
        } else {
            ordenActualP6.columna = col;
            ordenActualP6.direccion = col === 'nombre' ? 'asc' : 'desc';
        }
        actualizarIconosOrdenP6();
        aplicarFiltroYOrdenP6();
    });
});

function actualizarIconosOrdenP6() {
    document.querySelectorAll('.p6-th-sort').forEach(th => {
        const col = th.getAttribute('data-col');
        const span = th.querySelector('.sort-icon');
        if (!span) return;
        if (col === ordenActualP6.columna) {
            span.innerText = ordenActualP6.direccion === 'asc' ? '▲' : '▼';
        } else {
            span.innerText = '↕';
        }
    });
}

// ========================================================================
// BLOQUE EXTRA: EXPORTACIÓN DE REGISTROS DETALLADOS EN CSV (PANTALLA 3)
// ========================================================================

document.getElementById('btnDescargarCSV')?.addEventListener('click', descargarRegistrosCSV);

function convertirMatrizACSV(filas) {
    return filas.map(fila => 
        fila.map(celda => {
            const texto = celda !== null && celda !== undefined ? String(celda) : "";
            // Escapar comillas dobles y envolver entre comillas si hay comas, saltos de línea o comillas
            if (texto.includes('"') || texto.includes(',') || texto.includes('\n') || texto.includes('\r')) {
                return `"${texto.replace(/"/g, '""')}"`;
            }
            return texto;
        }).join(',')
    ).join('\r\n');
}

function dispararDescargaArchivoCSV(contenidoCSV, nombreArchivo) {
    // \uFEFF agrega el BOM de UTF-8 para que Excel abra acentos y ñ correctamente
    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function descargarRegistrosCSV() {
    const nombreFijoGafete = document.getElementById('credCompleto')?.innerText.trim() || "";
    const curpFijaGafete = document.getElementById('credIdentificacion')?.innerText.trim() || "BRIGADISTA";

    if (!nombreFijoGafete || nombreFijoGafete === "-" || nombreFijoGafete.length < 4) {
        alert("⚠️ No se pudo identificar el nombre del brigadista en pantalla.");
        return;
    }

    mostrarCarga("Extrayendo registros...");

    const urlExportar = `${SCRIPT_ESTADISTICAS_PROPIO}?action=exportar&nombre=${encodeURIComponent(nombreFijoGafete)}`;

    try {
        const respuesta = await fetch(urlExportar);
        if (!respuesta.ok) throw new Error("Error de conexión con el servidor de estadísticas.");

        const resultado = await respuesta.json();

        if (resultado.status !== "success" || !resultado.datos) {
            ocultarCarga();
            alert("⚠️ No se pudieron recuperar los datos para exportar.");
            return;
        }

        const hojas = [
            { clave: "Estadisticas", etiqueta: "Etapa2_Estadisticas" },
            { clave: "Derechohabientes", etiqueta: "Derechohabientes_SS" },
            { clave: "Actualizacion_Datos", etiqueta: "Actualizacion_Datos" }
        ];

        let archivosDescargados = 0;

        hojas.forEach((hoja, index) => {
            const filas = resultado.datos[hoja.clave];
            // Solo descargar si hay más de 1 fila (Fila 0 es encabezado + al menos 1 registro del brigadista)
            if (filas && filas.length > 1) {
                const csvTexto = convertirMatrizACSV(filas);
                const nombreArchivo = `${hoja.etiqueta}_${curpFijaGafete}.csv`;
                
                // Pequeño retardo escalonado para que navegadores móviles no bloqueen descargas múltiples
                setTimeout(() => {
                    dispararDescargaArchivoCSV(csvTexto, nombreArchivo);
                }, index * 400);

                archivosDescargados++;
            }
        });

        ocultarCarga();

        if (archivosDescargados === 0) {
            alert("ℹ️ Este brigadista aún no cuenta con registros capturados");
        } else {
            alert(`✅ Se están descargando ${archivosDescargados} archivo(s) .CSV con el desglose completo.`);
        }

    } catch (error) {
        console.error("Error exportando CSV:", error);
        ocultarCarga();
        alert("❌ Ocurrió un error al descargar los registros. Verifica tu conexión e intenta de nuevo.");
    }
}
// ========================================================================
// BLOQUE 4 (PANTALLA 6): TABLA DE VISITAS SEMANALES (LUNES A SÁBADO)
// ========================================================================

let ordenSemanalP6 = { columna: 'sem_total', direccion: 'desc' };

function aplicarFiltroYOrdenSemanalP6() {
    const termino = normalizarCadenaP6(document.getElementById('p6_buscadorSemanal')?.value || "");

    let filtrados = listaEstadisticasGeneralesGlobal.filter(item =>
        normalizarCadenaP6(item.nombre).includes(termino)
    );

    const { columna, direccion } = ordenSemanalP6;
    const factor = direccion === 'asc' ? 1 : -1;

    filtrados.sort((a, b) => {
        if (columna === 'nombre') {
            return a.nombre.localeCompare(b.nombre) * factor;
        }
        return ((a[columna] || 0) - (b[columna] || 0)) * factor;
    });

    renderizarTablaSemanalP6(filtrados);
}

function renderizarTablaSemanalP6(lista) {
    const tbody = document.getElementById('p6_tbodySemanal');
    if (!tbody) return;

    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align: center; color: var(--color-texto-mutado);">No se encontraron coincidencias.</td></tr>`;
        return;
    }

    lista.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.cssText = `background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb; cursor: pointer; transition: background-color 0.15s;`;

        tr.innerHTML = `
            <td style="padding: 0.5rem 0.4rem; text-align: left; font-weight: 700; color: var(--color-guinda); text-decoration: underline;">
                ${item.nombre}
            </td>
            <td style="padding: 0.5rem 0.3rem; text-align: center; font-family: monospace; font-weight: 700; color: var(--color-texto-oscuro);">
                ${item.sem_estadisticas}
            </td>
            <td style="padding: 0.5rem 0.3rem; text-align: center; font-family: monospace; font-weight: 700; color: var(--color-texto-oscuro);">
                ${item.sem_derechohabientes}
            </td>
            <td style="padding: 0.5rem 0.3rem; text-align: center; font-family: monospace; font-weight: 700; color: var(--color-texto-oscuro);">
                ${item.sem_actualizacion}
            </td>
            <td style="padding: 0.5rem 0.3rem; text-align: center; font-family: monospace; font-weight: 800; color: ${item.sem_total > 0 ? '#059669' : '#6b7280'};">
                ${item.sem_total}
            </td>
        `;

        tr.addEventListener('click', () => {
            pantallaOrigenSuperusuario = 6;
            const perfil = item.perfilCompleto || listaBrigadistasGlobal.find(
                b => normalizarCadenaP6(b.nombre) === normalizarCadenaP6(item.nombre)
            );

            if (perfil) {
                abrirPerfilDesdeSuperusuario(perfil);
            } else {
                abrirPerfilDesdeSuperusuario({
                    nombre: item.nombre,
                    municipio: "SIN MUNICIPIO",
                    zona: "SIN ZONA",
                    curp: "-",
                    telefono: "",
                    foto_url: "",
                    url_mapa_zona: ""
                });
            }
        });

        tbody.appendChild(tr);
    });
}

document.getElementById('p6_buscadorSemanal')?.addEventListener('input', aplicarFiltroYOrdenSemanalP6);

document.querySelectorAll('.p6-th-sem-sort').forEach(th => {
    th.addEventListener('click', () => {
        const col = th.getAttribute('data-col-sem');
        if (ordenSemanalP6.columna === col) {
            ordenSemanalP6.direccion = ordenSemanalP6.direccion === 'asc' ? 'desc' : 'asc';
        } else {
            ordenSemanalP6.columna = col;
            ordenSemanalP6.direccion = col === 'nombre' ? 'asc' : 'desc';
        }
        actualizarIconosOrdenSemanalP6();
        aplicarFiltroYOrdenSemanalP6();
    });
});

function actualizarIconosOrdenSemanalP6() {
    document.querySelectorAll('.p6-th-sem-sort').forEach(th => {
        const col = th.getAttribute('data-col-sem');
        const span = th.querySelector('.sort-icon-sem');
        if (!span) return;
        if (col === ordenSemanalP6.columna) {
            span.innerText = ordenSemanalP6.direccion === 'asc' ? '▲' : '▼';
        } else {
            span.innerText = '↕';
        }
    });
}
