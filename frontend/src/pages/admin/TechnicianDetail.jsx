import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const STATUS = {
  pending:  { label: 'Pendente',  cls: 'badge badge-pending' },
  approved: { label: 'Aprovado',  cls: 'badge badge-approved' },
  rejected: { label: 'Reprovado', cls: 'badge badge-rejected' },
}

const REF_TYPES = { supplier: 'Fornecedor de peças', client: 'Cliente antigo' }

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0 py-2.5 last:border-0"
         style={{ borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
      <span className="text-[10px] font-bold uppercase tracking-widest sm:w-48 shrink-0 pt-0.5"
            style={{ color: 'rgba(201,168,76,0.45)' }}>
        {label}
      </span>
      <span className="text-sm text-cream/80 break-all">{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="section-title">{title}</h2>
      {children}
    </div>
  )
}

function DocImage({ label, url }) {
  const [enlarged, setEnlarged] = useState(false)

  return (
    <div>
      <p className="section-title">{label}</p>
      {url ? (
        <>
          <img
            src={url}
            alt={label}
            onClick={() => setEnlarged(true)}
            className="w-full rounded-xl object-cover max-h-52 cursor-zoom-in hover:opacity-90 transition"
            style={{ border: '1px solid rgba(201,168,76,0.2)' }}
          />
          <p className="text-xs text-cream/25 mt-1 text-center">Clique para ampliar</p>
          {enlarged && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.92)' }}
              onClick={() => setEnlarged(false)}
            >
              <img src={url} alt={label} className="max-w-full max-h-full rounded-xl shadow-2xl" />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl h-36 flex items-center justify-center text-sm text-cream/25"
             style={{ background: 'rgba(240,237,228,0.03)', border: '1px solid rgba(240,237,228,0.07)' }}>
          Não enviado
        </div>
      )}
    </div>
  )
}

export default function TechnicianDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tech, setTech] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/admin/login')
  }, [user, navigate])

  useEffect(() => {
    api.get(`/admin/technicians/${id}`)
      .then(({ data }) => setTech(data))
      .catch(() => navigate('/admin/tecnicos'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const confirmPayment = async () => {
    setActionLoading(true)
    setFeedback(null)
    try {
      await api.post(`/admin/technicians/${id}/confirm-payment`)
      setTech((t) => ({ ...t, subscription_status: 'active', payment_proof_url: null }))
      setFeedback({ type: 'success', msg: 'Pagamento confirmado. Assinatura ativada por 30 dias.' })
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Erro ao confirmar pagamento.' })
    } finally {
      setActionLoading(false)
    }
  }

  const rejectPayment = async () => {
    setActionLoading(true)
    setFeedback(null)
    try {
      await api.post(`/admin/technicians/${id}/reject-payment`)
      setTech((t) => ({ ...t, subscription_status: 'expired', payment_proof_url: null }))
      setFeedback({ type: 'success', msg: 'Comprovante rejeitado.' })
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Erro ao rejeitar pagamento.' })
    } finally {
      setActionLoading(false)
    }
  }

  const approve = async () => {
    setActionLoading(true)
    setFeedback(null)
    try {
      await api.post(`/admin/technicians/${id}/approve`)
      setTech((t) => ({ ...t, status: 'approved' }))
      setFeedback({ type: 'success', msg: 'Técnico aprovado com sucesso! Trial de 30 dias iniciado.' })
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Erro ao aprovar.' })
    } finally {
      setActionLoading(false)
    }
  }

  const reject = async () => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
    setFeedback(null)
    try {
      await api.post(`/admin/technicians/${id}/reject`, { reason: rejectReason })
      setTech((t) => ({ ...t, status: 'rejected', rejection_reason: rejectReason }))
      setFeedback({ type: 'success', msg: 'Técnico reprovado.' })
      setShowRejectForm(false)
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Erro ao reprovar.' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner h-8 w-8 border-2" />
      </div>
    )
  }

  if (!tech) return null

  const addr = tech.address
  const ref  = tech.commercial_reference
  const s    = STATUS[tech.status] || STATUS.pending

  return (
    <div className="min-h-screen">
      <header className="app-header px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/tecnicos')}
          className="text-cream/40 hover:text-cream/70 transition p-1 -ml-1 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-cream truncate">{tech.name}</h1>
          <p className="text-xs text-cream/35">Análise de cadastro</p>
        </div>

        <span className={s.cls}>{s.label}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {feedback && (
          <div className={feedback.type === 'success' ? 'toast-banner rounded-xl' : 'error-box rounded-xl'}
               style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {feedback.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {feedback.msg}
          </div>
        )}

        {tech.status === 'pending' && (
          <Section title="Decisão">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={approve}
                  disabled={actionLoading}
                  className="btn-success flex-1 py-3"
                >
                  {actionLoading ? (
                    <div className="spinner h-4 w-4 border-2" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Aprovar Técnico
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="btn-danger flex-1 py-3"
                >
                  Reprovar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="form-label">
                    Motivo da reprovação <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    className="form-input mt-1"
                    placeholder="Explique o motivo para o técnico (ex: documento ilegível, CPF inválido)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                    disabled={actionLoading}
                    className="btn-muted flex-1 py-2.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={reject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="btn-danger flex-1 py-2.5"
                  >
                    {actionLoading && <div className="spinner h-4 w-4 border-2" />}
                    Confirmar Reprovação
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        {tech.rejection_reason && (
          <div className="error-box rounded-xl">
            <span className="font-semibold">Motivo da reprovação:</span> {tech.rejection_reason}
          </div>
        )}

        {tech.payment_proof_url && tech.subscription_status === 'pending_payment' && (
          <Section title="Comprovante de Pagamento">
            <DocImage label="Comprovante enviado pelo técnico" url={tech.payment_proof_url} />
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmPayment}
                disabled={actionLoading}
                className="btn-success flex-1 py-3"
              >
                {actionLoading ? (
                  <div className="spinner h-4 w-4 border-2" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Confirmar pagamento
                  </>
                )}
              </button>
              <button
                onClick={rejectPayment}
                disabled={actionLoading}
                className="btn-danger flex-1 py-3"
              >
                Rejeitar comprovante
              </button>
            </div>
          </Section>
        )}

        <Section title="Documentos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DocImage label="Selfie" url={tech.selfie_url} />
            <DocImage label="Comprovante de endereço" url={tech.proof_of_address_url} />
          </div>
        </Section>

        <Section title="Dados Pessoais">
          <Row label="Nome" value={tech.name} />
          <Row label="CPF" value={tech.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')} />
          <Row label="E-mail" value={tech.email} />
          <Row label="WhatsApp" value={tech.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')} />
          <Row label="Cadastro em" value={fmt(tech.created_at)} />
          <Row label="Termos aceitos em" value={fmt(tech.terms_accepted_at)} />
          {tech.approved_at && <Row label="Aprovado em" value={fmt(tech.approved_at)} />}
          {tech.rejected_at && <Row label="Reprovado em" value={fmt(tech.rejected_at)} />}
        </Section>

        <Section title="Endereço">
          <Row label="CEP" value={addr.zip_code.replace(/(\d{5})(\d{3})/, '$1-$2')} />
          <Row label="Logradouro" value={`${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}`} />
          <Row label="Bairro" value={addr.neighborhood} />
          <Row label="Cidade / UF" value={`${addr.city} / ${addr.state}`} />
        </Section>

        {ref && (
          <Section title="Referência Comercial">
            <Row label="Tipo" value={REF_TYPES[ref.type] || ref.type} />
            <Row label="Nome" value={ref.name} />
            <Row label="Contato" value={ref.contact} />
          </Section>
        )}

      </main>
    </div>
  )
}
