import { requireRole } from "../auth.js";
import { renderShell } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";

requireRole("admin");

const page = renderShell({ role: "admin", activePath: "notifications", title: "Notifications" });

page.innerHTML = `
  <div class="panel">
    <div class="panel-body">
      <form id="form" class="row g-3 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Audience</label>
          <select class="form-select" name="audience">
            <option value="all" selected>All</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Channel</label>
          <select class="form-select" name="channel">
            <option value="inapp" selected>In-App</option>
            <option value="email">Email (optional)</option>
            <option value="whatsapp">WhatsApp (placeholder)</option>
            <option value="sms">SMS (placeholder)</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Title</label>
          <input class="form-control" name="title" minlength="2" required />
        </div>
        <div class="col-md-3">
          <label class="form-label">Message</label>
          <input class="form-control" name="message" minlength="2" required />
        </div>
        <div class="col-12 d-flex justify-content-end">
          <button class="btn btn-primary" type="submit">Send</button>
        </div>
      </form>
    </div>
  </div>

  <div class="panel mt-3">
    <div class="panel-header">
      <div class="panel-title">Recent</div>
      <div class="muted small">Your in-app stream</div>
    </div>
    <div class="panel-body">
      <div id="list" class="vstack gap-2"></div>
      <div id="empty" class="empty d-none">No notifications yet.</div>
    </div>
  </div>
`;

function card(n) {
  return `
    <div class="p-3" style="border:1px solid rgba(15,23,42,0.08); border-radius:16px; background: rgba(255,255,255,0.65)">
      <div class="d-flex justify-content-between gap-2">
        <div style="font-weight:900">${n.title}</div>
        <div class="muted small">${String(n.createdAt).slice(0, 19).replace("T", " ")}</div>
      </div>
      <div class="muted">${n.message}</div>
      <div class="muted small mt-1">${n.channel.toUpperCase()} • ${n.audience.toUpperCase()}</div>
    </div>
  `;
}

async function loadMine() {
  const data = await apiFetch("/notifications/me");
  const list = data.notifications || [];
  document.getElementById("list").innerHTML = list.map(card).join("");
  document.getElementById("empty").classList.toggle("d-none", list.length > 0);
}

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const payload = {
    audience: f.audience.value,
    channel: f.channel.value,
    title: f.title.value.trim(),
    message: f.message.value.trim()
  };
  try {
    await apiFetch("/notifications", { method: "POST", body: payload });
    toast({ title: "Sent", detail: "Notification created." });
    f.reset();
    await loadMine();
  } catch (err) {
    toast({ title: "Send failed", detail: err.message, kind: "bad" });
  }
});

loadMine().catch((err) => toast({ title: "Load failed", detail: err.message, kind: "bad" }));

