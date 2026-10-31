// CONFIGURACIÓN: Pega aquí la URL de la aplicación web que te dio Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxK3U3YvEi4tt58VOFbMv72WeLT3xBOoHr1_-c71OtMrGGrRhS7YtWRCoS83TjyoaNk6A/exec";

const WEB_APP_URL = "URL_DE_TU_DEPLOY_DE_GOOGLE_APPS_SCRIPT_AQUÍ";

let fotoCompletaBase64 = "";
let fotoUrlActual = "";

function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}
document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    try {
        const queryParams = new URLSearchParams({ action: 'buscar', curp: curp });
        const res = await fetch(`${WEB_APP_URL}?${queryParams.toString()}`, { method: 'POST' });
        const datos = await res.json();

        document.getElementById('nombre_curp').value = curp;

        if (datos.existe) {
            document.getElementById('credCompleto').innerText = `${datos.nombre} ${datos.ap_paterno} ${datos.ap_materno}`.toUpperCase();
            document.getElementById('credPuesto').innerText = datos.puesto.toUpperCase();
            document.getElementById('credZona').innerText = datos.zona.toUpperCase();
            document.getElementById('credIdentificacion').innerText = datos.curp;
            document.getElementById('credFoto').src = datos.foto_url; // Renderizado instantáneo sin bloqueos
            fotoUrlActual = datos.foto_url;

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
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            fotoUrlActual = "";
            irAPantalla(2);
        }
    } catch (err) {
        alert('Error al consultar los registros del servidor.');
    }
});
// Conservar la cadena completa tipo DataURL para saltarnos el CORS de Google
document.getElementById('inputFoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            fotoCompletaBase64 = evt.target.result;
            document.getElementById('fotoAviso').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const curp = document.getElementById('nombre_curp').value;
    
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
        fotoCompletaBase64: fotoCompletaBase64
    };

    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payloadCompleto)
        });
        const resultado = await res.json();
        
        if (resultado.status === "success") {
            alert('🎉 ¡Perfil actualizado y guardado correctamente!');
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = resultado.foto_url;
            
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(3);
        }
    } catch (err) {
        alert('Error al sincronizar el envío de datos.');
    }
});

document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});

