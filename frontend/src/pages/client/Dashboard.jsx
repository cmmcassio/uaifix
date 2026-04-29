import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const APPLIANCE_LABEL = { refrigerator: 'Geladeira', washing_machine: 'Máquina de lavar' }

const STATUS_INFO = {
  open:        { label: 'Buscando técnico...', cls: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400 animate-pulse' },
  accepted:    { label: 'Técnico confirmado', cls: 'bg-green-100 text-green-800',  dot: 'bg-green-500' },
  in_progress: { label: 'Em atendimento',    cls: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500' },
  completed:   { label: 'Concluído',         cls: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  cancelled:   { label: 'Cancelado',         cls: 'bg-red-100 text-red-700',      dot: 'bg-red-400' },
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

export default function ClientDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [activeCall, setActiveCall] = useState(null)
  const [loadingCall, setLoadingCall] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState(location.state?.callCreated ? 'Chamado aberto! Buscando técnico.' : null)

  useEffect(() => {
    if (!user || user.role !== 'client') navigate('/cliente/login')
  }, [user, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    if (!user) return
    api.get('/calls/my')
      .then(({ data }) => {
        const open = data.find((c) => ['open', 'accepted', 'in_progress'].includes(c.status))
        setActiveCall(open || null)
      })
      .catch(() => {})
      .finally(() => setLoadingCall(false))
  }, [user])

  const cancel = async () => {
    if (!activeCall || !window.confirm('Cancelar o chamado?')) return
    setCancelling(true)
    try {
      await api.post(`/calls/${activeCall.id}/cancel`)
      setActiveCall(null)
      setToast('Chamado cancelado.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao cancelar.')
    } finally {
      setCancelling(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-primary-700">UaiFix</h1>
          <p className="text-xs text-gray-400">Olá, {user.name?.split(' ')[0]}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 transition">
          Sair
        </button>
      </header>

      {toast && (
        <div className="bg-green-600 text-white text-sm text-center py-2.5 px-4 font-medium">
          {toast}
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {loadingCall ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : activeCall ? (
          /* Chamado em aberto */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">Chamado em aberto</p>
                <h2 className="text-base font-bold text-gray-800">
                  {APPLIANCE_LABEL[activeCall.appliance_type]} {activeCall.brand}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{activeCall.symptom}</p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_INFO[activeCall.status]?.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_INFO[activeCall.status]?.dot}`} />
                {STATUS_INFO[activeCall.status]?.label}
              </span>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {activeCall.neighborhood}, {activeCall.city} · {timeAgo(activeCall.created_at)}
            </div>

            {activeCall.status === 'accepted' && activeCall.technician_name && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-green-700 mb-0.5">Técnico confirmado</p>
                <p className="text-sm text-green-800 font-medium">{activeCall.technician_name}</p>
                <p className="text-xs text-green-600 mt-1">O técnico entrará em contato pelo seu WhatsApp cadastrado.</p>
              </div>
            )}

            {activeCall.status === 'open' && (
              <button
                onClick={cancel}
                disabled={cancelling}
                className="w-full text-sm text-red-600 border border-red-200 rounded-xl py-2.5 hover:bg-red-50 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar chamado'}
              </button>
            )}
          </div>
        ) : (
          /* Sem chamado aberto */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-primary-700/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Tudo certo por aqui!</h2>
              <p className="text-sm text-gray-500 mt-1">Nenhum chamado em aberto no momento.</p>
            </div>
            <button
              onClick={() => navigate('/cliente/chamado/novo')}
              className="w-full bg-primary-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-800 transition"
            >
              Abrir chamado
            </button>
          </div>
        )}

        {/* Como funciona */}
        {!activeCall && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Como funciona</h3>
            <ol className="space-y-3">
              {[
                'Você descreve o aparelho e o problema',
                'Buscamos um técnico disponível na sua região',
                'O técnico entra em contato e agenda o atendimento',
                'Após o serviço, você avalia o técnico',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-primary-700/10 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

      </main>
    </div>
  )
}
