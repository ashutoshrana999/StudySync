function ensureHost() {
  let host = document.getElementById("toastHost");
  if (!host) {
    host = document.createElement("div");
    host.id = "toastHost";
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  return host;
}

export function toast({ title, detail = "", kind = "ok", ms = 2800 }) {
  const host = ensureHost();
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<div class="t"></div><div class="d"></div>`;
  el.querySelector(".t").textContent = title;
  el.querySelector(".d").textContent = detail;
  host.appendChild(el);
  window.setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "all 160ms ease";
    window.setTimeout(() => el.remove(), 180);
  }, ms);
}

