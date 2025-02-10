import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginCard.css';

axios.defaults.withCredentials = true;

// Definir a URL base diretamente
const API_URL = process.env.REACT_APP_API_URL || 'https://projeto-valex.railway.internal/api';

interface LoginCardProps {
  type: 'gestor' | 'cooperado';
  onClose: () => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ type, onClose }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [produtores, setProdutores] = useState<Array<{ id: number; nome: string }>>([]);

  useEffect(() => {
    if (type === 'cooperado') {
        axios.get(`${API_URL}/produtores`, {
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('Dados recebidos:', response.data);
            setProdutores(response.data);
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            alert('Erro ao carregar lista de produtores. Por favor, tente novamente.');
        });
    }
}, [type]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'gestor') {
      if (username === 'adm' && password === '123') {
        navigate('/gestor-dashboard');
      } else {
        alert('Credenciais inválidas!');
      }
    } else {
      if (password === '123') {
        navigate('/cooperado-dashboard', { state: { cooperadoNome: username } });
      } else {
        alert('Senha inválida!');
      }
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <h2 className="login-title">
          Login - {type === 'gestor' ? 'Gestor' : 'Cooperado'}
        </h2>
        <form onSubmit={handleLogin} className="login-form">
          {type === 'gestor' ? (
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            />
          ) : (
            <select
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            >
              <option value="">Selecione um cooperado</option>
              {produtores.map((produtor) => (
                <option key={produtor.id} value={produtor.nome}>
                  {produtor.nome}
                </option>
              ))}
            </select>
          )}
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            autoComplete="new-password" 
          />
          <div className="login-buttons">
            <button type="submit" className="login-button">
              Entrar
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginCard;