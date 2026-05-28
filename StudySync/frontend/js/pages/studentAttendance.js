import { requireRole } from "../auth.js";
import { renderShell } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";
import { renderBarChart } from "../charts.js";

requireRole("student");

const page = renderShell({ role: "student", activePath: "attendance", title: "Attendance" });

page.innerHTML = `
  <div class="row g-3">
    <div class="col-lg-5">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Scan QR</div>
          <div class="muted small">Static or Dynamic</div>
        </div>
        <div class="panel-body">
          <div class="d-flex gap-2 mb-2">
            <select id="qrType" class="form-select">
              <option value="static" selected>Static QR</option>
              <option value="dynamic">Dynamic QR</option>
            </select>
            <button id="btnStart" class="btn btn-primary">Start</button>
            <button id="btnStop" class="btn btn-outline-primary">Stop</button>
          </div>
          <div id="reader" style="width:100%; border-radius:16px; overflow:hidden; border:1px solid rgba(15,23,42,0.08)"></div>
          <div class="muted small mt-2">Scan again to check-out after you finish.</div>
        </div>
      </div>
    </div>
    <div class="col-lg-7">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Monthly Summary</div>
          <div class="muted small">Hours per day (completed sessions)</div>
        </div>
        <div class="panel-body">
          <canvas id="monthChart" height="120"></canvas>
        </div>
      </div>

      <div class="panel mt-3">
        <div class="panel-header">
          <div class="panel-title">Recent History</div>
          <div class="muted small">Last 30 days</div>
        </div>
        <div class="panel-body">
          <div class="table-responsive">
            <table class="table align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody id="rows"></tbody>
            </table>
          </div>
          <div id="empty" class="empty d-none">No attendance data yet.</div>
        </div>
      </div>
    </div>
  </div>
`;

let scanner = null;
let chart = null;

function fmtTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function row(a) {
  const mins = a.totalMinutes || 0;
  const hrs = Math.round((mins / 60) * 10) / 10;
  return `
    <tr>
      <td style="font-weight:900">${a.dateKey}</td>
      <td>${fmtTime(a.checkInAt)}</td>
      <td>${fmtTime(a.checkOutAt)}</td>
      <td>${hrs}h</td>
    </tr>
  `;
}

async function loadHistory() {
  const data = await apiFetch("/attendance/me/history");
  const rows = (data.history || []).slice(0, 30);
  document.getElementById("rows").innerHTML = rows.map(row).join("");
  document.getElementById("empty").classList.toggle("d-none", rows.length > 0);
}

async function loadMonthly() {
  const data = await apiFetch("/attendance/me/monthly");
  const labels = data.days.map((d) => d.dateKey.slice(8));
  const values = data.days.map((d) => Math.round(((d.totalMinutes || 0) / 60) * 10) / 10);
  if (chart) chart.destroy();
  chart = renderBarChart(document.getElementById("monthChart"), {
    labels: labels.length ? labels : ["—"],
    data: values.length ? values : [0],
    label: "Hours"
  });
}

async function mark(payload) {
  const type = document.getElementById("qrType").value;
  const data = await apiFetch("/attendance/mark", { method: "POST", body: { type, payload } });
  toast({
    title: data.status === "checked_in" ? "Checked in" : data.status === "checked_out" ? "Checked out" : "Recorded",
    detail: data.attendance.dateKey
  });
  await Promise.all([loadHistory(), loadMonthly()]);
}

async function start() {
  if (scanner) return;
  // html5-qrcode global
  scanner = new window.Html5Qrcode("reader");
  await scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    async (decodedText) => {
      try {
        await mark(decodedText);
      } catch (err) {
        toast({ title: "Scan failed", detail: err.message, kind: "bad" });
      } finally {
        // Prevent spamming multiple scans.
        await stop();
      }
    }
  );
  toast({ title: "Scanner started", detail: "Point camera at QR." });
}

async function stop() {
  if (!scanner) return;
  try {
    await scanner.stop();
    await scanner.clear();
  } finally {
    scanner = null;
  }
}

document.getElementById("btnStart").addEventListener("click", () => start().catch((e) => toast({ title: "Camera error", detail: e.message, kind: "bad" })));
document.getElementById("btnStop").addEventListener("click", () => stop());

Promise.all([loadHistory(), loadMonthly()]).catch((err) => toast({ title: "Load failed", detail: err.message, kind: "bad" }));

