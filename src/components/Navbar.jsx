import { NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon">🔥</span>
          <span className="brand-text">HeatChart</span>
        </NavLink>
        <ul className="navbar-links">
          <li>
            <NavLink to="/" end className="nav-link">
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/projects" className="nav-link">
              Projekte
            </NavLink>
          </li>
          <li>
            <NavLink to="/calendar" className="nav-link">
              Kalender
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className="nav-link">
              Einstellungen
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
