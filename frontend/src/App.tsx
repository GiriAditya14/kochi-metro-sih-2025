import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmergencyPage from './pages/Emergency';
import WhatIf from './pages/WhatIf';
import History from './pages/History';

function App() {
  return (
    <HeroUIProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/what-if" element={<WhatIf />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </HeroUIProvider>
  );
}

export default App;
