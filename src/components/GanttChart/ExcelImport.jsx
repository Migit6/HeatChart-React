import { useRef } from "react";
import { read, utils } from "xlsx";
import { parseProjectData } from "./ganttUtils.js";

export default function ExcelImport({ onImport }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const wb = read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawData = utils.sheet_to_json(sheet, { header: 1, defval: null });

      const result = parseProjectData(rawData);
      onImport(result);

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
