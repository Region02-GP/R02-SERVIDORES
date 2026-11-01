// CONFIGURACIÓN: Pega aquí la URL de la aplicación web que te dio Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxhsuYh0TQAS44Pk-6u41KRsg4Q5TugsHOMAIMMpFBp4VjFleWls6IIv9TxV-nTGfXmRw/exec";
// CONFIGURACIÓN: Enlace directo y verificado hacia tu Google Apps Script
const WEB_APP_URL = "https://google.com";

let fotoCompletaBase64 = "";
let fotoUrlActual = "";

// Función de navegación entre pantallas
function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}
// PANTALLA 1: VALIDACIÓN AUTOMÁTICA DE REGISTROS EXISTENTES
document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    try {
        // Estructura nativa de formulario para la búsqueda
        const formBuscar = new FormData();
        formBuscar.append('action', 'buscar');
        formBuscar.append('curp', curp);

        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            body: formBuscar
        });
        
        const datos = await res.json();
        document.getElementById('nombre_curp').value = curp;

        if (datos.existe) {
            // SI YA EXISTE: Mapear textos e ir directo a Pantalla 3 (Credencial)
            document.getElementById('credCompleto').innerText = `${datos.nombre} ${datos.ap_paterno} ${datos.ap_materno}`.toUpperCase();
            document.getElementById('credPuesto').innerText = datos.puesto.toUpperCase();
            document.getElementById('credZona').innerText = datos.zona.toUpperCase();
            document.getElementById('credIdentificacion').innerText = datos.curp;
            document.getElementById('credFoto').src = datos.foto_url || "https://placeholder.com";
            fotoUrlActual = datos.foto_url;

            // Rellenar formulario oculto en la Pantalla 2 por si presiona "Actualizar"
            document.getElementById('nombre').value = datos.nombre || "";
            document.getElementById('ap_paterno').value = datos.ap_paterno || "";
            document.getElementById('ap_materno').value = datos.ap_materno || "";
            document.getElementById('municipio').value = datos.municipio || "";
            document.getElementById('puesto').value = datos.puesto || "";
            document.getElementById('telefono').value = datos.telefono || "";
            document.getElementById('zona').value = datos.zona || "";
            document.getElementById('correo').value = datos.correo || "";

            irAPantalla(3);
        } else {
            // SI NO EXISTE: Mandar a la Pantalla 2 para registro nuevo
            document.getElementById('p2_titulo').innerText = "Nuevo Registro";
            document.getElementById('perfilForm').reset();
            document.getElementById('nombre_curp').value = curp;
            fotoUrlActual = "";
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(2);
        }
    } catch (err) {
        alert('Error físico de conexión con los registros de Google Sheets.');
    }
});
// Conversión de la fotografía seleccionada a texto Base64
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

// PANTALLA 2: ENVÍO COMPATIBLE CON ARCHIVOS GRANDES
document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const curp = document.getElementById('nombre_curp').value;
    
    // Convertir el envío a FormData nativo para soportar textos largos sin caídas de red
    const formGuardar = new FormData();
    formGuardar.append('action', 'guardar');
    formGuardar.append('curp', curp);
    formGuardar.append('nombre', document.getElementById('nombre').value);
    formGuardar.append('ap_paterno', document.getElementById('ap_paterno').value);
    formGuardar.append('ap_materno', document.getElementById('ap_materno').value);
    formGuardar.append('municipio', document.getElementById('municipio').value);
    formGuardar.append('puesto', document.getElementById('puesto').value);
    formGuardar.append('telefono', document.getElementById('telefono').value);
    formGuardar.append('zona', document.getElementById('zona').value);
    formGuardar.append('correo', document.getElementById('correo').value);
    formGuardar.append('foto_url', fotoUrlActual);
    formGuardar.append('fotoCompletaBase64', fotoCompletaBase64);

    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: formGuardar
        });
        const resultado = await res.json();
        
        if (resultado.status === "success") {
            alert('🎉 ¡Perfil guardado y sincronizado correctamente en la nube!');
            
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            document.getElementById('credFoto').src = resultado.foto_url;
            fotoUrlActual = resultado.foto_url;
            
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(3);
        }
    } catch (err) {
        alert('Error al sincronizar el envío de datos con Google.');
    }
});

// BOTÓN ACTUALIZAR PERFIL
document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.getElementById('p2_titulo').innerText = "Modificar Perfil";
    irAPantalla(2);
});

// BOTÓN CERRAR SESIÓN
document.getElementById('btnCerrar').addEventListener('click', () => {
    document.getElementById('p1_curp').value = "";
    irAPantalla(1);
});
