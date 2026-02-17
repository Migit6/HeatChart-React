import "./Pages.css";

function Calendar() {
  const events = [
    { id: 1, title: "Sprint Planning", date: "2026-02-18", time: "09:00" },
    { id: 2, title: "Design Review", date: "2026-02-19", time: "14:00" },
    { id: 3, title: "Release v2.0", date: "2026-02-20", time: "10:00" },
    { id: 4, title: "Retrospektive", date: "2026-02-21", time: "15:00" },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Kalender</h1>
      <p className="page-subtitle">Behalte deine Termine und Deadlines im Blick.</p>

      <section className="section">
        <h2 className="section-title">Anstehende Termine</h2>
        <div className="events-list">
          {events.map((event) => (
            <div key={event.id} className="card event-card">
              <div className="event-date">
                <span className="event-day">
                  {new Date(event.date).toLocaleDateString("de-DE", { day: "2-digit" })}
                </span>
                <span className="event-month">
                  {new Date(event.date).toLocaleDateString("de-DE", { month: "short" })}
                </span>
              </div>
              <div className="event-info">
                <h3 className="event-title">{event.title}</h3>
                <span className="event-time">{event.time} Uhr</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Calendar;
