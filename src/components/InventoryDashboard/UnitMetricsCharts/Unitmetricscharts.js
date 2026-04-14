import React, { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartModal from "../ChartsModal/Chartmodal";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ─── Tooltip positioner ────────────────────────────────────────────────────────
Tooltip.positioners.aboveMax = function (elements) {
  if (!elements.length) return false;
  const el      = elements[0];
  const chart   = el.element?.$context?.chart ?? this.chart;
  const dataset = chart?.data?.datasets?.[el.datasetIndex];
  const dp      = dataset?.minMax?.[el.index];

  if (dp && chart) {
    const yScale      = chart.scales.y;
    const maxY        = yScale.getPixelForValue(dp.max);
    const minY        = yScale.getPixelForValue(dp.min);
    const barHeightPx = minY - maxY;
    let gap;
    if (barHeightPx < 100)      gap = 25;
    else if (barHeightPx < 200) gap = 35;
    else if (barHeightPx < 300) gap = 50;
    else                        gap = 70;
    return { x: el.element.x, y: maxY - gap };
  }
  return { x: el.element.x, y: el.element.y - 48 };
};

// ─── Box dimensions ───────────────────────────────────────────────────────────
// Keeping boxes small so they take fewer pixels and stay close to true values
const BOX_H   = 16;
const BOX_PAD = 5;

// ─── Candlestick plugin ────────────────────────────────────────────────────────
const candlestickPlugin = {
  id: "candlestickPlugin",

  afterDatasetsDraw(chart) {
    const ctx     = chart.ctx;
    const meta    = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets?.[0];
    if (!meta?.data || !dataset?.minMax) return;

    meta.data.forEach((bar, index) => {
      const dp = dataset.minMax[index];
      if (!dp || !bar) return;
      const { min, max } = dp;
      if (min === undefined || max === undefined) return;

      const yScale = chart.scales.y;
      if (!yScale) return;

      const maxPx = yScale.getPixelForValue(max);
      const minPx = yScale.getPixelForValue(min);

      // Stick runs between inner edges of the two boxes
      const stickTop    = maxPx + BOX_H / 2;
      const stickBottom = minPx - BOX_H / 2;

      ctx.save();
      ctx.strokeStyle = "#D2691E";
      ctx.lineWidth   = 4;
      ctx.beginPath();
      ctx.moveTo(bar.x, stickTop);
      ctx.lineTo(bar.x, Math.max(stickBottom, stickTop + 2));
      ctx.stroke();
      ctx.restore();
    });
  },

  afterDraw(chart) {
    const ctx     = chart.ctx;
    const meta    = chart.getDatasetMeta(0);
    const dataset = chart.data.datasets?.[0];
    if (!meta?.data || !dataset?.minMax) return;

    const isDark      = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor   = isDark ? "#fff"                  : "#000";
    const bgColor     = isDark ? "rgba(30, 41, 59, 0.9)" : "#fff";
    const borderColor = isDark ? "#fff"                  : "#000";

    const fmt = (val) => Math.round(val).toLocaleString("en-US");

    meta.data.forEach((bar, index) => {
      const dp = dataset.minMax[index];
      if (!dp || !bar) return;
      const { min, max, avg } = dp;
      if (min === undefined || max === undefined || avg === undefined) return;

      const yScale = chart.scales.y;
      if (!yScale) return;

      const x = bar.x;

      // Always use the true scale pixel — no artificial expansion
      const maxPx = yScale.getPixelForValue(max);
      const minPx = yScale.getPixelForValue(min);
      const avgPx = yScale.getPixelForValue(avg);

      ctx.save();
      ctx.textAlign = "center";
      ctx.font      = `bold 9px Arial`;

      // Centre each box exactly on its true pixel
      const maxBoxY = maxPx - BOX_H / 2;
      const avgBoxY = avgPx - BOX_H / 2;
      const minBoxY = minPx - BOX_H / 2;

      const drawBox = (text, boxY, fill, stroke, txtColor) => {
        const boxWidth = ctx.measureText(text).width + BOX_PAD * 2;
        const boxX     = x - boxWidth / 2;
        ctx.fillStyle = fill;
        ctx.fillRect(boxX, boxY, boxWidth, BOX_H);
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth   = 1;
          ctx.strokeRect(boxX, boxY, boxWidth, BOX_H);
        }
        ctx.fillStyle = txtColor;
        ctx.fillText(text, x, boxY + BOX_H - 4);
      };

      drawBox(fmt(max), maxBoxY, bgColor,   borderColor, textColor);
      drawBox(fmt(avg), avgBoxY, "#FF6B35", null,        "#fff");
      drawBox(fmt(min), minBoxY, bgColor,   borderColor, textColor);

      ctx.restore();
    });
  },
};

ChartJS.register(candlestickPlugin);

// ─── Component ─────────────────────────────────────────────────────────────────
const UnitMetricsCharts = ({ units }) => {
  const [chartModalOpen,  setChartModalOpen]  = useState(false);
  const [chartModalTitle, setChartModalTitle] = useState("");
  const [chartModalData,  setChartModalData]  = useState(null);
  const [ ,setTheme] = useState(
    document.documentElement.getAttribute("data-theme"),
  );

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === "data-theme") {
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

  const openChartModal = (title, data) => {
    setChartModalTitle(title);
    setChartModalData(data);
    setChartModalOpen(true);
  };

  const aggregateByUnitType = (valueField) => {
    const grouped = {};
    units.forEach((unit) => {
      const unitType = unit.unit_type || "Unknown";
      const value    = parseFloat(unit[valueField]);
      if (!isNaN(value) && unitType !== "Unknown" && value > 0) {
        if (!grouped[unitType]) grouped[unitType] = [];
        grouped[unitType].push(value);
      }
    });

    const result = { labels: [], dataPoints: [] };
    Object.keys(grouped).sort().forEach((label) => {
      const values = grouped[label].sort((a, b) => a - b);
      if (values.length > 0) {
        result.labels.push(label);
        result.dataPoints.push({
          min:   values[0],
          max:   values[values.length - 1],
          avg:   values.reduce((s, v) => s + v, 0) / values.length,
          count: values.length,
        });
      }
    });
    return result;
  };

  const buildChartData = (valueField, label) => {
    const data = aggregateByUnitType(valueField);

    const globalMin = data.dataPoints.length > 0
      ? Math.min(...data.dataPoints.map((d) => d.min)) : 0;
    const globalMax = data.dataPoints.length > 0
      ? Math.max(...data.dataPoints.map((d) => d.max)) : 100;

    return {
      globalMin,
      globalMax,
      chartData: {
        labels: data.labels,
        datasets: [{
          label,
          data:            data.dataPoints.map((d) => d.max),
          backgroundColor: "transparent",
          borderColor:     "transparent",
          borderWidth:     0,
          barThickness:    50,
          minMax:          data.dataPoints,
        }],
      },
    };
  };

  const priceBundle = useMemo(() => buildChartData("sales_value",   "Price Range"),     [units]); // eslint-disable-line
  const psmBundle   = useMemo(() => buildChartData("psm",           "PSM Range"),       [units]); // eslint-disable-line
  const areaBundle  = useMemo(() => buildChartData("sellable_area", "Area Range (sqm)"),[units]); // eslint-disable-line

  const getTextColor = () =>
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "#F1F5F9" : "#1E293B";

  const getChartOptions = (yAxisLabel, globalMin, globalMax) => {
    const valueRange = globalMax - globalMin;

    // ── Generous y-axis buffer so values are spread across the full chart height.
    // The larger this buffer, the more pixel space between close values.
    // 50% of the range on each side gives enough room for the boxes to land
    // at their true y-axis positions without overlapping.
    const yBuffer  = valueRange === 0
      ? globalMin * 0.5           // single-value: 50% of value itself
      : valueRange * 0.5;         // normal: 50% of range on each side
    const yAxisMin = Math.max(0, globalMin - yBuffer);
    const yAxisMax = globalMax + yBuffer;

    return {
      responsive:          true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 60, bottom: 60, left: 30, right: 15 },
      },
      plugins: {
        legend:     { display: false },
        datalabels: { display: false },
        tooltip: {
          enabled:         true,
          position:        "aboveMax",
          backgroundColor: "rgba(0,0,0,0.95)",
          padding:         8,
          titleColor:      "#FF6B35",
          bodyColor:       "#fff",
          borderColor:     "#FF6B35",
          borderWidth:     2,
          cornerRadius:    6,
          displayColors:   false,
          titleFont:   { size: 10, weight: "bold" },
          bodyFont:    { size: 9 },
          bodySpacing: 4,
          titleAlign:  "center",
          bodyAlign:   "center",
          xAlign:      "center",
          yAlign:      "bottom",
          caretSize:    6,
          caretPadding: 8,
          callbacks: {
            title: (ctx) => ctx[0].chart.data.labels[ctx[0].dataIndex],
            label: (ctx) => {
              const dp  = ctx.dataset.minMax[ctx.dataIndex];
              const fmt = (val) => {
                if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
                if (val >= 1_000)     return `${(val / 1_000).toFixed(1)}K`;
                return val.toFixed(0);
              };
              return [
                `Max: ${fmt(dp.max)}`,
                `Avg: ${fmt(dp.avg)}`,
                `Min: ${fmt(dp.min)}`,
                `Count: ${dp.count} units`,
              ];
            },
          },
        },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
      hover: { mode: "nearest", intersect: true, animationDuration: 400 },
      scales: {
        y: {
          beginAtZero: false,
          min: yAxisMin,
          max: yAxisMax,
          title: {
            display: true,
            text:    yAxisLabel,
            color:   getTextColor(),
            font:    { size: 12, weight: "bold" },
          },
          grid: { color: "rgba(0,0,0,0.05)", drawBorder: true, borderColor: "#ccc" },
          afterBuildTicks: (scale) => {
            scale.ticks = [];
            if (globalMin === globalMax) {
              scale.ticks.push({ value: globalMin });
              return;
            }
            const range = globalMax - globalMin;
            [0, 0.25, 0.5, 0.75, 1].forEach((f) =>
              scale.ticks.push({ value: globalMin + range * f })
            );
          },
          ticks: {
            color:   getTextColor(),
            font:    { size: 10 },
            padding: 10,
            callback: (val) => {
              if (val >= 1_000_000) return parseFloat((val / 1_000_000).toFixed(2)) + "M";
              if (val >= 1_000)     return parseFloat((val / 1_000).toFixed(1))     + "K";
              return Math.round(val).toLocaleString("en-US");
            },
          },
        },
        x: {
          grid: { display: false, drawBorder: true, borderColor: "#ccc" },
          ticks: {
            color:       getTextColor(),
            font:        { size: 10 },
            maxRotation: 0,
            minRotation: 0,
            autoSkip:    false,
            padding:     30,
          },
        },
      },
    };
  };

  if (!units || units.length === 0) {
    return (
      <div className="unit-metrics-charts-container">
        <div className="chart-card">
          <p style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            No data available. Please select filters to view unit metrics.
          </p>
        </div>
      </div>
    );
  }

  const renderChartCard = (title, bundle, yAxisLabel, chartKey) => {
    const { chartData, globalMin, globalMax } = bundle;
    const options     = getChartOptions(yAxisLabel, globalMin, globalMax);
    const needsScroll = chartData.labels.length > 2;

    return (
      <div className="chart-card">
        <div className="chart-header">
          <h3>{title}</h3>
          <button
            className="chart-btn chart-expand-btn"
            onClick={() => openChartModal(yAxisLabel, chartData)}
            title="Expand chart"
          >
            ⛶
          </button>
        </div>
        <div className={needsScroll ? "chart-scroll-wrapper candlestick-wrapper-scroll" : "candlestick-wrapper-no-scroll"}>
          <div
            className="candlestick-chart-container"
            style={{ height: "500px", padding: "10px", minWidth: needsScroll ? "800px" : "auto" }}
          >
            <Bar key={chartKey} data={chartData} options={options} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="unit-metrics-charts-container">
      <div className="unit-metrics-cards-wrapper">
        {renderChartCard("Unit Price Range",             priceBundle, "Unit Price Range (Sales Value)", "price-chart")}
        {renderChartCard("Price per Square Meter Range", psmBundle,   "PSM (EGP/sqm)",                 "psm-chart")}
        {renderChartCard("Gross Area Range",             areaBundle,  "Area (sqm)",                    "area-chart")}
      </div>

      <ChartModal
        isOpen={chartModalOpen}
        onClose={() => setChartModalOpen(false)}
        title={chartModalTitle}
      >
        {chartModalData && (() => {
          const pts  = chartModalData.datasets[0]?.minMax ?? [];
          const mMin = pts.length ? Math.min(...pts.map((d) => d.min)) : 0;
          const mMax = pts.length ? Math.max(...pts.map((d) => d.max)) : 100;
          return (
            <div style={{ height: "75vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bar data={chartModalData} options={getChartOptions(chartModalTitle, mMin, mMax)} />
            </div>
          );
        })()}
      </ChartModal>
    </div>
  );
};

export default UnitMetricsCharts;