import "./Pages.css";

function Dashboard() {
  const stats = [
    { label: "Aktive Projekte", value: 5 },
    { label: "Offene Aufgaben", value: 23 },
    { label: "Abgeschlossen", value: 48 },
    { label: "Teammitglieder", value: 8 },
  ];

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Willkommen bei HeatChart — dein Projekt-Management auf einen Blick.</p>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <section className="section">
        <h2 className="section-title">Letzte Aktivitäten</h2>
        <div className="card">
          <p className="placeholder-text">Hier werden bald deine letzten Aktivitäten angezeigt.</p>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
