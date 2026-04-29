import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const REF_TYPES = { supplier: 'Fornecedor de peças', client: 'Cliente antigo' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || '—'}</span>
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
    try {
      await api.post(`/admin/technicians/${id}/approve`)
      setTech((t) => ({ ...t, status: 'approved' }))
      setFeedback({ type: 'success', msg: 'Técnico aprovado com sucesso!' })
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.detail || 'Erro ao aprovar.' })
    } finally {
      setActionLoading(false)
    }
  }

  const reject = async () => {
    if (!rejectReason.trim()) return
    setActionLoading(true)
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
  const ref = tech.commercial_reference

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/tecnicos')} className="text-gray-500 hover:text-gray-800 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{tech.name}</h1>
          <p className="text-xs text-gray-500">Análise de cadastro</p>
        </div>
        <div className="ml-auto">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            tech.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
            : tech.status === 'approved' ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
          }`}>
            {tech.status === 'pending' ? 'Pendente' : tech.status === 'approved' ? 'Aprovado' : 'Reprovado'}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {feedback && (
          <div className={`rounded-xl p-4 text-sm font-medium ${
            feedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {feedback.msg}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Dados Pessoais</h2>
          <Row label="Nome" value={tech.name} />
          <Row label="CPF" value={tech.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')} />
          <Row label="E-mail" value={tech.email} />
          <Row label="Telefone" value={tech.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')} />
          <Row label="Cadastro em" value={formatDate(tech.created_at)} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Endereço</h2>
          <Row label="CEP" value={addr.zip_code.replace(/(\d{5})(\d{3})/, '$1-$2')} />
          <Row label="Logradouro" value={`${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}`} />
          <Row label="Bairro" value={addr.neighborhood} />
          <Row label="Cidade / UF" value={`${addr.city} / ${addr.state}`} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Referência Comercial</h2>
          <Row label="Tipo" value={REF_TYPES[ref.type] || ref.type} />
          <Row label="Nome" value={ref.name} />
          <Row label="Contato" value={ref.contact} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">Documentos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">SELFIE</p>
              {tech.selfie_url ? (
                <img src={tech.selfie_url} alt="Selfie" className="w-full rounded-xl object-cover max-h-48 border border-gray-200" />
              ) : (
                <div className="bg-gray-100 rounded-xl h-32 flex items-center justify-center text-gray-400 text-sm">Não enviado</div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">COMPROVANTE DE ENDEREÇO</p>
              {tech.proof_of_address_url ? (
                <img src={tech.proof_of_address_url} alt="Comprovante" className="w-full rounded-xl object-cover max-h-48 border border-gray-200" />
              ) : (
                <div className="bg-gray-100 rounded-xl h-32 flex items-center justify-center text-gray-400 text-sm">Não enviado</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Termos</h2>
          <Row label="Aceito em" value={formatDate(tech.terms_accepted_at)} />
        </div>

        {tech.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            <span className="font-semibold">Motivo da reprovação:</span> {tech.rejection_reason}
          </div>
        )}

        {tech.status === 'pending' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Decisão</h2>

            {!showRejectForm ? (
              <div className="flex gap-3">
                <button
                  onClick={approve}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Processando...' : 'Aprovar Técnico'}
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                    placeholder="Explique o motivo para o técnico..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={reject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Processando...' : 'Confirmar Reprovação'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
