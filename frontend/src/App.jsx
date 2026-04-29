import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import TechnicianRegister from './pages/technician/Register'
import PendingApproval from './pages/technician/PendingApproval'
import AdminLogin from './pages/admin/Login'
import TechnicianQueue from './pages/admin/TechnicianQueue'
import TechnicianDetail from './pages/admin/TechnicianDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/tecnico/cadastro" replace />} />
          <Route path="/tecnico/cadastro" element={<TechnicianRegister />} />
          <Route path="/tecnico/aguardando" element={<PendingApproval />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/tecnicos" element={<TechnicianQueue />} />
          <Route path="/admin/tecnicos/:id" element={<TechnicianDetail />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
