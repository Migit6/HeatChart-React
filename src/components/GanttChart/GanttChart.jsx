import { useState, useRef, useEffect, useCallback } from "react";
import {
  getManagerColor,
  resetManagerColors,
  getAllManagerColors,
  lightenColor,
  shortenName,
  shortenNames,
} from "./ganttUtils.js";
import useGanttZoom from "./useGanttZoom.js";
import ExcelImport from "./ExcelImport.jsx";
import "./GanttChart.css";

const ROW_HEIGHT = 40;
const MONTH_ROW_H = 26;
const WEEK_ROW_H = 22;
const HEADER_HEIGHT = MONTH_ROW_H + WEEK_ROW_H;
const LEFT_PANEL_WIDTH = 200;

export default function GanttChart() {
  const [projects, setProjects] = useState([]);
  const [weekColumns, setWeekColumns] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const headerCanvasRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const leftBodyRef = useRef(null);

  const dayWidth = useGanttZoom(containerRef);
  const weekWidth = 7 * dayWidth;

  const totalWidth = weekColumns.length * weekWidth;
  const totalHeight = projects.length * ROW_HEIGHT;

  // Handle Excel import
  function handleImport(result) {
    resetManagerColors();
    setProjects(result.projects);
    setWeekColumns(result.weekColumns);
  }

  // Sync horizontal scroll
  const handleBodyScroll = useCallback(() => {
    const body = bodyScrollRef.current;
    const headerCanvas = headerCanvasRef.current;
    const leftBody = leftBodyRef.current;
    if (body && headerCanvas) {
      headerCanvas.parentElement.scrollLeft = body.scrollLeft;
    }
    if (body && leftBody) {
      leftBody.scrollTop = body.scrollTop;
    }
  }, []);

  // Draw the header canvas (months + weeks)
  useEffect(() => {
    const canvas = headerCanvasRef.current;
    if (!canvas || weekColumns.length === 0) return;

    canvas.width = totalWidth;
    canvas.height = HEADER_HEIGHT;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parse week dates to build month groups
    const monthGroups = [];
    let curMonth = null;
    weekColumns.forEach((week, idx) => {
      const parts = week.name.split(" - ")[0].split(".");
      const monthNum = parseInt(parts[1], 10) - 1;
      const monthNames = [
        "Januar", "Februar", "März", "April", "Mai", "Juni",
        "Juli", "August", "September", "Oktober", "November", "Dezember",
      ];
      const name = monthNames[monthNum] || "";
      if (!curMonth || curMonth.name !== name) {
        curMonth = { name, startIdx: idx, count: 1 };
        monthGroups.push(curMonth);
      } else {
        curMonth.count++;
      }
    });

    // Draw month pills (black rounded rects)
    monthGroups.forEach((month) => {
      const x = month.startIdx * weekWidth + dayWidth;
      const w = month.count * weekWidth - dayWidth * 2;
      if (w <= 0) return;

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.roundRect(x, 4, w, 18, 5);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "600 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(month.name, x + w / 2, 16);
    });

    // Draw week labels
    ctx.fillStyle = "#333";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";

    weekColumns.forEach((week, idx) => {
      const x = idx * weekWidth;
      const label = week.name.split(" - ")[0].replace(".", ".");
      ctx.fillText(label, x + weekWidth / 2, MONTH_ROW_H + 15);

      // Week separator line
      ctx.strokeStyle = "#bbb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + weekWidth, MONTH_ROW_H);
      ctx.lineTo(x + weekWidth, HEADER_HEIGHT);
      ctx.stroke();
    });
  }, [weekColumns, dayWidth, totalWidth, weekWidth]);

  // Draw the main Gantt canvas (bars, effort, milestones)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || projects.length === 0) return;

    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Week separator lines
    weekColumns.forEach((_, idx) => {
      const lineX = (idx + 1) * weekWidth;
      ctx.strokeStyle = "#bbb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lineX, 0);
      ctx.lineTo(lineX, totalHeight);
      ctx.stroke();
    });

    // Row separator lines
    projects.forEach((_, idx) => {
      ctx.strokeStyle = "#e9ecef";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, (idx + 1) * ROW_HEIGHT);
      ctx.lineTo(totalWidth, (idx + 1) * ROW_HEIGHT);
      ctx.stroke();
    });

    // Draw each project
    projects.forEach((project, pIdx) => {
      const yCenter = pIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
      const projectColor = getManagerColor(project.manager);

      // Draw bars between milestones
      if (project.milestones.length > 1) {
        for (let i = 0; i < project.milestones.length - 1; i++) {
          const startX = project.milestones[i].week * weekWidth + weekWidth / 2;
          const endX = project.milestones[i + 1].week * weekWidth + weekWidth / 2;

          ctx.fillStyle = projectColor;
          ctx.fillRect(startX, yCenter - 2, endX - startX, 4);
        }
      }

      // Draw effort curves between milestones
      if (project.effort.length > 0 && project.milestones.length > 0) {
        const curveColor = lightenColor(projectColor);
        const maxEffort = Math.max(...project.effort.map((e) => e.value), 10);
        const curveHeight = 20;

        for (let m = 0; m < project.milestones.length - 1; m++) {
          const startMs = project.milestones[m];
          const endMs = project.milestones[m + 1];

          const startX = startMs.week * weekWidth + weekWidth / 2;
          const endX = endMs.week * weekWidth + weekWidth / 2;

          ctx.fillStyle = curveColor;
          ctx.strokeStyle = curveColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(startX, yCenter - 5);

          for (let week = startMs.week; week <= endMs.week; week++) {
            const effortPoint = project.effort.find((e) => e.week === week);
            const weekX = week * weekWidth + weekWidth / 2;
            if (effortPoint && effortPoint.value > 0) {
              const h = (effortPoint.value / maxEffort) * curveHeight;
              ctx.lineTo(weekX, yCenter - h - 5);
            } else {
              ctx.lineTo(weekX, yCenter - 5);
            }
          }

          ctx.lineTo(endX, yCenter - 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw milestones (black diamonds)
      project.milestones.forEach((milestone) => {
        const msX = milestone.week * weekWidth + weekWidth / 2;

        ctx.fillStyle = "#000";
        ctx.save();
        ctx.translate(msX, yCenter);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();

        // Milestone label above
        ctx.fillStyle = "#000";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.fillText(milestone.text, msX, yCenter - 10);
      });
    });

    // Today line
    const today = new Date();
    const firstWeekDate = parseWeekDate(weekColumns[0]?.name);
    if (firstWeekDate) {
      const diffDays = (today - firstWeekDate) / (1000 * 60 * 60 * 24);
      const todayX = diffDays * dayWidth;
      if (todayX >= 0 && todayX <= totalWidth) {
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(todayX, 0);
        ctx.lineTo(todayX, totalHeight);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.roundRect(todayX - 18, 0, 36, 14, 3);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px Arial";
        ctx.textAlign = "center";
        ctx.fillText("HEUTE", todayX, 10);
      }
    }

    // Zoom info
    ctx.fillStyle = "#999";
    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `Zoom: ${Math.round((dayWidth / 7) * 100)}% (Ctrl+Mausrad)`,
      totalWidth - 10,
      totalHeight - 5
    );
  }, [projects, weekColumns, dayWidth, totalWidth, totalHeight, weekWidth]);

  // Mouse move handler for tooltip
  const handleCanvasMouseMove = useCallback(
    (e) => {
      if (projects.length === 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      projects.forEach((project, pIdx) => {
        const yCenter = pIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
        if (mouseY >= yCenter - 4 && mouseY <= yCenter + 4 && project.milestones.length > 0) {
          const firstX = project.milestones[0].week * weekWidth;
          const lastX = (project.milestones[project.milestones.length - 1].week + 1) * weekWidth;
          if (mouseX >= firstX && mouseX <= lastX) {
            found = project;
          }
        }
      });

      if (found) {
        const managerShort = shortenName(found.manager);
        const processorShort = shortenNames(found.processor);
        setTooltip({
          text: `${managerShort}, ${processorShort}`,
          x: e.clientX + 8,
          y: e.clientY - 15,
        });
      } else {
        setTooltip(null);
      }
    },
    [projects, weekWidth]
  );

  const hasData = projects.length > 0;

  return (
    <div className="gantt-wrapper" ref={containerRef}>
      {/* Toolbar */}
      <div className="gantt-toolbar">
        <ExcelImport onImport={handleImport} />
        {hasData && (
          <span className="gantt-zoom-hint">
            Zoom: {Math.round((dayWidth / 7) * 100)}% — Ctrl + Mausrad
          </span>
        )}
      </div>

      {!hasData && (
        <div className="gantt-upload-section">
          <div className="gantt-upload-box">
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📊</div>
            <h2>Excel-Datei hochladen</h2>
            <p className="gantt-upload-hint">
              Nach dem Upload werden die Projektdaten als Gantt-Chart dargestellt.
            </p>
          </div>
        </div>
      )}

      {hasData && (
        <>
          <div className="gantt-container">
            {/* Top-left corner */}
            <div
              className="gantt-corner"
              style={{ width: LEFT_PANEL_WIDTH, height: HEADER_HEIGHT }}
            >
              <span className="corner-label">Projekt</span>
            </div>

            {/* Timeline header (months + weeks) */}
            <div
              className="gantt-timeline-header"
              style={{ left: LEFT_PANEL_WIDTH, height: HEADER_HEIGHT }}
            >
              <div className="gantt-timeline-scroll">
                <canvas ref={headerCanvasRef} style={{ display: "block" }} />
              </div>
            </div>

            {/* Left panel (project labels) */}
            <div
              className="gantt-left-panel"
              style={{ width: LEFT_PANEL_WIDTH, top: HEADER_HEIGHT }}
            >
              <div className="gantt-left-body" ref={leftBodyRef}>
                {projects.map((p, idx) => (
                  <div
                    key={idx}
                    className="gantt-left-row"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <span className="left-number">{p.number}</span>
                    <div className="left-info">
                      <span className="left-name">{p.name}</span>
                      <span className="left-gl">{shortenName(p.gl)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt body (scrollable canvas) */}
            <div
              className="gantt-body"
              style={{ top: HEADER_HEIGHT, left: LEFT_PANEL_WIDTH }}
            >
              <div
                className="gantt-body-scroll"
                ref={bodyScrollRef}
                onScroll={handleBodyScroll}
              >
                <canvas
                  ref={canvasRef}
                  style={{ display: "block", cursor: tooltip ? "pointer" : "default" }}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={() => setTooltip(null)}
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="gantt-legend">
            <span className="gantt-legend-title">Projektleitung:</span>
            {Object.entries(getAllManagerColors()).map(([name, color]) => (
              <span key={name} className="gantt-legend-item">
                <span
                  className="gantt-legend-bar"
                  style={{ backgroundColor: color }}
                />
                {shortenName(name)}
              </span>
            ))}
            <span className="gantt-legend-item">
              <span className="gantt-legend-diamond" />
              Meilenstein
            </span>
          </div>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="gantt-tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.text}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Parse "DD.MM - DD.MM" week header into a Date */
function parseWeekDate(weekName) {
  if (!weekName) return null;
  const parts = weekName.split(" - ")[0].split(".");
  if (parts.length < 2) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  // Infer year from month (crossing year boundary)
  const year = month < 6 ? 2026 : 2025;
  return new Date(year, month, day);
}
