// Already logged in? Go straight to the right page.
(() => {
  const u = Session.user();
  if (Session.token() && u) window.location.href = homeFor(u.role);
})();

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const registerRole = document.getElementById("rRole");
const adminCodeField = document.getElementById("adminCodeField");
const adminCodeInput = document.getElementById("rAdminCode");

function updateAdminCodeField() {
  const isAdmin = registerRole.value === "ADMIN";
  adminCodeField.classList.toggle("hidden", !isAdmin);
  adminCodeInput.required = isAdmin;
  if (!isAdmin) adminCodeInput.value = "";
}

function showTab(which) {
  const login = which === "login";
  loginForm.classList.toggle("hidden", !login);
  registerForm.classList.toggle("hidden", login);
  tabLogin.setAttribute("aria-selected", login);
  tabRegister.setAttribute("aria-selected", !login);
}
tabLogin.addEventListener("click", () => showTab("login"));
tabRegister.addEventListener("click", () => showTab("register"));
registerRole.addEventListener("change", updateAdminCodeField);
updateAdminCodeField();

async function submitAuth(form, errorEl, path, body) {
  const btn = form.querySelector("button[type=submit]");
  errorEl.textContent = "";
  btn.disabled = true;
  try {
    const auth = await Api.post(path, body);
    Session.save(auth);
    window.location.href = homeFor(auth.role);
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitAuth(loginForm, document.getElementById("loginError"), "/auth/login", {
    email: document.getElementById("lEmail").value,
    password: document.getElementById("lPass").value
  });
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitAuth(registerForm, document.getElementById("registerError"), "/auth/register", {
    name: document.getElementById("rName").value,
    email: document.getElementById("rEmail").value,
    department: document.getElementById("rDept").value,
    password: document.getElementById("rPass").value,
    role: registerRole.value,
    adminCode: adminCodeInput.value
  });
});
