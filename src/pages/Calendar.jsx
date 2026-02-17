import GanttChart from "../components/GanttChart/index.js";
import "./Pages.css";

function Calendar() {
  return (
    <div className="page">
      <h1 className="page-title">Kalender</h1>
      <p className="page-subtitle">
        Gantt-Chart — Projektplanung und Meilensteine im Überblick.
      </p>
      <GanttChart />
    </div>
  );
}

export default Calendar;
