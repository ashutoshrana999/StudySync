import { requireRole } from "../auth.js";
import { renderShell } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";
import { CONFIG } from "../config.js";
import { loadAuth } from "../storage.js";

requireRole("student");

const page = renderShell({ role: "student", activePath: "payments", title: "Payments" });

page.innerHTML = `
  <div class="kpi-grid" id="kpis"></div>
  <div class="panel mt-3">
    <div class="panel-header"><div class="panel-title">Payment History</div><div class="muted small">Invoices</div></div>
    <div class="panel-body">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Month</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <div id="empty" class="empty d-none">No payments recorded yet.</div>
    </div>
  </div>
`;

function kpi(label, value, hint = "") {
  return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="hint">${hint}</div></div>`;
}

function badge(status) {
  return status === "paid" ? `<span class="badge-soft badge-good">PAID</span>` : `<span class="badge-soft badge-warn">UNPAID</span>`;
}

function row(p) {
  // protect() also accepts token via query to allow simple browser opens.
  const token = loadAuth()?.token || "";
  const invUrl = `${CONFIG.API_BASE}/payments/${p._id}/invoice?token=${encodeURIComponent(token)}`;
  return `
    <tr>
      <td style="font-weight:900">${p.monthKey}</td>
      <td>₹${Number(p.amount).toFixed(0)}</td>
      <td>${badge(p.status)}</td>
      <td>${String(p.dueDate).slice(0, 10)}</td>
      <td><a class="btn btn-sm btn-outline-primary" target="_blank" rel="noreferrer" href="${invUrl}">Open PDF</a></td>
    </tr>
  `;
}

async function load() {
  try {
    const [due, list, summary] = await Promise.all([
      apiFetch("/payments/me/due"),
      apiFetch("/payments/me"),
      apiFetch("/users/me/summary")
    ]);

    document.getElementById("kpis").innerHTML = [
      kpi("Month", due.monthKey, "Current billing period"),
      kpi("Due", `₹${due.due}`, due.reason),
      kpi("Plan", summary.user.planName || "Standard", `₹${summary.user.monthlyFee || 0}/mo`),
      kpi("Seat", summary.user.seatNumber || "—", summary.user.shift)
    ].join("");

    const payments = list.payments || [];
    document.getElementById("rows").innerHTML = payments.map(row).join("");
    document.getElementById("empty").classList.toggle("d-none", payments.length > 0);
  } catch (err) {
    toast({ title: "Load failed", detail: err.message, kind: "bad" });
  }
}

load();
