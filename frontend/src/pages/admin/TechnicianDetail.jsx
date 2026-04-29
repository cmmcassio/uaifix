import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const STATUS = {
  pending:  { label: 'Pendente',  cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Aprovado',  cls: 'bg-green-100 text-green-800' },
  rejected: { label: 'Reprovado', cls: 'bg-red-100 text-red-800' },
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
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-0 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-48 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 break-all">{value || '—'}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</h2>
      {children}
    </div>
  )
}

function DocImage({ label, url }) {
  const [enlarged, setEnlarged] = useState(false)

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {url ? (
        <>
          <img
            src={url}
            alt={label}
            onClick={() => setEnlarged(true)}
            className="w-full rounded-xl object-cover max-h-52 border border-gray-200 cursor-zoom-in hover:opacity-90 transition"
          />
          <p className="text-xs text-gray-400 mt-1 text-center">Clique para ampliar</p>
          {enlarged && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
              onClick={() => setEnlarged(false)}
            >
              <img src={url} alt={label} className="max-w-full max-h-full rounded-xl shadow-2xl" />
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-100 rounded-xl h-36 flex items-center justify-center text-gray-400 text-sm">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!tech) return null

  const addr = tech.address
  const ref  = tech.commercial_reference
  const s    = STATUS[tech.status] || STATUS.pending

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/tecnicos')}
          className="text-gray-400 hover:text-gray-700 transition p-1 -ml-1 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-800 truncate">{tech.name}</h1>
          <p className="text-xs text-gray-400">Análise de cadastro</p>
        </div>

        <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
          {s.label}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {feedback && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
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

        {/* Decisão — aparece primeiro para técnicos pendentes */}
        {tech.status === 'pending' && (
          <Section title="Decisão">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={approve}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 active:bg-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Aprovar Técnico
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-50 text-red-700 border border-red-200 rounded-xl py-3 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
                >
                  Reprovar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da reprovação <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    placeholder="Explique o motivo para o técnico (ex: documento ilegível, CPF inválido)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason('') }}
                    disabled={actionLoading}
                    className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={reject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading && (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    )}
                    Confirmar Reprovação
                  </button>
                </div>
              </div>
            )}
          </Section>
        )}

        {tech.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            <span className="font-semibold">Motivo da reprovação:</span> {tech.rejection_reason}
          </div>
        )}

        {/* Documentos */}
        <Section title="Documentos">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DocImage label="Selfie" url={tech.selfie_url} />
            <DocImage label="Comprovante de endereço" url={tech.proof_of_address_url} />
          </div>
        </Section>

        {/* Dados pessoais */}
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

        {/* Endereço */}
        <Section title="Endereço">
          <Row label="CEP" value={addr.zip_code.replace(/(\d{5})(\d{3})/, '$1-$2')} />
          <Row
            label="Logradouro"
            value={`${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}`}
          />
          <Row label="Bairro" value={addr.neighborhood} />
          <Row label="Cidade / UF" value={`${addr.city} / ${addr.state}`} />
        </Section>

        {/* Referência comercial — só exibe se preenchida */}
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
