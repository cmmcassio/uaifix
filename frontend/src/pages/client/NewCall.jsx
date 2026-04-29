import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

const APPLIANCES = [
  {
    id: 'refrigerator',
    label: 'Geladeira',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h12a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'washing_machine',
    label: 'Máquina de lavar',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
      </svg>
    ),
  },
]

const SYMPTOMS = {
  refrigerator: [
    'Não está gelando',
    'Fazendo barulho',
    'Vazando água',
    'Não liga',
    'Porta não fecha bem',
    'Gela demais / formando gelo em excesso',
    'Compressor não para',
    'Outro',
  ],
  washing_machine: [
    'Não centrifuga',
    'Não liga',
    'Vazando água',
    'Fazendo barulho estranho',
    'Não drena a água',
    'Para no meio do ciclo',
    'Não agita',
    'Vibração excessiva',
    'Outro',
  ],
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition'

export default function NewCall() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ appliance_type: '', brand: '', symptom: '', description: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const set = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'appliance_type') next.symptom = ''
      return next
    })
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.appliance_type) e.appliance_type = 'Selecione o aparelho'
    if (!form.brand.trim()) e.brand = 'Informe a marca'
    if (!form.symptom) e.symptom = 'Selecione o problema'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setGlobalError('')
    try {
      await api.post('/calls', {
        appliance_type: form.appliance_type,
        brand: form.brand.trim(),
        symptom: form.symptom,
        description: form.description.trim() || undefined,
      })
      navigate('/cliente/dashboard', { state: { callCreated: true } })
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erro ao abrir chamado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/cliente/dashboard')}
            className="text-gray-400 hover:text-gray-700 transition p-1 -ml-1 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Abrir chamado</h1>
            <p className="text-xs text-gray-400">Descreva o problema do seu aparelho</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

          {/* Tipo de aparelho */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Qual aparelho está com problema? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {APPLIANCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => set('appliance_type', a.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                    form.appliance_type === a.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {a.icon}
                  <span className="text-sm font-medium">{a.label}</span>
                </button>
              ))}
            </div>
            {errors.appliance_type && (
              <p className="mt-1.5 text-xs text-red-600">{errors.appliance_type}</p>
            )}
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca <span className="text-red-500">*</span>
            </label>
            <input
              className={`${inputClass} ${errors.brand ? 'border-red-400 bg-red-50' : ''}`}
              placeholder="Ex: Brastemp, Electrolux, Samsung..."
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
            />
            {errors.brand && <p className="mt-1 text-xs text-red-600">{errors.brand}</p>}
          </div>

          {/* Sintoma */}
          {form.appliance_type && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qual o problema? <span className="text-red-500">*</span>
              </label>
              <select
                className={`${inputClass} ${errors.symptom ? 'border-red-400 bg-red-50' : ''}`}
                value={form.symptom}
                onChange={(e) => set('symptom', e.target.value)}
              >
                <option value="">Selecione o problema...</option>
                {SYMPTOMS[form.appliance_type].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.symptom && <p className="mt-1 text-xs text-red-600">{errors.symptom}</p>}
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detalhes adicionais <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Ex: o barulho começou há 3 dias, aparece uma luz piscando..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-primary-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : 'Abrir chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}
