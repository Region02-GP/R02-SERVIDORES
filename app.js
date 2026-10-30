// CONFIGURACIÓN: Pega aquí la URL de la aplicación web que te dio Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyA53cQSQQ3Pr9lz0O8GW9yl8-C3VsLISQUtQ6mTJ_F9QVyo08EEDQukeCgnW7I5Wn5XQ/exec";

let fotoBase64 = "";
let fotoContentType = "";
let fotoUrlActual = "";

// Función de navegación nativa entre las 3 pantallas
function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}

// PANTALLA 1: VALIDAR INGRESO Y DIRECCIONAMIENTO AUTOMÁTICO
document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    try {
        const res = await fetch(`${WEB_APP_URL}?action=buscar&curp=${curp}`, { method: 'POST' });
        const datos = await res.json();

        document.getElementById('nombre_curp').value = curp;

        if (datos.existe) {
            // SI YA EXISTE: Mapear textos y brincar directo a Pantalla 3 (Gafete)
            document.getElementById('credCompleto').innerText = `${datos.nombre} ${datos.ap_paterno} ${datos.ap_materno}`.toUpperCase();
            document.getElementById('credPuesto').innerText = datos.puesto.toUpperCase();
            document.getElementById('credZona').innerText = datos.zona.toUpperCase();
            document.getElementById('credIdentificacion').innerText = datos.curp;
            document.getElementById('credFoto').src = datos.foto_url;
            fotoUrlActual = datos.foto_url;

            // Guardar en inputs ocultos por si decide actualizar
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
            // SI NO EXISTE: Ir a Pantalla 2 (Registro)
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            fotoUrlActual = "";
            irAPantalla(2);
        }
    } catch (err) {
        alert('Error de conexión con los servicios de Google Cloud Sheets.');
    }
});

// CAPTURA MULTIMEDIA Y CONVERSIÓN A BASE64 BINARIO
document.getElementById('inputFoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fotoContentType = file.type;
        const reader = new FileReader();
        reader.onload = function(evt) {
            fotoBase64 = evt.target.result.split(',')[1];
            document.getElementById('fotoAviso').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// PANTALLA 2: ENVÍO ASÍNCRONO DEL REGISTRO (CON EXCLUSIÓN / UPSERT)
document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const curp = document.getElementById('nombre_curp').value;
    const urlPayload = `${WEB_APP_URL}?action=guardar&curp=${curp}&nombre=${document.getElementById('nombre').value}&ap_paterno=${document.getElementById('ap_paterno').value}&ap_materno=${document.getElementById('ap_materno').value}&municipio=${document.getElementById('municipio').value}&puesto=${document.getElementById('puesto').value}&telefono=${document.getElementById('telefono').value}&zona=${document.getElementById('zona').value}&correo=${document.getElementById('correo').value}&foto_url=${fotoUrlActual}`;

    let bodyPayload = "{}";
    if (fotoBase64) {
        bodyPayload = JSON.stringify({ fotoBase64: fotoBase64, fotoContentType: fotoContentType });
    }

    try {
        const res = await fetch(urlPayload, { method: 'POST', body: bodyPayload });
        const resultado = await res.json();
        
        if (resultado.status === "success") {
            alert('🎉 Registro guardado en la nube exitosamente');
            // Transferir a pantalla 3
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = resultado.foto_url;
            
            // Limpieza
            fotoBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(3);
        }
    } catch (err) {
        alert('Error al sincronizar datos en la nube de Google.');
    }
});

// BOTÓN ACTUALIZAR PERFIL (De pantalla 3 regresa a pantalla 2 manteniendo datos en memoria)
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

// BOTÓN CERRAR SESIÓN / SALIR
document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});
