const BASE_URL = 'http://127.0.0';
let fotoArchivo = null;

// 1. Conexión de variables espejo (Escribir y actualizar credencial al instante)
document.getElementById('nombre').addEventListener('input', (e) => document.getElementById('credNombre').innerText = e.target.value || '-');
document.getElementById('apellido1').addEventListener('input', (e) => document.getElementById('credApellido1').innerText = e.target.value || '-');
document.getElementById('apellido2').addEventListener('input', (e) => document.getElementById('credApellido2').innerText = e.target.value || '-');
document.getElementById('identificacion').addEventListener('input', (e) => document.getElementById('credIdentificacion').innerText = e.target.value.toUpperCase() || '-');
document.getElementById('brigada').addEventListener('input', (e) => document.getElementById('credBrigada').innerText = e.target.value || '-');
document.getElementById('sangre').addEventListener('input', (e) => document.getElementById('credSangre').innerText = e.target.value.toUpperCase() || '-');

// 2. Previsualización de imágenes en el contenedor oficial
document.getElementById('inputFoto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fotoArchivo = file;
        document.getElementById('credFoto').src = URL.createObjectURL(file);
        document.getElementById('seccionCredencial').classList.remove('hidden');
    }
});

// 3. Botón Buscar: Solicita información de la base de datos
document.getElementById('btnBuscar').addEventListener('click', async () => {
    const id = document.getElementById('identificacion').value.trim().toUpperCase();
    if (!id) return alert('Por favor, ingresa una identificación');

    document.getElementById('camposRegistro').classList.remove('hidden');

    try {
        const res = await fetch(`${BASE_URL}/${id}`);
        const datos = await res.json();

        if (datos.existe) {
            const partes = datos.nombre.split(' ');
            document.getElementById('nombre').value = partes[0] || '';
            document.getElementById('apellido1').value = partes[1] || '';
            document.getElementById('apellido2').value = partes.slice(2).join(' ') || '';
            document.getElementById('telefono').value = datos.telefono;
            document.getElementById('sangre').value = datos.sangre;
            document.getElementById('region').value = datos.region;
            document.getElementById('brigada').value = datos.brigada;
            
            document.getElementById('credNombre').innerText = partes[0] || '-';
            document.getElementById('credApellido1').innerText = partes[1] || '-';
            document.getElementById('credApellido2').innerText = partes.slice(2).join(' ') || '-';
            document.getElementById('credIdentificacion').innerText = id;
            document.getElementById('credBrigada').innerText = datos.brigada;
            document.getElementById('credSangre').innerText = datos.sangre;
            document.getElementById('credFoto').src = datos.foto_url;

            // Mostrar credencial y ocultar formulario de forma limpia
            document.getElementById('seccionCredencial').classList.remove('hidden');
            document.getElementById('seccionFormulario').classList.add('hidden');
            document.getElementById('btnVolver').classList.remove('hidden');
        } else {
            // Reiniciar campos menos el ID para registrar uno nuevo
            document.getElementById('nombre').value = '';
            document.getElementById('apellido1').value = '';
            document.getElementById('apellido2').value = '';
            document.getElementById('telefono').value = '';
            document.getElementById('sangre').value = '';
            document.getElementById('region').value = '';
            document.getElementById('brigada').value = '';
            document.getElementById('seccionCredencial').classList.add('hidden');
            alert('✨ ID no encontrado en registros. Complete el formulario para darlo de alta.');
        }
    } catch (err) {
        alert('Modo simulación activado: El backend local no está encendido.');
        document.getElementById('credIdentificacion').innerText = id;
        document.getElementById('seccionCredencial').classList.remove('hidden');
    }
});

// 4. Envío de datos empaquetados hacia el Servidor Python
document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreCompleto = `${document.getElementById('nombre').value} ${document.getElementById('apellido1').value} ${document.getElementById('apellido2').value}`.trim();
    const idDoc = document.getElementById('identificacion').value.trim().toUpperCase();
    
    const formData = new FormData();
    formData.append('identificacion', idDoc);
    formData.append('nombre', nombreCompleto);
    formData.append('telefono', document.getElementById('telefono').value);
    formData.append('sangre', document.getElementById('sangre').value);
    formData.append('region', document.getElementById('region').value);
    formData.append('brigada', document.getElementById('brigada').value);
    if (fotoArchivo) formData.append('foto', fotoArchivo);

    try {
        const res = await fetch(`${BASE_URL}/guardar`, { method: 'POST', body: formData });
        const resultado = await res.json();
        if (resultado.status === 'success') {
            alert('🎉 ¡Registro guardado exitosamente!');
            document.getElementById('credFoto').src = resultado.foto_url;
            fotoArchivo = null;
            
            document.getElementById('seccionCredencial').classList.remove('hidden');
            document.getElementById('seccionFormulario').classList.add('hidden');
            document.getElementById('btnVolver').classList.remove('hidden');
        }
    } catch (err) {
        alert('💾 Datos previsualizados localmente (Sin conexión de servidor)');
        document.getElementById('seccionCredencial').classList.remove('hidden');
        document.getElementById('seccionFormulario').classList.add('hidden');
        document.getElementById('btnVolver').classList.remove('hidden');
    }
});

// 5. Botón Volver
document.getElementById('btnVolver').addEventListener('click', () => {
    document.getElementById('seccionFormulario').classList.remove('hidden');
    document.getElementById('seccionCredencial').classList.add('hidden');
    document.getElementById('btnVolver').classList.add('hidden');
});
// LÓGICA PARA PROCESAR EL FORMULARIO DE REPORTES DIARIOS
document.getElementById('reporteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtenemos la CURP del buscador principal para saber a quién asociar el reporte
    const idDoc = document.getElementById('identificacion').value.trim().toUpperCase();
    if (!idDoc) return alert('Por favor, busque e identifíquese primero antes de enviar un reporte.');

    const formData = new FormData();
    formData.append('identificacion', idDoc);
    formData.append('actividad', document.getElementById('repActividad').value);
    formData.append('observaciones', document.getElementById('repObservaciones').value);

    try {
        const res = await fetch('http://127.0.0', {
            method: 'POST',
            body: formData
        });
        const resultado = await res.json();
        
        if (resultado.status === 'success') {
            alert('🎉 ¡Reporte diario registrado correctamente en el sistema!');
            document.getElementById('reporteForm').reset();
        }
    } catch (err) {
        alert('💾 Modo Offline: El reporte se guardaría en local debido a la falta de conexión con el backend.');
    }
});
