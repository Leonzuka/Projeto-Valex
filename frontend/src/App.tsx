import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './components/Homepage';
import CooperadoRegistro from './components/CooperadoRegistro';

// Componente wrapper para passar as props corretamente
const CooperadoDashboardWrapper = () => {
  const location = useLocation();
  const state = location.state as { cooperadoNome: string } | null;
  
  // Redirecionamento se não houver state
  if (!state?.cooperadoNome) {
    return <Homepage />;
  }
  
  return <CooperadoRegistro cooperadoNome={state.cooperadoNome} />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/cooperado-dashboard" element={<CooperadoDashboardWrapper />} />
        {/* Adicione outras rotas aqui se necessário */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;