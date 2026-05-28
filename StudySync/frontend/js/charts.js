export function renderLineChart(canvas, { labels, data, label = "Value" }) {
  const ctx = canvas.getContext("2d");
  return new window.Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          tension: 0.35,
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79,70,229,0.15)",
          fill: true,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "rgba(15,23,42,0.06)" } }
      }
    }
  });
}

export function renderBarChart(canvas, { labels, data, label = "Value" }) {
  const ctx = canvas.getContext("2d");
  return new window.Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderRadius: 10,
          backgroundColor: "rgba(139,92,246,0.22)",
          borderColor: "rgba(139,92,246,0.55)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: "rgba(15,23,42,0.06)" } }
      }
    }
  });
}

