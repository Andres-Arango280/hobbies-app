// 📌 Al cargar la página, obtener y mostrar los eventos
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔄 Cargando eventos...");
  await loadEvents();
});

// 📌 Manejar envío del formulario de creación
const form = document.getElementById("createEvent");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      date: form.date.value,
      time: form.time.value,
      place: form.place.value.trim(),
    };

    // Validación básica
    if (!data.title || !data.date || !data.time || !data.place) {
      alert("❌ Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      console.log("📤 Enviando evento:", data);
      
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      console.log("📄 Respuesta del servidor:", result);

      if (res.ok) {
        console.log("✅ Evento creado exitosamente");
        alert("✅ Evento creado");
        form.reset();
        await loadEvents(); // refrescar lista
      } else {
        console.error("❌ Error del servidor:", result);
        if (res.status === 401) {
          alert("❌ Debes iniciar sesión para crear eventos");
        } else {
          alert("❌ Error: " + (result.error || "No se pudo crear el evento"));
        }
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err);
      alert("⚠️ Error de conexión con el servidor");
    }
  });
} else {
  console.warn("⚠️ No se encontró el formulario #createEvent");
}

// 📌 Función para obtener y renderizar eventos
async function loadEvents() {
  const eventsList = document.getElementById("eventsList");
  
  if (!eventsList) {
    console.error("❌ No se encontró el elemento #eventsList");
    return;
  }

  eventsList.innerHTML = "<p>Cargando eventos...</p>";

  try {
    console.log("🔍 Obteniendo eventos del servidor...");
    const res = await fetch("/api/events");
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const events = await res.json();
    console.log("📄 Eventos recibidos:", events);

    if (!Array.isArray(events)) {
      console.error("❌ La respuesta no es un array:", events);
      eventsList.innerHTML = "<p>❌ Error en el formato de datos.</p>";
      return;
    }

    if (events.length === 0) {
      eventsList.innerHTML = "<p>📅 No hay eventos próximos.</p>";
      return;
    }

    // Renderizar eventos
    eventsList.innerHTML = events
      .map((ev) => {
        // Formatear fecha y hora
        let dateStr = ev.date;
        let timeStr = ev.time;
        
        try {
          // Intentar formatear la fecha si es posible
          const date = new Date(ev.date + 'T' + ev.time);
          if (!isNaN(date.getTime())) {
            dateStr = date.toLocaleDateString();
            timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          }
        } catch (e) {
          // Si falla el formateo, usar los valores originales
        }

        return `
          <div class="event-card" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #f9f9f9;">
            <h4 style="margin: 0 0 10px 0; color: #333;">${ev.title}</h4>
            <p style="margin: 5px 0; color: #666;">${ev.description || "Sin descripción"}</p>
            <p style="margin: 5px 0;"><strong>📅</strong> ${dateStr} a las ${timeStr}</p>
            <p style="margin: 5px 0;"><strong>📍</strong> ${ev.place}</p>
            ${ev.createdBy && ev.createdBy.username ? 
              `<p style="margin: 5px 0; font-size: 12px; color: #999;">Creado por: ${ev.createdBy.username}</p>` : 
              ''
            }
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #aaa;">
              ${new Date(ev.createdAt).toLocaleString()}
            </p>
          </div>
        `;
      })
      .join("");

    console.log(`✅ ${events.length} eventos renderizados correctamente`);

  } catch (err) {
    console.error("❌ Error cargando eventos:", err);
    eventsList.innerHTML = `<p style="color: red;">❌ Error al cargar eventos: ${err.message}</p>`;
  }
}