// ========================================================
// BLOQUE 1: NAUFRAGIO DE VISTAS Y CONFIGURACIÓN INICIAL
// ========================================================

// Reemplaza esta URL con tu enlace generado al hacer Deploy en Google
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz747sYPq107Dos3ppdWIaGP0DIJgi-8jvQOjqlzuzD5BvPXO4xK8W3d1FAhtXRIV3B7A/exec";

let fotoCompletaBase64 = "";
let fotoUrlActual = "";

function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}

function mostrarCarga(texto) {
    document.getElementById('textoCarga').innerText = texto || "Procesando...";
    document.getElementById('pantallaCarga').classList.remove('hidden');
}

function ocultarCarga() {
    document.getElementById('pantallaCarga').classList.add('hidden');
}
// ========================================================
// BLOQUE 2: VALIDADOR DE IDENTIDAD (CORREGIDO)
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

        // CONTROL DE RECHAZO AUTOMÁTICO
        if (datos.status === "denied") {
            ocultarCarga();
            alert(`⛔ ACCESO DENEGADO\n\n${datos.message}`);
            return;
        }

        document.getElementById('nombre_curp').value = curp;

        // BRIGADISTA EXISTENTE EN LA HOJA DE EXCEL
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

            document.getElementById('nombre').value = nom;
            document.getElementById('ap_paterno').value = pat;
            document.getElementById('ap_materno').value = mat;
            document.getElementById('municipio').value = mun;
            document.getElementById('puesto').value = pue;
            document.getElementById('telefono').value = tel;
            document.getElementById('zona').value = zon;
            document.getElementById('correo').value = cor;

            // AUDITORÍA INTERNA DE CAMPOS OBLIGATORIOS
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

            if (camposFaltantes.length > 0) {
                ocultarCarga();
                alert(`⚠️ PERFIL INCOMPLETO.\n\nCompleta los campos pendientes para desbloquear tu credencial:\n• ${camposFaltantes.join('\n• ')}`);
                document.getElementById('p2_titulo').innerText = "Completar Registro";
                document.getElementById('fotoAviso').classList.add('hidden');
                irAPantalla(2); 
                return; 
            }

            // PERFIL LISTO: ENVIAR AL GAFETE
            document.getElementById('credCompleto').innerText = `${nom} ${pat} ${mat}`.trim().toUpperCase();
            document.getElementById('credPuesto').innerText = pue.toUpperCase();
            document.getElementById('credZona').innerText = zon.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = fotoUrlActual;
            
            ocultarCarga();
            irAPantalla(3);

        } else {
            // BRIGADISTA AUTORIZADO - PRIMER REGISTRO EN EL SISTEMA
            ocultarCarga();
            alert(`🎉 ¡Validación Exitosa!\n\nCURP localizada en el padrón oficial de Brigadistas de Campo. Complementa tu perfil para emitir tu credencial.`);
            
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            
            // Inyectar de manera segura la información oficial inalterable desde el backend
            document.getElementById('nombre').value = String(datos.nombre_oficial || "").toUpperCase();
            document.getElementById('municipio').value = String(datos.municipio_oficial || "").toUpperCase();
            
            fotoUrlActual = "";
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(2);
        }
    } catch (err) {
        console.error(err);
        ocultarCarga();
        alert('Error en el enlace de red con el módulo de acceso. Verifica que la URL del servidor sea correcta.');
    }
});

// ========================================================
// BLOQUE 3: COMPRESIÓN FOTOGRÁFICA Y ENVÍO (CORREGIDO)
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
        reader.readAsDataURL(files[0]); // <--- CORRECCIÓN CLAVE: Se añade el índice [0] para leer el archivo correctamente
    }
});

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
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
// BLOQUE 4: MOTOR DE RENDERIZADO HD E INTERFAZ DE USUARIO
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

    ctx.fillStyle = "#fcfaf6";
    ctx.fillRect(0, 0, 1276, 2020);

    ctx.fillStyle = "#611232";
    ctx.fillRect(0, 0, 1276, 320);

    ctx.fillStyle = "#ddc9a3";
    ctx.fillRect(0, 320, 1276, 16);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 52px sans-serif";
    ctx.fillText("SERVICIO UNIVERSAL DE SALUD", 638, 140);
    
    ctx.fillStyle = "#ddc9a3";
    ctx.font = "600 32px sans-serif";
    ctx.fillText("ESTADOS UNIDOS MEXICANOS", 638, 230);

    const imgFoto = new Image();
    imgFoto.onload = function() {
        const marcoX = 358;
        const marcoY = 420;
        const marcoAncho = 560;
        const marcoAlto = 700;

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
        texto.innerHTML = "☝️ MANTÉN PRESIONADA LA CREDENCIAL<br>para guardarla o compartirla.<br><br><span style='font-weight:400; font-size:0.85rem; background:#6b7280; padding:0.5rem 1rem; border-radius:0.5rem; cursor:pointer;'>Regresar</span>";
        
        modal.appendChild(img);
        modal.appendChild(texto);
        document.body.appendChild(modal);

        texto.addEventListener('click', () => { document.body.removeChild(modal); });
        ocultarCarga();
    };
    imgFoto.src = fotoSrc;
});

document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});
