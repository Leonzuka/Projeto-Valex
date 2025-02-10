import React, { useState } from 'react';
import './Homepage.css';
import LoginCard from 'components/LoginCard';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [loginType, setLoginType] = useState<'gestor' | 'cooperado' | null>(null);
  const [theme, setTheme] = useState('light');

  const handleButtonClick = (type: 'gestor' | 'cooperado') => {
    setLoginType(type);
    setShowLogin(true);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="container">
      <button onClick={toggleTheme} className="theme-toggle">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="content">
        <h1>Sistema de Gestão Valex</h1>
        <div className="button-container">
          <button 
            className="button gestor" 
            onClick={() => handleButtonClick('gestor')}
          >
            Gestor
          </button>
          <button 
            className="button cooperado" 
            onClick={() => handleButtonClick('cooperado')}
          >
            Cooperado
          </button>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <a href="#" className="footer-link">Contato</a>
          <a href="#" className="footer-link">Documentação</a>
        </div>
      </footer>

      {showLogin && loginType && (
        <LoginCard
          type={loginType}
          onClose={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

export default App;