// Al cargar la página
document.addEventListener("DOMContentLoaded", async () => {
  loadRecentPosts();
  loadUpcomingEvents();
});

// 📌 Cargar publicaciones recientes
async function loadRecentPosts() {
  const postsDiv = document.getElementById("posts");
  if (!postsDiv) return;

  postsDiv.innerHTML = "<p>Cargando publicaciones...</p>";

  try {
    const res = await fetch("/api/posts");
    const posts = await res.json();

    if (!res.ok) {
      postsDiv.innerHTML = "<p>No se pudieron cargar las publicaciones.</p>";
      return;
    }

    if (posts.length === 0) {
      postsDiv.innerHTML = "<p>No hay publicaciones aún.</p>";
      return;
    }

    // Mostrar solo las 3 últimas
    const recent = posts.slice(-3).reverse();

    postsDiv.innerHTML = recent
      .map(
        (post) => `
        <div class="post-card">
          <p>${post.caption || "Sin descripción"}</p>
          ${
            post.mediaUrl
              ? post.mediaUrl.match(/\.(mp4|webm|ogg)$/i)
                ? `<video controls src="${post.mediaUrl}" width="100%"></video>`
                : `<img src="${post.mediaUrl}" alt="Post" width="100%">`
              : ""
          }
          <small>📅 ${new Date(post.createdAt).toLocaleString()}</small>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    postsDiv.innerHTML = "<p>Error al conectar con el servidor.</p>";
  }
}

// 📌 Cargar próximos eventos
async function loadUpcomingEvents() {
  const eventsDiv = document.getElementById("upcoming-events");
  if (!eventsDiv) return;

  eventsDiv.innerHTML = "<p>Cargando eventos...</p>";

  try {
    const res = await fetch("/api/events");
    const events = await res.json();

    if (!res.ok) {
      eventsDiv.innerHTML = "<p>No se pudieron cargar los eventos.</p>";
      return;
    }

    if (events.length === 0) {
      eventsDiv.innerHTML = "<p>No hay eventos próximos.</p>";
      return;
    }

    // Mostrar solo los 3 más próximos
    const upcoming = events.slice(0, 3);

    eventsDiv.innerHTML = upcoming
      .map(
        (ev) => `
        <div class="event-card">
          <h4>${ev.title}</h4>
          <p>${ev.description || "Sin descripción"}</p>
          <small>📅 ${ev.date} 🕒 ${ev.time} 📍 ${ev.place}</small>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    eventsDiv.innerHTML = "<p>Error al conectar con el servidor.</p>";
  }
}
