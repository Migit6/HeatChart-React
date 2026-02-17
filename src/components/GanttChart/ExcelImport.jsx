import { useRef, useEffect } from "react";
import { read, utils } from "xlsx";
import { parseProjectData } from "./ganttUtils.js";

const STORAGE_KEY = "gantt_excel_data";

function processExcelData(data) {
  const wb = read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawData = utils.sheet_to_json(sheet, { header: 1, defval: null });
  return parseProjectData(rawData);
}

export default function ExcelImport({ onImport, hasData }) {
  const fileRef = useRef();

  // Auto-load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const arr = new Uint8Array(JSON.parse(saved));
      onImport(processExcelData(arr));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);

      // Save to localStorage for auto-load
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(data)));

      onImport(processExcelData(data));
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <label className="gantt-import-btn">
      {hasData ? "Daten aktualisieren" : "Excel importieren"}
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
