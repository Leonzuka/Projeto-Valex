import React, { useState, useEffect } from 'react';
import LoginCard from 'components/LoginCard';
import './Homepage.css';

function Homepage() {
  const [showLogin, setShowLogin] = useState(false);
  const [loginType, setLoginType] = useState<'gestor' | 'cooperado' | null>(null);
  const [theme, setTheme] = useState('light');
  
  // Verificar se há um tema salvo na primeira montagem
  useEffect(() => {
    // Verificar se o usuário tem uma preferência salva
    const savedTheme = localStorage.getItem('theme');
    
    // Se houver, usar essa preferência
    if (savedTheme) {
      setTheme(savedTheme);
      
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Se não houver, verificar a preferência do sistema
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  // Efeito para atualizar o tema sempre que ele mudar
  useEffect(() => {
    // Definir o atributo data-theme no documento HTML
    document.documentElement.setAttribute('data-theme', theme);
    
    // Adicionar ou remover a classe 'dark' no HTML para o Tailwind
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleButtonClick = (type: 'gestor' | 'cooperado') => {
    setLoginType(type);
    setShowLogin(true);
  };

  const toggleTheme = () => {
    // Primeiro verificamos o tema atual
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Depois atualizamos o estado
    setTheme(newTheme);
    
    // Salvamos a preferência no localStorage
    localStorage.setItem('theme', newTheme);
    
    // Definimos o atributo no elemento HTML
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Adicionamos ou removemos a classe 'dark' diretamente
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 text-gray-800 dark:text-gray-200 transition-colors duration-300">
      {/* Botão de tema */}
      <button 
        onClick={toggleTheme} 
        className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-lg text-xl transition-all duration-300 hover:scale-110 z-10"
        aria-label="Alternar tema"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
      
      {/* Cabeçalho */}
      <header className="pt-16 pb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
          Cooperativa ValexFruit
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto px-4">
          Plataforma integrada para gestão dos cooperados
        </p>
      </header>
      
      {/* Conteúdo principal */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="grid grid-cols-1 gap-6 mb-12">
            <button 
              onClick={() => handleButtonClick('gestor')}
              className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">Gestor</span>
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Acesso administrativo para gerenciamento</p>
              </div>
            </button>
            
            <button 
              onClick={() => handleButtonClick('cooperado')}
              className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Cooperado</span>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">Acesso dedicado para os cooperados</p>
              </div>
            </button>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-4 text-center shadow-md backdrop-blur-sm">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <strong>Acesso Gestor:</strong> Usuário: adm | Senha: 123
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Acesso Cooperados:</strong> Senha padrão: 123
          </p>
        </div>
      </main>
      
      {/* Rodapé */}
      <footer className="py-8 px-4 text-center">
        <div className="flex justify-center space-x-6 mb-4">
          <a 
            href="mailto:contato@valex.com.br"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contato
          </a>
          <a 
            href="https://github.com/seu-repositorio/documentacao"
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentação
          </a>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} Sistema Valex • Todos os direitos reservados
        </p>
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

export default Homepage;