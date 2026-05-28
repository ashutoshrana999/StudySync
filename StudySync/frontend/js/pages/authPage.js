import { login, register } from "../auth.js";
import { toast } from "../toast.js";

function setLoading(form, on) {
  const btn = form.querySelector("button[type=submit]");
  const sp = btn.querySelector(".spinner-border");
  btn.disabled = on;
  sp.classList.toggle("d-none", !on);
}

function show(formId) {
  document.getElementById("loginForm").classList.toggle("d-none", formId !== "loginForm");
  document.getElementById("registerForm").classList.toggle("d-none", formId !== "registerForm");
  document.getElementById("tabLogin").classList.toggle("btn-primary", formId === "loginForm");
  document.getElementById("tabLogin").classList.toggle("btn-outline-primary", formId !== "loginForm");
  document.getElementById("tabRegister").classList.toggle("btn-primary", formId === "registerForm");
  document.getElementById("tabRegister").classList.toggle("btn-outline-primary", formId !== "registerForm");
}

document.getElementById("tabLogin").addEventListener("click", () => show("loginForm"));
document.getElementById("tabRegister").addEventListener("click", () => show("registerForm"));

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const payload = {
    email: String(fd.get("email") || "").trim(),
    password: String(fd.get("password") || ""),
    remember: Boolean(fd.get("remember"))
  };
  setLoading(form, true);
  try {
    const { user } = await login(payload);
    toast({ title: "Welcome back", detail: user.name });
    window.location.href = user.role === "admin" ? "./admin/index.html" : "./student/index.html";
  } catch (err) {
    toast({ title: "Login failed", detail: err.message, kind: "bad" });
  } finally {
    setLoading(form, false);
  }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const password = String(fd.get("password") || "");
  const password2 = String(fd.get("password2") || "");
  if (password !== password2) {
    toast({ title: "Password mismatch", detail: "Please re-check both passwords.", kind: "bad" });
    return;
  }
  const payload = {
    name: String(fd.get("name") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    password,
    remember: Boolean(fd.get("remember"))
  };
  setLoading(form, true);
  try {
    const { user } = await register(payload);
    toast({ title: "Account created", detail: "Redirecting to dashboard..." });
    window.location.href = user.role === "admin" ? "./admin/index.html" : "./student/index.html";
  } catch (err) {
    toast({ title: "Register failed", detail: err.message, kind: "bad" });
  } finally {
    setLoading(form, false);
  }
});

