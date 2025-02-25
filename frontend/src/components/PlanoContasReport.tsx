import React, { useState, useEffect, useRef } from 'react';
import {Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface PlanoContasReportProps {
  onClose: () => void;
}

interface Conta {
    id?: number;           
    sequencial: string;
    codigo: string;
    tipo: string;
    descricao: string;
    referencia: string;
    nivel?: number;     
    permite_lancamento?: boolean;
  }

interface EstruturaGrupo {
  descricao: string;
  subcontas: Conta[];
  contas: Conta[];
}

interface DataType {
  total: number;
  contasSinteticas: number;
  contasAnaliticas: number;
  distribuicaoGrupos: {
    grupo: string;
    quantidade: number;
    fill: string;
  }[];
  estruturaPorGrupo: {
    [key: string]: EstruturaGrupo;
  };
  contasCompletas: Conta[];
  gruposPrincipais: {
    [key: string]: string;
  };
}
// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PlanoContasReport: React.FC<PlanoContasReportProps> = ({ onClose }) => {
    const [data, setData] = useState<DataType>({
        total: 0,
        contasSinteticas: 0,
        contasAnaliticas: 0,
        distribuicaoGrupos: [],
        estruturaPorGrupo: {},
        contasCompletas: [],
        gruposPrincipais: {}
      });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('resumo');
    const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
    const [search, setSearch] = useState<string>('');
    const [filteredAccounts, setFilteredAccounts] = useState<Conta[]>([]);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
  
  

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/contabilidade/plano-contas`);
        const contasData = response.data;
        
        // Processar os dados
        const total = contasData.length;
        const contasSinteticas = contasData.filter((conta: Conta) => conta.tipo === 'S').length;
        const contasAnaliticas = contasData.filter((conta: Conta) => conta.tipo === 'A').length;
        
        const gruposPrincipais: {[key: string]: string} = {};
        contasData.filter((conta: Conta) => conta.nivel === 1).forEach((conta: Conta) => {
            gruposPrincipais[conta.codigo] = conta.descricao;
        });
        
        // Calcular distribuição por grupo
        const distribuicaoGrupos = Object.keys(gruposPrincipais).map((grupo: string, index: number) => ({
            grupo: `${grupo} - ${gruposPrincipais[grupo]}`,
            quantidade: contasData.filter((conta: Conta) => conta.codigo.startsWith(grupo)).length || 0,
            fill: COLORS[index % COLORS.length]
        }));
        
        // Agrupar contas por grupo principal
        const estruturaPorGrupo: {[key: string]: EstruturaGrupo} = {};
        Object.keys(gruposPrincipais).forEach(grupo => {
        const contasDoGrupo = contasData.filter((conta: Conta) => 
            conta.codigo.startsWith(grupo)
        ) || [];

        const subcontasDoGrupo = contasData.filter((conta: Conta) => 
            conta.codigo.startsWith(grupo + '.') && 
            conta.codigo.split('.').length === 2
        ) || [];

        estruturaPorGrupo[grupo] = {
            descricao: gruposPrincipais[grupo],
            subcontas: subcontasDoGrupo,
            contas: contasDoGrupo
        };
        });
        
        setData({
            total,
            contasSinteticas,
            contasAnaliticas,
            distribuicaoGrupos,
            estruturaPorGrupo,
            contasCompletas: contasData,
            gruposPrincipais: gruposPrincipais
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar os dados do plano de contas. Por favor, tente novamente.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [COLORS]);

  useEffect(() => {
    if (data && search.trim()) {
      const term = search.toLowerCase();
      const filtered = data.contasCompletas.filter(conta => 
        conta.codigo.toLowerCase().includes(term) || 
        conta.descricao.toLowerCase().includes(term)
      );
      setFilteredAccounts(filtered);
    } else {
      setFilteredAccounts([]);
    }
  }, [search, data]);

  const toggleGroup = (grupo: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [grupo]: !prev[grupo]
    }));
  };
  
  const renderAccountsTree = (grupo: string) => {
    if (!data) return null;
    
    // Ordena as subcontas por código para exibição organizada
    const accounts = [...data.estruturaPorGrupo[grupo].subcontas].sort((a, b) => 
      a.codigo.localeCompare(b.codigo)
    );
    
    return (
      <div className="ml-4 mt-2">
        {accounts.map(conta => (
          <div key={conta.sequencial || conta.id?.toString() || conta.codigo}>
            <div className="flex items-start">
              <button
                className="mr-2 px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
                onClick={() => renderSubAccounts(conta.codigo)}
              >
                {expandedGroups[conta.codigo] ? '-' : '+'}
              </button>
              <div>
                <div className="font-medium">{conta.codigo} - {conta.descricao}</div>
                {expandedGroups[conta.codigo] && renderSubAccountsList(conta.codigo)}
              </div>
            </div>
          </div>
        ))}
        
        {accounts.length === 0 && (
          <div className="text-gray-500">Nenhuma subconta encontrada para este grupo</div>
        )}
      </div>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    let file = e.target.files[0];
    
    // Verificar se é um CSV (independente de maiúsculas/minúsculas)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('Erro: O arquivo deve ter extensão .csv');
      return;
    }
    
    // Criar um novo arquivo com nome em minúsculas se necessário
    if (file.name !== file.name.toLowerCase()) {
      const newFileName = file.name.toLowerCase();
      file = new File([file], newFileName, { type: file.type });
    }
    
    setIsUploading(true);
    setUploadStatus('Enviando arquivo...');
    
    const formData = new FormData();
    formData.append('arquivo', file);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/contabilidade/importar-plano`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setUploadStatus(`Importação concluída! Importados: ${response.data.registros_importados}, Atualizados: ${response.data.registros_atualizados}`);
    } catch (error: any) {
        console.error('Erro ao enviar arquivo:', error);
        // Exibe mensagem de erro mais detalhada
        const errorMessage = error.response?.data?.error || 'Erro desconhecido';
        const errorDetails = JSON.stringify(error.response?.data || {});
        console.log('Detalhes do erro:', errorDetails);
        setUploadStatus(`Erro na importação: ${errorMessage}. Detalhes: ${errorDetails}`);
      } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const renderSubAccounts = (codigo: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [codigo]: !prev[codigo]
    }));
  };
  
  const renderSubAccountsList = (codigo: string) => {
    if (!data) return null;
    
    // Filtrar e ordenar as subcontas pelo código
    const subAccounts = data.contasCompletas
      .filter(conta => 
        conta.codigo.startsWith(codigo + '.') && 
        (conta.codigo.match(/\./g) || []).length === codigo.split('.').length
      )
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    if (subAccounts.length === 0) {
      return <div className="text-gray-500 ml-4 mt-1">Nenhuma subconta encontrada</div>;
    }
    
    return (
      <div className="ml-4 mt-1">
        {subAccounts.slice(0, 10).map(subconta => (
          <div key={subconta.sequencial || subconta.id?.toString() || subconta.codigo}>
            <div className="flex items-start">
              <button
                className="mr-2 px-2 py-0 text-xs bg-blue-50 hover:bg-blue-100 rounded"
                onClick={() => renderSubAccounts(subconta.codigo)}
              >
                {expandedGroups[subconta.codigo] ? '-' : '+'}
              </button>
              <div>
                <div className={`${subconta.tipo === 'A' ? 'text-green-600' : 'font-medium'}`}>
                  {subconta.codigo} - {subconta.descricao}
                </div>
                {expandedGroups[subconta.codigo] && renderSubAccountsList(subconta.codigo)}
              </div>
            </div>
          </div>
        ))}
        {subAccounts.length > 10 && (
          <div className="ml-4 mt-1 text-gray-500 text-sm">
            ... mais {subAccounts.length - 10} contas
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">Carregando dados...</div>;
    }
    
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    
    if (!data) {
      return <div className="text-center p-8">Nenhum dado disponível</div>;
    }
    
    switch (activeTab) {
      case 'resumo':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Resumo do Plano de Contas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-700">Total de Contas</h3>
                <p className="text-3xl font-bold text-blue-600">{data.total}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-700">Contas Sintéticas</h3>
                <p className="text-3xl font-bold text-green-600">{data.contasSinteticas}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-700">Contas Analíticas</h3>
                <p className="text-3xl font-bold text-orange-600">{data.contasAnaliticas}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium text-gray-700">Grupos Principais</h3>
                <p className="text-3xl font-bold text-purple-600">{Object.keys(data.gruposPrincipais).length}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-4">Distribuição por Grupo</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.distribuicaoGrupos}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="quantidade"
                      nameKey="grupo"
                      label={({ grupo, quantidade }) => `${grupo.split(' - ')[0]}: ${quantidade}`}
                    >
                      {data.distribuicaoGrupos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="text-lg font-medium mb-4">Estrutura Principal do Plano de Contas</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total de Contas
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data && Object.keys(data.gruposPrincipais).map(grupo => (
                        <tr key={grupo} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {grupo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {data.gruposPrincipais[grupo]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {data.estruturaPorGrupo[grupo]?.contas?.length || 0} {/* Adicione verificação de segurança */}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                                onClick={() => setActiveGroup(grupo)}
                                className="text-indigo-600 hover:text-indigo-900"
                            >
                                Ver detalhes
                            </button>
                            </td>
                        </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {activeGroup && (
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Detalhes do Grupo: {activeGroup} - {data.gruposPrincipais[activeGroup]}
                  </h3>
                  <button 
                    onClick={() => setActiveGroup(null)}
                    className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Fechar
                  </button>
                </div>
                {renderAccountsTree(activeGroup)}
              </div>
            )}
          </div>
        );
        
      case 'estrutura':
        return (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Estrutura Hierárquica</h2>
              
              {/* Adicione a seção de importação aqui */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h3 className="text-lg font-medium mb-3">Importar Plano de Contas</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Faça upload do arquivo CSV com o plano de contas atualizado.
                </p>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  
                  {isUploading && (
                    <div className="w-6 h-6 border-2 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
                  )}
                </div>
                
                {uploadStatus && (
                  <div className={`mt-3 p-3 rounded text-sm ${
                    uploadStatus.startsWith('Erro') 
                      ? 'bg-red-100 text-red-700' 
                      : uploadStatus.startsWith('Importação') 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {data && Object.keys(data.gruposPrincipais).map((grupo, index) => (
                  <button
                      key={grupo}
                      className={`p-3 rounded-lg shadow text-left ${expandedGroups[grupo]
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white hover:bg-gray-50'}`}
                      onClick={() => toggleGroup(grupo)}
                  >
                      <h3 className="text-lg font-semibold" style={{ color: COLORS[index % COLORS.length] }}>
                          {grupo} - {data.gruposPrincipais[grupo]}
                      </h3>
                      <p className="text-sm text-gray-600">
                          {data.estruturaPorGrupo[grupo].contas.length} contas
                      </p>
                  </button>
              ))}
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
            {data && Object.keys(data.gruposPrincipais).map((grupo, index) => {
                if (expandedGroups[grupo]) {
                  return (
                    <div key={grupo} className="mb-6">
                      <h3 className="text-lg font-semibold mb-3" style={{ color: COLORS[index % COLORS.length] }}>
                        {grupo} - {data.gruposPrincipais[grupo]}
                      </h3>
                      {renderAccountsTree(grupo)}
                    </div>
                  );
                }
                return null;
              })}
              
              {!Object.values(expandedGroups).some(Boolean) && (
                <p className="text-center py-8 text-gray-500">
                  Clique em um dos grupos acima para expandir a estrutura
                </p>
              )}
            </div>
          </div>
        );
        
      case 'pesquisa':
        return (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Pesquisa de Contas</h2>
            
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="mb-4">
                <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
                  Pesquisar por código ou descrição:
                </label>
                <input
                  id="search-input"
                  type="text"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite para pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              {search.trim() && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Resultados ({filteredAccounts.length})</h3>
                  {filteredAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Código
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Descrição
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Referência
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAccounts.slice(0, 20).map(conta => (
                            <tr key={conta.sequencial} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {conta.codigo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  conta.tipo === 'S' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {conta.tipo === 'S' ? 'Sintética' : 'Analítica'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conta.descricao}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {conta.referencia || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      Nenhuma conta encontrada com os termos pesquisados
                    </p>
                  )}
                  {filteredAccounts.length > 20 && (
                    <p className="text-center py-2 text-gray-500">
                      Mostrando 20 de {filteredAccounts.length} resultados. Refine sua busca para ver mais resultados específicos.
                    </p>
                  )}
                </div>
              )}
              
              {!search.trim() && (
                <p className="text-center py-8 text-gray-500">
                  Digite um termo de pesquisa para encontrar contas
                </p>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 bg-blue-700 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Relatório do Plano de Contas 2025</h1>
              <p className="mt-2">Visualização e análise da estrutura contábil</p>
            </div>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-medium"
            >
              Voltar ao Dashboard
            </button>
          </div>
          
          <div className="bg-blue-100 px-6 py-2">
            <div className="flex border-b">
                <button
                className={`py-3 px-4 font-medium border-b-2 ${
                    activeTab === 'resumo' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('resumo')}
                >
                Resumo
                </button>
                
                <button
                className={`py-3 px-4 font-medium border-b-2 ${
                    activeTab === 'estrutura' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('estrutura')}
                >
                Estrutura
                </button>
                
                <button
                className={`py-3 px-4 font-medium border-b-2 ${
                    activeTab === 'pesquisa' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('pesquisa')}
                >
                Pesquisa de Contas
                </button>
            </div>
            </div>
          
          {renderContent()}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Legendas e Informações</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Tipos de Contas</h3>
              <div className="flex items-center mb-2">
                <span className="w-4 h-4 bg-blue-100 rounded-full mr-2"></span>
                <span><strong>S - Sintética:</strong> Contas que agrupam outras contas</span>
              </div>
              <div className="flex items-center">
                <span className="w-4 h-4 bg-green-100 rounded-full mr-2"></span>
                <span><strong>A - Analítica:</strong> Contas de lançamento/operacionais</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Estrutura Principal</h3>
              <ul className="list-disc pl-5">
                {data && Object.entries(data.gruposPrincipais).map(([codigo, descricao]) => (
                  <li key={codigo}>
                    <strong>{codigo}:</strong> {descricao}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanoContasReport;