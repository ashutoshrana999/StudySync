import { requireRole } from "../auth.js";
import { renderShell } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";

requireRole("student");

const page = renderShell({ role: "student", activePath: "goals", title: "Productivity" });

page.innerHTML = `
  <div class="panel">
    <div class="panel-body">
      <form id="createForm" class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label">Scope</label>
          <select class="form-select" name="scope">
            <option value="daily" selected>Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="col-md-7">
          <label class="form-label">Task</label>
          <input class="form-control" name="title" minlength="2" placeholder="e.g. Revise Chapter 3" required />
        </div>
        <div class="col-md-2 d-grid">
          <button class="btn btn-primary" type="submit">Add</button>
        </div>
      </form>
    </div>
  </div>

  <div class="row g-3 mt-1">
    <div class="col-lg-4">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Daily</div><div class="muted small">Today</div></div>
        <div class="panel-body"><div id="daily"></div><div id="dailyEmpty" class="empty d-none">No tasks.</div></div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Weekly</div><div class="muted small">This week</div></div>
        <div class="panel-body"><div id="weekly"></div><div id="weeklyEmpty" class="empty d-none">No tasks.</div></div>
      </div>
    </div>
    <div class="col-lg-4">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Monthly</div><div class="muted small">This month</div></div>
        <div class="panel-body"><div id="monthly"></div><div id="monthlyEmpty" class="empty d-none">No tasks.</div></div>
      </div>
    </div>
  </div>
`;

let goals = [];

function item(g) {
  return `
    <div class="d-flex align-items-center justify-content-between gap-2 p-2 mb-2"
         style="border:1px solid rgba(15,23,42,0.08); border-radius:14px; background: rgba(255,255,255,0.65)">
      <label class="d-flex gap-2 align-items-start" style="cursor:pointer; margin:0">
        <input type="checkbox" data-act="toggle" data-id="${g._id}" ${g.completed ? "checked" : ""} class="form-check-input mt-1"/>
        <div>
          <div style="font-weight:900; text-decoration:${g.completed ? "line-through" : "none"}">${g.title}</div>
          <div class="muted small">${new Date(g.createdAt).toLocaleString()}</div>
        </div>
      </label>
      <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${g._id}">Delete</button>
    </div>
  `;
}

function renderScope(scope) {
  const list = goals.filter((g) => g.scope === scope);
  document.getElementById(scope).innerHTML = list.map(item).join("");
  document.getElementById(`${scope}Empty`).classList.toggle("d-none", list.length > 0);
}

function render() {
  renderScope("daily");
  renderScope("weekly");
  renderScope("monthly");
}

async function load() {
  const data = await apiFetch("/goals");
  goals = data.goals || [];
  render();
}

document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  try {
    await apiFetch("/goals", { method: "POST", body: { scope: f.scope.value, title: f.title.value.trim() } });
    toast({ title: "Added", detail: "Task created." });
    f.title.value = "";
    await load();
  } catch (err) {
    toast({ title: "Add failed", detail: err.message, kind: "bad" });
  }
});

page.addEventListener("click", async (e) => {
  const del = e.target.closest("button[data-act=del]");
  if (!del) return;
  const id = del.getAttribute("data-id");
  try {
    await apiFetch(`/goals/${id}`, { method: "DELETE" });
    toast({ title: "Deleted" });
    await load();
  } catch (err) {
    toast({ title: "Delete failed", detail: err.message, kind: "bad" });
  }
});

page.addEventListener("change", async (e) => {
  const t = e.target.closest("input[data-act=toggle]");
  if (!t) return;
  const id = t.getAttribute("data-id");
  try {
    await apiFetch(`/goals/${id}`, { method: "PATCH", body: { completed: t.checked } });
    await load();
  } catch (err) {
    toast({ title: "Update failed", detail: err.message, kind: "bad" });
    t.checked = !t.checked;
  }
});

load().catch((err) => toast({ title: "Load failed", detail: err.message, kind: "bad" }));

