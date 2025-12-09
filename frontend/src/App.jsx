import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AnimationTransition from './pages/AnimationTransition'
import InductionPlanner from './pages/InductionPlanner'
import WhatIfSimulator from './pages/WhatIfSimulator'
import DataPlayground from './pages/DataPlayground'
import TrainDetails from './pages/TrainDetails'
import Alerts from './pages/Alerts'
import Simulator from './pages/Simulator'
import ResilienceLab from './pages/ResilienceLab'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute>
            <Layout><InductionPlanner /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/what-if"
        element={
          <ProtectedRoute>
            <Layout><WhatIfSimulator /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulator"
        element={
          <ProtectedRoute>
            <Layout><Simulator /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resilience"
        element={
          <ProtectedRoute>
            <Layout><ResilienceLab /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/data"
        element={
          <ProtectedRoute>
            <Layout><DataPlayground /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trains/:id"
        element={
          <ProtectedRoute>
            <Layout><TrainDetails /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Layout><Alerts /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

