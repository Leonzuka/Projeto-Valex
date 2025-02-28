import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginCard.css';
import { useTheme } from './ThemeContext';

// Definir a URL base diretamente
const API_URL = process.env.REACT_APP_API_URL || 'https://cooperativavalexfruit.up.railway.app/api';

// Configuração global do axios
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

interface LoginCardProps {
  type: 'gestor' | 'cooperado';
  onClose: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ type, onClose }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [produtores, setProdutores] = useState<Array<{ id: number; nome: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (type === 'cooperado') {
      setIsLoading(true);
      axios.get(`${API_URL}/produtores`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        console.log('Dados recebidos:', response.data);
        setProdutores(response.data);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Erro completo:', error);
        console.error('Erro detalhado:', error.response?.data || error.message);
        
        // Mensagem mais específica para o usuário
        const mensagem = error.response?.data?.details || 
                        error.response?.data?.error || 
                        'Erro ao carregar lista de produtores. Por favor, tente novamente.';
        alert(mensagem);
        setIsLoading(false);
      });
    }
  }, [type]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (type === 'gestor') {
        if (username === 'contábil' && password === 'Valex25') {
          navigate('/gestor-dashboard');
        } else {
          alert('Credenciais inválidas!');
        }
      } else {
        // Sistema de senhas para cada cooperado
        const senhasCooperados: {[key: string]: string} = {
          'ADOLAR JOSE KOEHLER': 'Ajk@2025',
          'ALDEMIR DE ARAUJO RODRIGUES': 'Ada#7531',
          'ANDERSON DE CASTRO AMORIM': 'Adc$8642',
          'GERALDO DE ARAUJO AMARIZ': 'Gda&2468',
          'GILDETE ANTUNES DE MACEDO': 'Gad*1357',
          'JAIRO JOSE CAVALCANTI COELHO': 'Jjc!9753',
          'MARCELO GOMES PEREIRA': 'Mgp#2580',
          'MARCOS ANTONIO DE MACEDO': 'Mad@1470',
          'NADIR ANTONIO KOEHLER': 'Nak$3690',
          'REGIVALDO LINO PEREIRA': 'Rlp&4812',
          'ROGERIA DE OLIVEIRA SOARES': 'Rdo*5923',
          'ROMULO NUNO SANTANA AMARIZ': 'Rns!7046'
        };

        const senhaCorreta = senhasCooperados[username] || '';
        
        if (password === senhaCorreta) {
          navigate('/cooperado-dashboard', { state: { cooperadoNome: username } });
        } else {
            alert('Senha inválida para o cooperado selecionado!');
          }
      }
      setIsLoading(false);
    }, 300); // Pequeno delay para mostrar o estado de loading
  };

  const cardClasses = `login-card ${theme === 'dark' ? 'dark' : ''}`;

  return (
    <div className="login-overlay" onClick={onClose}>
      <div 
        className={cardClasses}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="login-header">
          <h2 className="login-title">
            {type === 'gestor' ? 'Acesso de Gestor' : 'Acesso de Cooperado'}
          </h2>
          <button 
            onClick={onClose} 
            className="login-close-button"
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {type === 'gestor' ? (
            <div className="login-input-group">
              <label htmlFor="username" className="login-label">Usuário</label>
              <input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                required
              />
            </div>
          ) : (
            <div className="login-input-group">
              <label htmlFor="cooperado" className="login-label">Cooperado</label>
              {isLoading ? (
                <div className="login-loading-select">
                  <div className="login-loading-spinner"></div>
                  <span>Carregando...</span>
                </div>
              ) : (
                <select
                  id="cooperado"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input login-select"
                  required
                >
                  <option value="">Selecione um cooperado</option>
                  {produtores.map((produtor) => (
                    <option key={produtor.id} value={produtor.nome}>
                      {produtor.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          
          <div className="login-input-group">
            <label htmlFor="password" className="login-label">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="login-buttons">
            <button 
              type="button" 
              onClick={onClose} 
              className="login-button cancel-button"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="login-button submit-button"
              disabled={isLoading || (!username || !password)}
            >
              {isLoading ? (
                <span className="login-button-loading">
                  <span className="login-loading-dot"></span>
                  <span className="login-loading-dot"></span>
                  <span className="login-loading-dot"></span>
                </span>
              ) : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginCard;