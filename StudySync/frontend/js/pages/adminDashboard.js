import { requireRole } from "../auth.js";
import { renderShell, setPillOk } from "../components.js";
import { apiFetch } from "../api.js";
import { toast } from "../toast.js";
import { renderLineChart, renderBarChart } from "../charts.js";

requireRole("admin");

const page = renderShell({ role: "admin", activePath: "dashboard", title: "Admin Dashboard" });

page.innerHTML = `
  <div id="kpis" class="kpi-grid"></div>
  <div class="panel-grid">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Attendance This Month</div>
        <div class="muted small">Daily check-ins</div>
      </div>
      <div class="panel-body">
        <canvas id="attendanceChart" height="120"></canvas>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Revenue (Last 6 Months)</div>
        <div class="muted small">Paid invoices</div>
      </div>
      <div class="panel-body">
        <canvas id="revenueChart" height="120"></canvas>
      </div>
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

async function load() {
  try {
    const data = await apiFetch("/admin/dashboard");
    setPillOk(true);

    const k = data.kpis;
    document.getElementById("kpis").innerHTML = [
      kpiCard("Total Students", k.totalStudents, "All registrations"),
      kpiCard("Active Students", k.activeStudents, "Currently active"),
      kpiCard("Today Attendance", k.todayAttendance, "Check-ins today"),
      kpiCard("Monthly Revenue", `₹${Math.round(k.monthlyRevenue)}`, `Month: ${data.charts.currentMonthKey}`),
      kpiCard("Due Payments", k.duePayments, "Renewal pending"),
      kpiCard("Available Seats", k.availableSeats, "Unoccupied"),
      kpiCard("Occupied Seats", k.occupiedSeats, "Assigned"),
      kpiCard("System", "Live", "QR + Invoices enabled")
    ].join("");

    const aLabels = data.charts.attendanceThisMonth.map((r) => r._id.slice(8));
    const aData = data.charts.attendanceThisMonth.map((r) => r.count);
    renderLineChart(document.getElementById("attendanceChart"), {
      labels: aLabels.length ? aLabels : ["—"],
      data: aData.length ? aData : [0],
      label: "Attendance"
    });

    const rLabels = data.charts.revenueByMonth.map((r) => r._id);
    const rData = data.charts.revenueByMonth.map((r) => r.total);
    renderBarChart(document.getElementById("revenueChart"), {
      labels: rLabels.length ? rLabels : ["—"],
      data: rData.length ? rData : [0],
      label: "Revenue"
    });
  } catch (err) {
    setPillOk(false);
    toast({ title: "Failed to load dashboard", detail: err.message, kind: "bad" });
  }
}

load();

