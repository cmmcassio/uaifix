import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const STATUS_LABELS = {
  pending:  { label: 'Pendente',  cls: 'badge badge-pending' },
  approved: { label: 'Aprovado',  cls: 'badge badge-approved' },
  rejected: { label: 'Reprovado', cls: 'badge badge-rejected' },
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
    if (!user || user.role !== 'admin') navigate('/admin/login')
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

  const filters = [
    { value: 'pending', label: 'Pendentes' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'rejected', label: 'Reprovados' },
    { value: '', label: 'Todos' },
  ]

  return (
    <div className="min-h-screen">
      <header className="app-header px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-gold">UaiFix Admin</span>
          <p className="text-xs text-cream/35">Fila de aprovação de técnicos</p>
        </div>
        <button onClick={logout} className="text-sm text-cream/45 hover:text-cream/80 transition">Sair</button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: filterStatus === value ? '#C9A84C' : 'rgba(26,31,46,0.85)',
                color: filterStatus === value ? '#0D1117' : 'rgba(240,237,228,0.55)',
                border: filterStatus === value ? 'none' : '1px solid rgba(201,168,76,0.2)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner h-8 w-8 border-2" />
          </div>
        ) : technicians.length === 0 ? (
          <div className="text-center py-12 text-cream/35">
            Nenhum técnico encontrado com este filtro.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.12)', background: 'rgba(13,17,23,0.3)' }}>
                  <th className="text-left px-4 py-3 section-title">Nome</th>
                  <th className="text-left px-4 py-3 section-title">CPF</th>
                  <th className="text-left px-4 py-3 section-title hidden sm:table-cell">Cidade</th>
                  <th className="text-left px-4 py-3 section-title hidden md:table-cell">Cadastro</th>
                  <th className="text-left px-4 py-3 section-title">Status</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/admin/tecnicos/${t.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid rgba(201,168,76,0.06)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.04)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-4 py-3 font-medium text-cream/85">{t.name}</td>
                    <td className="px-4 py-3 text-cream/55 font-mono text-xs">{maskCPF(t.cpf)}</td>
                    <td className="px-4 py-3 text-cream/55 hidden sm:table-cell">{t.city}</td>
                    <td className="px-4 py-3 text-cream/40 hidden md:table-cell text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_LABELS[t.status]?.cls}>
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
