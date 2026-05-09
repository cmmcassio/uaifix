import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import StarRating from '../../components/StarRating'

const APPLIANCE_LABEL = { refrigerator: 'Geladeira', washing_machine: 'Máquina de lavar' }

const STATUS_INFO = {
  open:        { label: 'Buscando técnico...', cls: 'badge badge-pending',  dot: 'bg-yellow-400 animate-pulse' },
  accepted:    { label: 'Técnico confirmado',  cls: 'badge badge-approved', dot: 'bg-green-500' },
  on_the_way:  { label: 'A caminho',           cls: 'badge badge-pending',  dot: 'bg-yellow-400 animate-pulse' },
  arrived:     { label: 'Chegou no local',     cls: 'badge badge-active',   dot: 'bg-blue-500 animate-pulse' },
  in_progress: { label: 'Em atendimento',      cls: 'badge badge-active',   dot: 'bg-blue-500' },
  completed:   { label: 'Concluído',           cls: 'badge badge-done',     dot: 'bg-cream/30' },
  cancelled:   { label: 'Cancelado',           cls: 'badge badge-rejected', dot: 'bg-red-500' },
}

const PROGRESS_STEPS = [
  {
    key: 'accepted',
    label: 'Confirmado',
    color: '#22c55e',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
  },
  {
    key: 'on_the_way',
    label: 'A caminho',
    color: '#C9A84C',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    key: 'arrived',
    label: 'Chegou',
    color: '#3b82f6',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    key: 'completed',
    label: 'Concluído',
    color: '#22c55e',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
]

const STEP_ORDER = ['accepted', 'on_the_way', 'arrived', 'completed']
const STEP_MESSAGES = {
  accepted:   'Técnico confirmado! Aguarde o contato.',
  on_the_way: 'Técnico está a caminho do seu endereço.',
  arrived:    'Técnico chegou no local.',
  completed:  'Serviço concluído! Avalie o técnico.',
}

function CallProgressBar({ status }) {
  const currentIdx = STEP_ORDER.indexOf(status)
  return (
    <div className="space-y-3">
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, i) => {
          const isDone = i < currentIdx
          const isCurrent = i === currentIdx
          const isFuture = i > currentIdx
          const color = isFuture ? 'rgba(26,26,26,0.2)' : step.color
          return (
            <div key={step.key} className="flex items-center" style={{ flex: i < PROGRESS_STEPS.length - 1 ? '1' : 'none' }}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div
                  className={isCurrent ? 'animate-pulse' : ''}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isFuture ? 'rgba(26,26,26,0.04)' : `${step.color}22`,
                    border: `2px solid ${color}`,
                    color,
                  }}
                >
                  {step.icon}
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color, textAlign: 'center', lineHeight: 1.2 }}>
                  {step.label}
                </span>
              </div>
              {i < PROGRESS_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 mb-4"
                     style={{ background: isDone ? '#C9A84C' : 'rgba(26,26,26,0.08)' }} />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-cream/50 text-center">{STEP_MESSAGES[status] ?? ''}</p>
    </div>
  )
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
  const [retrying, setRetrying] = useState(false)
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

  useEffect(() => {
    if (!user) return
    fetchCalls()
    const id = setInterval(fetchCalls, 15000)
    return () => clearInterval(id)
  }, [user])

  const activeCall = calls.find((c) => ['open', 'no_technician_available', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(c.status))
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

  const retry = async () => {
    if (!activeCall) return
    setRetrying(true)
    try {
      await api.post(`/calls/${activeCall.id}/retry`)
      setToast('Buscando técnicos novamente...')
      fetchCalls()
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao tentar novamente.')
    } finally {
      setRetrying(false)
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

        ) : activeCall?.status === 'no_technician_available' ? (
          <div className="card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: 'rgba(239,68,68,0.1)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                     style={{ color: '#F87171' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-cream">Nenhum técnico disponível</h2>
                <p className="text-sm text-cream/50 mt-0.5">
                  {APPLIANCE_LABEL[activeCall.appliance_type]} {activeCall.brand} · {activeCall.symptom}
                </p>
              </div>
            </div>

            <p className="text-xs text-cream/40">
              Não encontramos técnicos disponíveis agora na sua região. Tente novamente em alguns minutos ou cancele o chamado.
            </p>

            <div className="flex flex-col gap-2">
              <button onClick={retry} disabled={retrying || cancelling} className="btn-gold w-full py-3">
                {retrying ? (
                  <div className="animate-spin h-4 w-4 rounded-full border-2 mx-auto"
                       style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
                ) : 'Tentar novamente'}
              </button>
              <button onClick={cancel} disabled={cancelling || retrying} className="btn-danger w-full py-2.5 text-sm">
                {cancelling ? 'Cancelando...' : 'Cancelar chamado'}
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

            {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(activeCall.status) && (
              <CallProgressBar status={activeCall.status} />
            )}

            {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(activeCall.status) && activeCall.technician_name && (
              <div className="rounded-xl p-3 space-y-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: '#4ADE80' }}>Técnico confirmado</p>

                <div className="flex items-center gap-3">
                  {activeCall.technician_photo_url ? (
                    <img
                      src={activeCall.technician_photo_url}
                      alt={activeCall.technician_name}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                      style={{ border: '2px solid #C9A84C' }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg font-bold"
                         style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '2px solid #C9A84C' }}>
                      {activeCall.technician_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cream/85">{activeCall.technician_name}</p>

                    {activeCall.technician_avg_rating != null && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-bold" style={{ color: '#C9A84C' }}>
                          {activeCall.technician_avg_rating.toFixed(1)}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <svg key={s} className="w-3 h-3" viewBox="0 0 24 24"
                                 fill={s <= Math.round(activeCall.technician_avg_rating) ? '#C9A84C' : 'none'}
                                 stroke="#C9A84C" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-cream/35">({activeCall.technician_ratings_count})</span>
                      </div>
                    )}

                    {activeCall.technician_calls_completed > 0 && (
                      <p className="text-xs text-cream/35 mt-0.5">
                        {activeCall.technician_calls_completed} serviços realizados
                      </p>
                    )}
                  </div>
                </div>

                {activeCall.technician_phone && (
                  <a
                    href={`https://wa.me/55${activeCall.technician_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition"
                    style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chamar no WhatsApp
                  </a>
                )}

                {activeCall.technician_payment_methods?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-cream/35">Aceita:</span>
                    {activeCall.technician_payment_methods.map((m) => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}>
                        {m === 'pix' ? 'PIX' : m === 'cartao' ? 'Cartão' : 'Dinheiro'}
                      </span>
                    ))}
                  </div>
                )}
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
