import { requireRole } from "../auth.js";
import { renderShell, setPillOk } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";
import { CONFIG } from "../config.js";
import { loadAuth } from "../storage.js";

requireRole("admin");

const page = renderShell({ role: "admin", activePath: "payments", title: "Payments" });

page.innerHTML = `
  <div class="d-flex gap-2 flex-wrap align-items-center">
    <button id="btnReload" class="btn btn-outline-primary">Refresh</button>
    <button id="btnCreate" class="btn btn-primary">Add Payment</button>
  </div>

  <div class="panel mt-3">
    <div class="panel-body">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Student</th>
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
      <div id="empty" class="empty d-none">No payments yet.</div>
    </div>
  </div>

  <div class="modal fade" id="payModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:16px">
        <div class="modal-header">
          <h5 class="modal-title">Add Payment</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <form class="modal-body vstack gap-3" id="payForm">
          <div>
            <label class="form-label">Student</label>
            <select class="form-select" name="userId" required></select>
          </div>
          <div class="row g-3">
            <div class="col-6">
              <label class="form-label">Month (YYYY-MM)</label>
              <input class="form-control" name="monthKey" placeholder="2026-05" />
            </div>
            <div class="col-6">
              <label class="form-label">Amount (INR)</label>
              <input class="form-control" name="amount" type="number" min="1" required />
            </div>
            <div class="col-6">
              <label class="form-label">Due Date</label>
              <input class="form-control" name="dueDate" type="date" required />
            </div>
            <div class="col-6">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                <option value="paid" selected>Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const payModal = new window.bootstrap.Modal(document.getElementById("payModal"));
let payments = [];
let students = [];

function statusBadge(p) {
  if (p.status === "paid") return `<span class="badge-soft badge-good">PAID</span>`;
  return `<span class="badge-soft badge-warn">UNPAID</span>`;
}

function row(p) {
  const token = loadAuth()?.token || "";
  const invUrl = `${CONFIG.API_BASE}/payments/${p._id}/invoice?token=${encodeURIComponent(token)}`;
  return `
    <tr>
      <td style="font-weight:900">${p.invoiceNumber}</td>
      <td>${p.user?.name || "—"}<div class="muted small">${p.user?.email || ""}</div></td>
      <td>${p.monthKey}</td>
      <td>₹${Number(p.amount).toFixed(0)}</td>
      <td>${statusBadge(p)}</td>
      <td>${String(p.dueDate).slice(0, 10)}</td>
      <td>
        <a class="btn btn-sm btn-outline-primary" target="_blank" rel="noreferrer" href="${invUrl}">
          Open PDF
        </a>
        <div class="muted small mt-1">Opens with token query for convenience (ok for demos).</div>
      </td>
    </tr>
  `;
}

function render() {
  document.getElementById("rows").innerHTML = payments.map(row).join("");
  document.getElementById("empty").classList.toggle("d-none", payments.length > 0);
}

async function loadStudents() {
  const data = await apiFetch("/admin/students");
  students = data.students || [];
  const sel = document.querySelector("#payForm select[name=userId]");
  sel.innerHTML = students.map((s) => `<option value="${s._id}">${s.name} • ${s.email}</option>`).join("");
}

async function loadPayments() {
  const data = await apiFetch("/payments");
  payments = data.payments || [];
  render();
}

document.getElementById("btnReload").addEventListener("click", loadPayments);
document.getElementById("btnCreate").addEventListener("click", () => payModal.show());

document.getElementById("payForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const payload = {
    userId: f.userId.value,
    monthKey: f.monthKey.value.trim() || undefined,
    amount: Number(f.amount.value),
    dueDate: f.dueDate.value,
    status: f.status.value
  };
  try {
    await apiFetch("/payments", { method: "POST", body: payload });
    toast({ title: "Payment created", detail: "Invoice generated." });
    payModal.hide();
    await loadPayments();
  } catch (err) {
    toast({ title: "Create failed", detail: err.message, kind: "bad" });
  }
});

async function init() {
  try {
    await apiFetch("/health", { auth: false });
    setPillOk(true);
  } catch {
    setPillOk(false);
  }
  try {
    await Promise.all([loadStudents(), loadPayments()]);
  } catch (err) {
    toast({ title: "Load failed", detail: err.message, kind: "bad" });
  }
}

init();
