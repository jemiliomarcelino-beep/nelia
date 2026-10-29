// Interações gerais e formulários demonstrativos do FluxEdu.
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const opened = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(opened));
    menuToggle.textContent = opened ? "×" : "☰";
  });
  siteNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }));
}

const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(signupForm).entries());
    const message = document.getElementById("signup-message");
    try {
      localStorage.setItem("fluxedu-demo-profile", JSON.stringify({
        school: data.school.trim(),
        location: data.location.trim(),
        email: data.email.trim(),
        createdAt: new Date().toISOString()
      }));
      message.textContent = "Perfil de demonstração guardado neste navegador.";
      signupForm.querySelector("button").textContent = "Perfil criado ✓";
    } catch {
      message.textContent = "Não foi possível guardar neste navegador. Pode abrir o painel de demonstração.";
    }
  });
}
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const message = document.getElementById("login-message");
    message.textContent = "Este é um formulário demonstrativo. Para experimentar as funções, abra o painel.";
    const link = document.createElement("a");
    link.href = "dashboard.html";
    link.className = "text-link";
    link.textContent = "Abrir painel de demonstração →";
    const oldLink = loginForm.parentElement.querySelector(".login-dashboard-link");
    if (oldLink) oldLink.remove();
    link.classList.add("login-dashboard-link");
    loginForm.appendChild(link);
  });
}
