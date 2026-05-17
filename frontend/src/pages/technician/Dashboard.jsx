import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import Logo from '../../components/Logo'

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

const APPLIANCE_ICON_64 = {
  refrigerator: (
    <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth={0.9}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h12a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5v.75M8.25 16.5v1.5" />
    </svg>
  ),
  washing_machine: (
    <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="#999" strokeWidth={0.9}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.75h.75M8.25 6.75H9M10.5 12a1.5 1.5 0 012.5-1.118" />
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

function parseUTC(s) {
  if (typeof s === 'string' && !s.endsWith('Z') && !/[+\-]\d\d:\d\d$/.test(s)) {
    return new Date(s + 'Z')
  }
  return new Date(s)
}

function addMinutes(isoStr, minutes) {
  return new Date(parseUTC(isoStr).getTime() + minutes * 60000).toISOString()
}

const noop = () => {}

function useCountdown(expiresAt, onExpired) {
  const [secsLeft, setSecsLeft] = useState(() =>
    expiresAt ? Math.max(0, Math.floor((parseUTC(expiresAt) - Date.now()) / 1000)) : null
  )
  const expiredFired = useRef(false)

  useEffect(() => {
    if (!expiresAt) return
    expiredFired.current = false
    const interval = setInterval(() => {
      const s = Math.max(0, Math.floor((parseUTC(expiresAt) - Date.now()) / 1000))
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

const STAR_PATH = "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"

function Stars({ value, size = 14, filled = true }) {
  const rounded = Math.round(value)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
             fill={(!filled || i <= rounded) ? '#C9A84C' : 'none'} stroke="#C9A84C" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

function AvailableCard({ call, onAccept, onDecline, accepting, declining, onExpired, techPricing, techStats }) {
  const secsLeft = useCountdown(call.offer_expires_at, onExpired)
  const urgent = secsLeft !== null && secsLeft <= 10

  const priceRange = call.appliance_type === 'refrigerator'
    ? techPricing?.repair_refrigerator
    : techPricing?.repair_washing_machine
  const priceDisplay = priceRange ? `R$ ${priceRange.min},00 – R$ ${priceRange.max},00` : null

  const avgRating = techStats?.avg_rating ?? 0
  const ratingCount = techStats?.ratings_count ?? 0
  const completedCount = techStats?.calls_completed_count ?? 0
  const initial = (call.client_name ?? 'C').charAt(0).toUpperCase()
  const addressParts = [call.street, call.neighborhood, call.city].filter(Boolean)

  return (
    <div>
      {/* ── CARD SERVIÇO ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-base tracking-tight" style={{ color: '#2D5016' }}>UaiFix</span>
          {secsLeft !== null && (
            <span className="text-xs font-bold tabular-nums px-2.5 py-1 rounded-full"
                  style={{
                    background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(201,168,76,0.12)',
                    color: urgent ? '#F87171' : '#C9A84C',
                    animation: urgent ? 'pulse 1s infinite' : 'none',
                  }}>
              {secsLeft}s
            </span>
          )}
        </div>

        <div className="flex justify-center mb-3">
          {APPLIANCE_ICON_64[call.appliance_type]}
        </div>

        <p className="text-center text-lg font-bold text-cream leading-tight">
          {APPLIANCE_LABEL[call.appliance_type]}{call.brand ? ` · ${call.brand}` : ''}
        </p>

        {addressParts.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-cream/45">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate">{addressParts.join(', ')}</span>
          </div>
        )}

        {priceDisplay && (
          <p className="text-center text-sm font-bold mt-3" style={{ color: '#16a34a' }}>
            Preço: {priceDisplay}
          </p>
        )}
      </div>

      {/* ── COUNTDOWN BAR ── */}
      {secsLeft !== null && (
        <div className="w-full h-1.5" style={{ background: 'rgba(240,237,228,0.05)' }}>
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, (secsLeft / 45) * 100)}%`,
              background: urgent ? '#F87171' : '#C9A84C',
            }}
          />
        </div>
      )}

      {/* ── CARD CLIENTE ── */}
      <div className="card p-5 mt-3">
        <p className="text-sm font-bold mb-4" style={{ color: '#a07428' }}>
          Informações do cliente
        </p>

        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center rounded-full text-xl font-bold text-cream shrink-0"
               style={{
                 width: 48, height: 48,
                 border: '3px solid rgba(201,168,76,0.65)',
                 background: 'rgba(201,168,76,0.1)',
               }}>
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-cream text-base leading-tight">{call.client_name ?? 'Cliente'}</p>

            {call.client_email_verified && (
              <div className="flex items-center gap-1 mt-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                     style={{ color: '#3b82f6' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>Cliente verificado</span>
              </div>
            )}

            <div className="mt-1.5">
              <Stars value={5} size={12} filled />
            </div>
          </div>
        </div>

        {(call.description || call.symptom) && (
          <p className="text-sm text-cream/50 leading-relaxed line-clamp-3 mt-4">
            {call.description || call.symptom}
          </p>
        )}
      </div>

      {/* ── CARD PERFORMANCE ── */}
      <div className="card p-5 mt-3">
        <p className="text-sm font-bold italic text-cream mb-4">Performance</p>

        <div className="flex items-center">
          <div className="flex-1 flex flex-col items-center gap-1">
            <Stars value={avgRating} size={16} />
            <p className="text-base font-bold text-cream tabular-nums">
              {avgRating > 0 ? `${avgRating.toFixed(1)}/5.0` : '—/5.0'}
            </p>
            <p className="text-[10px] text-cream/40">Avaliações ({ratingCount})</p>
          </div>

          <div className="self-stretch w-px mx-4" style={{ background: 'rgba(240,237,228,0.1)' }} />

          <div className="flex-1 flex flex-col items-center gap-1">
            <p className="text-3xl font-bold text-cream tabular-nums leading-none">{completedCount}</p>
            <p className="text-[10px] text-cream/40 text-center">Serviços realizados</p>
          </div>
        </div>
      </div>

      {/* ── BOTÕES ── */}
      <div className="flex gap-3 mt-4">
        <div className="flex flex-col gap-1.5" style={{ width: '35%' }}>
          <button
            onClick={() => onDecline(call.id)}
            disabled={declining === call.id || accepting === call.id}
            className="btn-muted py-3.5 text-sm font-semibold w-full"
            style={{ borderRadius: 24 }}
          >
            {declining === call.id ? '...' : 'Rejeitar'}
          </button>
          <p className="text-center leading-tight" style={{ fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
            O chamado será enviado para outro técnico
          </p>
        </div>
        <div className="flex flex-col gap-1.5" style={{ width: '60%' }}>
          <button
            onClick={() => onAccept(call.id)}
            disabled={accepting === call.id || declining === call.id}
            className="btn-gold py-3.5 text-sm font-semibold w-full"
            style={{ borderRadius: 24 }}
          >
            {accepting === call.id ? (
              <div className="animate-spin h-4 w-4 rounded-full border-2 mx-auto"
                   style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            ) : 'Aceitar'}
          </button>
          <p className="text-center leading-tight" style={{ fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
            Ao aceitar você receberá os dados do cliente e terá 60 minutos para iniciar o atendimento
          </p>
        </div>
      </div>
    </div>
  )
}

const ACTIVE_JOB_STATUS = {
  accepted:   { label: 'Aceito',    cls: 'badge-approved' },
  on_the_way: { label: 'A caminho', cls: 'badge-pending'  },
  arrived:    { label: 'Chegou',    cls: 'badge-active'   },
  in_progress:{ label: 'Em andamento', cls: 'badge-active' },
}

const CANCEL_REASONS = [
  { value: 'client_no_answer', label: 'Cliente não atende o telefone' },
  { value: 'part_unavailable', label: 'Peça não disponível no momento' },
  { value: 'wrong_problem',    label: 'Problema diferente do descrito pelo cliente' },
  { value: 'cannot_go',        label: 'Não consigo ir hoje',          warning: 'Essa opção gera advertência' },
  { value: 'gave_up',          label: 'Desisti do atendimento',        warning: 'Essa opção gera advertência e suspensão de 24h' },
]

function ActiveJobCard({ call, onOnTheWay, onArrived, onComplete, onTechCancel, goingOnTheWay, arriving, completing, techCancelling }) {
  const statusInfo = ACTIVE_JOB_STATUS[call.status] ?? ACTIVE_JOB_STATUS.accepted
  const busy = goingOnTheWay === call.id || arriving === call.id || completing === call.id || techCancelling === call.id

  const deadline30 = call.status === 'accepted' && call.accepted_at
    ? addMinutes(call.accepted_at, 30) : null
  const secsLeft30 = useCountdown(deadline30, noop)
  const timer30 = secsLeft30 !== null
    ? `${String(Math.floor(secsLeft30 / 60)).padStart(2, '0')}:${String(secsLeft30 % 60).padStart(2, '0')}`
    : null
  const timerUrgent = secsLeft30 !== null && secsLeft30 < 300
  const timerPulse  = secsLeft30 !== null && secsLeft30 < 120

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedReason, setSelectedReason] = useState(null)

  const handleConfirmCancel = () => {
    if (!selectedReason) return
    onTechCancel(call.id, selectedReason)
    setShowCancelModal(false)
    setSelectedReason(null)
  }

  return (
    <>
    {showCancelModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4"
           style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-sm rounded-2xl p-5 space-y-4"
             style={{ background: '#FBF8F2', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="font-bold text-base" style={{ color: '#991B1B' }}>Cancelar atendimento</p>
          <p className="text-sm" style={{ color: 'rgba(26,26,26,0.55)' }}>Selecione o motivo do cancelamento:</p>
          <div className="space-y-2">
            {CANCEL_REASONS.map((r) => {
              const selected = selectedReason === r.value
              return (
                <button
                  key={r.value}
                  onClick={() => setSelectedReason(r.value)}
                  className="w-full text-left rounded-xl px-4 py-3 transition-all"
                  style={{
                    background: selected ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${selected ? 'rgba(239,68,68,0.4)' : 'rgba(201,168,76,0.2)'}`,
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>{r.label}</p>
                  {r.warning && (
                    <p className="text-xs mt-0.5 font-semibold" style={{ color: '#DC2626' }}>⚠️ {r.warning}</p>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setShowCancelModal(false); setSelectedReason(null) }}
              className="btn-muted flex-1 py-2.5 text-sm"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={!selectedReason || techCancelling === call.id}
              className="btn-danger flex-1 py-2.5 text-sm"
            >
              {techCancelling === call.id ? <div className="spinner h-4 w-4 border-2 mx-auto" /> : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    )}

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
        <span className={`badge ${statusInfo.cls} shrink-0`}>{statusInfo.label}</span>
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

      {call.status === 'accepted' && (
        <div className="space-y-1.5">
          {timer30 !== null && (
            <p className={`text-center text-sm font-bold tabular-nums ${timerPulse ? 'animate-pulse' : ''}`}
               style={{ color: timerUrgent ? '#EF4444' : 'rgba(26,26,26,0.55)' }}>
              Clique "A caminho" em{' '}
              <span style={{ color: timerUrgent ? '#EF4444' : '#1A1A1A' }}>{timer30}</span>
              {' '}ou o chamado será redistribuído e você receberá uma advertência
            </p>
          )}
          <button onClick={() => onOnTheWay(call.id)} disabled={busy} className="btn-gold w-full py-2.5 text-sm">
            {goingOnTheWay === call.id ? <div className="spinner h-4 w-4 border-2 mx-auto" /> : 'A caminho'}
          </button>
        </div>
      )}
      {call.status === 'on_the_way' && (
        <div className="space-y-1.5">
          <button onClick={() => onArrived(call.id)} disabled={busy} className="btn-gold w-full py-2.5 text-sm">
            {arriving === call.id ? <div className="spinner h-4 w-4 border-2 mx-auto" /> : 'Cheguei no local'}
          </button>
          <p className="text-center leading-tight" style={{ fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
            Clique quando chegar no endereço do cliente para ele saber que você está no local.
          </p>
        </div>
      )}
      {(call.status === 'arrived' || call.status === 'in_progress') && (
        <div className="space-y-1.5">
          <button onClick={() => onComplete(call.id)} disabled={busy} className="btn-success w-full py-2.5 text-sm">
            {completing === call.id ? <div className="spinner h-4 w-4 border-2 mx-auto" /> : 'Marcar como concluído'}
          </button>
          <p className="text-center leading-tight" style={{ fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
            Clique quando terminar o serviço. O cliente poderá avaliar seu atendimento.
          </p>
        </div>
      )}

      <div className="pt-1">
        <button
          onClick={() => setShowCancelModal(true)}
          disabled={busy}
          className="w-full py-2 text-xs font-semibold rounded-xl transition-all"
          style={{
            background: 'transparent',
            color: 'rgba(220,38,38,0.7)',
            border: '1px solid rgba(220,38,38,0.25)',
          }}
        >
          Cancelar atendimento
        </button>
      </div>
    </div>
    </>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = typeof iso === 'string' && !iso.endsWith('Z') ? new Date(iso + 'Z') : new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function HistoryCard({ call }) {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-cream text-sm">
            {APPLIANCE_LABEL[call.appliance_type]} {call.brand}
          </p>
          <p className="text-sm text-cream/55 mt-0.5">{call.client_name}</p>
        </div>
        {call.rated_by_client && (
          <div className="flex items-center gap-1 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#C9A84C" stroke="#C9A84C" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={STAR_PATH} />
            </svg>
            <span className="text-xs font-semibold" style={{ color: '#C9A84C' }}>Avaliado</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-cream/35">
        <span>{[call.neighborhood, call.city].filter(Boolean).join(', ')}</span>
        <span>{fmtDate(call.completed_at)}</span>
      </div>
    </div>
  )
}

let _unlockedCtx = null

const playAlert = () => {
  try {
    const ctx = _unlockedCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
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
  try { navigator.vibrate([500, 200, 500, 200, 500]) } catch(e) {}
}

const PIX_LINK = 'https://nubank.com.br/cobrar/12w67k/6a08e22a-e34c-4db5-9923-d89aae7eb169'

function PaymentCard() {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1.5px solid #3B82F6',
      borderRadius: 12,
      padding: 20,
    }}>
      <p style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A', marginBottom: 4 }}>
        Dados para pagamento
      </p>
      <p style={{ fontWeight: 700, fontSize: 20, color: '#3B82F6', marginBottom: 12 }}>
        R$ 59,00 / mês
      </p>
      <div style={{ borderTop: '1px solid rgba(59,130,246,0.15)', marginBottom: 12 }} />
      <a
        href={PIX_LINK}
        target="_blank"
        rel="noreferrer"
        className="btn-gold w-full"
        style={{ borderRadius: 24, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
      >
        Pagar R$59,00 via PIX
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(26,26,26,0.45)', marginTop: 8 }}>
        Você será redirecionado para o Nubank para concluir o pagamento
      </p>
      <div style={{ borderTop: '1px solid rgba(59,130,246,0.15)', margin: '12px 0' }} />
      <p style={{ fontSize: 13, color: 'rgba(26,26,26,0.55)', textAlign: 'center' }}>
        Após o pagamento, envie o comprovante abaixo para ativar sua conta
      </p>
    </div>
  )
}

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('available')
  const prevAvailableIds = useRef(new Set())
  const alertIntervalRef = useRef(null)
  const [showNewCallBanner, setShowNewCallBanner] = useState(false)
  const [available, setAvailable] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [declining, setDeclining] = useState(null)
  const [goingOnTheWay, setGoingOnTheWay] = useState(null)
  const [arriving, setArriving] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [techCancelling, setTechCancelling] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [warningToast, setWarningToast] = useState(false)
  const [suspensionDismissed, setSuspensionDismissed] = useState(false)
  const [soundActivated, setSoundActivated] = useState(false)
  const prevWarningsRef = useRef(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const proofInputRef = useRef(null)
  const [techPricing, setTechPricing] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'technician') navigate('/tecnico/login')
  }, [user, navigate])

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [avRes, jobRes, meRes] = await Promise.all([
        api.get('/calls/available'),
        api.get('/calls/my-jobs'),
        api.get('/technician/me'),
      ])
      setAvailable(avRes.data)
      const newIds = new Set(avRes.data.map(c => c.id))
      const hasNew = avRes.data.some(c => !prevAvailableIds.current.has(c.id))
      const wasEmpty = prevAvailableIds.current.size === 0
      prevAvailableIds.current = newIds
      setMyJobs(jobRes.data)
      setSubscriptionInfo(meRes.data)

      if (avRes.data.length === 0) {
        if (alertIntervalRef.current) { clearInterval(alertIntervalRef.current); alertIntervalRef.current = null }
        setShowNewCallBanner(false)
      } else if (hasNew && !wasEmpty && !alertIntervalRef.current) {
        playAlert()
        setShowNewCallBanner(true)
        alertIntervalRef.current = setInterval(() => playAlert(), 5000)
      }
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
    api.get('/technician/pricing').then(({ data }) => setTechPricing(data)).catch(() => {})
  }, [user, fetchAll])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => fetchAll(true), 15000)
    return () => clearInterval(interval)
  }, [user, fetchAll])

  useEffect(() => {
    if (!subscriptionInfo) return
    const wc = subscriptionInfo.warnings_count ?? 0
    if (prevWarningsRef.current !== null && wc > prevWarningsRef.current) {
      setWarningToast(true)
      setTimeout(() => setWarningToast(false), 10000)
    }
    prevWarningsRef.current = wc
  }, [subscriptionInfo])

  const activateSound = () => {
    try {
      if (!_unlockedCtx) {
        _unlockedCtx = new (window.AudioContext || window.webkitAudioContext)()
      }
      if (_unlockedCtx.state === 'suspended') _unlockedCtx.resume()
      // Silent micro-beep to unlock audio on mobile
      const osc = _unlockedCtx.createOscillator()
      const gain = _unlockedCtx.createGain()
      osc.connect(gain); gain.connect(_unlockedCtx.destination)
      gain.gain.setValueAtTime(0.001, _unlockedCtx.currentTime)
      osc.start(); osc.stop(_unlockedCtx.currentTime + 0.001)
    } catch(e) {}
    setSoundActivated(true)
    localStorage.setItem('uaifix_sound_activated', '1')
  }

  useEffect(() => {
    if (localStorage.getItem('uaifix_sound_activated') === '1') {
      setSoundActivated(true)
      try {
        if (!_unlockedCtx) {
          _unlockedCtx = new (window.AudioContext || window.webkitAudioContext)()
        }
      } catch(e) {}
    }
  }, [])

  const clearAlert = () => {
    if (alertIntervalRef.current) { clearInterval(alertIntervalRef.current); alertIntervalRef.current = null }
    setShowNewCallBanner(false)
  }

  const accept = async (callId) => {
    clearAlert()
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
    clearAlert()
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

  const markOnTheWay = async (callId) => {
    setGoingOnTheWay(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/on-the-way`)
      await fetchAll(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar status.')
    } finally {
      setGoingOnTheWay(null)
    }
  }

  const markArrived = async (callId) => {
    setArriving(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/arrived`)
      await fetchAll(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao atualizar status.')
    } finally {
      setArriving(null)
    }
  }

  const techCancel = async (callId, reason) => {
    setTechCancelling(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/technician-cancel`, { reason })
      setToast('Atendimento cancelado. O chamado voltou para a fila.')
      setTimeout(() => setToast(''), 4000)
      await fetchAll()
      setTab('available')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao cancelar atendimento.')
    } finally {
      setTechCancelling(null)
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

  const isSuspended = subscriptionInfo?.suspended_until
    ? parseUTC(subscriptionInfo.suspended_until) > new Date()
    : false

  return (
    <div className="min-h-screen">
      {showNewCallBanner && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 animate-pulse"
          style={{ background: '#3B82F6', color: '#FFFFFF' }}
        >
          <span className="font-bold text-base">🔔 NOVO CHAMADO! Toque para aceitar</span>
        </div>
      )}

      {warningToast && (
        <div
          className="fixed left-0 right-0 z-40 flex items-center justify-center py-3 px-4"
          style={{ background: '#EF4444', color: '#FFFFFF', top: showNewCallBanner ? 44 : 0 }}
        >
          <span className="font-bold text-sm text-center">⚠️ Advertência recebida. Você não compareceu ao atendimento. Sua conta ficará suspensa por 24h.</span>
        </div>
      )}

      <header className="app-header px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-gold">UaiFix</span>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-cream/40">Olá, {user.name?.split(' ')[0]}</p>
            {subscriptionInfo?.warnings_count > 0 && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: subscriptionInfo.warnings_count >= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                      color: subscriptionInfo.warnings_count >= 3 ? '#DC2626' : '#92400E',
                      border: `1px solid ${subscriptionInfo.warnings_count >= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
                    }}>
                ⚠️ {subscriptionInfo.warnings_count} {subscriptionInfo.warnings_count === 1 ? 'advertência' : 'advertências'}
              </span>
            )}
          </div>
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
            onClick={soundActivated ? undefined : activateSound}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
            style={soundActivated
              ? { border: '1px solid rgba(74,222,128,0.35)', color: '#16a34a', background: 'rgba(74,222,128,0.08)', cursor: 'default' }
              : { border: '1px solid #3B82F6', color: '#3B82F6', background: 'rgba(59,130,246,0.06)', cursor: 'pointer' }
            }
          >
            {soundActivated ? '🔔 Som ativado' : '🔔 Ativar som'}
          </button>
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
        if (daysLeft > 5) {
          return (
            <div className="px-4 py-2.5 text-sm text-center font-medium"
                 style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', borderBottom: '1px solid rgba(201,168,76,0.2)' }}>
              Período de teste: {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
            </div>
          )
        }
        return (
          <div className="px-4 py-4 space-y-3"
               style={{ background: 'rgba(234,179,8,0.07)', borderBottom: '1px solid rgba(234,179,8,0.2)' }}>
            <p className="text-sm font-semibold text-center" style={{ color: '#92400E' }}>
              Seu período de teste acaba em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}. Renove agora para não perder acesso.
            </p>
            <PaymentCard />
            <input ref={proofInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                   className="hidden" onChange={uploadProof} />
            <button
              onClick={() => proofInputRef.current?.click()}
              disabled={uploadingProof}
              className="btn-ghost w-full py-2 text-sm disabled:opacity-50"
            >
              {uploadingProof ? 'Enviando...' : 'Enviar comprovante PIX'}
            </button>
          </div>
        )
      })()}

      {subscriptionInfo?.subscription_status === 'expired' && (
        <div className="px-4 py-4 space-y-3"
             style={{ background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-sm font-semibold text-center" style={{ color: '#DC2626' }}>
            Assinatura expirada. Faça o pagamento para continuar recebendo chamados.
          </p>
          <PaymentCard />
          <input ref={proofInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                 className="hidden" onChange={uploadProof} />
          <button
            onClick={() => proofInputRef.current?.click()}
            disabled={uploadingProof}
            className="btn-ghost w-full py-2 text-sm disabled:opacity-50"
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

      {isSuspended && !suspensionDismissed ? (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="card-danger p-6 text-center space-y-4">
            <p className="text-5xl">🚫</p>
            <p className="font-bold text-lg" style={{ color: '#991B1B' }}>Conta suspensa</p>
            <p className="text-sm leading-relaxed" style={{ color: '#7F1D1D' }}>
              Sua conta está suspensa até{' '}
              <strong>{fmtDate(subscriptionInfo.suspended_until)}</strong>
              {' '}por não comparecer a atendimentos aceitos.
            </p>
            <button
              onClick={() => setSuspensionDismissed(true)}
              className="btn-danger w-full py-3"
            >
              Entendi
            </button>
          </div>
        </div>
      ) : (
      <>
      <div className="app-header border-b" style={{ borderColor: 'rgba(201,168,76,0.12)' }}>
        <div className="max-w-2xl mx-auto flex">
          {[
            { key: 'available', label: 'Disponíveis', count: available.length },
            { key: 'jobs',      label: 'Meus atendimentos', count: myJobs.filter(c => c.status !== 'completed').length },
            { key: 'history',   label: 'Histórico', count: 0 },
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
                techPricing={techPricing}
                techStats={subscriptionInfo}
              />
            ))
          )
        ) : tab === 'jobs' ? (
          (() => {
            const activeJobs = myJobs.filter(c => c.status !== 'completed')
            return activeJobs.length === 0 ? (
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
            ) : activeJobs.map((call) => (
              <ActiveJobCard
                key={call.id}
                call={call}
                onOnTheWay={markOnTheWay}
                onArrived={markArrived}
                onComplete={complete}
                onTechCancel={techCancel}
                goingOnTheWay={goingOnTheWay}
                arriving={arriving}
                completing={completing}
                techCancelling={techCancelling}
              />
            ))
          })()
        ) : (
          (() => {
            const completedJobs = myJobs.filter(c => c.status === 'completed')
            return completedJobs.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                     style={{ background: 'rgba(240,237,228,0.05)' }}>
                  <svg className="w-6 h-6 text-cream/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-cream/50">Nenhum atendimento concluído</p>
                <p className="text-xs text-cream/30">Seus últimos 30 dias aparecerão aqui.</p>
              </div>
            ) : completedJobs.map((call) => (
              <HistoryCard key={call.id} call={call} />
            ))
          })()
        )}
      </main>
      </>
      )}
    </div>
  )
}
