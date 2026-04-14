import React, { useState, useMemo } from "react";
import "./chartssection.css";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import UnitsModal from "../UnitsModal";
import ChartModal from "../ChartsModal/Chartmodal";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

const splitFillPlugin = {
  id: "splitFill",
  beforeDatasetDraw(chart, args) {
    const dataset = chart.data.datasets[args.index];
    if (!dataset || (!dataset._splitFill && !dataset._orangeFill)) return;

    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const meta = chart.getDatasetMeta(args.index);
    const points = meta.data;
    if (!points || points.length < 2) return;

    const { bottom } = chartArea;

    const drawFill = (startIdx, endIdx, color) => {
      if (startIdx >= endIdx || endIdx >= points.length) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[startIdx].x, bottom);
      for (let i = startIdx; i <= endIdx; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[endIdx].x, bottom);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
    };

    if (dataset._orangeFill) {
      drawFill(0, points.length - 1, "rgba(255, 150, 80, 0.10)");
      return;
    }

    const splitIndex = dataset._splitIndex ?? points.length;
    drawFill(0, Math.min(splitIndex, points.length - 1), "rgba(255, 150, 80, 0.10)");
    if (splitIndex < points.length) {
      drawFill(splitIndex, points.length - 1, "rgba(52, 152, 219, 0.10)");
    }
  },
};

ChartJS.register(splitFillPlugin);

// FIX 2: Moved outside component so it's a stable module-level constant
// (prevents useMemo exhaustive-deps warning for inventoryChartData)
const STATUS_COLORS = {
  Available: "#5B9BD5",
  Unreleased: "#ED7D31",
  "Blocked Development": "#A5A5A5",
  Reserved: "#FFC000",
  Contracted: "#70AD47",
  Partner: "#000000",
  Hold: "#fff000",
};

const ChartsSection = ({
  units,
  allUnits,
  filters,
  onDateRangeChange,
  onFilterChange,
}) => {
  const [salesPeriod, setSalesPeriod] = useState("annually");
  const [deliveryPeriod, setDeliveryPeriod] = useState("annually");
  const [salesDateRange, setSalesDateRange] = useState({ start: "", end: "" });
  const [deliveryDateRange, setDeliveryDateRange] = useState({ start: "", end: "" });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalUnits, setModalUnits] = useState([]);
  const [modalTitle, setModalTitle] = useState("");

  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartModalTitle, setChartModalTitle] = useState("");
  const [chartModalData, setChartModalData] = useState(null);
  const [chartModalType, setChartModalType] = useState("pie");
  const [, setTheme] = useState(
    document.documentElement.getAttribute("data-theme"),
  );

  // FIX 1: setTheme is a stable state setter — adding it to the dep array
  // satisfies the exhaustive-deps rule without causing any extra re-renders.
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          setTheme(document.documentElement.getAttribute("data-theme"));
        }
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [setTheme]);

  const getTextColor = () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    return isDark ? "#F1F5F9" : "#1E293B";
  };

  const openChartModal = (title, data, type) => {
    setChartModalTitle(title);
    setChartModalData(data);
    setChartModalType(type);
    setChartModalOpen(true);
  };

  const getStartDateFromLabel = (label, period) => {
    if (period === "monthly") {
      const date = new Date(label + " 1");
      if (!isNaN(date.getTime()))
        return new Date(date.getFullYear(), date.getMonth(), 1);
    } else if (period === "quarterly") {
      const match = label.match(/Q(\d)\s+(\d{4})/);
      if (match) {
        const quarter = parseInt(match[1]);
        const year = parseInt(match[2]);
        return new Date(year, (quarter - 1) * 3, 1);
      }
    } else {
      const year = parseInt(label);
      if (!isNaN(year)) return new Date(year, 0, 1);
    }
    return null;
  };

  const getEndDateFromLabel = (label, period) => {
    if (period === "monthly") {
      const date = new Date(label + " 1");
      if (!isNaN(date.getTime()))
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    } else if (period === "quarterly") {
      const match = label.match(/Q(\d)\s+(\d{4})/);
      if (match) {
        const quarter = parseInt(match[1]);
        const year = parseInt(match[2]);
        return new Date(year, quarter * 3, 0);
      }
    } else {
      const year = parseInt(label);
      if (!isNaN(year)) return new Date(year, 11, 31);
    }
    return null;
  };

  const modalPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, padding: 15 } },
      datalabels: {
        color: "#fff",
        font: { weight: "bold", size: 11 },
        formatter: (val, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const pct = total ? ((val / total) * 100).toFixed(1) : "0.0";
          return Number(pct) > 5 ? `${pct}%` : "";
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total ? ((value / total) * 100).toFixed(2) : "0.00";
            const label = context.label;
            const salesMap = context.dataset.salesByLabel || {};
            const totalSalesValue = salesMap[label] || 0;
            return [
              `Number of Units: ${value}`,
              `Total Sales Value: EGP ${Number(totalSalesValue).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
              `% of Total Inventory: ${percentage}%`,
            ];
          },
          footer: (context) => `${context[0].label}: ${context[0].parsed} units`,
        },
      },
    },
  };

  const handleChartClick = (filterType, value) => {
    if (!onFilterChange) return;
    const currentValues = filters[filterType] || [];
    if (currentValues.includes(value)) {
      onFilterChange(filterType, currentValues.filter((v) => v !== value));
    } else {
      onFilterChange(filterType, [...currentValues, value]);
    }
  };

  const handleDeliveryComplianceClick = (event, elements, chart) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const label = chart.data.labels[index];
      const categorizedUnits = [];

      units.forEach((unit) => {
        if (!unit.contract_delivery_date || !unit.development_delivery_date) return;
        try {
          const contractDate = new Date(unit.contract_delivery_date);
          const developmentDate = new Date(unit.development_delivery_date);
          if (isNaN(contractDate.getTime()) || isNaN(developmentDate.getTime())) return;
          const adjustedContractDate = new Date(contractDate);
          adjustedContractDate.setMonth(
            adjustedContractDate.getMonth() + (parseInt(unit.grace_period_months) || 0),
          );
          const isOnTime = adjustedContractDate >= developmentDate;
          if (
            (label.includes("On Time") && isOnTime) ||
            (label.includes("Delayed") && !isOnTime)
          ) {
            categorizedUnits.push(unit);
          }
        } catch (error) {
          console.warn("Error categorizing unit:", unit);
        }
      });

      const countMatch = label.match(/\((\d+)\)/);
      const count = countMatch ? countMatch[1] : categorizedUnits.length;
      setModalUnits(categorizedUnits);
      setModalTitle(label.replace(/\s*\(\d+\)/, "") + ` (${count})`);
      setModalOpen(true);
    }
  };

  const groupByStatus = (unitsData) => {
    const grouped = {};
    unitsData.forEach((unit) => {
      const status = unit.status || "Unknown";
      if (status !== "Unknown") grouped[status] = (grouped[status] || 0) + 1;
    });
    return grouped;
  };

  const groupByUnitType = (unitsData) => {
    const grouped = {};
    unitsData.forEach((unit) => {
      const type = unit.unit_type || "Unknown";
      if (type !== "Unknown") grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  };

  const groupByPaymentPlan = (unitsData) => {
    const grouped = {};
    unitsData.forEach((unit) => {
      const plan = unit.adj_contract_payment_plan || "Unknown";
      if (plan !== "Unknown") grouped[plan] = (grouped[plan] || 0) + 1;
    });
    return grouped;
  };

  const inventoryChartData = useMemo(() => {
    const statusCounts = groupByStatus(units);
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    // FIX 2: Using STATUS_COLORS (module-level constant) instead of statusColors
    const backgroundColors = labels.map((label) => STATUS_COLORS[label] || "#CCCCCC");
    const salesByLabel = {};
    allUnits.forEach((unit) => {
      const status = unit.status || "Unknown";
      if (status !== "Unknown") {
        salesByLabel[status] = (salesByLabel[status] || 0) + (parseFloat(unit.sales_value) || 0);
      }
    });
    return {
      labels,
      datasets: [{ data, backgroundColor: backgroundColors, borderWidth: 2, borderColor: "#fff", salesByLabel }],
    };
  }, [units, allUnits]);

  const unitModelChartData = useMemo(() => {
    const typeCounts = groupByUnitType(units);
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];
    const salesByLabel = {};
    allUnits.forEach((unit) => {
      const type = unit.unit_type || "Unknown";
      if (type !== "Unknown") {
        salesByLabel[type] = (salesByLabel[type] || 0) + (parseFloat(unit.sales_value) || 0);
      }
    });
    return {
      labels: Object.keys(typeCounts),
      datasets: [{ data: Object.values(typeCounts), backgroundColor: colors, borderWidth: 2, borderColor: "#fff", salesByLabel }],
    };
  }, [units, allUnits]);

  const paymentPlanChartData = useMemo(() => {
    const planCounts = groupByPaymentPlan(units);
    const sortedEntries = Object.entries(planCounts).sort((a, b) => {
      if (a[0].toLowerCase().includes("cash")) return -1;
      if (b[0].toLowerCase().includes("cash")) return 1;
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    });
    return {
      labels: sortedEntries.map((e) => e[0]),
      datasets: [{
        label: "Number of Units",
        data: sortedEntries.map((e) => e[1]),
        backgroundColor: "rgba(210, 105, 30, 0.6)",
        borderColor: "rgba(210, 105, 30, 1)",
        borderWidth: 1,
      }],
    };
  }, [units]);

  const salesTrendChartData = useMemo(() => {
    const contractedUnits = units.filter((u) => u.status === "Contracted");
    const grouped = {};

    contractedUnits.forEach((unit) => {
      if (!unit.reservation_date) return;
      const date = new Date(unit.reservation_date);
      if (isNaN(date.getTime())) return;

      let key, label;
      switch (salesPeriod) {
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          label = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
          break;
        case "quarterly": {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          label = `Q${quarter} ${date.getFullYear()}`;
          break;
        }
        default:
          key = `${date.getFullYear()}`;
          label = `${date.getFullYear()}`;
      }

      if (!grouped[key]) grouped[key] = { sales: 0, label };
      grouped[key].sales += parseFloat(unit.sales_value) || 0;
    });

    const sorted = Object.keys(grouped)
      .sort()
      .map((key) => ({ label: grouped[key].label, sales: grouped[key].sales }));

    return {
      labels: sorted.map((s) => s.label),
      datasets: [{
        label: "Sales Value",
        data: sorted.map((s) => s.sales),
        borderColor: "#FF6B35",
        backgroundColor: "transparent",
        fill: false,
        _orangeFill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#FF6B35",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      }],
    };
  }, [units, salesPeriod]);

  const deliveryProgressChartData = useMemo(() => {
    const now = new Date();
    const grouped = {};

    units.forEach((unit) => {
      if (!unit.development_delivery_date) return;
      const date = new Date(unit.development_delivery_date);
      if (isNaN(date.getTime())) return;

      let key, label, periodDate;
      switch (deliveryPeriod) {
        case "monthly":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          label = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
          periodDate = new Date(date.getFullYear(), date.getMonth(), 1);
          break;
        case "quarterly": {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          label = `Q${quarter} ${date.getFullYear()}`;
          periodDate = new Date(date.getFullYear(), (quarter - 1) * 3, 1);
          break;
        }
        default:
          key = `${date.getFullYear()}`;
          label = `${date.getFullYear()}`;
          periodDate = new Date(date.getFullYear(), 0, 1);
      }

      if (!grouped[key]) grouped[key] = { count: 0, label, periodDate };
      grouped[key].count += 1;
    });

    const sorted = Object.keys(grouped)
      .sort()
      .map((key) => ({
        label: grouped[key].label,
        count: grouped[key].count,
        periodDate: grouped[key].periodDate,
      }));

    let currentPeriodDate;
    switch (deliveryPeriod) {
      case "monthly":
        currentPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarterly": {
        const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
        currentPeriodDate = new Date(now.getFullYear(), currentQuarterMonth, 1);
        break;
      }
      default:
        currentPeriodDate = new Date(now.getFullYear(), 0, 1);
    }

    const isFuturePoint = (s) => s && s.periodDate >= currentPeriodDate;
    const splitIndex = sorted.findIndex((s) => isFuturePoint(s));
    const resolvedSplitIndex = splitIndex === -1 ? sorted.length : splitIndex;
    const pointBackgroundColors = sorted.map((s) => isFuturePoint(s) ? "#3498db" : "#FF6B35");

    return {
      labels: sorted.map((s) => s.label),
      datasets: [{
        label: "Number of Deliveries",
        data: sorted.map((s) => s.count),
        borderColor: "#FF6B35",
        fill: false,
        backgroundColor: "transparent",
        segment: {
          borderColor: (ctx) =>
            isFuturePoint(sorted[ctx.p0DataIndex]) ? "#3498db" : "#FF6B35",
        },
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        periodData: sorted,
        _splitFill: true,
        _splitIndex: resolvedSplitIndex,
      }],
    };
  }, [units, deliveryPeriod]);

  const deliveryComplianceChartData = useMemo(() => {
    let onTime = 0, delayed = 0;
    units.forEach((unit) => {
      if (!unit.contract_delivery_date || !unit.development_delivery_date) return;
      try {
        const contractDate = new Date(unit.contract_delivery_date);
        const developmentDate = new Date(unit.development_delivery_date);
        if (isNaN(contractDate.getTime()) || isNaN(developmentDate.getTime())) return;
        const adjusted = new Date(contractDate);
        adjusted.setMonth(adjusted.getMonth() + (parseInt(unit.grace_period_months) || 0));
        if (adjusted >= developmentDate) onTime++;
        else delayed++;
      } catch (e) {}
    });
    return {
      labels: [`On Time (${onTime})`, `Delayed (${delayed})`],
      datasets: [{
        data: [onTime, delayed],
        backgroundColor: ["#28a745", "#dc3545"],
        borderWidth: 2,
        borderColor: "#fff",
      }],
    };
  }, [units]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = chart.data.labels[index];
        if (chart.canvas.id === "inventory-chart") handleChartClick("statuses", label);
        else if (chart.canvas.id === "unit-type-chart") handleChartClick("unitTypes", label);
      }
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, padding: 15 },
        onClick: (e, legendItem, legend) => {
          const label = legendItem.text;
          if (legend.chart.canvas.id === "inventory-chart") handleChartClick("statuses", label);
          else if (legend.chart.canvas.id === "unit-type-chart") handleChartClick("unitTypes", label);
        },
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold", size: 11 },
        formatter: (val, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const pct = ((val / total) * 100).toFixed(1);
          return pct > 5 ? `${pct}%` : "";
        },
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            const label = context.label;
            let totalSalesValue = 0;
            if (context.chart.canvas.id === "inventory-chart") {
              totalSalesValue = allUnits
                .filter((u) => u.status === label)
                .reduce((sum, u) => sum + (parseFloat(u.sales_value) || 0), 0);
            } else if (context.chart.canvas.id === "unit-type-chart") {
              totalSalesValue = allUnits
                .filter((u) => u.unit_type === label)
                .reduce((sum, u) => sum + (parseFloat(u.sales_value) || 0), 0);
            }
            return [
              `Number of Units: ${value}`,
              `Total Sales Value: EGP ${totalSalesValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
              `% of Total Inventory: ${percentage}%`,
            ];
          },
          footer: () => "💡 Click to toggle filter",
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 32, right: 8 } },
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = chart.data.labels[index];
        handleChartClick("contractPaymentPlans", label);
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: "end",
        align: "top",
        color: getTextColor(),
        font: { weight: "bold", size: 11 },
      },
      tooltip: {
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return [`Number of Units: ${value}`, `Percentage: ${percentage}%`];
          },
          footer: () => "💡 Click to toggle filter",
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: getTextColor() }, title: { color: getTextColor() } },
      x: { ticks: { color: getTextColor() } },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 28 } },
    plugins: {
      legend: { display: true, labels: { color: getTextColor() } },
      datalabels: {
        display: true,
        align: "top",
        anchor: "end",
        offset: 2,
        color: getTextColor(),
        font: { weight: "bold", size: 9 },
        formatter: (value) => {
          if (value === null || value === undefined) return "";
          const num = Number(value);
          if (isNaN(num)) return "";
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toFixed(0);
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: getTextColor() }, title: { color: getTextColor() } },
      x: { ticks: { color: getTextColor() } },
    },
  };

  const salesLineOptions = {
    ...lineOptions,
    onClick: (event, elements, chart) => {
      if (elements.length === 0) return;
      const index = elements[0].index;
      const label = chart.data.labels[index];
      const start = getStartDateFromLabel(label, salesPeriod);
      const end = getEndDateFromLabel(label, salesPeriod);
      if (start && end) {
        setSalesDateRange({ start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] });
        onDateRangeChange("salesDateRange", start, end);
      }
    },
    plugins: {
      ...lineOptions.plugins,
      tooltip: { callbacks: { footer: () => "💡 Click a point to filter by this period" } },
    },
  };

  const deliveryLineOptions = {
    ...lineOptions,
    onClick: (event, elements, chart) => {
      if (elements.length === 0) return;
      const index = elements[0].index;
      const label = chart.data.labels[index];
      const start = getStartDateFromLabel(label, deliveryPeriod);
      const end = getEndDateFromLabel(label, deliveryPeriod);
      if (start && end) {
        setDeliveryDateRange({ start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] });
        onDateRangeChange("deliveryDateRange", start, end);
      }
    },
    plugins: {
      ...lineOptions.plugins,
      tooltip: { callbacks: { footer: () => "💡 Click a point to filter by this period" } },
    },
  };

  const deliveryCompliancePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleDeliveryComplianceClick,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, padding: 15 },
        onClick: (e, legendItem, legend) => {
          const chart = legend.chart;
          const index = legendItem.index;
          handleDeliveryComplianceClick(null, [{ index }], chart);
        },
      },
      datalabels: {
        color: "#fff",
        font: { weight: "bold", size: 11 },
        formatter: (val, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          const pct = ((val / total) * 100).toFixed(1);
          return pct > 5 ? `${pct}%` : "";
        },
      },
      tooltip: { callbacks: { footer: () => "💡 Click to see details" } },
    },
  };

  return (
    <>
      {/* ── Single wrapper: one flex child in .home-view ── */}
      <div className="charts-section-wrapper">

        {/* ── Row 1: Inventory Status + Unit Type + Contract Payment Plan ── */}
        <div className="chart-container" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Inventory Status</h3>
              <button className="chart-btn chart-expand-btn" onClick={() => openChartModal("Inventory Status", inventoryChartData, "pie")} title="Expand chart">⛶</button>
            </div>
            <div style={{ height: "250px" }}>
              <Pie id="inventory-chart" data={inventoryChartData} options={pieOptions} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Unit Type Distribution</h3>
              <button className="chart-btn chart-expand-btn" onClick={() => openChartModal("Unit Type Distribution", unitModelChartData, "pie")} title="Expand chart">⛶</button>
            </div>
            <div style={{ height: "250px" }}>
              <Pie id="unit-type-chart" data={unitModelChartData} options={pieOptions} />
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3>Contract Payment Plan</h3>
              <button className="chart-btn chart-expand-btn" onClick={() => openChartModal("Contract Payment Plan", paymentPlanChartData, "bar")} title="Expand chart">⛶</button>
            </div>
            <div style={{ height: "300px" }}>
              <Bar id="payment-plan-chart" data={paymentPlanChartData} options={barOptions} />
            </div>
          </div>
        </div>

        {/* ── Row 2: Sales Trend (full width) ── */}
        <div className="chart-container" style={{ gridTemplateColumns: "1fr" }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Sales Trend</h3>
              <button className="chart-btn chart-expand-btn" onClick={() => openChartModal("Sales Trend", salesTrendChartData, "line")} title="Expand chart">⛶</button>
            </div>
            <div className="chart-scroll-wrapper">
              <div style={{ height: "220px", minWidth: "600px" }}>
                <Line data={salesTrendChartData} options={salesLineOptions} />
              </div>
            </div>
            <div className="chart-controls-wrapper">
              <div className="date-range-controls compact">
                <label>From:</label>
                <input type="date" value={salesDateRange.start} onChange={(e) => setSalesDateRange({ ...salesDateRange, start: e.target.value })} />
                <label>To:</label>
                <input type="date" value={salesDateRange.end} onChange={(e) => setSalesDateRange({ ...salesDateRange, end: e.target.value })} />
                <button className="btn btn-primary btn-sm" onClick={() => { const start = salesDateRange.start ? new Date(salesDateRange.start) : null; const end = salesDateRange.end ? new Date(salesDateRange.end) : null; onDateRangeChange("salesDateRange", start, end); }}>Apply</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSalesDateRange({ start: "", end: "" }); onDateRangeChange("salesDateRange", null, null); }}>Clear</button>
              </div>
              <div className="period-selector compact">
                <button className={`period-btn ${salesPeriod === "monthly" ? "active" : ""}`} onClick={() => setSalesPeriod("monthly")}>Monthly</button>
                <button className={`period-btn ${salesPeriod === "quarterly" ? "active" : ""}`} onClick={() => setSalesPeriod("quarterly")}>Quarterly</button>
                <button className={`period-btn ${salesPeriod === "annually" ? "active" : ""}`} onClick={() => setSalesPeriod("annually")}>Annually</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Delivery Analysis (full width) ── */}
        <div className="chart-container" style={{ gridTemplateColumns: "1fr" }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Delivery Analysis</h3>
              <button className="chart-btn chart-expand-btn" onClick={() => openChartModal("Delivery Analysis", deliveryProgressChartData, "line")} title="Expand chart">⛶</button>
            </div>
            <div className="chart-scroll-wrapper">
              <div style={{ height: "220px", minWidth: "600px" }}>
                <Line data={deliveryProgressChartData} options={deliveryLineOptions} />
              </div>
            </div>
            <div className="chart-controls-wrapper">
              <div className="date-range-controls compact">
                <label>From:</label>
                <input type="date" value={deliveryDateRange.start} onChange={(e) => setDeliveryDateRange({ ...deliveryDateRange, start: e.target.value })} />
                <label>To:</label>
                <input type="date" value={deliveryDateRange.end} onChange={(e) => setDeliveryDateRange({ ...deliveryDateRange, end: e.target.value })} />
                <button className="btn btn-primary btn-sm" onClick={() => { const start = deliveryDateRange.start ? new Date(deliveryDateRange.start) : null; const end = deliveryDateRange.end ? new Date(deliveryDateRange.end) : null; onDateRangeChange("deliveryDateRange", start, end); }}>Apply</button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setDeliveryDateRange({ start: "", end: "" }); onDateRangeChange("deliveryDateRange", null, null); }}>Clear</button>
              </div>
              <div className="period-selector compact">
                <button className={`period-btn ${deliveryPeriod === "monthly" ? "active" : ""}`} onClick={() => setDeliveryPeriod("monthly")}>Monthly</button>
                <button className={`period-btn ${deliveryPeriod === "quarterly" ? "active" : ""}`} onClick={() => setDeliveryPeriod("quarterly")}>Quarterly</button>
                <button className={`period-btn ${deliveryPeriod === "annually" ? "active" : ""}`} onClick={() => setDeliveryPeriod("annually")}>Annually</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px", paddingLeft: "4px", fontSize: "0.8rem", color: getTextColor(), opacity: 0.8 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF6B35", display: "inline-block" }} />
                Past deliveries
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#3498db", display: "inline-block" }} />
                Future scheduled
              </span>
            </div>
          </div>
        </div>

        {/* ── Row 4: Delivery Compliance ── */}
        <div className="chart-container" style={{ gridTemplateColumns: "1fr" }}>
          <div className="chart-card">
            <div className="chart-header">
              <h3>Delivery Compliance</h3>
              <button className="chart-btn chart-expand-btn" onClick={() => openChartModal("Delivery Compliance", deliveryComplianceChartData, "pie")} title="Expand chart">⛶</button>
            </div>
            <div style={{ height: "320px", display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "500px", margin: "0 auto" }}>
              <Pie data={deliveryComplianceChartData} options={deliveryCompliancePieOptions} />
            </div>
          </div>
        </div>

      </div>

      {/* Modals stay outside the wrapper */}
      <UnitsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} units={modalUnits} title={modalTitle} />
      <ChartModal isOpen={chartModalOpen} onClose={() => setChartModalOpen(false)} title={chartModalTitle}>
        {chartModalData && (
          <div style={{ height: "75vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {chartModalType === "pie" && <Pie data={chartModalData} options={modalPieOptions} />}
            {chartModalType === "bar" && <Bar data={chartModalData} options={barOptions} />}
            {chartModalType === "line" && <Line data={chartModalData} options={lineOptions} />}
          </div>
        )}
      </ChartModal>
    </>
  );
};

export default ChartsSection;