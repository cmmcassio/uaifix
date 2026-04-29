import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const STATUS_LABELS = {
  pending: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprovado', cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Reprovado', cls: 'bg-red-100 text-red-800' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function maskCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export default function TechnicianQueue() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [technicians, setTechnicians] = useState([])
  const [filterStatus, setFilterStatus] = useState('pending')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/login')
    }
  }, [user, navigate])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/admin/technicians', {
          params: filterStatus ? { status: filterStatus } : {},
        })
        setTechnicians(data)
      } catch {
        // erro já tratado pelo interceptor
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [filterStatus])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">UaiFix Admin</h1>
          <p className="text-xs text-gray-500">Fila de aprovação de técnicos</p>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-800 transition">
          Sair
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected', ''].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filterStatus === s
                  ? 'bg-primary-700 text-white'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'Todos' : STATUS_LABELS[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum técnico encontrado com este filtro.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CPF</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Cidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cadastro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/admin/tecnicos/${t.id}`)}
                    className="border-b border-gray-50 hover:bg-primary-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{maskCPF(t.cpf)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{t.city}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[t.status]?.cls}`}>
                        {STATUS_LABELS[t.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
