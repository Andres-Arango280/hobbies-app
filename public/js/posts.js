document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("createPost");
  const postsList = document.getElementById("postsList");

  // Función para cargar todas las publicaciones
  async function loadPosts() {
    try {
      console.log("🔄 Cargando publicaciones...");
      const res = await fetch("/api/posts");
      
      // Verificar si la respuesta es exitosa
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("📄 Datos recibidos:", data);

      // Asegurarse de que sea un array
      const postsArray = Array.isArray(data) ? data : data.posts || [];
      console.log(`📝 ${postsArray.length} publicaciones encontradas`);

      postsList.innerHTML = "";

      if (postsArray.length === 0) {
        postsList.innerHTML = "<p>No hay publicaciones aún</p>";
        return;
      }

      postsArray.forEach(post => {
        const div = document.createElement("div");
        div.className = "post";
        div.style.cssText = "border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px;";

        // Mostrar información del autor si está disponible
        if (post.createdBy && post.createdBy.username) {
          const authorP = document.createElement("p");
          authorP.style.cssText = "font-weight: bold; color: #666; margin: 0 0 10px 0;";
          authorP.textContent = `Por: ${post.createdBy.username}`;
          div.appendChild(authorP);
        }

        // Caption
        const p = document.createElement("p");
        p.textContent = post.caption;
        p.style.cssText = "margin: 10px 0;";
        div.appendChild(p);

        // Media (imagen o video)
        if (post.media) {
          const ext = post.media.split('.').pop()?.toLowerCase();
          if (["mp4", "webm", "ogg"].includes(ext)) {
            const video = document.createElement("video");
            video.src = post.media;
            video.controls = true;
            video.style.cssText = "max-width: 100%; height: auto; margin: 10px 0;";
            div.appendChild(video);
          } else {
            const img = document.createElement("img");
            img.src = post.media;
            img.alt = post.caption;
            img.style.cssText = "max-width: 100%; height: auto; margin: 10px 0;";
            
            // Manejar error de carga de imagen
            img.onerror = () => {
              img.style.display = "none";
              const errorMsg = document.createElement("p");
              errorMsg.textContent = "❌ Error cargando imagen";
              errorMsg.style.color = "red";
              div.appendChild(errorMsg);
            };
            
            div.appendChild(img);
          }
        }

        // Fecha de creación
        if (post.createdAt) {
          const dateP = document.createElement("p");
          dateP.style.cssText = "font-size: 12px; color: #999; margin: 10px 0 0 0;";
          dateP.textContent = `📅 ${new Date(post.createdAt).toLocaleString()}`;
          div.appendChild(dateP);
        }

        postsList.appendChild(div);
      });

      console.log("✅ Publicaciones cargadas correctamente");

    } catch (err) {
      console.error("❌ Error cargando publicaciones:", err);
      postsList.innerHTML = `<p style="color: red;">❌ Error cargando publicaciones: ${err.message}</p>`;
    }
  }

  // Verificar que los elementos existen antes de usarlos
  if (!postsList) {
    console.error("❌ No se encontró el elemento #postsList");
    return;
  }

  // Llamar a la función al cargar la página
  await loadPosts();

  // Crear publicación (solo si existe el formulario)
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      try {
        console.log("📤 Enviando nueva publicación...");
        const res = await fetch("/api/posts", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        
        if (res.ok) {
          console.log("✅ Publicación creada:", result);
          alert("✅ Publicación creada");
          form.reset();
          await loadPosts(); // 🔄 Recargar publicaciones después de crear
        } else {
          console.error("❌ Error del servidor:", result);
          alert("❌ Error: " + (result.error || "No se pudo crear"));
        }
      } catch (err) {
        console.error("❌ Error de conexión:", err);
        alert("⚠️ Error de conexión con el servidor");
      }
    });
  } else {
    console.warn("⚠️ No se encontró el formulario #createPost");
  }
});