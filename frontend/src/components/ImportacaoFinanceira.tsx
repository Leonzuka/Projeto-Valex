import React, { useState } from 'react';
import axios from 'axios';


const ImportacaoFinanceira = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Verifica se é um arquivo Excel
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo para importar');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(
            `${process.env.REACT_APP_API_URL}/financeiro/importar-balancete`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 100)
                );
                setProgress(percentCompleted);
              },
            }
          );
          
          console.log('Resposta da API:', response.data);
          

      setSuccess(true);
      setFile(null);
      // Limpa o input de arquivo
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError('Erro ao importar arquivo. Por favor, tente novamente.');
      console.error('Erro na importação:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Importação de Dados Financeiros
      </h2>

      <div className="space-y-6">
        {/* Área de Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-gray-600">
              {file ? file.name : 'Clique para selecionar o arquivo Excel'}
            </span>
          </label>
        </div>

        {/* Barra de Progresso */}
        {loading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Mensagens de Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            Arquivo importado com sucesso!
          </div>
        )}

        {/* Botão de Upload */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full py-3 px-6 rounded-lg text-white transition-all duration-200 ${
            !file || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
          }`}
        >
          {loading ? 'Importando...' : 'Importar Arquivo'}
        </button>

        {/* Instruções */}
        <div className="mt-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Instruções:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Selecione um arquivo Excel (.xlsx ou .xls)</li>
            <li>O arquivo deve conter a planilha "BALANCETE CONSOLIDADO"</li>
            <li>Certifique-se que as colunas estejam no formato correto</li>
            <li>Aguarde a conclusão da importação</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportacaoFinanceira;