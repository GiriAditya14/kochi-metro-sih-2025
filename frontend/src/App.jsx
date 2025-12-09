import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AnimationTransition from './pages/AnimationTransition'
import InductionPlanner from './pages/InductionPlanner'
import WhatIfSimulator from './pages/WhatIfSimulator'
import DataPlayground from './pages/DataPlayground'
import TrainDetails from './pages/TrainDetails'
import Alerts from './pages/Alerts'
import Simulator from './pages/Simulator'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/transition" element={<AnimationTransition />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planner" element={<InductionPlanner />} />
        <Route path="/what-if" element={<WhatIfSimulator />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/data" element={<DataPlayground />} />
        <Route path="/trains/:id" element={<TrainDetails />} />
        <Route path="/alerts" element={<Alerts />} />
      </Route>
    </Routes>
  )
}

export default App

