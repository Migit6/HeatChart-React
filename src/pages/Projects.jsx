import "./Pages.css";

function Projects() {
  const projects = [
    { id: 1, name: "Website Redesign", status: "Aktiv", tasks: 12, progress: 65 },
    { id: 2, name: "Mobile App", status: "Aktiv", tasks: 8, progress: 30 },
    { id: 3, name: "API Integration", status: "Geplant", tasks: 5, progress: 0 },
    { id: 4, name: "Datenmigration", status: "Abgeschlossen", tasks: 15, progress: 100 },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projekte</h1>
          <p className="page-subtitle">Verwalte und verfolge deine Projekte.</p>
        </div>
        <button className="btn btn-primary">+ Neues Projekt</button>
      </div>

      <div className="projects-list">
        {projects.map((project) => (
          <div key={project.id} className="card project-card">
            <div className="project-info">
              <h3 className="project-name">{project.name}</h3>
              <span className={`status-badge status-${project.status.toLowerCase()}`}>
                {project.status}
              </span>
            </div>
            <div className="project-meta">
              <span>{project.tasks} Aufgaben</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="progress-text">{project.progress}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
