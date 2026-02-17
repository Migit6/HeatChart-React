import { useState, useRef, useMemo, useCallback } from "react";
import {
  buildTimeline,
  getBarPosition,
  getMilestonePosition,
  getLeadColor,
  resetLeadColors,
  getSampleData,
} from "./ganttUtils.js";
import useGanttZoom from "./useGanttZoom.js";
import ExcelImport from "./ExcelImport.jsx";
import "./GanttChart.css";

const ROW_HEIGHT = 48;
const HEADER_HEIGHT = 52;
const LEFT_PANEL_WIDTH = 360;

export default function GanttChart() {
  const [projects, setProjects] = useState(getSampleData);
  const containerRef = useRef(null);
  const timelineScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const leftBodyRef = useRef(null);

  const colWidth = useGanttZoom(containerRef);

  // Compute timeline range from project data
  const { timelineStart, timelineEnd } = useMemo(() => {
    if (projects.length === 0) {
      const now = new Date();
      return {
        timelineStart: new Date(now.getFullYear(), 0, 1),
        timelineEnd: new Date(now.getFullYear(), 11, 31),
      };
    }
    let min = projects[0].start;
    let max = projects[0].end;
    for (const p of projects) {
      if (p.start < min) min = p.start;
      if (p.end > max) max = p.end;
      for (const ms of p.milestones) {
        if (ms.date < min) min = ms.date;
        if (ms.date > max) max = ms.date;
      }
    }
    // Add 4 weeks padding on each side
    const pad = 28 * 24 * 60 * 60 * 1000;
    return {
      timelineStart: new Date(min.getTime() - pad),
      timelineEnd: new Date(max.getTime() + pad),
    };
  }, [projects]);

  const { months, weeks } = useMemo(
    () => buildTimeline(timelineStart, timelineEnd),
    [timelineStart, timelineEnd]
  );

  // The actual start date of the first week column (Monday)
  const firstWeekStart = weeks.length > 0 ? weeks[0].startDate : timelineStart;

  const totalTimelineWidth = weeks.length * colWidth;

  // Sync horizontal scroll between header and body
  const handleBodyScroll = useCallback(() => {
    const body = bodyScrollRef.current;
    const header = timelineScrollRef.current;
    const leftBody = leftBodyRef.current;
    if (body && header) {
      header.scrollLeft = body.scrollLeft;
    }
    if (body && leftBody) {
      leftBody.scrollTop = body.scrollTop;
    }
  }, []);

  const handleLeftBodyScroll = useCallback(() => {
    const body = bodyScrollRef.current;
    const leftBody = leftBodyRef.current;
    if (body && leftBody) {
      body.scrollTop = leftBody.scrollTop;
    }
  }, []);

  function handleImport(data) {
    resetLeadColors();
    setProjects(data);
  }

  // Build effort curve SVG path for a project row
  function renderEffortCurve(project) {
    if (!project.effort || project.effort.length === 0) return null;

    const { left, width } = getBarPosition(
      project.start,
      project.end,
      firstWeekStart,
      colWidth
    );

    const points = project.effort;
    const segmentWidth = width / Math.max(points.length - 1, 1);
    const curveHeight = ROW_HEIGHT - 8;

    let d = "";
    for (let i = 0; i < points.length; i++) {
      const x = left + i * segmentWidth;
      const y = ROW_HEIGHT - 4 - (points[i] / 100) * curveHeight;
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    // Close the area path for filling
    const lastX = left + (points.length - 1) * segmentWidth;
    const areaD =
      d +
      ` L ${lastX} ${ROW_HEIGHT - 4} L ${left} ${ROW_HEIGHT - 4} Z`;

    const color = getLeadColor(project.lead);

    return (
      <g key={`effort-${project.id}`}>
        <path d={areaD} fill={color} fillOpacity="0.15" />
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
      </g>
    );
  }

  return (
    <div className="gantt-wrapper" ref={containerRef}>
      {/* Toolbar */}
      <div className="gantt-toolbar">
        <ExcelImport onImport={handleImport} />
        <span className="gantt-zoom-hint">Ctrl + Mausrad zum Zoomen</span>
      </div>

      <div className="gantt-container">
        {/* =============== TOP-LEFT CORNER (fixed) =============== */}
        <div
          className="gantt-corner"
          style={{ width: LEFT_PANEL_WIDTH, height: HEADER_HEIGHT }}
        >
          <span className="corner-col corner-id">Nr.</span>
          <span className="corner-col corner-name">Projektname</span>
          <span className="corner-col corner-lead">GL</span>
        </div>

        {/* =============== TIMELINE HEADER (fixed top, scrolls horizontally) =============== */}
        <div
          className="gantt-timeline-header"
          style={{ left: LEFT_PANEL_WIDTH, height: HEADER_HEIGHT }}
        >
          <div
            className="gantt-timeline-scroll"
            ref={timelineScrollRef}
          >
            <div
              className="gantt-timeline-inner"
              style={{ width: totalTimelineWidth }}
            >
              {/* Month row */}
              <div className="gantt-months-row">
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="gantt-month-cell"
                    style={{ width: m.colSpan * colWidth }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Week row */}
              <div className="gantt-weeks-row">
                {weeks.map((w, i) => (
                  <div
                    key={i}
                    className="gantt-week-cell"
                    style={{ width: colWidth }}
                  >
                    {colWidth >= 32 ? w.label : w.weekNum}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* =============== LEFT PANEL (fixed left, scrolls vertically) =============== */}
        <div
          className="gantt-left-panel"
          style={{ width: LEFT_PANEL_WIDTH, top: HEADER_HEIGHT }}
        >
          <div
            className="gantt-left-body"
            ref={leftBodyRef}
            onScroll={handleLeftBodyScroll}
          >
            {projects.map((p) => (
              <div
                key={p.id}
                className="gantt-left-row"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="left-col left-id">{p.id}</span>
                <span className="left-col left-name">{p.name}</span>
                <span
                  className="left-col left-lead"
                  style={{ color: getLeadColor(p.lead) }}
                >
                  {p.lead}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* =============== GANTT BODY (scrolls both ways) =============== */}
        <div
          className="gantt-body"
          style={{ top: HEADER_HEIGHT, left: LEFT_PANEL_WIDTH }}
        >
          <div
            className="gantt-body-scroll"
            ref={bodyScrollRef}
            onScroll={handleBodyScroll}
          >
            <div
              className="gantt-body-inner"
              style={{
                width: totalTimelineWidth,
                height: projects.length * ROW_HEIGHT,
              }}
            >
              {/* Grid lines */}
              {weeks.map((_, i) => (
                <div
                  key={`grid-${i}`}
                  className="gantt-grid-line"
                  style={{ left: i * colWidth, height: "100%" }}
                />
              ))}

              {/* Rows */}
              {projects.map((project, rowIdx) => {
                const color = getLeadColor(project.lead);
                const bar = getBarPosition(
                  project.start,
                  project.end,
                  firstWeekStart,
                  colWidth
                );

                return (
                  <div
                    key={project.id}
                    className="gantt-row"
                    style={{
                      top: rowIdx * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      width: totalTimelineWidth,
                    }}
                  >
                    {/* Effort curve */}
                    <svg
                      className="gantt-effort-svg"
                      style={{
                        width: totalTimelineWidth,
                        height: ROW_HEIGHT,
                      }}
                    >
                      {renderEffortCurve(project)}
                    </svg>

                    {/* Bar */}
                    <div
                      className="gantt-bar"
                      style={{
                        left: bar.left,
                        width: bar.width,
                        backgroundColor: color,
                      }}
                      title={`${project.name} (${project.start.toLocaleDateString("de-DE")} – ${project.end.toLocaleDateString("de-DE")})`}
                    />

                    {/* Milestones */}
                    {project.milestones.map((ms, msIdx) => {
                      const msLeft = getMilestonePosition(
                        ms.date,
                        firstWeekStart,
                        colWidth
                      );
                      return (
                        <div
                          key={msIdx}
                          className="gantt-milestone"
                          style={{ left: msLeft }}
                          title={`${ms.label} – ${ms.date.toLocaleDateString("de-DE")}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14">
                            <polygon
                              points="7,0 14,7 7,14 0,7"
                              fill="#000000"
                            />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {projects.length > 0 && (
        <div className="gantt-legend">
          <span className="gantt-legend-title">Projektleitung:</span>
          {[...new Set(projects.map((p) => p.lead))].filter(Boolean).map((lead) => (
            <span key={lead} className="gantt-legend-item">
              <span
                className="gantt-legend-dot"
                style={{ backgroundColor: getLeadColor(lead) }}
              />
              {lead}
            </span>
          ))}
          <span className="gantt-legend-item">
            <svg width="12" height="12" viewBox="0 0 14 14" style={{ verticalAlign: "middle" }}>
              <polygon points="7,0 14,7 7,14 0,7" fill="#000000" />
            </svg>{" "}
            Meilenstein
          </span>
        </div>
      )}
    </div>
  );
}
