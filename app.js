// CONFIGURACIÓN: Pega aquí la URL de la aplicación web que te dio Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby8VnXlnQVLnwNO8Ey8q_rSSL9tC9g3iQ8iDgVWgZx7fFQQReYAwx8yRiK2eB9EOGvNLQ/exec";


let fotoBase64 = "";
let fotoContentType = "";
let fotoUrlActual = "";

// Función nativa para alternar la visualización de las 3 pantallas de flujo
function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}
// PANTALLA 1: BUSCADOR DE IDENTIDAD ASÍNCRONO SIN PREFLIGHT
document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    try {
        // Estructura limpia de parámetros para evadir bloqueos de origen cruzado
        const queryParams = new URLSearchParams({
            action: 'buscar',
            curp: curp
        });

        const res = await fetch(`${WEB_APP_URL}?${queryParams.toString()}`, { 
            method: 'POST'
        });
        const datos = await res.json();

        document.getElementById('nombre_curp').value = curp;

        if (datos.existe) {
            // SI EXISTE: Jalar datos y saltar directo a Pantalla 3 (Credencial)
            document.getElementById('credCompleto').innerText = `${datos.nombre} ${datos.ap_paterno} ${datos.ap_materno}`.toUpperCase();
            document.getElementById('credPuesto').innerText = datos.puesto.toUpperCase();
            document.getElementById('credZona').innerText = datos.zona.toUpperCase();
            document.getElementById('credIdentificacion').innerText = datos.curp;
            document.getElementById('credFoto').src = datos.foto_url;
            fotoUrlActual = datos.foto_url;

            // Almacenar en formulario oculto por si pulsa "Actualizar Perfil"
            document.getElementById('nombre').value = datos.nombre;
            document.getElementById('ap_paterno').value = datos.ap_paterno;
            document.getElementById('ap_materno').value = datos.ap_materno;
            document.getElementById('municipio').value = datos.municipio;
            document.getElementById('puesto').value = datos.puesto;
            document.getElementById('telefono').value = datos.telefono;
            document.getElementById('zona').value = datos.zona;
            document.getElementById('correo').value = datos.correo;

            irAPantalla(3);
        } else {
            // SI NO EXISTE: Mandar a Pantalla 2 (Registro)
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            fotoUrlActual = "";
            irAPantalla(2);
        }
    } catch (err) {
        alert('Error: La respuesta de Google Apps Script fue bloqueada o no está activa. Verifique los permisos de implementación.');
    }
});
// CONVERSIÓN MULTIMEDIA A MAPA DE BITS BASE64
document.getElementById('inputFoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fotoContentType = file.type;
        const reader = new FileReader();
        reader.onload = function(evt) {
            // Extraer exclusivamente la cadena binaria limpia
            fotoBase64 = evt.target.result.split(',')[1];
            document.getElementById('fotoAviso').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// PANTALLA 2: ENVÍO INTEGRAL MODIFICADO PARA EVADIR CORS
document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const curp = document.getElementById('nombre_curp').value;
    
    // Empaquetar todo el payload de datos planos e imagen en un solo objeto JSON
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
        foto_url: fotoUrlActual,
        fotoBase64: fotoBase64,
        fotoContentType: fotoContentType
    };

    try {
        // Enviar con Content-Type text/plain evita que el navegador active la restricción CORS
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payloadCompleto)
        });
        
        const resultado = await res.json();
        
        if (resultado.status === "success") {
            alert('🎉 ¡Información guardada con éxito en Google Sheets y Drive!');
            
            // Renderizar la información final sobre el Gafete (Pantalla 3)
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = resultado.foto_url;
            
            // Resetear estados multimedia
            fotoBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(3);
        } else {
            alert('Error en el servidor de Google: ' + resultado.message);
        }
    } catch (err) {
        alert('Error físico de conexión de red con los servicios de Google.');
    }
});
// BOTÓN ACTUALIZAR PERFIL (De pantalla 3 retrocede a pantalla 2 con la data intacta)
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

// BOTÓN CERRAR SESIÓN / RETROCEDER
document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});
