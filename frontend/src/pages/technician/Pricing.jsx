import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition'

function RangeField({ label, hint, fieldMin, fieldMax, form, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Mínimo (R$)</label>
          <input
            type="number"
            min={0}
            max={99999}
            className={inputClass}
            placeholder="Ex: 80"
            value={form[fieldMin]}
            onChange={(e) => onChange(fieldMin, e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Máximo (R$)</label>
          <input
            type="number"
            min={0}
            max={99999}
            className={inputClass}
            placeholder="Ex: 150"
            value={form[fieldMax]}
            onChange={(e) => onChange(fieldMax, e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    diag_min: '', diag_max: '',
    fridge_min: '', fridge_max: '',
    wash_min: '', wash_max: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'technician') navigate('/tecnico/login')
  }, [user, navigate])

  useEffect(() => {
    api.get('/technician/pricing')
      .then(({ data }) => {
        setForm({
          diag_min: data.diagnostic_fee?.min ?? '',
          diag_max: data.diagnostic_fee?.max ?? '',
          fridge_min: data.repair_refrigerator?.min ?? '',
          fridge_max: data.repair_refrigerator?.max ?? '',
          wash_min: data.repair_washing_machine?.min ?? '',
          wash_max: data.repair_washing_machine?.max ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const buildRange = (min, max) => {
    const mn = parseInt(min)
    const mx = parseInt(max)
    if (!min && !max) return undefined
    if (isNaN(mn) || isNaN(mx)) return null
    if (mn > mx) return null
    return { min: mn, max: mx }
  }

  const save = async () => {
    setError('')
    const diag = buildRange(form.diag_min, form.diag_max)
    const fridge = buildRange(form.fridge_min, form.fridge_max)
    const wash = buildRange(form.wash_min, form.wash_max)

    if (diag === null || fridge === null || wash === null) {
      setError('O valor mínimo não pode ser maior que o máximo.')
      return
    }

    setSaving(true)
    try {
      await api.put('/technician/pricing', {
        ...(diag && { diagnostic_fee: diag }),
        ...(fridge && { repair_refrigerator: fridge }),
        ...(wash && { repair_washing_machine: wash }),
      })
      setToast('Valores salvos com sucesso!')
      setTimeout(() => setToast(''), 3000)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/tecnico/dashboard')}
          className="text-gray-400 hover:text-gray-700 transition p-1 -ml-1 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-800">Meus preços</h1>
          <p className="text-xs text-gray-400">Esses valores são exibidos para os clientes antes do chamado</p>
        </div>
      </header>

      {toast && (
        <div className="bg-green-600 text-white text-sm text-center py-2.5 font-medium">{toast}</div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-800">
          Informe faixas de preço para que os clientes saibam o que esperar. Valores são estimativas — o combinado final é direto com o cliente.
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <RangeField
            label="Visita diagnóstico"
            hint="Valor cobrado pela visita e avaliação do problema"
            fieldMin="diag_min" fieldMax="diag_max"
            form={form} onChange={set}
          />
          <hr className="border-gray-100" />
          <RangeField
            label="Conserto de geladeira"
            hint="Estimativa para o reparo (excluindo peças)"
            fieldMin="fridge_min" fieldMax="fridge_max"
            form={form} onChange={set}
          />
          <hr className="border-gray-100" />
          <RangeField
            label="Conserto de máquina de lavar"
            hint="Estimativa para o reparo (excluindo peças)"
            fieldMin="wash_min" fieldMax="wash_max"
            form={form} onChange={set}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-primary-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : 'Salvar preços'}
          </button>
        </div>
      </main>
    </div>
  )
}
