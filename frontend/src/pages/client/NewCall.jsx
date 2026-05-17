import { useEffect, useState } from 'react'
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
    'Não está gelando', 'Fazendo barulho', 'Vazando água', 'Não liga',
    'Porta não fecha bem', 'Gela demais / formando gelo em excesso',
    'Compressor não para', 'Outro',
  ],
  washing_machine: [
    'Não centrifuga', 'Não liga', 'Vazando água', 'Fazendo barulho estranho',
    'Não drena a água', 'Para no meio do ciclo', 'Não agita',
    'Vibração excessiva', 'Outro',
  ],
}

function fmt(v) { return `R$ ${v}` }

function maskCEP(v) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

export default function NewCall() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    appliance_type: '', brand: '', symptom: '', description: '',
    zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [pricing, setPricing] = useState(null)
  const [cepLoading, setCepLoading] = useState(false)

  useEffect(() => {
    if (!form.appliance_type) { setPricing(null); return }
    api.get(`/stats/pricing?appliance=${form.appliance_type}`)
      .then(({ data }) => {
        if (data.diagnostic || data.repair) setPricing(data)
        else setPricing(null)
      })
      .catch(() => setPricing(null))
  }, [form.appliance_type])

  const fetchCEP = async (raw) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }))
        setErrors((prev) => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }))
      }
    } catch {
      // ViaCEP falhou — usuário preenche manualmente
    } finally {
      setCepLoading(false)
    }
  }

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
    if (form.zip_code.replace(/\D/g, '').length !== 8) e.zip_code = 'CEP inválido'
    if (!form.street.trim()) e.street = 'Logradouro obrigatório'
    if (!form.number.trim()) e.number = 'Número obrigatório'
    if (!form.neighborhood.trim()) e.neighborhood = 'Bairro obrigatório'
    if (!form.city.trim()) e.city = 'Cidade obrigatória'
    if (!form.state.trim()) e.state = 'Estado obrigatório'
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
        zip_code: form.zip_code.replace(/\D/g, ''),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || undefined,
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.toUpperCase().trim(),
      })
      if (window.gtag) {
        window.gtag('event', 'chamado_criado', {
          event_category: 'chamado',
          event_label: form.appliance_type,
          value: 1,
        })
      }
      navigate('/cliente/dashboard', { state: { callCreated: true } })
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erro ao abrir chamado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/cliente/dashboard')}
            className="text-cream/40 hover:text-cream/70 transition p-1 -ml-1 rounded-lg"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(44,36,22,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-cream">Abrir chamado</h1>
            <p className="text-xs text-cream/35">Descreva o problema do seu aparelho</p>
          </div>
        </div>

        <div className="card p-6 space-y-6">

          <div>
            <label className="form-label">
              Qual aparelho está com problema? <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {APPLIANCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => set('appliance_type', a.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                  style={{
                    border: `2px solid ${form.appliance_type === a.id ? '#C9A84C' : 'rgba(201,168,76,0.15)'}`,
                    background: form.appliance_type === a.id ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.65)',
                    color: form.appliance_type === a.id ? '#C9A84C' : 'rgba(44,36,22,0.6)',
                  }}
                >
                  {a.icon}
                  <span className="text-sm font-medium">{a.label}</span>
                </button>
              ))}
            </div>
            {errors.appliance_type && (
              <p className="mt-1.5 text-xs" style={{ color: '#F87171' }}>{errors.appliance_type}</p>
            )}
          </div>

          {pricing && (
            <div className="info-box space-y-1.5">
              <p className="text-xs font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Valores estimados pelos técnicos da plataforma
              </p>
              {pricing.diagnostic && (
                <p className="text-xs">Visita diagnóstico: <span className="font-semibold">{fmt(pricing.diagnostic.min)} – {fmt(pricing.diagnostic.max)}</span></p>
              )}
              {pricing.repair && (
                <p className="text-xs">Conserto: <span className="font-semibold">{fmt(pricing.repair.min)} – {fmt(pricing.repair.max)}</span></p>
              )}
              <p className="text-xs opacity-70">O valor final é combinado diretamente com o técnico.</p>
            </div>
          )}

          <div>
            <label className="form-label">Marca <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
            <input
              className={`form-input mt-1${errors.brand ? ' error' : ''}`}
              placeholder="Ex: Brastemp, Electrolux, Samsung..."
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
            />
            {errors.brand && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.brand}</p>}
          </div>

          {form.appliance_type && (
            <div>
              <label className="form-label">Qual o problema? <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
              <select
                className={`form-input mt-1${errors.symptom ? ' error' : ''}`}
                value={form.symptom}
                onChange={(e) => set('symptom', e.target.value)}
              >
                <option value="">Selecione o problema...</option>
                {SYMPTOMS[form.appliance_type].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.symptom && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.symptom}</p>}
            </div>
          )}

          <div>
            <label className="form-label">
              Detalhes adicionais <span className="text-cream/25 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              rows={3}
              className="form-input mt-1"
              placeholder="Ex: o barulho começou há 3 dias, aparece uma luz piscando..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <label className="form-label">Endereço do atendimento</label>

            <div>
              <label className="form-label">
                CEP <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>
              </label>
              <div className="relative mt-1">
                <input
                  className={`form-input${errors.zip_code ? ' error' : ''}`}
                  placeholder="00000-000"
                  value={maskCEP(form.zip_code)}
                  onChange={(e) => {
                    set('zip_code', e.target.value)
                    fetchCEP(e.target.value)
                  }}
                />
                {cepLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 rounded-full border-2"
                         style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
                  </div>
                )}
              </div>
              {errors.zip_code && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.zip_code}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="form-label">Logradouro <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
                <input
                  className={`form-input mt-1${errors.street ? ' error' : ''}`}
                  placeholder="Rua, Av..."
                  value={form.street}
                  onChange={(e) => set('street', e.target.value)}
                />
                {errors.street && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.street}</p>}
              </div>
              <div>
                <label className="form-label">Número <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
                <input
                  className={`form-input mt-1${errors.number ? ' error' : ''}`}
                  placeholder="123"
                  value={form.number}
                  onChange={(e) => set('number', e.target.value)}
                />
                {errors.number && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.number}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">
                Complemento <span className="text-cream/25 font-normal normal-case">(opcional)</span>
              </label>
              <input
                className="form-input mt-1"
                placeholder="Apto, Bloco..."
                value={form.complement}
                onChange={(e) => set('complement', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Bairro <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
              <input
                className={`form-input mt-1${errors.neighborhood ? ' error' : ''}`}
                placeholder="Bairro"
                value={form.neighborhood}
                onChange={(e) => set('neighborhood', e.target.value)}
              />
              {errors.neighborhood && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.neighborhood}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="form-label">Cidade <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
                <input
                  className={`form-input mt-1${errors.city ? ' error' : ''}`}
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                />
                {errors.city && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.city}</p>}
              </div>
              <div>
                <label className="form-label">UF <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span></label>
                <input
                  className={`form-input mt-1${errors.state ? ' error' : ''}`}
                  placeholder="MG"
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => set('state', e.target.value.toUpperCase())}
                />
                {errors.state && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{errors.state}</p>}
              </div>
            </div>
          </div>

          {globalError && <div className="error-box">{globalError}</div>}

          <button onClick={submit} disabled={loading} className="btn-gold w-full py-3">
            {loading ? (
              <div className="animate-spin h-4 w-4 rounded-full border-2" style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
            ) : 'Abrir chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}
