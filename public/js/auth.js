document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        username: registerForm.username.value,
        password: registerForm.password.value,
      };

      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (res.ok) {
          alert("✅ Usuario registrado correctamente");
          registerForm.reset();
          window.location.href = "/login.html"; // redirige al login
        } else {
          alert("❌ " + (result.error || "No se pudo registrar"));
        }
      } catch (err) {
        console.error(err);
        alert("⚠️ Error de conexión con el servidor");
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        username: loginForm.username.value,
        password: loginForm.password.value,
      };

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (res.ok) {
          alert("✅ Bienvenido " + result.user.username);
          localStorage.setItem("user", JSON.stringify(result.user));
          window.location.href = '/index.html'; // redirige al inicio
        } else {
          alert("❌ " + (result.error || "Credenciales inválidas"));
        }
      } catch (err) {
        console.error(err);
        alert("⚠️ Error de conexión con el servidor");
      }
    });
  }
});
