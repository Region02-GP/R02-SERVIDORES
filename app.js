// ==========================================
// BLOQUE 1: CONFIGURACIÓN Y CONTROL DE VISTAS
// ==========================================

// CONFIGURACIÓN: Coloca aquí tu URL /exec de Google Apps Script pública
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyuMs73jjMm82NHMeoKpFIkGND2309TIh0YPTq_NYZHIoFkGSBfg-GlqgCr_w2kbPrqbQ/exec";

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
// BLOQUE 2: CONTROLADOR DE ACCESO, BÚSQUEDA Y AUDITORÍA DE CAMPOS
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
            // 1. Castear de forma segura los valores a String limpios
            const nom = String(datos.nombre || "").trim();
            const pat = String(datos.ap_paterno || "").trim();
            const mat = String(datos.ap_materno || "").trim(); // El segundo apellido es el único opcional
            const mun = String(datos.municipio || "").trim();
            const pue = String(datos.puesto || "").trim();
            const tel = String(datos.telefono || "").trim();
            const zon = String(datos.zona || "").trim();
            const cor = String(datos.correo || "").trim();
            const fot = String(datos.foto_url || "").trim();

            // 2. Prellenar el formulario de la Pantalla 2 de forma inmediata
            document.getElementById('nombre').value = nom;
            document.getElementById('ap_paterno').value = pat;
            document.getElementById('ap_materno').value = mat;
            document.getElementById('municipio').value = mun;
            document.getElementById('puesto').value = pue;
            document.getElementById('telefono').value = tel;
            document.getElementById('zona').value = zon;
            document.getElementById('correo').value = cor;
            fotoUrlActual = fot;

            // 3. AUDITORÍA CLAVE: Verificar si falta algún dato obligatorio en la base de datos
            let camposFaltantes = [];
            if (!nom) camposFaltantes.push("Nombre");
            if (!pat) camposFaltantes.push("Primer Apellido");
            if (!mun) camposFaltantes.push("Municipio");
            if (!pue) camposFaltantes.push("Puesto");
            if (!tel) camposFaltantes.push("Teléfono");
            if (!zon) camposFaltantes.push("Zona / Región");
            if (!cor) camposFaltantes.push("Correo Electrónico");
            if (!fot || fot.startsWith('data:image/svg+xml') || fot.includes('placeholder')) {
                camposFaltantes.push("Fotografía del Brigadista");
            }

            // 4. Evaluar el resultado de la auditoría de campos
            if (camposFaltantes.length > 0) {
                // Si faltan datos: Informar al usuario y enviarlo a corregir el formulario
                ocultarCarga();
                alert(`⚠️ Registro Incompleto.\n\nPara visualizar tu credencial, es necesario completar los siguientes datos faltantes:\n• ${camposFaltantes.join('\n• ')}`);
                
                document.getElementById('p2_titulo').innerText = "Completar Registro";
                if (fot && !camposFaltantes.includes("Fotografía del Brigadista")) {
                    document.getElementById('fotoAviso').classList.remove('hidden');
                } else {
                    document.getElementById('fotoAviso').classList.add('hidden');
                }
                
                irAPantalla(2); // Redirección forzada a la Pantalla del Formulario
                return; // Detener el flujo para que no pase a la pantalla 3
            }

            // 5. SI TODO ESTÁ COMPLETO: Cargar e ir directamente al Gafete Final (Pantalla 3)
            document.getElementById('credCompleto').innerText = `${nom} ${pat} ${mat}`.trim().toUpperCase();
            document.getElementById('credPuesto').innerText = pue.toUpperCase();
            document.getElementById('credZona').innerText = zon.toUpperCase();
            document.getElementById('credIdentificacion').innerText = String(datos.curp || curp).toUpperCase();
            document.getElementById('credFoto').src = fot;

            irAPantalla(3);
        } else {
            // Brigadista totalmente nuevo (No existe en la base de datos)
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
        alert('Error al procesar la respuesta del servidor de registros.');
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
// BLOQUE 4: ENVÍO DE DATOS Y SINCRONIZACIÓN (CORRECCIÓN DE FOTO ACTUALIZADA)
// ==========================================

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const curp = document.getElementById('nombre_curp').value;
    mostrarCarga("Sincronizando y guardando en la nube...");

    // ALGORITMO DE DETECCIÓN: Si el brigadista capturó una foto nueva, esa será la foto activa.
    // Si no capturó ninguna nueva, mantenemos la que ya estaba registrada en la base de datos.
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
        foto_url: fotoParaEnviar, // CORREGIDO: Enviamos la foto correcta (sea la nueva o la anterior)
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
            
            // Actualizar interfaz final de la tarjeta con los nuevos datos
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            
            // Guardar en memoria la foto devuelta por el servidor
            fotoUrlActual = resultado.foto_url || fotoParaEnviar;
            document.getElementById('credFoto').src = fotoUrlActual;
            
            // Limpiar la memoria temporal de la foto cargada
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

