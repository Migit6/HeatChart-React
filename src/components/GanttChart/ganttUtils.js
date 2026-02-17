/** 20 distinct, muted colors for project leads (Projektleitung) */
const COLOR_PALETTE = [
  "#4A90A4", "#9B6B4F", "#6B9B4F", "#8B6BA3", "#B8864F",
  "#4F7B8B", "#A34F6B", "#6BA37B", "#8B7B4F", "#6B6BA3",
  "#A3826B", "#4F9B7B", "#9B4F7B", "#7BA34F", "#8B4F6B",
  "#4F8B9B", "#A36B4F", "#6B4F9B", "#9BA34F", "#4F6B9B",
];

const managerColorMap = {};
let assignedCount = 0;

export function getManagerColor(manager) {
  if (!manager || manager === "-") return "#999";
  if (!managerColorMap[manager]) {
    managerColorMap[manager] = COLOR_PALETTE[assignedCount % COLOR_PALETTE.length];
    assignedCount++;
  }
  return managerColorMap[manager];
}

export function resetManagerColors() {
  for (const key of Object.keys(managerColorMap)) delete managerColorMap[key];
  assignedCount = 0;
}

export function getAllManagerColors() {
  return { ...managerColorMap };
}

/** Lighten a hex color toward white */
export function lightenColor(hex, amount = 0.6) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr},${ng},${nb})`;
}

/** Shorten "Daniel Wolf" → "Daniel W." */
export function shortenName(fullName) {
  if (!fullName || fullName === "-") return "-";
  const parts = fullName.trim().split(" ");
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

/** Shorten comma-separated names */
export function shortenNames(namesStr) {
  if (!namesStr || namesStr === "-") return "-";
  return namesStr
    .split(/[,;/]+/)
    .map((n) => shortenName(n.trim()))
    .filter(Boolean)
    .join(", ");
}

/**
 * Parse Excel workbook data (raw 2D array from sheet_to_json with header:1).
 * Format: Row 0 = headers (cols 0-4 are project info, 5+ are week ranges).
 * Each project = 3 rows: [milestones row, effort row, extra row].
 */
export function parseProjectData(rawData) {
  const weekColumns = [];
  const projects = [];

  if (!rawData || rawData.length === 0) return { projects, weekColumns };

  // Parse week columns from header row
  for (let i = 5; i < rawData[0].length; i++) {
    const header = rawData[0][i];
    if (header && typeof header === "string" && header.includes(".") && header.includes("-")) {
      weekColumns.push({ index: i, name: header });
    }
  }

  // Parse projects (3 rows each)
  for (let i = 1; i < rawData.length; i += 3) {
    const row = rawData[i];
    if (!row || !row[0] || typeof row[0] !== "number") continue;

    // Collect processors from all 3 rows (col 4)
    const processors = [];
    for (let r = 0; r < 3; r++) {
      if (i + r < rawData.length && rawData[i + r][4]) {
        const proc = rawData[i + r][4];
        if (proc && proc !== "" && proc !== "-") processors.push(proc);
      }
    }

    // Effort data from row 2 (i+1)
    const effort = [];
    if (i + 1 < rawData.length) {
      weekColumns.forEach((week, idx) => {
        const val = rawData[i + 1][week.index];
        effort.push({ week: idx, value: typeof val === "number" ? val : 0 });
      });
    }

    const project = {
      number: row[0],
      name: row[1] || "Unbenannt",
      gl: row[2] || "-",
      manager: row[3] || "-",
      processor: processors.join(", "),
      effort,
      milestones: [],
    };

    // Milestones: string values in week columns of row 1
    weekColumns.forEach((week, idx) => {
      const ms = row[week.index];
      if (ms && typeof ms === "string") {
        project.milestones.push({ week: idx, text: ms, weekName: week.name });
      }
    });

    if (project.milestones.length > 0) {
      project.startWeek = project.milestones[0].week;
      project.endWeek = project.milestones[project.milestones.length - 1].week;
    }

    projects.push(project);
  }

  return { projects, weekColumns };
}
