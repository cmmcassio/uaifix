import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import StarRating from '../../components/StarRating'

const APPLIANCE_LABEL = { refrigerator: 'Geladeira', washing_machine: 'Máquina de lavar' }

const STATUS_INFO = {
  open:        { label: 'Buscando técnico...', cls: 'badge badge-pending', dot: 'bg-yellow-400 animate-pulse' },
  accepted:    { label: 'Técnico confirmado', cls: 'badge badge-approved',  dot: 'bg-green-500' },
  in_progress: { label: 'Em atendimento',    cls: 'badge badge-active',    dot: 'bg-blue-500' },
  completed:   { label: 'Concluído',         cls: 'badge badge-done',      dot: 'bg-cream/30' },
  cancelled:   { label: 'Cancelado',         cls: 'badge badge-rejected',  dot: 'bg-red-500' },
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
  const [calls, setCalls] = useState([])
  const [loadingCall, setLoadingCall] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState(location.state?.callCreated ? 'Chamado aberto! Buscando técnico.' : null)

  const [ratingStars, setRatingStars] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingError, setRatingError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'client') navigate('/cliente/login')
  }, [user, navigate])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const fetchCalls = async () => {
    if (!user) return
    try {
      const { data } = await api.get('/calls/my')
      setCalls(data)
    } catch {}
    finally { setLoadingCall(false) }
  }

  useEffect(() => { fetchCalls() }, [user])

  const activeCall = calls.find((c) => ['open', 'accepted', 'in_progress'].includes(c.status))
  const pendingRating = !activeCall && calls.find((c) => c.status === 'completed' && !c.rated_by_client)

  const cancel = async () => {
    if (!activeCall || !window.confirm('Cancelar o chamado?')) return
    setCancelling(true)
    try {
      await api.post(`/calls/${activeCall.id}/cancel`)
      setToast('Chamado cancelado.')
      fetchCalls()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao cancelar.')
    } finally {
      setCancelling(false)
    }
  }

  const submitRating = async () => {
    if (ratingStars === 0) { setRatingError('Selecione uma nota de 1 a 5 estrelas.'); return }
    setSubmittingRating(true)
    setRatingError('')
    try {
      await api.post(`/calls/${pendingRating.id}/rate`, {
        stars: ratingStars,
        comment: ratingComment.trim() || undefined,
      })
      setToast('Avaliação enviada!')
      setRatingStars(0)
      setRatingComment('')
      fetchCalls()
    } catch (err) {
      setRatingError(err.response?.data?.detail || 'Erro ao enviar avaliação.')
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <header className="app-header px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-gold">UaiFix</span>
          <p className="text-xs text-cream/40">Olá, {user.name?.split(' ')[0]}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-cream/45 hover:text-cream/80 transition">
          Sair
        </button>
      </header>

      {toast && <div className="toast-banner">{toast}</div>}

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {loadingCall ? (
          <div className="flex justify-center py-8">
            <div className="spinner h-6 w-6 border-2" />
          </div>

        ) : pendingRating ? (
          <div className="card-warn p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-yellow-400/80 uppercase tracking-wide mb-1">Avalie o atendimento</p>
              <h2 className="text-base font-bold text-cream">
                {APPLIANCE_LABEL[pendingRating.appliance_type]} {pendingRating.brand}
              </h2>
              <p className="text-sm text-cream/50 mt-0.5">{pendingRating.symptom}</p>
              {pendingRating.technician_name && (
                <p className="text-sm text-cream/50 mt-1">
                  Técnico: <span className="font-medium text-cream/80">{pendingRating.technician_name}</span>
                </p>
              )}
            </div>

            <p className="text-xs text-cream/40">
              Avalie para poder abrir um novo chamado. Se não avaliar em 24h, uma nota neutra será registrada automaticamente.
            </p>

            <div className="space-y-3">
              <StarRating value={ratingStars} onChange={setRatingStars} size="lg" />

              <textarea
                rows={2}
                className="form-input"
                placeholder="Comentário opcional..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />

              {ratingError && <p className="text-xs" style={{ color: '#F87171' }}>{ratingError}</p>}

              <button onClick={submitRating} disabled={submittingRating} className="btn-gold w-full py-3">
                {submittingRating ? (
                  <div className="animate-spin h-4 w-4 rounded-full border-2" style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
                ) : 'Enviar avaliação'}
              </button>
            </div>
          </div>

        ) : activeCall ? (
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-cream/35 mb-1">Chamado em aberto</p>
                <h2 className="text-base font-bold text-cream">
                  {APPLIANCE_LABEL[activeCall.appliance_type]} {activeCall.brand}
                </h2>
                <p className="text-sm text-cream/50 mt-0.5">{activeCall.symptom}</p>
              </div>
              <span className={STATUS_INFO[activeCall.status]?.cls}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_INFO[activeCall.status]?.dot}`} />
                {STATUS_INFO[activeCall.status]?.label}
              </span>
            </div>

            <div className="text-xs text-cream/35 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {activeCall.neighborhood}, {activeCall.city} · {timeAgo(activeCall.created_at)}
            </div>

            {activeCall.status === 'accepted' && activeCall.technician_name && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#4ADE80' }}>Técnico confirmado</p>
                <p className="text-sm font-medium text-cream/80">{activeCall.technician_name}</p>
                <p className="text-xs text-cream/40 mt-1">O técnico entrará em contato pelo seu WhatsApp cadastrado.</p>
              </div>
            )}

            {activeCall.status === 'open' && (
              <button
                onClick={cancel}
                disabled={cancelling}
                className="btn-danger w-full py-2.5 text-sm"
              >
                {cancelling ? 'Cancelando...' : 'Cancelar chamado'}
              </button>
            )}
          </div>

        ) : (
          <div className="card p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                 style={{ background: 'rgba(201,168,76,0.1)' }}>
              <svg className="w-7 h-7 text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-cream">Tudo certo por aqui!</h2>
              <p className="text-sm text-cream/45 mt-1">Nenhum chamado em aberto no momento.</p>
            </div>
            <button onClick={() => navigate('/cliente/chamado/novo')} className="btn-gold w-full py-3">
              Abrir chamado
            </button>
          </div>
        )}

        {!activeCall && !pendingRating && (
          <div className="card p-5">
            <h3 className="section-title">Como funciona</h3>
            <ol className="space-y-3">
              {[
                'Você descreve o aparelho e o problema',
                'Buscamos um técnico disponível na sua região',
                'O técnico entra em contato e agenda o atendimento',
                'Após o serviço, você avalia o técnico',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-cream/55">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                        style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
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
