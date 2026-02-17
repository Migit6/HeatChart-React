/** Color palette assigned to project leads (GL) */
const LEAD_COLORS = [
  "#4A90D9", // blue
  "#E6783A", // orange
  "#5BB55B", // green
  "#CC5C76", // rose
  "#8E6FBF", // purple
  "#C9A832", // gold
  "#3DBDB5", // teal
  "#D45D5D", // red
  "#7B8FB2", // steel
  "#A0522D", // sienna
];

const leadColorMap = new Map();
let nextColorIndex = 0;

export function getLeadColor(leadName) {
  if (!leadName) return "#999999";
  if (!leadColorMap.has(leadName)) {
    leadColorMap.set(leadName, LEAD_COLORS[nextColorIndex % LEAD_COLORS.length]);
    nextColorIndex++;
  }
  return leadColorMap.get(leadName);
}

export function resetLeadColors() {
  leadColorMap.clear();
  nextColorIndex = 0;
}

/**
 * Build the week columns for the timeline header.
 * Returns { months: [{ label, colSpan }], weeks: [{ label, year, month, weekNum, startDate }] }
 */
export function buildTimeline(startDate, endDate) {
  const weeks = [];
  const months = [];

  // Start from Monday of the week containing startDate
  const current = new Date(startDate);
  const dayOfWeek = current.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);

  let currentMonthLabel = "";
  let currentMonthSpan = 0;

  while (current <= endDate) {
    const weekNum = getISOWeek(current);
    const monthLabel = current.toLocaleDateString("de-DE", {
      month: "short",
      year: "numeric",
    });

    if (monthLabel !== currentMonthLabel) {
      if (currentMonthLabel) {
        months.push({ label: currentMonthLabel, colSpan: currentMonthSpan });
      }
      currentMonthLabel = monthLabel;
      currentMonthSpan = 0;
    }
    currentMonthSpan++;

    weeks.push({
      label: `KW${weekNum}`,
      year: current.getFullYear(),
      month: current.getMonth(),
      weekNum,
      startDate: new Date(current),
    });

    current.setDate(current.getDate() + 7);
  }

  if (currentMonthLabel && currentMonthSpan > 0) {
    months.push({ label: currentMonthLabel, colSpan: currentMonthSpan });
  }

  return { months, weeks };
}

/** ISO 8601 week number */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * Calculate horizontal position and width for a bar in the Gantt area.
 * @param {Date} barStart
 * @param {Date} barEnd
 * @param {Date} timelineStart - the startDate of the first week column
 * @param {number} colWidth - pixel width per week column
 * @returns {{ left: number, width: number }}
 */
export function getBarPosition(barStart, barEnd, timelineStart, colWidth) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const left = ((barStart - timelineStart) / msPerWeek) * colWidth;
  const width = Math.max(((barEnd - barStart) / msPerWeek) * colWidth, 4);
  return { left, width };
}

/**
 * Calculate the horizontal position for a milestone (single date).
 */
export function getMilestonePosition(date, timelineStart, colWidth) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return ((date - timelineStart) / msPerWeek) * colWidth;
}

/**
 * Parse a date value from Excel (can be serial number or string).
 */
export function parseExcelDate(value) {
  if (value == null || value === "") return null;
  // Excel serial date number
  if (typeof value === "number") {
    const epoch = new Date(1899, 11, 30);
    return new Date(epoch.getTime() + value * 86400000);
  }
  // Try ISO or German date format
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  // Try DD.MM.YYYY
  const parts = String(value).split(".");
  if (parts.length === 3) {
    const parsed = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/** Demo/sample data for when no Excel is imported */
export function getSampleData() {
  return [
    {
      id: "P-001",
      name: "Website Redesign",
      lead: "Müller",
      start: new Date(2026, 0, 5),
      end: new Date(2026, 4, 15),
      effort: [0, 10, 30, 60, 80, 90, 100, 100, 80, 60, 40, 20, 10, 0, 0, 0, 0, 0, 0, 0],
      milestones: [
        { date: new Date(2026, 1, 2), label: "Kickoff" },
        { date: new Date(2026, 3, 1), label: "Beta" },
      ],
    },
    {
      id: "P-002",
      name: "Mobile App",
      lead: "Schmidt",
      start: new Date(2026, 1, 1),
      end: new Date(2026, 7, 30),
      effort: [0, 0, 0, 5, 15, 30, 50, 70, 85, 95, 100, 90, 70, 50, 30, 15, 5, 0, 0, 0],
      milestones: [
        { date: new Date(2026, 3, 15), label: "MVP" },
        { date: new Date(2026, 6, 1), label: "Release" },
      ],
    },
    {
      id: "P-003",
      name: "API Integration",
      lead: "Müller",
      start: new Date(2026, 2, 10),
      end: new Date(2026, 5, 30),
      effort: [0, 0, 0, 0, 10, 40, 70, 100, 100, 80, 50, 20, 0, 0, 0, 0, 0, 0, 0, 0],
      milestones: [
        { date: new Date(2026, 4, 20), label: "Go-Live" },
      ],
    },
    {
      id: "P-004",
      name: "Datenmigration",
      lead: "Weber",
      start: new Date(2026, 3, 1),
      end: new Date(2026, 6, 15),
      effort: [0, 0, 0, 0, 0, 20, 50, 80, 100, 80, 50, 20, 0, 0, 0, 0, 0, 0, 0, 0],
      milestones: [
        { date: new Date(2026, 5, 1), label: "Migration Start" },
      ],
    },
    {
      id: "P-005",
      name: "CI/CD Pipeline",
      lead: "Schmidt",
      start: new Date(2026, 0, 15),
      end: new Date(2026, 3, 30),
      effort: [0, 20, 50, 80, 100, 90, 60, 30, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      milestones: [
        { date: new Date(2026, 2, 15), label: "Pipeline Live" },
      ],
    },
    {
      id: "P-006",
      name: "Security Audit",
      lead: "Fischer",
      start: new Date(2026, 4, 1),
      end: new Date(2026, 8, 30),
      effort: [0, 0, 0, 0, 0, 0, 0, 10, 30, 60, 80, 100, 90, 70, 50, 30, 10, 0, 0, 0],
      milestones: [
        { date: new Date(2026, 6, 15), label: "Bericht" },
        { date: new Date(2026, 8, 15), label: "Abschluss" },
      ],
    },
  ];
}
