import { requireRole } from "../auth.js";
import { renderShell, setPillOk } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";

requireRole("admin");

const page = renderShell({ role: "admin", activePath: "students", title: "Students" });

page.innerHTML = `
  <div class="d-flex gap-2 flex-wrap align-items-center">
    <input id="q" class="form-control" style="max-width:320px" placeholder="Search name/email/phone..." />
    <button id="btnReload" class="btn btn-outline-primary">Refresh</button>
    <button id="btnAdd" class="btn btn-primary">Add Student</button>
  </div>

  <div class="panel mt-3">
    <div class="panel-body">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Student</th>
              <th>Seat</th>
              <th>Shift</th>
              <th>Plan</th>
              <th>Fee</th>
              <th>Status</th>
              <th style="width:220px">Actions</th>
            </tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
      <div id="empty" class="empty d-none">No students found.</div>
    </div>
  </div>

  <div class="modal fade" id="studentModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content" style="border-radius:16px">
        <div class="modal-header">
          <h5 class="modal-title" id="modalTitle">Student</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <form class="modal-body vstack gap-3" id="studentForm">
          <input type="hidden" name="id" />
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Name</label>
              <input class="form-control" name="name" minlength="2" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Email</label>
              <input class="form-control" name="email" type="email" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Phone</label>
              <input class="form-control" name="phone" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Shift</label>
              <select class="form-select" name="shift">
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="full" selected>Full Day</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Plan</label>
              <input class="form-control" name="planName" placeholder="Standard" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Monthly Fee (INR)</label>
              <input class="form-control" name="monthlyFee" type="number" min="0" value="0" />
            </div>
            <div class="col-md-3">
              <label class="form-label">Next Renewal</label>
              <input class="form-control" name="nextRenewalDate" type="date" />
            </div>
            <div class="col-12" id="passwordRow">
              <label class="form-label">Initial Password</label>
              <input class="form-control" name="password" minlength="6" value="Welcome@123" />
              <div class="muted small mt-1">Used only when creating a new student.</div>
            </div>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div class="modal fade" id="seatModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:16px">
        <div class="modal-header">
          <h5 class="modal-title">Assign Seat</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <form class="modal-body vstack gap-3" id="seatForm">
          <input type="hidden" name="studentId" />
          <div>
            <label class="form-label">Seat</label>
            <select class="form-select" name="seatId" required></select>
          </div>
          <div>
            <label class="form-label">Shift</label>
            <select class="form-select" name="shift">
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="full" selected>Full Day</option>
            </select>
          </div>
          <div class="d-flex gap-2 justify-content-end">
            <button type="button" class="btn btn-outline-primary" data-bs-dismiss="modal">Cancel</button>
            <button class="btn btn-primary" type="submit">Assign</button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const studentModal = new window.bootstrap.Modal(document.getElementById("studentModal"));
const seatModal = new window.bootstrap.Modal(document.getElementById("seatModal"));
let students = [];
let seats = [];

function badge(active) {
  return active ? `<span class="badge-soft badge-good">Active</span>` : `<span class="badge-soft badge-bad">Inactive</span>`;
}

function row(s) {
  return `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          <img src="${s.profileImageUrl || "https://placehold.co/40x40?text=U"}" width="40" height="40" style="border-radius:14px;object-fit:cover;border:1px solid rgba(15,23,42,0.08)" />
          <div>
            <div style="font-weight:900">${s.name}</div>
            <div class="muted small">${s.email}${s.phone ? " • " + s.phone : ""}</div>
          </div>
        </div>
      </td>
      <td>${s.seatNumber || "—"}</td>
      <td>${s.shift}</td>
      <td>${s.planName || "Standard"}</td>
      <td>₹${Number(s.monthlyFee || 0).toFixed(0)}</td>
      <td>${badge(s.active)}</td>
      <td class="d-flex gap-2 flex-wrap">
        <button class="btn btn-sm btn-outline-primary" data-act="edit" data-id="${s._id}">Edit</button>
        <button class="btn btn-sm btn-outline-primary" data-act="seat" data-id="${s._id}">Seat</button>
        <label class="btn btn-sm btn-outline-primary mb-0">
          <input type="file" data-act="upload" data-id="${s._id}" accept="image/*" hidden />
          Photo
        </label>
        <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${s._id}">Delete</button>
      </td>
    </tr>
  `;
}

function openCreate() {
  const form = document.getElementById("studentForm");
  form.reset();
  document.getElementById("modalTitle").textContent = "Add Student";
  form.id.value = "";
  form.email.disabled = false;
  document.getElementById("passwordRow").classList.remove("d-none");
  studentModal.show();
}

function openEdit(id) {
  const s = students.find((x) => x._id === id);
  if (!s) return;
  const form = document.getElementById("studentForm");
  document.getElementById("modalTitle").textContent = "Edit Student";
  form.id.value = s._id;
  form.name.value = s.name || "";
  form.email.value = s.email || "";
  form.phone.value = s.phone || "";
  form.shift.value = s.shift || "full";
  form.planName.value = s.planName || "Standard";
  form.monthlyFee.value = Number(s.monthlyFee || 0);
  form.nextRenewalDate.value = s.nextRenewalDate ? String(s.nextRenewalDate).slice(0, 10) : "";
  form.email.disabled = true;
  document.getElementById("passwordRow").classList.add("d-none");
  studentModal.show();
}

async function openSeat(id) {
  const s = students.find((x) => x._id === id);
  if (!s) return;
  const form = document.getElementById("seatForm");
  form.studentId.value = s._id;
  const seatSelect = form.seatId;
  seatSelect.innerHTML = seats
    .map((seat) => {
      const occupied = seat.assignedTo && seat.assignedTo._id !== s._id;
      const label = `${seat.seatNumber} • ${seat.type} • ${occupied ? "Occupied" : "Available"}`;
      return `<option value="${seat._id}" ${occupied ? "disabled" : ""} ${seat.seatNumber === s.seatNumber ? "selected" : ""}>${label}</option>`;
    })
    .join("");
  form.shift.value = s.shift || "full";
  seatModal.show();
}

function render() {
  const rowsEl = document.getElementById("rows");
  rowsEl.innerHTML = students.map(row).join("");
  document.getElementById("empty").classList.toggle("d-none", students.length > 0);
}

async function loadSeats() {
  const data = await apiFetch("/seats");
  seats = data.seats || [];
}

async function loadStudents() {
  const q = String(document.getElementById("q").value || "").trim();
  const data = await apiFetch(`/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  students = data.students || [];
  render();
}

page.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.getAttribute("data-act");
  const id = btn.getAttribute("data-id");
  try {
    if (act === "edit") openEdit(id);
    if (act === "seat") await openSeat(id);
    if (act === "del") {
      if (!confirm("Delete this student?")) return;
      await apiFetch(`/admin/students/${id}`, { method: "DELETE" });
      toast({ title: "Deleted", detail: "Student removed." });
      await loadStudents();
    }
  } catch (err) {
    toast({ title: "Action failed", detail: err.message, kind: "bad" });
  }
});

page.addEventListener("change", async (e) => {
  const input = e.target.closest("input[data-act=upload]");
  if (!input) return;
  const id = input.getAttribute("data-id");
  const file = input.files?.[0];
  if (!file) return;
  try {
    const fd = new FormData();
    fd.append("image", file);
    await apiFetch(`/admin/students/${id}/profile-image`, { method: "POST", body: fd });
    toast({ title: "Updated", detail: "Profile image uploaded." });
    await loadStudents();
  } catch (err) {
    toast({ title: "Upload failed", detail: err.message, kind: "bad" });
  } finally {
    input.value = "";
  }
});

document.getElementById("btnAdd").addEventListener("click", openCreate);
document.getElementById("btnReload").addEventListener("click", loadStudents);
document.getElementById("q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") loadStudents();
});

document.getElementById("studentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const id = form.id.value;
  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    shift: form.shift.value,
    planName: form.planName.value.trim() || "Standard",
    monthlyFee: Number(form.monthlyFee.value || 0),
    nextRenewalDate: form.nextRenewalDate.value || ""
  };
  try {
    if (!id) {
      payload.password = form.password.value;
      await apiFetch("/admin/students", { method: "POST", body: payload });
      toast({ title: "Created", detail: "Student added." });
    } else {
      await apiFetch(`/admin/students/${id}`, { method: "PATCH", body: payload });
      toast({ title: "Saved", detail: "Student updated." });
    }
    studentModal.hide();
    await loadStudents();
  } catch (err) {
    toast({ title: "Save failed", detail: err.message, kind: "bad" });
  }
});

document.getElementById("seatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  try {
    await apiFetch(`/admin/students/${form.studentId.value}/assign-seat`, {
      method: "POST",
      body: { seatId: form.seatId.value, shift: form.shift.value }
    });
    toast({ title: "Seat assigned", detail: "Updated seat allocation." });
    seatModal.hide();
    await loadSeats();
    await loadStudents();
  } catch (err) {
    toast({ title: "Assignment failed", detail: err.message, kind: "bad" });
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
    await loadSeats();
    await loadStudents();
  } catch (err) {
    toast({ title: "Load failed", detail: err.message, kind: "bad" });
  }
}

init();

