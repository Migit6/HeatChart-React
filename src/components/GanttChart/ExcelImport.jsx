import { useRef } from "react";
import { read, utils } from "xlsx";
import { parseExcelDate } from "./ganttUtils.js";

/**
 * Expected Excel columns:
 *   Projektnummer | Projektname | GL | Start | Ende | Meilenstein-Datum | Meilenstein-Label | Aufwand (comma-separated %)
 */
export default function ExcelImport({ onImport }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = read(evt.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws, { defval: "" });

      const projectMap = new Map();

      for (const row of rows) {
        const id =
          row["Projektnummer"] || row["ProjektNr"] || row["ID"] || row["Nr"] || "";
        const name =
          row["Projektname"] || row["Projekt"] || row["Name"] || "";
        const lead =
          row["GL"] || row["Projektleitung"] || row["Lead"] || "";
        const start = parseExcelDate(
          row["Start"] || row["Beginn"] || row["Von"] || ""
        );
        const end = parseExcelDate(
          row["Ende"] || row["Bis"] || row["End"] || ""
        );
        const effortRaw =
          row["Aufwand"] || row["Effort"] || row["Kurve"] || "";
        const msDate = parseExcelDate(
          row["Meilenstein-Datum"] || row["MS-Datum"] || row["Milestone"] || ""
        );
        const msLabel =
          row["Meilenstein-Label"] || row["MS-Label"] || row["Meilenstein"] || "";

        if (!id || !name || !start || !end) continue;

        const key = String(id);
        if (!projectMap.has(key)) {
          const effort = effortRaw
            ? String(effortRaw)
                .split(",")
                .map((v) => parseFloat(v.trim()) || 0)
            : [];

          projectMap.set(key, {
            id: key,
            name: String(name),
            lead: String(lead),
            start,
            end,
            effort,
            milestones: [],
          });
        }

        const proj = projectMap.get(key);
        if (msDate && msLabel) {
          proj.milestones.push({ date: msDate, label: String(msLabel) });
        }
      }

      onImport(Array.from(projectMap.values()));
      // Reset input so the same file can be re-imported
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <label className="gantt-import-btn">
      Excel importieren
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFile}
        hidden
      />
    </label>
  );
}
