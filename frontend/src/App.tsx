import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Homepage from './components/Homepage';
import CooperadoRegistro from './components/CooperadoRegistro';
import GestorDashboard from './components/GestorDashboard';
import { ThemeProvider } from './components/ThemeContext';

// Componente wrapper para passar as props corretamente
const CooperadoDashboardWrapper = () => {
  const location = useLocation();
  const state = location.state as { cooperadoNome: string } | null;
  
  if (!state?.cooperadoNome) {
    return <Homepage />;
  }
  
  return <CooperadoRegistro cooperadoNome={state.cooperadoNome} />;
};

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/cooperado-dashboard" element={<CooperadoDashboardWrapper />} />
          <Route path="/gestor-dashboard" element={<GestorDashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;