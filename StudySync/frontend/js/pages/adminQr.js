import { requireRole } from "../auth.js";
import { renderShell } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";

requireRole("admin");

const page = renderShell({ role: "admin", activePath: "qr", title: "QR Setup" });

page.innerHTML = `
  <div class="panel">
    <div class="panel-body">
      <div class="row g-3">
        <div class="col-md-6">
          <div class="panel" style="box-shadow:none">
            <div class="panel-header">
              <div class="panel-title">Static QR</div>
              <div class="muted small">Print & paste in library</div>
            </div>
            <div class="panel-body">
              <img id="staticImg" alt="Static QR" style="width: 280px; max-width: 100%; border-radius: 16px; border:1px solid rgba(15,23,42,0.08)" />
              <div class="muted small mt-2">Students scan this to mark attendance (check-in/check-out toggle).</div>
              <button id="btnStatic" class="btn btn-outline-primary mt-2">Refresh</button>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="panel" style="box-shadow:none">
            <div class="panel-header">
              <div class="panel-title">Dynamic QR</div>
              <div class="muted small">Changes every 30 seconds</div>
            </div>
            <div class="panel-body">
              <img id="dynImg" alt="Dynamic QR" style="width: 280px; max-width: 100%; border-radius: 16px; border:1px solid rgba(15,23,42,0.08)" />
              <div class="muted small mt-2">Harder to fake; backend validates time window.</div>
              <div class="d-flex gap-2 mt-2">
                <button id="btnDyn" class="btn btn-outline-primary">Refresh</button>
                <span class="muted small" id="dynHint"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

let intervalId = null;

async function loadStatic() {
  const data = await apiFetch("/admin/qr/static");
  document.getElementById("staticImg").src = data.dataUrl;
}

async function loadDynamic() {
  const data = await apiFetch("/admin/qr/dynamic");
  document.getElementById("dynImg").src = data.dataUrl;
  document.getElementById("dynHint").textContent = `Auto-refresh: ${data.refreshSeconds}s`;
}

document.getElementById("btnStatic").addEventListener("click", async () => {
  try {
    await loadStatic();
    toast({ title: "Static QR updated" });
  } catch (err) {
    toast({ title: "Failed", detail: err.message, kind: "bad" });
  }
});

document.getElementById("btnDyn").addEventListener("click", async () => {
  try {
    await loadDynamic();
    toast({ title: "Dynamic QR updated" });
  } catch (err) {
    toast({ title: "Failed", detail: err.message, kind: "bad" });
  }
});

async function init() {
  try {
    await Promise.all([loadStatic(), loadDynamic()]);
  } catch (err) {
    toast({ title: "Failed to load QR", detail: err.message, kind: "bad" });
  }
  if (intervalId) window.clearInterval(intervalId);
  intervalId = window.setInterval(loadDynamic, 30_000);
}

init();

