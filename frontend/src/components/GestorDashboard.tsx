import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Produtor {
  id: number;
  nome: string;
  ggn: string | null;
}

interface ResumoDia {
  produtor_id: number;
  produtor_nome: string;
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

const GestorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [produtores, setProdutores] = useState<Produtor[]>([]);
  const [resumos, setResumos] = useState<ResumoDia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Buscar produtores
        const produtoresResponse = await axios.get(`${process.env.REACT_APP_API_URL}/produtores`);
        setProdutores(produtoresResponse.data);

        // Buscar resumos para cada produtor
        const resumosPromises = produtoresResponse.data.map(async (produtor: Produtor) => {
          const resumoResponse = await axios.get(`${process.env.REACT_APP_API_URL}/atividades/resumo/${produtor.id}`);
          return {
            produtor_id: produtor.id,
            produtor_nome: produtor.nome,
            ...resumoResponse.data
          };
        });

        const resumosData = await Promise.all(resumosPromises);
        setResumos(resumosData);
        setIsLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados');
        setIsLoading(false);
      }
    };

    fetchData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Dashboard do Gestor
            </h1>
              <Link to="/importacao-financeira" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all mr-4">
                Importar Dados
              </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumos.map((resumo) => (
              <div
                key={resumo.produtor_id}
                className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow"
              >
                {/* Cabeçalho do Card */}
                <div className="border-b pb-4 mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {resumo.produtor_nome}
                  </h3>
                </div>

                {/* Total Geral */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-600">Total de Pallets</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {resumo.total_pallets}
                  </p>
                </div>

                {/* Detalhamento por Variedade e Classificação */}
                <div className="space-y-4">
                  {Object.entries(resumo.detalhamento).map(([variedade, dados]) => (
                    <div key={variedade} className="bg-gray-50 p-4 rounded-lg">
                      {/* Cabeçalho da Variedade */}
                      <div className="border-b border-gray-200 pb-2 mb-2">
                        <h4 className="font-medium text-gray-700">{variedade}</h4>
                        <p className="text-sm font-semibold text-gray-800">
                          Total: {dados.total_pallets} pallets
                        </p>
                      </div>

                      {/* Detalhamento das Classificações */}
                      {Object.entries(dados.classificacoes).length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500 uppercase">
                            Classificações:
                          </p>
                          {Object.entries(dados.classificacoes).map(([classificacao, quantidade]) => (
                            <div key={classificacao} className="flex justify-between items-center bg-white p-2 rounded">
                              <span className="text-sm text-gray-600">{classificacao}</span>
                              <span className="text-sm font-medium text-gray-800">
                                {quantidade} pallets
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Sem classificações registradas
                        </p>
                      )}
                    </div>
                  ))}

                  {Object.keys(resumo.detalhamento).length === 0 && (
                    <p className="text-sm text-gray-500 text-center italic">
                      Nenhuma atividade registrada hoje
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">© 2025 Sistema Valex</p>
            <p className="text-sm text-gray-400 mt-2">Versão 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GestorDashboard;