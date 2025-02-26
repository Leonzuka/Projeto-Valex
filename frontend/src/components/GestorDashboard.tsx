import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardCard from './DashboardCard';
import { useNavigate } from 'react-router-dom';
import PlanoContasReport from './PlanoContasReport';

interface ResumoDia {
  produtor_id: number;
  produtor_nome: string;
  produtor_sigla: string;
  total_pallets: number;
  detalhamento: {
    [variedade: string]: {
      total_pallets: number;
      classificacoes: {
        [classificacao: string]: number;
      };
    };
  };
}

interface Estatisticas {
  total_pallets_dia: number;
  produtores_ativos: number;
  atividades_por_tipo: {
    [key: string]: number;
  };
}

const GestorDashboard: React.FC = () => {
  const [resumos, setResumos] = useState<ResumoDia[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  const fetchDados = async () => {
    try {
      // Estatísticas
      const estatisticasResponse = await axios.get(`${process.env.REACT_APP_API_URL}/gestor/estatisticas`);
      setEstatisticas(estatisticasResponse.data);

      // Resumos
      const resumoResponse = await axios.get(`${process.env.REACT_APP_API_URL}/gestor/resumo-geral`);
      setResumos(resumoResponse.data);
  
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados');
      setIsLoading(false);
      console.error('Erro:', err);
    }
  };

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full border-4 border-gray-200 border-t-blue-500 rounded-full animate-[spin_1.5s_ease-in-out_infinite]">
            </div>
          </div>
          <p className="text-gray-600 text-lg font-medium animate-pulse">
            Carregando informações...
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Aguarde alguns instantes
          </p>
        </div>
      </div>
    );
  }

  // Renderiza o relatório do plano de contas
  if (activeSection === 'Plano de Contas') {
    return <PlanoContasReport onClose={() => setActiveSection('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard do Gestor</h1>
              <p className="mt-1 text-sm text-gray-500">
                Visão geral das atividades dos cooperados
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                onClick={() => setActiveSection('financeiro')}
              >
                Financeiro
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                onClick={() => setActiveSection('fiscal')}
              >
                Fiscal
              </button>
              <button
                className={`px-4 py-2 ${activeSection === 'Plano de Contas' 
                  ? 'bg-blue-800' 
                  : 'bg-blue-600 hover:bg-blue-700'} 
                  text-white rounded-lg transition-all`}
                onClick={() => setActiveSection('Plano de Contas')}
              >
                Plano de Contas
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                onClick={() => setActiveSection('relatorios')}
              >
                Relatórios
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas Gerais */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DashboardCard title="Total de Pallets Hoje">
              <div className="text-3xl font-bold text-blue-600">
                {estatisticas.total_pallets_dia}
              </div>
              <p className="text-gray-500 text-sm mt-1">pallets registrados</p>
            </DashboardCard>

            <DashboardCard title="Produtores Ativos Hoje">
              <div className="text-3xl font-bold text-green-600">
                {estatisticas.produtores_ativos}
              </div>
              <p className="text-gray-500 text-sm mt-1">produtores hoje</p>
            </DashboardCard>

            <DashboardCard title="Atividades por Tipo">
              <div className="space-y-2">
                {Object.entries(estatisticas.atividades_por_tipo).map(([tipo, quantidade]) => (
                  <div key={tipo} className="flex justify-between items-center">
                    <span className="text-gray-600">{tipo}</span>
                    <span className="font-semibold">{quantidade}</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        )}

        {/* Lista de Produtores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumos.map((resumo) => (
            <DashboardCard 
              key={resumo.produtor_id}
              title={`${resumo.produtor_nome} (${resumo.produtor_sigla})`}
              className="hover:shadow-2xl transition-shadow"
            >
              {/* Total Geral */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600">Total de Pallets</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resumo.total_pallets}
                </p>
              </div>

              {/* Detalhamento por Variedade */}
              <div className="space-y-4">
                {Object.entries(resumo.detalhamento).map(([variedade, dados]) => (
                  <div key={variedade} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700">{variedade}</h4>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      Total: {dados.total_pallets} pallets
                    </p>

                    {/* Classificações */}
                    {Object.entries(dados.classificacoes).map(([classificacao, quantidade]) => {
                      let displayText = '';
                      let bgColor = '';
                      let textColor = '';

                      // Converte a string da classificação para número
                      const classificacaoId = parseInt(classificacao);

                      switch (classificacaoId) {
                        case 1: // VALEX
                          displayText = '📦 VALEX';
                          bgColor = 'bg-blue-100';
                          textColor = 'text-blue-700';
                          break;
                        case 2: // VITACE
                          displayText = '📦 VITACE';
                          bgColor = 'bg-green-100';
                          textColor = 'text-green-700';
                          break;
                        case 3: // LINA
                          displayText = '📦 LINA';
                          bgColor = 'bg-purple-100';
                          textColor = 'text-purple-700';
                          break;
                        case 4: // EXTRA
                          displayText = '📦 EXTRA';
                          bgColor = 'bg-yellow-100';
                          textColor = 'text-yellow-700';
                          break;
                        case 5: // LININHA
                          displayText = '📦 LININHA';
                          bgColor = 'bg-pink-100';
                          textColor = 'text-pink-700';
                          break;
                        case 6: // VALEX SACOLA
                          displayText = '🛍️ VALEX SACOLA';
                          bgColor = 'bg-red-100';
                          textColor = 'text-red-700';
                          break;
                        default:
                          displayText = `Classificação ${classificacao}`;
                          bgColor = 'bg-gray-100';
                          textColor = 'text-gray-600';
                      }

                      return (
                        <div 
                          key={classificacao} 
                          className={`flex justify-between items-center text-sm p-1 rounded mt-1 ${bgColor}`}
                        >
                          <span className={`${textColor} font-medium`}>
                            {displayText}
                          </span>
                          <span className="font-medium">{quantidade} pallets</span>
                        </div>
                      );
                    })}
                      </div>
                ))}

                {Object.keys(resumo.detalhamento).length === 0 && (
                  <p className="text-sm text-gray-500 text-center italic">
                    Nenhuma atividade registrada hoje
                  </p>
                )}
              </div>
            </DashboardCard>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">© 2025 Sistema Valex</p>
            <p className="text-sm text-gray-400 mt-2">Dashboard do Gestor v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GestorDashboard;