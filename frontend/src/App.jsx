import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import InductionPlanner from './pages/InductionPlanner'
import WhatIfSimulator from './pages/WhatIfSimulator'
import DataPlayground from './pages/DataPlayground'
import TrainDetails from './pages/TrainDetails'
import Alerts from './pages/Alerts'
import Simulator from './pages/Simulator'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/planner" element={<InductionPlanner />} />
        <Route path="/what-if" element={<WhatIfSimulator />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/data" element={<DataPlayground />} />
        <Route path="/trains/:id" element={<TrainDetails />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </Layout>
  )
}

export default App

