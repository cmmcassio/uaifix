import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const APPLIANCE_LABEL = { refrigerator: 'Geladeira', washing_machine: 'Máquina de lavar' }
const APPLIANCE_ICON = {
  refrigerator: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h12a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-2.25z" />
    </svg>
  ),
  washing_machine: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
    </svg>
  ),
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

function fmtPhone(p) {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}

function useCountdown(expiresAt, onExpired) {
  const [secsLeft, setSecsLeft] = useState(() =>
    expiresAt ? Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)) : null
  )
  const expiredFired = useRef(false)

  useEffect(() => {
    if (!expiresAt) return
    expiredFired.current = false
    const interval = setInterval(() => {
      const s = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
      setSecsLeft(s)
      if (s === 0 && !expiredFired.current) {
        expiredFired.current = true
        setTimeout(onExpired, 1500)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpired])

  return secsLeft
}

function AvailableCard({ call, onAccept, onDecline, accepting, declining, onExpired }) {
  const secsLeft = useCountdown(call.offer_expires_at, onExpired)
  const urgent = secsLeft !== null && secsLeft <= 30

  return (
    <div className={urgent ? 'card-danger p-4 space-y-3' : 'card p-4 space-y-3'}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
             style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
          {APPLIANCE_ICON[call.appliance_type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-cream">
            {APPLIANCE_LABEL[call.appliance_type]} {call.brand}
          </p>
          <p className="text-sm text-cream/60 mt-0.5">{call.symptom}</p>
          {call.description && (
            <p className="text-xs text-cream/35 mt-1 line-clamp-2">{call.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-cream/35">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {call.neighborhood}, {call.city} · {timeAgo(call.created_at)}
        </div>

        {secsLeft !== null && (
          <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
                style={{
                  background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(201,168,76,0.12)',
                  color: urgent ? '#F87171' : '#C9A84C',
                  animation: urgent ? 'pulse 1s infinite' : 'none',
                }}>
            {secsLeft}s
          </span>
        )}
      </div>

      {secsLeft !== null && (
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(240,237,228,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, (secsLeft / 120) * 100)}%`,
              background: urgent ? '#F87171' : '#C9A84C',
            }}
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onDecline(call.id)}
          disabled={declining === call.id || accepting === call.id}
          className="btn-muted flex-1 py-2.5 text-sm"
        >
          {declining === call.id ? '...' : 'Recusar'}
        </button>
        <button
          onClick={() => onAccept(call.id)}
          disabled={accepting === call.id || declining === call.id}
          className="btn-gold flex-[2] py-2.5 text-sm"
        >
          {accepting === call.id ? (
            <div className="animate-spin h-4 w-4 rounded-full border-2" style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
          ) : 'Aceitar chamado'}
        </button>
      </div>
    </div>
  )
}

function ActiveJobCard({ call, onComplete, completing }) {
  return (
    <div className="card-success p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
             style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80' }}>
          {APPLIANCE_ICON[call.appliance_type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-cream">
            {APPLIANCE_LABEL[call.appliance_type]} {call.brand}
          </p>
          <p className="text-sm text-cream/55 mt-0.5">{call.symptom}</p>
        </div>
        <span className="badge badge-approved shrink-0">Aceito</span>
      </div>

      <div className="rounded-xl p-3 space-y-1.5 text-sm"
           style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}>
        <p className="font-semibold text-cream/80">{call.client_name}</p>
        <a
          href={`https://wa.me/55${call.client_phone.replace(/\D/g,'')}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 font-medium hover:underline"
          style={{ color: '#4ADE80' }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {fmtPhone(call.client_phone)}
        </a>
        <p className="text-xs text-cream/35 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {call.street}, {call.number}{call.complement ? ` — ${call.complement}` : ''} · {call.neighborhood}, {call.city}
        </p>
      </div>

      <button
        onClick={() => onComplete(call.id)}
        disabled={completing === call.id}
        className="btn-success w-full py-2.5 text-sm"
      >
        {completing === call.id ? (
          <div className="spinner h-4 w-4 border-2" />
        ) : 'Marcar como concluído'}
      </button>
    </div>
  )
}

const playAlert = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (delay) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.6)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + 0.6)
    }
    beep(0); beep(0.7); beep(1.4)
  } catch(e) {}
}

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('available')
  const prevAvailableIds = useRef(new Set())
  const [available, setAvailable] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [declining, setDeclining] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const proofInputRef = useRef(null)

  useEffect(() => {
    if (!user || user.role !== 'technician') navigate('/tecnico/login')
  }, [user, navigate])

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [avRes, jobRes] = await Promise.all([
        api.get('/calls/available'),
        api.get('/calls/my-jobs'),
      ])
      setAvailable(avRes.data)
      const newIds = new Set(avRes.data.map(c => c.id))
      const hasNew = avRes.data.some(c => !prevAvailableIds.current.has(c.id))
      if (hasNew && prevAvailableIds.current.size > 0) playAlert()
      prevAvailableIds.current = newIds
      setMyJobs(jobRes.data)
    } catch (err) {
      if (err.response?.status !== 401) {
        setError('Erro ao carregar chamados. Verifique sua conexão.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchAll()
    api.get('/technician/me').then(({ data }) => setSubscriptionInfo(data)).catch(() => {})
  }, [user, fetchAll])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => fetchAll(true), 15000)
    return () => clearInterval(interval)
  }, [user, fetchAll])

  const accept = async (callId) => {
    setAccepting(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/accept`)
      setToast('Chamado aceito! Entre em contato com o cliente.')
      setTimeout(() => setToast(''), 4000)
      await fetchAll()
      setTab('jobs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao aceitar chamado.')
    } finally {
      setAccepting(null)
    }
  }

  const decline = async (callId) => {
    setDeclining(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/decline`)
      await fetchAll(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao recusar chamado.')
    } finally {
      setDeclining(null)
    }
  }

  const complete = async (callId) => {
    if (!window.confirm('Confirmar conclusão do atendimento?')) return
    setCompleting(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/complete`)
      setToast('Atendimento concluído!')
      setTimeout(() => setToast(''), 4000)
      await fetchAll()
      setTab('available')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao concluir chamado.')
    } finally {
      setCompleting(null)
    }
  }

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append('photo', file)
      await api.put('/technician/profile-photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setToast('Foto de perfil atualizada!')
      setTimeout(() => setToast(''), 4000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar foto.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const uploadProof = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingProof(true)
    try {
      const form = new FormData()
      form.append('proof', file)
      await api.post('/technician/upload-payment-proof', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setToast('Comprovante enviado! Aguarde a confirmação do admin.')
      setTimeout(() => setToast(''), 5000)
      const { data } = await api.get('/technician/me')
      setSubscriptionInfo(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao enviar comprovante.')
    } finally {
      setUploadingProof(false)
      e.target.value = ''
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <header className="app-header px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-gold">UaiFix</span>
          <p className="text-xs text-cream/40">Olá, {user.name?.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={uploadPhoto}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="text-xs text-cream/45 hover:text-cream/80 transition px-2.5 py-1.5 rounded-lg disabled:opacity-40"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            onMouseEnter={(e) => { if (!uploadingPhoto) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
          >
            {uploadingPhoto ? '...' : 'Alterar foto'}
          </button>
          <button
            onClick={() => navigate('/tecnico/precos')}
            className="text-xs text-cream/45 hover:text-cream/80 transition px-2.5 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
          >
            Meus preços
          </button>
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            className="text-cream/35 hover:text-cream/60 transition disabled:opacity-40"
            title="Atualizar"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button onClick={handleLogout} className="text-sm text-cream/45 hover:text-cream/80 transition">
            Sair
          </button>
        </div>
      </header>

      {toast && <div className="toast-banner">{toast}</div>}

      {subscriptionInfo?.subscription_status === 'trial' && subscriptionInfo?.trial_started_at && (() => {
        const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(subscriptionInfo.trial_started_at)) / 86400000))
        return (
          <div className="px-4 py-2.5 text-sm text-center font-medium"
               style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
            Período de teste: {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
          </div>
        )
      })()}

      {subscriptionInfo?.subscription_status === 'expired' && (
        <div className="px-4 py-3 space-y-2"
             style={{ background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-sm font-medium text-center" style={{ color: '#F87171' }}>
            Assinatura expirada. Faça o pagamento para continuar recebendo chamados.
          </p>
          <input ref={proofInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                 className="hidden" onChange={uploadProof} />
          <button
            onClick={() => proofInputRef.current?.click()}
            disabled={uploadingProof}
            className="btn-gold w-full py-2 text-sm disabled:opacity-50"
          >
            {uploadingProof ? 'Enviando...' : 'Enviar comprovante PIX'}
          </button>
        </div>
      )}

      {subscriptionInfo?.subscription_status === 'pending_payment' && (
        <div className="px-4 py-2.5 text-sm text-center font-medium"
             style={{ background: 'rgba(234,179,8,0.1)', color: '#CA8A04', borderBottom: '1px solid rgba(234,179,8,0.2)' }}>
          Comprovante enviado — aguardando confirmação do admin.
        </div>
      )}

      <div className="app-header border-b" style={{ borderColor: 'rgba(201,168,76,0.12)' }}>
        <div className="max-w-2xl mx-auto flex">
          {[
            { key: 'available', label: 'Disponíveis', count: available.length },
            { key: 'jobs', label: 'Meus atendimentos', count: myJobs.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`tab-btn ${tab === key ? 'active' : ''}`}
            >
              {label}
              {count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: tab === key ? 'rgba(201,168,76,0.15)' : 'rgba(240,237,228,0.06)',
                        color: tab === key ? '#C9A84C' : 'rgba(240,237,228,0.4)',
                      }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner h-7 w-7 border-2" />
          </div>
        ) : tab === 'available' ? (
          available.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                   style={{ background: 'rgba(240,237,228,0.05)' }}>
                <svg className="w-6 h-6 text-cream/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-cream/50">Nenhum chamado disponível</p>
              <p className="text-xs text-cream/30">Atualiza a cada 15 segundos automaticamente.</p>
            </div>
          ) : (
            available.map((call) => (
              <AvailableCard
                key={call.id}
                call={call}
                onAccept={accept}
                onDecline={decline}
                accepting={accepting}
                declining={declining}
                onExpired={() => fetchAll(true)}
              />
            ))
          )
        ) : (
          myJobs.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                   style={{ background: 'rgba(240,237,228,0.05)' }}>
                <svg className="w-6 h-6 text-cream/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-cream/50">Nenhum atendimento ativo</p>
              <p className="text-xs text-cream/30">Aceite um chamado disponível para começar.</p>
            </div>
          ) : (
            myJobs.map((call) => (
              <ActiveJobCard
                key={call.id}
                call={call}
                onComplete={complete}
                completing={completing}
              />
            ))
          )
        )}
      </main>
    </div>
  )
}
