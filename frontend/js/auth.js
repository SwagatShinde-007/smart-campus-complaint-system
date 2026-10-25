// Already logged in? Go straight to the right page.
(() => {
  const user = Session.user();
  if (Session.token() && user) window.location.href = homeFor(user.role);
})();

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const resetPasswordForm = document.getElementById("resetPasswordForm");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const registerRole = document.getElementById("rRole");
const adminCodeField = document.getElementById("adminCodeField");
const adminCodeInput = document.getElementById("rAdminCode");
let resetToken = new URLSearchParams(window.location.hash.slice(1)).get("reset");

function updateAdminCodeField() {
  const isAdmin = registerRole.value === "ADMIN";
  adminCodeField.classList.toggle("hidden", !isAdmin);
  adminCodeInput.required = isAdmin;
  if (!isAdmin) adminCodeInput.value = "";
}

function showMode(mode) {
  const forms = {
    login: loginForm,
    register: registerForm,
    forgot: forgotPasswordForm,
    reset: resetPasswordForm
  };
  Object.entries(forms).forEach(([name, form]) => form.classList.toggle("hidden", name !== mode));
  const showTabs = mode === "login" || mode === "register";
  tabLogin.closest(".tabs").classList.toggle("hidden", !showTabs);
  tabLogin.setAttribute("aria-selected", mode === "login");
  tabRegister.setAttribute("aria-selected", mode === "register");
}

function showTab(which) {
  showMode(which);
}

tabLogin.addEventListener("click", () => showTab("login"));
tabRegister.addEventListener("click", () => showTab("register"));
registerRole.addEventListener("change", updateAdminCodeField);
document.getElementById("forgotPasswordLink").addEventListener("click", () => showMode("forgot"));
document.getElementById("backToLogin").addEventListener("click", () => showMode("login"));
updateAdminCodeField();

if (resetToken) {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  showMode("reset");
} else {
  showMode("login");
}

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
    email: document.getElementById("lEmail").value.trim(),
    password: document.getElementById("lPass").value
  });
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  submitAuth(registerForm, document.getElementById("registerError"), "/auth/register", {
    name: document.getElementById("rName").value.trim(),
    email: document.getElementById("rEmail").value.trim(),
    department: document.getElementById("rDept").value.trim(),
    password: document.getElementById("rPass").value,
    role: registerRole.value,
    adminCode: adminCodeInput.value.trim()
  });
});

forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("forgotError");
  const messageEl = document.getElementById("forgotMessage");
  const btn = forgotPasswordForm.querySelector("button[type=submit]");
  errorEl.textContent = "";
  messageEl.textContent = "";
  btn.disabled = true;
  try {
    const result = await Api.post("/auth/forgot-password", {
      email: document.getElementById("forgotEmail").value.trim()
    });
    messageEl.textContent = result.message;
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById("resetError");
  const messageEl = document.getElementById("resetMessage");
  const btn = resetPasswordForm.querySelector("button[type=submit]");
  errorEl.textContent = "";
  messageEl.textContent = "";
  if (!resetToken) {
    errorEl.textContent = "This reset link is invalid. Request a new one.";
    return;
  }
  btn.disabled = true;
  try {
    const result = await Api.post("/auth/reset-password", {
      token: resetToken,
      password: document.getElementById("newPassword").value
    });
    resetToken = null;
    messageEl.textContent = result.message;
    resetPasswordForm.reset();
    window.setTimeout(() => showMode("login"), 1800);
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
