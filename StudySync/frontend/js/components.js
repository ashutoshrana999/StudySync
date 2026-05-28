import { logout, getAuth } from "./auth.js";

function icon(name) {
  const map = {
    dashboard: "▦",
    students: "👥",
    seats: "▣",
    qr: "⌁",
    payments: "₹",
    goals: "✓",
    attendance: "⏱",
    notifications: "🔔",
    profile: "☺"
  };
  return map[name] || "•";
}

export function renderShell({ role, activePath, title }) {
  const auth = getAuth();
  const base = role === "admin" ? "./" : "./";
  const nav =
    role === "admin"
      ? [
          { href: `${base}index.html`, key: "dashboard", label: "Dashboard" },
          { href: `${base}students.html`, key: "students", label: "Students" },
          { href: `${base}seats.html`, key: "seats", label: "Seat Map" },
          { href: `${base}qr.html`, key: "qr", label: "QR Setup" },
          { href: `${base}payments.html`, key: "payments", label: "Payments" },
          { href: `${base}notifications.html`, key: "notifications", label: "Notifications" }
        ]
      : [
          { href: `${base}index.html`, key: "dashboard", label: "Dashboard" },
          { href: `${base}attendance.html`, key: "attendance", label: "Attendance" },
          { href: `${base}goals.html`, key: "goals", label: "Productivity" },
          { href: `${base}payments.html`, key: "payments", label: "Payments" },
          { href: `${base}profile.html`, key: "profile", label: "Profile" }
        ];

  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="side-title">
          <div class="brand-mark" style="width:40px;height:40px;border-radius:14px">SS</div>
          <div>
            <div class="side-name">StudySync</div>
            <div class="side-meta">${role.toUpperCase()} • ${auth?.user?.name || ""}</div>
          </div>
        </div>
        <div class="divider"></div>
        <nav class="nav nav-pills flex-column gap-1" id="sideNav"></nav>
        <div class="divider"></div>
        <button id="btnLogout" class="btn btn-sm btn-outline-primary w-100">Logout</button>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="page-title">${title}</div>
          <div class="d-flex gap-2 align-items-center">
            <span class="badge-soft badge-good" id="pillOnline">API</span>
          </div>
        </div>
        <div id="page" class="mt-3"></div>
      </main>
    </div>
  `;

  const navEl = root.querySelector("#sideNav");
  navEl.innerHTML = nav
    .map(
      (i) =>
        `<a class="nav-link ${i.key === activePath ? "active" : ""}" href="${i.href}">
          <span style="width:22px;display:inline-grid;place-items:center">${icon(i.key)}</span>
          <span>${i.label}</span>
        </a>`
    )
    .join("");

  root.querySelector("#btnLogout").addEventListener("click", () => {
    logout();
    window.location.href = "../index.html";
  });

  return root.querySelector("#page");
}

export function setPillOk(ok) {
  const pill = document.getElementById("pillOnline");
  if (!pill) return;
  pill.textContent = ok ? "API OK" : "API DOWN";
  pill.className = `badge-soft ${ok ? "badge-good" : "badge-bad"}`;
}

