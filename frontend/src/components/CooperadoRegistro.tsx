import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

interface CooperadoRegistroProps {
  cooperadoNome: string;
}

interface Fazenda {
  id: number;
  nome: string;
  area_parcela: string;
  variedade_id: number;
  variedade_nome: string;
}

interface Classificacao {
  id: number;
  classificacao: string;
  caixa: string;
  cinta: string;
  peso: string;
  cumbuca: string;
}

interface Produtor {
  id: number;
  nome: string;
  ggn: string;
  sigla: string;
}

interface ResumoDia {
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

interface Atividade {
  id: number;
  tipo_atividade: string;
  quantidade_pallets: number;
  created_at: string;
  fazenda: string;
  area_parcela: string;
  variedade: string;
  classificacao?: string;
}

const CooperadoRegistro: React.FC<CooperadoRegistroProps> = ({ cooperadoNome }) => {
  const navigate = useNavigate();
  const [produtor, setProdutor] = useState<Produtor | null>(null);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [selectedFazenda, setSelectedFazenda] = useState<string>('');
  const [selectedClassificacao, setSelectedClassificacao] = useState<string>('');
  const [tipoAtividade, setTipoAtividade] = useState('');
  const [quantidadePallets, setQuantidadePallets] = useState('');
  const [resumoDia, setResumoDia] = useState<ResumoDia>({
    total_pallets: 0,
    detalhamento: {}
  });
  const [historico, setHistorico] = useState<Atividade[]>([]);

  const fetchResumoDia = useCallback(async () => {
    if (!produtor) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/atividades/resumo/${produtor.id}`);
      setResumoDia(response.data);
    } catch (error) {
      console.error('Erro ao buscar resumo do dia:', error);
    }
  }, [produtor]);
  useEffect(() => {
    if (!produtor?.id) return;
  
    // Buscar resumo inicial
    fetchResumoDia();
  
    // Configurar intervalo de atualização (a cada 30 segundos)
    const interval = setInterval(fetchResumoDia, 30000);
  
    // Limpar intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, [produtor?.id, fetchResumoDia]); // Adicione fetchResumoDia como dependência

  useEffect(() => {
    const fetchProdutorData = async () => {
      try {
        // Buscar todos os produtores
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/produtores`);
        console.log('Resposta da API (produtores):', response.data);
        const produtores = response.data;
        
        // Encontrar o produtor pelo nome
        const produtorEncontrado = produtores.find(
          (p: Produtor) => p.nome === cooperadoNome
        );
        
        if (produtorEncontrado) {
          setProdutor(produtorEncontrado);
          
          // Buscar fazendas do produtor
          const fazendasResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/fazendas/produtor/${produtorEncontrado.id}`
          );
          console.log('Resposta da API (fazendas):', fazendasResponse.data);
          setFazendas(fazendasResponse.data);
        } else {
          console.error('Produtor não encontrado:', cooperadoNome);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do produtor:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente.');
      }
    };
  
    fetchProdutorData();
  }, [cooperadoNome]);

  useEffect(() => {
    const fetchClassificacoes = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/classificacoes`);
        setClassificacoes(response.data);
      } catch (error) {
        console.error('Erro ao buscar classificações:', error);
      }
    };

    fetchClassificacoes();
  }, []);

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!produtor?.id) return;
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/atividades/historico/${produtor.id}`)
        setHistorico(response.data);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      }
    };
  
    if (produtor?.id) {
      fetchHistorico();
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchHistorico, 30000);
      return () => clearInterval(interval);
    }
  }, [produtor?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtor || !selectedFazenda) return;

    const fazenda = fazendas.find(f => f.id.toString() === selectedFazenda);
    if (!fazenda) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/atividades`, {
        produtor_id: produtor.id,
        fazenda_id: parseInt(selectedFazenda),
        variedade_id: fazenda.variedade_id,
        classificacao_id: parseInt(selectedClassificacao),
        tipo_atividade: tipoAtividade,
        quantidade_pallets: tipoAtividade === 'COLHEITA' ? 0 : parseInt(quantidadePallets)
      });

      alert('Atividade registrada com sucesso!');
      setSelectedFazenda('');
      setSelectedClassificacao('');
      setTipoAtividade('');
      setQuantidadePallets('');
      fetchResumoDia();
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      alert('Erro ao registrar atividade');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      {/* Header mais moderno */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Sistema Valex
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {cooperadoNome.charAt(0)}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{cooperadoNome}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Registro de Atividade
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Atividade
                  </label>
                  <select
                    value={tipoAtividade}
                    onChange={(e) => setTipoAtividade(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione a Atividade</option>
                    <option value="COLHEITA">Colheita</option>
                    <option value="EMBALAGEM">Embalagem</option>
                    <option value="TRANSPORTE">Transporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fazenda
                  </label>
                  <select
                    value={selectedFazenda}
                    onChange={(e) => setSelectedFazenda(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione a fazenda</option>
                    {fazendas.map((fazenda) => (
                      <option key={fazenda.id} value={fazenda.id}>
                        {fazenda.nome} - {fazenda.area_parcela}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variedade
                  </label>
                  <input
                    type="text"
                    value={fazendas.find(f => f.id.toString() === selectedFazenda)?.variedade_nome || ''}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>

                {tipoAtividade === 'EMBALAGEM' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Classificação
                    </label>
                    <select
                      value={selectedClassificacao}
                      onChange={(e) => setSelectedClassificacao(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione a classificação</option>
                      {classificacoes.map((classificacao) => (
                        <option key={classificacao.id} value={classificacao.id}>
                          {classificacao.classificacao} - {classificacao.peso} - {classificacao.cumbuca}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tipoAtividade !== 'COLHEITA' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade de Pallets
                    </label>
                    <input
                      type="number"
                      value={quantidadePallets}
                      onChange={(e) => setQuantidadePallets(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Registrar Atividade
                </button>
              </form>
            </div>
          </div>

          {/* Card de Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-200 hover:shadow-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Resumo do Dia
              </h3>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total de Pallets</p>
                  <p className="text-2xl font-bold text-green-600">{resumoDia.total_pallets}</p>
                </div>

                {resumoDia.detalhamento && Object.entries(resumoDia.detalhamento).map(([variedade, dados]) => (
                  <div key={variedade} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">{variedade}</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {dados.total_pallets} pallets
                    </p>
                    
                    {Object.entries(dados.classificacoes).map(([classificacao, quantidade]) => (
                      <div key={classificacao} className="mt-2 pl-4 border-l-2 border-blue-200">
                        <p className="text-sm text-gray-600">
                          {classificacao}: {quantidade} pallets
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Histórico de Atividades */}
        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-200 hover:shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Histórico de Atividades
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atividade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fazenda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variedade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classificação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pallets</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historico.map((atividade) => (
                    <tr key={atividade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{atividade.created_at}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          atividade.tipo_atividade === 'COLHEITA' 
                            ? 'bg-green-100 text-green-800' 
                            : atividade.tipo_atividade === 'EMBALAGEM'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {atividade.tipo_atividade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{atividade.fazenda}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{atividade.area_parcela}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{atividade.variedade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {atividade.tipo_atividade === 'EMBALAGEM' ? (atividade.classificacao || '-') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {atividade.tipo_atividade === 'COLHEITA' ? '-' : atividade.quantidade_pallets}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historico.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  Nenhuma atividade registrada ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Moderno */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500">
              © 2025 Sistema Valex
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Versão 1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CooperadoRegistro;