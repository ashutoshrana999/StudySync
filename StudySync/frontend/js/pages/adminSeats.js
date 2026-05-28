import { requireRole } from "../auth.js";
import { renderShell, setPillOk } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";

requireRole("admin");

const page = renderShell({ role: "admin", activePath: "seats", title: "Seat Map" });

page.innerHTML = `
  <div class="d-flex gap-2 flex-wrap align-items-center">
    <button id="btnReload" class="btn btn-outline-primary">Refresh</button>
    <button id="btnBulk" class="btn btn-primary">Create Seats (Bulk)</button>
    <div class="muted small">Click a seat to unassign.</div>
  </div>

  <div class="panel mt-3">
    <div class="panel-body">
      <div class="seat-grid" id="seatGrid"></div>
      <div id="empty" class="empty d-none">No seats created yet. Use bulk create.</div>
    </div>
  </div>

  <div class="modal fade" id="bulkModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content" style="border-radius:16px">
        <div class="modal-header">
          <h5 class="modal-title">Bulk Seat Creation</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <form class="modal-body vstack gap-3" id="bulkForm">
          <div class="row g-3">
            <div class="col-4">
              <label class="form-label">Prefix</label>
              <input class="form-control" name="prefix" value="S" />
            </div>
            <div class="col-4">
              <label class="form-label">From</label>
              <input class="form-control" name="from" type="number" min="1" value="1" required />
            </div>
            <div class="col-4">
              <label class="form-label">To</label>
              <input class="form-control" name="to" type="number" min="1" value="30" required />
            </div>
            <div class="col-6">
              <label class="form-label">Type</label>
              <select class="form-select" name="type">
                <option value="fixed" selected>Fixed</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">Allowed Shift</label>
              <select class="form-select" name="allowedShift">
                <option value="full" selected>Full Day</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
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

const bulkModal = new window.bootstrap.Modal(document.getElementById("bulkModal"));
let seats = [];

function seatCard(s) {
  const cls = [
    "seat",
    s.assignedTo ? "occupied" : "",
    s.type === "flexible" ? "flex" : ""
  ].join(" ");
  const meta = s.assignedTo ? `Occupied • ${s.assignedTo.name}` : "Available";
  return `
    <div class="${cls}" data-id="${s._id}">
      <div class="n">${s.seatNumber}</div>
      <div class="m">${s.type} • ${s.allowedShift}</div>
      <div class="m">${meta}</div>
    </div>
  `;
}

function render() {
  const grid = document.getElementById("seatGrid");
  grid.innerHTML = seats.map(seatCard).join("");
  document.getElementById("empty").classList.toggle("d-none", seats.length > 0);
}

async function load() {
  try {
    const data = await apiFetch("/seats");
    seats = data.seats || [];
    render();
    setPillOk(true);
  } catch (err) {
    setPillOk(false);
    toast({ title: "Failed to load seats", detail: err.message, kind: "bad" });
  }
}

document.getElementById("btnReload").addEventListener("click", load);
document.getElementById("btnBulk").addEventListener("click", () => bulkModal.show());

document.getElementById("bulkForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = {
    prefix: form.prefix.value.trim() || "S",
    from: Number(form.from.value),
    to: Number(form.to.value),
    type: form.type.value,
    allowedShift: form.allowedShift.value
  };
  try {
    await apiFetch("/seats/bulk", { method: "POST", body: payload });
    toast({ title: "Created", detail: "Seats generated (duplicates ignored)." });
    bulkModal.hide();
    await load();
  } catch (err) {
    toast({ title: "Create failed", detail: err.message, kind: "bad" });
  }
});

page.addEventListener("click", async (e) => {
  const seat = e.target.closest(".seat[data-id]");
  if (!seat) return;
  const seatId = seat.getAttribute("data-id");
  const s = seats.find((x) => x._id === seatId);
  if (!s) return;
  if (!s.assignedTo) return;
  if (!confirm(`Unassign ${s.seatNumber} from ${s.assignedTo.name}?`)) return;
  try {
    await apiFetch(`/seats/${seatId}/assign`, { method: "POST", body: { userId: null } });
    toast({ title: "Unassigned", detail: `${s.seatNumber} is now available.` });
    await load();
  } catch (err) {
    toast({ title: "Unassign failed", detail: err.message, kind: "bad" });
  }
});

load();

