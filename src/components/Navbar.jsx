import { useState } from 'react';
import { FiMenu, FiX, FiHome, FiMap, FiDatabase, FiMail, FiSearch, FiUser, FiGlobe, FiBell } from 'react-icons/fi';
import ehtpLogo from '../assets/EHTP_1.png';
import '../styles/Navbar.css';
import { Link } from 'react-router-dom';


function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={ehtpLogo} alt="Logo EHTP" className="ehtp-logo" />
        </div>

        <div className="navbar-controls">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
            <li>
              <Link to="/" className="nav-link hover-effect">
                <FiHome className="nav-icon" />
                Accueil
              </Link>
            </li>

            <li>
              <Link to="/carte" className="nav-link hover-effect">
                <FiMap className="nav-icon" />
                Cartes
              </Link>
            </li>
            <li>
              <a href="#" className="nav-link hover-effect">
                <FiDatabase className="nav-icon" />
                Données
              </a>
            </li>
            <li>
              <a href="#" className="nav-link hover-effect">
                <FiMail className="nav-icon" />
                Contact
              </a>
            </li>
          </ul>


          <div className="navbar-actions">

            <div className="language-selector">
              <FiGlobe className="action-icon" />
              <select className="language-dropdown">
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </div>

            {isLoggedIn ? (
              <div className="user-profile">
                <img
                  src="https://via.placeholder.com/40"
                  alt="Profile"
                  className="profile-picture"
                />
                <div className="profile-menu">
                  <a href="#account">Mon Compte</a>
                  <a href="#logout">Déconnexion</a>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="login-btn">Connexion</button>
                <button className="signup-btn">Inscription</button>
              </div>
            )}
          </div>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;