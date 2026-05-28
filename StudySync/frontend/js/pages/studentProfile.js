import { requireRole } from "../auth.js";
import { renderShell } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";

requireRole("student");

const page = renderShell({ role: "student", activePath: "profile", title: "Profile" });

page.innerHTML = `
  <div class="row g-3">
    <div class="col-lg-5">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">My Details</div><div class="muted small">Account</div></div>
        <div class="panel-body" id="profileBox"></div>
      </div>
    </div>
    <div class="col-lg-7">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Notifications</div><div class="muted small">In-app</div></div>
        <div class="panel-body">
          <div id="list" class="vstack gap-2"></div>
          <div id="empty" class="empty d-none">No notifications.</div>
        </div>
      </div>
    </div>
  </div>
`;

function profileCard(u) {
  return `
    <div class="d-flex align-items-center gap-3">
      <img src="${u.profileImageUrl || "https://placehold.co/64x64?text=U"}" width="64" height="64"
           style="border-radius:18px; object-fit:cover; border:1px solid rgba(15,23,42,0.08)" />
      <div>
        <div style="font-weight:900; font-size:18px">${u.name}</div>
        <div class="muted">${u.email}</div>
        <div class="muted small mt-1">Seat: ${u.seatNumber || "—"} • Shift: ${u.shift}</div>
        <div class="muted small">Plan: ${u.planName || "Standard"} • Fee: ₹${u.monthlyFee || 0}/mo</div>
      </div>
    </div>
  `;
}

function notifCard(n) {
  return `
    <div class="p-3" style="border:1px solid rgba(15,23,42,0.08); border-radius:16px; background: rgba(255,255,255,0.65)">
      <div class="d-flex justify-content-between gap-2">
        <div style="font-weight:900">${n.title}</div>
        <div class="muted small">${String(n.createdAt).slice(0, 19).replace("T", " ")}</div>
      </div>
      <div class="muted">${n.message}</div>
      <div class="muted small mt-1">${n.channel.toUpperCase()}</div>
    </div>
  `;
}

async function load() {
  try {
    const [summary, notifs] = await Promise.all([apiFetch("/users/me/summary"), apiFetch("/notifications/me")]);
    document.getElementById("profileBox").innerHTML = profileCard(summary.user);

    const list = notifs.notifications || [];
    document.getElementById("list").innerHTML = list.map(notifCard).join("");
    document.getElementById("empty").classList.toggle("d-none", list.length > 0);
  } catch (err) {
    toast({ title: "Load failed", detail: err.message, kind: "bad" });
  }
}

load();

