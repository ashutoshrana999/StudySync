import { requireRole } from "../auth.js";
import { renderShell, setPillOk } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";
import { renderLineChart } from "../charts.js";

requireRole("student");

const page = renderShell({ role: "student", activePath: "dashboard", title: "Student Dashboard" });

page.innerHTML = `
  <div id="kpis" class="kpi-grid"></div>
  <div class="panel-grid">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Last 7 Days Study</div>
        <div class="muted small">Minutes per day</div>
      </div>
      <div class="panel-body">
        <canvas id="weekChart" height="120"></canvas>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Productivity</div>
        <div class="muted small">Task completion</div>
      </div>
      <div class="panel-body" id="goalsBox"></div>
    </div>
  </div>
`;

function kpiCard(label, value, hint = "") {
  return `
    <div class="kpi">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="hint">${hint}</div>
    </div>
  `;
}

function goalRow(name, stat) {
  const pct = stat.total ? Math.round((stat.done / stat.total) * 100) : 0;
  return `
    <div class="d-flex justify-content-between align-items-center py-2" style="border-bottom:1px solid rgba(15,23,42,0.06)">
      <div>
        <div style="font-weight:900; text-transform:capitalize">${name}</div>
        <div class="muted small">${stat.done}/${stat.total} completed</div>
      </div>
      <div class="badge-soft ${pct >= 70 ? "badge-good" : pct >= 35 ? "badge-warn" : "badge-bad"}">${pct}%</div>
    </div>
  `;
}

async function load() {
  try {
    const data = await apiFetch("/users/me/summary");
    setPillOk(true);

    const m = data.metrics;
    document.getElementById("kpis").innerHTML = [
      kpiCard("Attendance (MTD)", `${m.attendancePct}%`, `${m.presentDays} days present`),
      kpiCard("Today Study", `${m.todayHours}h`, `${m.todayMinutes} mins`),
      kpiCard("Monthly Study", `${m.totalHours}h`, `${m.totalMinutes} mins`),
      kpiCard("Study Streak", `${m.streak} days`, "Keep it going"),
      kpiCard("Seat", data.user.seatNumber || "—", data.user.shift),
      kpiCard("Plan", data.user.planName || "Standard", `₹${data.user.monthlyFee || 0}/mo`),
      kpiCard("Due Fee", `₹${m.due}`, m.due ? "Renewal pending" : "All clear"),
      kpiCard("Month", m.monthKey, "Analytics")
    ].join("");

    const labels = data.charts.last7.map((x) => x.dateKey.slice(5));
    const values = data.charts.last7.map((x) => x.minutes);
    renderLineChart(document.getElementById("weekChart"), {
      labels,
      data: values,
      label: "Minutes"
    });

    const box = document.getElementById("goalsBox");
    box.innerHTML =
      goalRow("daily", data.goals.daily) +
      goalRow("weekly", data.goals.weekly) +
      goalRow("monthly", data.goals.monthly);
  } catch (err) {
    setPillOk(false);
    toast({ title: "Failed to load dashboard", detail: err.message, kind: "bad" });
  }
}

load();

