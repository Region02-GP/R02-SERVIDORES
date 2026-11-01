// CONFIGURACIÓN: Pega aquí la URL de la aplicación web que te dio Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyvDQZWEVDxpMOlNFkUhCZTcMWtbKmtKcMc_AxwclGJ0v-6P44JSmcJou-AzHyYPZy9nQ/exec";

let fotoCompletaBase64 = "";
let fotoUrlActual = "";

function irAPantalla(num) {
    document.getElementById('pantalla1').classList.add('hidden');
    document.getElementById('pantalla2').classList.add('hidden');
    document.getElementById('pantalla3').classList.add('hidden');
    document.getElementById('pantalla' + num).classList.remove('hidden');
}

// PANTALLA 1: VALIDACIÓN AUTOMÁTICA DE REGISTROS
document.getElementById('btnAcceder').addEventListener('click', async () => {
    const curp = document.getElementById('p1_curp').value.trim().toUpperCase();
    if (!curp) return alert('Por favor, ingresa una CURP válida');

    try {
        const payloadBuscar = { action: 'buscar', curp: curp };

        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payloadBuscar)
        });
        
        const datos = await res.json();
        document.getElementById('nombre_curp').value = curp;

        if (datos.existe) {
            // SI YA EXISTE: Cargar elementos e ir a Credencial (Pantalla 3)
            document.getElementById('credCompleto').innerText = `${datos.nombre} ${datos.ap_paterno} ${datos.ap_materno}`.toUpperCase();
            document.getElementById('credPuesto').innerText = datos.puesto.toUpperCase();
            document.getElementById('credZona').innerText = datos.zona.toUpperCase();
            document.getElementById('credIdentificacion').innerText = datos.curp;
            
            // Renderizado seguro de imagen
            const fotoSrc = (datos.foto_url && datos.foto_url.startsWith('data:image')) ? datos.foto_url : "";
            document.getElementById('credFoto').src = fotoSrc || "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='100' height='100' viewBox='0 0 24 24' fill='%236b7280'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 2 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";
            fotoUrlActual = datos.foto_url || "";

            // Rellenar el formulario por si pulsa "Modificar Perfil"
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
            // SI NO EXISTE: Habilitar campos e ir a Registro (Pantalla 2)
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
        alert('Error de red: No se pudo conectar con el servidor. Revisa que la URL de Google Apps Script sea la de una nueva implementación configurada como pública.');
    }
});

// REDUCCIÓN AUTOMÁTICA DE PESO DE IMAGEN EN TIEMPO REAL
document.getElementById('inputFoto').addEventListener('change', (e) => {
    const file = e.target.files[0]; // CORREGIDO: Añadido [0] para capturar el archivo correctamente
    if (file) {
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

                fotoCompletaBase64 = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('fotoAviso').classList.remove('hidden');
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// PANTALLA 2: ENVÍO COMPACTO DE REGISTRO EN LÍNEA
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
            
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payloadBuscar    )
        });
        const resultado = await res.json();
        
        if (resultado.status === "success") {
            alert('🎉 ¡Perfil guardado y sincronizado correctamente en la nube!');
            
            document.getElementById('credCompleto').innerText = `${document.getElementById('nombre').value} ${document.getElementById('ap_paterno').value} ${document.getElementById('ap_materno').value}`.toUpperCase();
            document.getElementById('credPuesto').innerText = document.getElementById('puesto').value.toUpperCase();
            document.getElementById('credZona').innerText = document.getElementById('zona').value.toUpperCase();
            document.getElementById('credIdentificacion').innerText = curp;
            
            document.getElementById('credFoto').src = resultado.foto_url || "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='100' height='100' viewBox='0 0 24 24' fill='%236b7280'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 2 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5-4-8-4z'/></svg>";
            fotoUrlActual = resultado.foto_url;
            
            fotoCompletaBase64 = "";
            document.getElementById('fotoAviso').classList.add('hidden');
            irAPantalla(3);
        } else {
            alert('Error del servidor: ' + resultado.message);
        }
    } catch (err) {
        console.error(err);
        alert('Error al sincronizar el envío de datos con Google.');
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
