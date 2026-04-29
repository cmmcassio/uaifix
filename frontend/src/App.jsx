import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

import Home from './pages/Home'

import ClientRegister from './pages/client/Register'
import ClientLogin from './pages/client/Login'
import ClientDashboard from './pages/client/Dashboard'

import TechnicianRegister from './pages/technician/Register'
import TechnicianLogin from './pages/technician/Login'
import PendingApproval from './pages/technician/PendingApproval'
import TechnicianDashboard from './pages/technician/Dashboard'

import NewCall from './pages/client/NewCall'

import AdminLogin from './pages/admin/Login'
import TechnicianQueue from './pages/admin/TechnicianQueue'
import TechnicianDetail from './pages/admin/TechnicianDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Cliente */}
          <Route path="/cliente/cadastro" element={<ClientRegister />} />
          <Route path="/cliente/login" element={<ClientLogin />} />
          <Route path="/cliente/dashboard" element={<ClientDashboard />} />
          <Route path="/cliente/chamado/novo" element={<NewCall />} />

          {/* Técnico */}
          <Route path="/tecnico/cadastro" element={<TechnicianRegister />} />
          <Route path="/tecnico/login" element={<TechnicianLogin />} />
          <Route path="/tecnico/aguardando" element={<PendingApproval />} />
          <Route path="/tecnico/dashboard" element={<TechnicianDashboard />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/tecnicos" element={<TechnicianQueue />} />
          <Route path="/admin/tecnicos/:id" element={<TechnicianDetail />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
