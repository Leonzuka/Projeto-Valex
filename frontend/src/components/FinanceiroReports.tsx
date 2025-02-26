import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface FinanceiroReportsProps {
  onClose: () => void;
}

interface ContaBalancete {
  id: number;
  conta: string;
  reducao: number | null;
  tipo: string | null;
  descricao: string;
  valor_anterior: number;
  valor_periodo_debito: number;
  valor_periodo_credito: number;
  valor_atual: number;
  competencia?: string;
}

interface ContaRelatorio {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
  nivel: number;
  tipo: string;
}

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4C9FB4', '#AE4C4C', '#8DAE4C'];

const FinanceiroReports: React.FC<FinanceiroReportsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('balanco');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceteData, setBalanceteData] = useState<ContaBalancete[]>([]);
  const [competencia, setCompetencia] = useState<string>('2024-12');
  const [competenciasDisponiveis, setCompetenciasDisponiveis] = useState<string[]>(['2024-12']);
  
  // Estados para cada relatório
  const [contasPagar, setContasPagar] = useState<ContaRelatorio[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaRelatorio[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<{operacional: number, investimento: number, financiamento: number}>({ 
    operacional: 0, investimento: 0, financiamento: 0 
  });
  const [patrimonioLiquido, setPatrimonioLiquido] = useState<ContaRelatorio[]>([]);
  const [sobrasPerdas, setSobrasPerdas] = useState<{
    receitas: ContaRelatorio[], 
    custos: ContaRelatorio[], 
    despesas: ContaRelatorio[],
    total_receitas: number, 
    total_custos: number, 
    total_despesas: number,
    resultado: number
  }>({
    receitas: [], custos: [], despesas: [], 
    total_receitas: 0, total_custos: 0, total_despesas: 0, resultado: 0
  });
  const [balanco, setBalanco] = useState<{
    ativo: ContaRelatorio[],
    passivo: ContaRelatorio[],
    patrimonio: ContaRelatorio[],
    total_ativo: number,
    total_passivo: number,
    total_patrimonio: number
  }>({
    ativo: [], passivo: [], patrimonio: [],
    total_ativo: 0, total_passivo: 0, total_patrimonio: 0
  });

  // Carregar as competências disponíveis
  useEffect(() => {
    const fetchCompetencias = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/contabilidade/competencias`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setCompetenciasDisponiveis(response.data);
          setCompetencia(response.data[0]); // Define a primeira competência como padrão
        }
      } catch (error) {
        console.error('Erro ao buscar competências', error);
        // Manter o valor padrão '2024-12' em caso de erro
      }
    };

    fetchCompetencias();
  }, []);

  // Carregar os dados do balancete
  useEffect(() => {
    const fetchBalancete = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar dados do balancete completo
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/contabilidade/balancete/completo`);
        setBalanceteData(response.data);
        processarDados(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar balancete', error);
        setError('Erro ao carregar dados do balancete');
        setLoading(false);
      }
    };

    fetchBalancete();
  }, [competencia]); // Recarregar quando a competência mudar

  const processarDados = (dados: ContaBalancete[]) => {
    if (!dados || !Array.isArray(dados) || dados.length === 0) {
      console.error('Dados inválidos ou vazios:', dados);
      setError('Dados do balancete inválidos ou vazios');
      return;
    }

    console.log('Processando dados do balancete:', dados.length, 'registros');
    
    try {
      processarContasPagar(dados);
      processarContasReceber(dados);
      processarFluxoCaixa(dados);
      processarPatrimonioLiquido(dados);
      processarSobrasPerdas(dados);
      processarBalancoPatrimonial(dados);
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      setError(`Erro ao processar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const processarContasPagar = (dados: ContaBalancete[]) => {
    // Filtrar contas a pagar (grupo 2.1 - passivo circulante)
    const contasFiltradas = dados.filter(item => 
      item && item.conta && 
      item.conta.startsWith('2.1') && 
      item.tipo === 'A' && 
      (item.valor_atual > 0 || false)
    );

    const contas = contasFiltradas.map(item => ({
      codigo: item.conta,
      descricao: item.descricao,
      valor: item.valor_atual || 0,
      percentual: 0, // Será calculado depois
      nivel: item.conta ? item.conta.split('.').length : 0,
      tipo: item.tipo || '',
    }));

    setContasPagar(contas);
  };

  const processarContasReceber = (dados: ContaBalancete[]) => {
    // Filtrar contas a receber (grupo 1.1.2 - créditos)
    const contasFiltradas = dados.filter(item => 
      item && item.conta && 
      item.conta.startsWith('1.1.2') && 
      item.tipo === 'A' && 
      (item.valor_atual > 0 || false)
    );

    const contas = contasFiltradas.map(item => ({
      codigo: item.conta,
      descricao: item.descricao,
      valor: item.valor_atual || 0,
      percentual: 0, // Será calculado depois
      nivel: item.conta ? item.conta.split('.').length : 0,
      tipo: item.tipo || '',
    }));

    setContasReceber(contas);
  };

  const processarFluxoCaixa = (dados: ContaBalancete[]) => {
    // Simplificação para o exemplo - normalmente seria necessário processar transações
    // Para uma DFC real, usaríamos dados de movimentação e não apenas saldos
    
    // Simplificado usar algumas contas como representativas
    const operacional = dados
      .filter(item => item.conta && item.conta.startsWith('1.1.1'))
      .reduce((sum, item) => sum + ((item.valor_periodo_credito || 0) - (item.valor_periodo_debito || 0)), 0);
    
    const investimento = dados
      .filter(item => (item.conta && (item.conta.startsWith('1.2.2') || item.conta.startsWith('1.2.3'))))
      .reduce((sum, item) => sum + ((item.valor_periodo_debito || 0) - (item.valor_periodo_credito || 0)), 0);
    
    const financiamento = dados
      .filter(item => (item.conta && (item.conta.startsWith('2.2.1') || item.conta.startsWith('2.4.1'))))
      .reduce((sum, item) => sum + ((item.valor_periodo_credito || 0) - (item.valor_periodo_debito || 0)), 0);
    
    setFluxoCaixa({
      operacional: Math.abs(operacional),
      investimento: Math.abs(investimento),
      financiamento: Math.abs(financiamento)
    });
  };

  const processarPatrimonioLiquido = (dados: ContaBalancete[]) => {
    // Filtrar contas de patrimônio líquido (grupo 2.4)
    const contasFiltradas = dados.filter(item => 
      item && item.conta && 
      item.conta.startsWith('2.4') && 
      (item.valor_atual !== 0)
    );

    const contas = contasFiltradas.map(item => ({
      codigo: item.conta,
      descricao: item.descricao,
      valor: item.valor_atual || 0,
      percentual: 0, // Será calculado depois
      nivel: item.conta ? item.conta.split('.').length : 0,
      tipo: item.tipo || '',
    }));

    setPatrimonioLiquido(contas);
  };

  const processarSobrasPerdas = (dados: ContaBalancete[]) => {
    // Receitas - grupo 4
    const receitas = dados
      .filter(item => item && item.conta && item.conta.startsWith('4') && item.tipo === 'A')
      .map(item => ({
        codigo: item.conta,
        descricao: item.descricao,
        valor: item.valor_atual || 0,
        percentual: 0, // Será calculado depois
        nivel: item.conta ? item.conta.split('.').length : 0,
        tipo: item.tipo || '',
      }));
    
    // Custos - grupo 5
    const custos = dados
      .filter(item => item && item.conta && item.conta.startsWith('5') && item.tipo === 'A')
      .map(item => ({
        codigo: item.conta,
        descricao: item.descricao,
        valor: item.valor_atual || 0,
        percentual: 0, // Será calculado depois
        nivel: item.conta ? item.conta.split('.').length : 0,
        tipo: item.tipo || '',
      }));
    
    // Despesas - grupo 3
    const despesas = dados
      .filter(item => item && item.conta && item.conta.startsWith('3') && item.tipo === 'A')
      .map(item => ({
        codigo: item.conta,
        descricao: item.descricao,
        valor: item.valor_atual || 0,
        percentual: 0, // Será calculado depois
        nivel: item.conta ? item.conta.split('.').length : 0,
        tipo: item.tipo || '',
      }));
    
    // Calcular totais
    const total_receitas = receitas.reduce((sum, item) => sum + item.valor, 0);
    const total_custos = custos.reduce((sum, item) => sum + item.valor, 0);
    const total_despesas = despesas.reduce((sum, item) => sum + item.valor, 0);
    const resultado = total_receitas - total_custos - total_despesas;
    
    setSobrasPerdas({
      receitas,
      custos,
      despesas,
      total_receitas,
      total_custos,
      total_despesas,
      resultado
    });
  };

  const processarBalancoPatrimonial = (dados: ContaBalancete[]) => {
    // Ativo - grupo 1
    const ativo = dados
      .filter(item => item && item.conta && item.conta.startsWith('1'))
      .map(item => ({
        codigo: item.conta,
        descricao: item.descricao,
        valor: item.valor_atual || 0,
        percentual: 0, // Será calculado depois
        nivel: item.conta ? item.conta.split('.').length : 0,
        tipo: item.tipo || '',
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    // Passivo - grupo 2 (exceto 2.4 patrimônio líquido)
    const passivo = dados
      .filter(item => item && item.conta && item.conta.startsWith('2') && !item.conta.startsWith('2.4'))
      .map(item => ({
        codigo: item.conta,
        descricao: item.descricao,
        valor: item.valor_atual || 0,
        percentual: 0, // Será calculado depois
        nivel: item.conta ? item.conta.split('.').length : 0,
        tipo: item.tipo || '',
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    // Patrimônio Líquido - grupo 2.4
    const patrimonio = dados
      .filter(item => item && item.conta && item.conta.startsWith('2.4'))
      .map(item => ({
        codigo: item.conta,
        descricao: item.descricao,
        valor: item.valor_atual || 0,
        percentual: 0, // Será calculado depois
        nivel: item.conta ? item.conta.split('.').length : 0,
        tipo: item.tipo || '',
      }))
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    // Calcular totais
    const total_ativo = dados
      .filter(item => item && item.conta === '1' && item.tipo === 'S')
      .reduce((sum, item) => sum + (item.valor_atual || 0), 0);
    
    const total_passivo = dados
      .filter(item => 
        item && item.conta && 
        item.conta.startsWith('2') && 
        !item.conta.startsWith('2.4') && 
        item.tipo === 'S' && 
        item.conta.split('.').length === 1
      )
      .reduce((sum, item) => sum + (item.valor_atual || 0), 0);
    
    const total_patrimonio = dados
      .filter(item => item && item.conta === '2.4' && item.tipo === 'S')
      .reduce((sum, item) => sum + (item.valor_atual || 0), 0);
    
    setBalanco({
      ativo,
      passivo,
      patrimonio,
      total_ativo,
      total_passivo,
      total_patrimonio
    });
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  const calcularPercentual = (valor: number, total: number) => {
    if (total === 0) return 0;
    return (valor / total) * 100;
  };

  const renderizarContasReceber = () => {
    if (contasReceber.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhuma conta a receber encontrada para o período selecionado.
        </div>
      );
    }

    const total = contasReceber.reduce((sum, conta) => sum + conta.valor, 0);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Resumo de Contas a Receber</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">{formatarValor(total)}</div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contasReceber.map((conta, index) => ({
                  name: conta.descricao,
                  value: conta.valor
                }))}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {contasReceber.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatarValor(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contasReceber.map((conta, index) => (
                <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conta.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {calcularPercentual(conta.valor, total).toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 text-right">{formatarValor(total)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderizarFluxoCaixa = () => {
    const total = fluxoCaixa.operacional + fluxoCaixa.investimento + fluxoCaixa.financiamento;

    const dadosGrafico = [
      { name: 'Operacional', value: fluxoCaixa.operacional },
      { name: 'Investimento', value: fluxoCaixa.investimento },
      { name: 'Financiamento', value: fluxoCaixa.financiamento }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Fluxo de Caixa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-blue-800">Operacional</h4>
              <p className="text-2xl font-bold text-blue-600">{formatarValor(fluxoCaixa.operacional)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-purple-800">Investimento</h4>
              <p className="text-2xl font-bold text-purple-600">{formatarValor(fluxoCaixa.investimento)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-green-800">Financiamento</h4>
              <p className="text-2xl font-bold text-green-600">{formatarValor(fluxoCaixa.financiamento)}</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dadosGrafico}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatarValor(value)} />
              <Legend />
              <Bar dataKey="value" name="Valor">
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Análise do Fluxo de Caixa</h3>
          <p className="text-gray-600 mb-4">
            Os dados apresentados são uma simplificação do fluxo de caixa, baseados nos saldos acumulados das contas contábeis relacionadas.
          </p>
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Fluxo Operacional</h4>
            <p className="text-sm text-gray-600 mb-4">
              Representa os recursos gerados ou consumidos pelas atividades operacionais da cooperativa.
              Inclui recebimentos de clientes, pagamentos a fornecedores e colaboradores.
            </p>
            
            <h4 className="font-medium text-gray-700 mb-2">Fluxo de Investimento</h4>
            <p className="text-sm text-gray-600 mb-4">
              Demonstra os recursos usados na aquisição de ativos de longo prazo e outros investimentos.
              Inclui compra de máquinas, equipamentos e imóveis.
            </p>
            
            <h4 className="font-medium text-gray-700 mb-2">Fluxo de Financiamento</h4>
            <p className="text-sm text-gray-600">
              Representa os recursos provenientes de atividades de financiamento.
              Inclui captação de empréstimos, pagamento de dividendos e integralização de capital.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderizarMutacaoPatrimonioLiquido = () => {
    if (patrimonioLiquido.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhuma informação de patrimônio líquido encontrada para o período selecionado.
        </div>
      );
    }

    const total = patrimonioLiquido.reduce((sum, conta) => sum + conta.valor, 0);

    // Filtrar apenas as contas de nível 2 para o gráfico (diretas de 2.4)
    const contasNivel2 = patrimonioLiquido.filter(c => c.nivel === 2);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Composição do Patrimônio Líquido</h3>
          <div className="text-3xl font-bold text-purple-600 mb-2">{formatarValor(total)}</div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contasNivel2.map((conta) => ({
                  name: conta.descricao,
                  value: Math.abs(conta.valor)
                }))}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {contasNivel2.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatarValor(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patrimonioLiquido.map((conta, index) => (
                <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {/* Adicionar indentação baseada no nível */}
                    <span className="pl-2" style={{ marginLeft: `${(conta.nivel - 1) * 1}rem` }}>
                      {conta.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {Math.abs(conta.nivel === 1 ? 100 : calcularPercentual(conta.valor, total)).toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600 text-right">{formatarValor(total)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderizarSobrasPerdas = () => {
    const { total_receitas, total_custos, total_despesas, resultado, receitas, custos, despesas } = sobrasPerdas;
    
    const dadosGrafico = [
      { name: 'Receitas', value: total_receitas },
      { name: 'Custos', value: total_custos },
      { name: 'Despesas', value: total_despesas }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Demonstração de Sobras ou Perdas (DSP)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-green-800">Receitas</h4>
              <p className="text-2xl font-bold text-green-600">{formatarValor(total_receitas)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-yellow-800">Custos</h4>
              <p className="text-2xl font-bold text-yellow-600">{formatarValor(total_custos)}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-pink-800">Despesas</h4>
              <p className="text-2xl font-bold text-pink-600">{formatarValor(total_despesas)}</p>
            </div>
            <div className={`p-4 rounded-lg ${resultado >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <h4 className={`text-lg font-medium ${resultado >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                {resultado >= 0 ? 'Sobras' : 'Perdas'}
              </h4>
              <p className={`text-2xl font-bold ${resultado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatarValor(Math.abs(resultado))}
              </p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dadosGrafico}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatarValor(value)} />
              <Legend />
              <Bar dataKey="value" name="Valor">
                <Cell fill="#10B981" /> {/* Receitas - verde */}
                <Cell fill="#F59E0B" /> {/* Custos - amarelo */}
                <Cell fill="#EC4899" /> {/* Despesas - rosa */}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo de Receitas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-3">
            <h3 className="text-lg font-medium text-green-800">Receitas</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receitas.slice(0, 5).map((conta, index) => (
                <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conta.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {calcularPercentual(conta.valor, total_receitas).toFixed(2)}%
                  </td>
                </tr>
              ))}
              {receitas.length > 5 && (
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ... mais {receitas.length - 5} contas
                  </td>
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    Mostrando top 5 de {receitas.length} contas
                  </td>
                </tr>
              )}
              <tr className="bg-green-100">
                <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800">Total de Receitas</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800 text-right">{formatarValor(total_receitas)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-800 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resumo de Custos & Despesas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-yellow-50 px-6 py-3">
              <h3 className="text-lg font-medium text-yellow-800">Custos</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {custos.slice(0, 5).map((conta, index) => (
                  <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conta.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  </tr>
                ))}
                {custos.length > 5 && (
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ... mais {custos.length - 5} contas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      Mostrando top 5
                    </td>
                  </tr>
                )}
                <tr className="bg-yellow-100">
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-800">Total de Custos</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-yellow-800 text-right">{formatarValor(total_custos)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-pink-50 px-6 py-3">
              <h3 className="text-lg font-medium text-pink-800">Despesas</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {despesas.slice(0, 5).map((conta, index) => (
                  <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conta.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  </tr>
                ))}
                {despesas.length > 5 && (
                  <tr className="bg-gray-50">
                    <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ... mais {despesas.length - 5} contas
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      Mostrando top 5
                    </td>
                  </tr>
                )}
                <tr className="bg-pink-100">
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-pink-800">Total de Despesas</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-pink-800 text-right">{formatarValor(total_despesas)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Resultado Final</h3>
            <div className={`text-2xl font-bold ${resultado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {resultado >= 0 ? 'Sobras: ' : 'Perdas: '}{formatarValor(Math.abs(resultado))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderizarBalancoPatrimonial = () => {
    const { ativo, passivo, patrimonio, total_ativo, total_passivo, total_patrimonio } = balanco;
    
    // Filtrar apenas as contas de nível 2 para o gráfico
    const ativoNivel2 = ativo.filter(c => c.nivel === 2);
    const passivoNivel2 = passivo.filter(c => c.nivel === 2);
    const patrimonioNivel2 = patrimonio.filter(c => c.nivel === 2);
    
    // Dados para o gráfico
    const dadosGraficoAtivo = ativoNivel2.map(item => ({
      name: item.descricao,
      value: Math.abs(item.valor)
    }));
    
    const dadosGraficoPassivoPatrimonio = [
      ...passivoNivel2.map(item => ({
        name: item.descricao,
        value: Math.abs(item.valor),
        group: 'Passivo'
      })),
      ...patrimonioNivel2.map(item => ({
        name: item.descricao,
        value: Math.abs(item.valor),
        group: 'Patrimônio'
      }))
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Balanço Patrimonial</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-blue-800">Total do Ativo</h4>
              <p className="text-2xl font-bold text-blue-600">{formatarValor(total_ativo)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-red-800">Total do Passivo</h4>
              <p className="text-2xl font-bold text-red-600">{formatarValor(total_passivo)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-purple-800">Patrimônio Líquido</h4>
              <p className="text-2xl font-bold text-purple-600">{formatarValor(total_patrimonio)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-blue-800 mb-3">Composição do Ativo</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosGraficoAtivo}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosGraficoAtivo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatarValor(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-red-800 mb-3">Composição do Passivo + PL</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosGraficoPassivoPatrimonio}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosGraficoPassivoPatrimonio.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.group === 'Passivo' ? COLORS[index % 3] : COLORS[(index % 3) + 4]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatarValor(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabela do Ativo */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-50 px-6 py-3">
            <h3 className="text-lg font-medium text-blue-800">Ativo</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ativo.filter(c => c.nivel <= 2).map((conta, index) => (
                <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span style={{ marginLeft: `${(conta.nivel - 1) * 1}rem` }}>
                      {conta.codigo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {conta.nivel === 1 ? '100.00' : calcularPercentual(conta.valor, total_ativo).toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-blue-100">
                <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800">Total do Ativo</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800 text-right">{formatarValor(total_ativo)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-800 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabela do Passivo + PL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Passivo */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-red-50 px-6 py-3">
              <h3 className="text-lg font-medium text-red-800">Passivo</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {passivo.filter(c => c.nivel <= 2).map((conta, index) => (
                  <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span style={{ marginLeft: `${(conta.nivel - 1) * 1}rem` }}>
                        {conta.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  </tr>
                ))}
                <tr className="bg-red-100">
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-800">Total do Passivo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-800 text-right">{formatarValor(total_passivo)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Patrimônio Líquido */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-purple-50 px-6 py-3">
              <h3 className="text-lg font-medium text-purple-800">Patrimônio Líquido</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patrimonio.filter(c => c.nivel <= 2).map((conta, index) => (
                  <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span style={{ marginLeft: `${(conta.nivel - 1) * 1}rem` }}>
                        {conta.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  </tr>
                ))}
                <tr className="bg-purple-100">
                  <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-800">Total do PL</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-800 text-right">{formatarValor(total_patrimonio)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Equação Patrimonial */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row justify-center items-center text-center py-4">
            <div className="text-xl font-bold text-blue-600 px-4">{formatarValor(total_ativo)}</div>
            <div className="text-xl font-bold px-4">=</div>
            <div className="text-xl font-bold text-red-600 px-4">{formatarValor(total_passivo)}</div>
            <div className="text-xl font-bold px-4">+</div>
            <div className="text-xl font-bold text-purple-600 px-4">{formatarValor(total_patrimonio)}</div>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center text-center">
            <div className="text-lg font-medium text-blue-600 px-4">Ativo</div>
            <div className="text-lg font-medium px-4">=</div>
            <div className="text-lg font-medium text-red-600 px-4">Passivo</div>
            <div className="text-lg font-medium px-4">+</div>
            <div className="text-lg font-medium text-purple-600 px-4">Patrimônio Líquido</div>
          </div>
        </div>
      </div>
    );
  };
  const renderizarContasPagar = () => {
    if (contasPagar.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhuma conta a pagar encontrada para o período selecionado.
        </div>
      );
    }

    const total = contasPagar.reduce((sum, conta) => sum + conta.valor, 0);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Resumo de Contas a Pagar</h3>
          <div className="text-3xl font-bold text-red-600 mb-2">{formatarValor(total)}</div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={contasPagar.map((conta, index) => ({
                  name: conta.descricao,
                  value: conta.valor
                }))}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, value, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {contasPagar.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatarValor(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contasPagar.map((conta, index) => (
                <tr key={conta.codigo} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conta.codigo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.descricao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatarValor(conta.valor)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {calcularPercentual(conta.valor, total).toFixed(2)}%
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-100">
                <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">{formatarValor(total)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Os outros métodos de renderização permanecem iguais...

  const renderizarConteudo = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg text-gray-600">Carregando dados...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-300 rounded-md p-6 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2">Verifique se o backend está funcionando corretamente ou tente novamente mais tarde.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'contas-pagar':
        return renderizarContasPagar();
      case 'contas-receber':
        return renderizarContasReceber();
      case 'fluxo-caixa':
        return renderizarFluxoCaixa();
      case 'patrimonio':
        return renderizarMutacaoPatrimonioLiquido();
      case 'dsp':
        return renderizarSobrasPerdas();
      case 'balanco':
        return renderizarBalancoPatrimonial();
      default:
        return renderizarBalancoPatrimonial();
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
              <p className="mt-2">Análises contábeis e financeiras da cooperativa</p>
            </div>
            <div className="flex items-center space-x-4">
              <div>
                <label htmlFor="competencia" className="sr-only">Competência</label>
                <select
                  id="competencia"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                  className="bg-white text-gray-800 text-sm rounded-lg px-3 py-2 focus:outline-none"
                >
                  {competenciasDisponiveis.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp.split('-')[0]}/{comp.split('-')[1]}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 font-medium"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 px-6 py-2">
            <div className="flex border-b overflow-x-auto">
              <button
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'balanco' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('balanco')}
              >
                Balanço Patrimonial
              </button>
              
              <button
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'dsp' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('dsp')}
              >
                Sobras & Perdas
              </button>
              
              <button
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'fluxo-caixa' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('fluxo-caixa')}
              >
                Fluxo de Caixa
              </button>
              
              <button
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'patrimonio' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('patrimonio')}
              >
                Mutação do PL
              </button>
              
              <button
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'contas-pagar' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('contas-pagar')}
              >
                Contas a Pagar
              </button>
              
              <button
                className={`py-3 px-4 font-medium border-b-2 whitespace-nowrap ${
                  activeTab === 'contas-receber' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('contas-receber')}
              >
                Contas a Receber
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {renderizarConteudo()}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Informações Adicionais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Legendas</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-blue-500 rounded-full"></span>
                  Ativo - Bens e direitos da cooperativa
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-red-500 rounded-full"></span>
                  Passivo - Obrigações da cooperativa
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-purple-500 rounded-full"></span>
                  Patrimônio Líquido - Capital próprio
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-green-500 rounded-full"></span>
                  Receitas - Entradas de recursos
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-yellow-500 rounded-full"></span>
                  Custos - Gastos diretos com a produção
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block mr-2 bg-pink-500 rounded-full"></span>
                  Despesas - Gastos indiretos da operação
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Sobre os Relatórios</h3>
              <p className="text-sm text-gray-600 mb-2">
                Os relatórios apresentados são baseados nos dados contábeis da competência {competencia.split('-')[0]}/{competencia.split('-')[1]}.
              </p>
              <p className="text-sm text-gray-600 mb-2">
                A análise financeira é uma ferramenta essencial para a tomada de decisões estratégicas da cooperativa.
              </p>
              <p className="text-sm text-gray-600">
                Em caso de dúvidas sobre os dados apresentados, consulte o departamento contábil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroReports;