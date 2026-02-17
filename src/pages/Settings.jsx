import "./Pages.css";

function Settings() {
  return (
    <div className="page">
      <h1 className="page-title">Einstellungen</h1>
      <p className="page-subtitle">Passe HeatChart an deine Bedürfnisse an.</p>

      <section className="section">
        <h2 className="section-title">Profil</h2>
        <div className="card settings-card">
          <div className="setting-row">
            <label className="setting-label">Name</label>
            <input type="text" className="setting-input" placeholder="Dein Name" />
          </div>
          <div className="setting-row">
            <label className="setting-label">E-Mail</label>
            <input type="email" className="setting-input" placeholder="name@example.com" />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Benachrichtigungen</h2>
        <div className="card settings-card">
          <div className="setting-row">
            <label className="setting-label">E-Mail-Benachrichtigungen</label>
            <input type="checkbox" className="setting-checkbox" defaultChecked />
          </div>
          <div className="setting-row">
            <label className="setting-label">Projekt-Updates</label>
            <input type="checkbox" className="setting-checkbox" defaultChecked />
          </div>
          <div className="setting-row">
            <label className="setting-label">Wöchentlicher Bericht</label>
            <input type="checkbox" className="setting-checkbox" />
          </div>
        </div>
      </section>

      <button className="btn btn-primary">Speichern</button>
    </div>
  );
}

export default Settings;
