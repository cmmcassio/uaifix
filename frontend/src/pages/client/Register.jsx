import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'
import ProgressSteps from '../../components/ProgressSteps'
import Logo from '../../components/Logo'

const STEPS = ['Dados', 'Endereço']

function maskPhone(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskCEP(v) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

const inputClass = (error) => `form-input${error ? ' error' : ''}`

const InputField = ({ label, required, error, children }) => (
  <div>
    <label className="form-label">
      {label} {required && <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{error}</p>}
  </div>
)

export default function ClientRegister() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [errors, setErrors] = useState({})
  const [cepLoading, setCepLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  })

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Nome obrigatório'
      if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'WhatsApp inválido'
      if (!form.email.includes('@')) e.email = 'E-mail inválido'
      if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Senhas não conferem'
    }
    if (step === 2) {
      if (form.zip_code.replace(/\D/g, '').length !== 8) e.zip_code = 'CEP inválido'
      if (!form.street.trim()) e.street = 'Logradouro obrigatório'
      if (!form.number.trim()) e.number = 'Número obrigatório'
      if (!form.neighborhood.trim()) e.neighborhood = 'Bairro obrigatório'
      if (!form.city.trim()) e.city = 'Cidade obrigatória'
      if (!form.state.trim()) e.state = 'Estado obrigatório'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const fetchCEP = async (cep) => {
    const digits = cep.replace(/\D/g, '')
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
      }
    } catch {
      // ViaCEP falhou — usuário preenche manualmente
    } finally {
      setCepLoading(false)
    }
  }

  const next = () => {
    if (!validateStep()) return
    setStep(2)
    window.scrollTo(0, 0)
  }

  const submit = async () => {
    if (!validateStep()) return
    setLoading(true)
    setGlobalError('')
    try {
      await api.post('/auth/register/client', {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        zip_code: form.zip_code.replace(/\D/g, ''),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || undefined,
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.toUpperCase().trim(),
      })
      await login(form.email.toLowerCase().trim(), form.password, 'client')
      navigate('/cliente/dashboard')
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex flex-col items-center mb-6">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition">
            <Logo size="sm" showTagline={false} />
          </button>
          <p className="text-cream/40 text-sm mt-2">Criar conta de Cliente</p>
        </div>

        <div className="card p-6">
          <ProgressSteps steps={STEPS} current={step} />

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">Seus dados</h2>

              <InputField label="Nome completo" required error={errors.name}>
                <input className={inputClass(errors.name)} placeholder="Seu nome completo" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </InputField>

              <InputField label="WhatsApp" required error={errors.phone}>
                <input className={inputClass(errors.phone)} placeholder="(31) 99999-9999" value={maskPhone(form.phone)} onChange={(e) => set('phone', e.target.value)} />
              </InputField>

              <InputField label="E-mail" required error={errors.email}>
                <input type="email" className={inputClass(errors.email)} placeholder="seu@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </InputField>

              <InputField label="Senha" required error={errors.password}>
                <input type="password" className={inputClass(errors.password)} placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </InputField>

              <InputField label="Confirmar senha" required error={errors.confirmPassword}>
                <input type="password" className={inputClass(errors.confirmPassword)} placeholder="Repita a senha" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} />
              </InputField>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">Endereço</h2>
              <p className="text-sm text-cream/40">Usado para que o técnico saiba onde você está.</p>

              <InputField label="CEP" required error={errors.zip_code}>
                <div className="relative">
                  <input
                    className={inputClass(errors.zip_code)}
                    placeholder="00000-000"
                    value={maskCEP(form.zip_code)}
                    onChange={(e) => { set('zip_code', e.target.value); fetchCEP(e.target.value) }}
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-2.5">
                      <div className="spinner h-5 w-5 border-2" />
                    </div>
                  )}
                </div>
              </InputField>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <InputField label="Logradouro" required error={errors.street}>
                    <input className={inputClass(errors.street)} placeholder="Rua, Av..." value={form.street} onChange={(e) => set('street', e.target.value)} />
                  </InputField>
                </div>
                <InputField label="Número" required error={errors.number}>
                  <input className={inputClass(errors.number)} placeholder="123" value={form.number} onChange={(e) => set('number', e.target.value)} />
                </InputField>
              </div>

              <InputField label="Complemento" error={errors.complement}>
                <input className={inputClass()} placeholder="Apto, Bloco... (opcional)" value={form.complement} onChange={(e) => set('complement', e.target.value)} />
              </InputField>

              <InputField label="Bairro" required error={errors.neighborhood}>
                <input className={inputClass(errors.neighborhood)} placeholder="Bairro" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} />
              </InputField>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <InputField label="Cidade" required error={errors.city}>
                    <input className={inputClass(errors.city)} placeholder="Cidade" value={form.city} onChange={(e) => set('city', e.target.value)} />
                  </InputField>
                </div>
                <InputField label="UF" required error={errors.state}>
                  <input className={inputClass(errors.state)} placeholder="MG" maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} />
                </InputField>
              </div>

              {globalError && <div className="error-box">{globalError}</div>}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => { setStep(1); window.scrollTo(0, 0) }}
                disabled={loading}
                className="btn-muted flex-1 py-3"
              >
                Voltar
              </button>
            )}
            {step === 1 ? (
              <button onClick={next} className="btn-gold flex-1 py-3">Próximo</button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn-gold flex-1 py-3">
                {loading ? (
                  <div className="animate-spin h-4 w-4 rounded-full border-2" style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
                ) : 'Criar conta'}
              </button>
            )}
          </div>

          {step === 1 && (
            <p className="text-center text-xs text-cream/40 mt-4">
              Já tem conta?{' '}
              <Link to="/cliente/login" className="text-gold font-medium hover:underline">Entrar</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
