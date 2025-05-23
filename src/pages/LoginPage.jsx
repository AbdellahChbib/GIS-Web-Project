import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import '../styles/AuthPages.css';
import ehtpLogo from '../assets/EHTP_1.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <button className="back-button" onClick={() => navigate('/')}>
            <FiArrowLeft /> Retour
          </button>
          <img src={ehtpLogo} alt="EHTP Logo" className="auth-logo" />
        </div>

        <div className="auth-form-container">
          <div className="auth-welcome">
            <h1>Bienvenue</h1>
            <p>Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <div className="input-icon-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="auth-submit-btn">
              Se connecter
            </button>
          </form>

          <div className="auth-links">
            <a href="#" className="forgot-password">Mot de passe oublié ?</a>
            <p className="register-link">
              Pas encore de compte ?{' '}
              <button onClick={() => navigate('/register')} className="link-button">
                S'inscrire
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="auth-background">
        <div className="auth-background-overlay"></div>
      </div>
    </div>
  );
};

export default LoginPage; 