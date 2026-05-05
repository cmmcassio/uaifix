import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/client'
import Logo from '../../components/Logo'

function maskPhone(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
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
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
  })

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nome obrigatório'
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'WhatsApp inválido'
    if (!form.email.includes('@')) e.email = 'E-mail inválido'
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Senhas não conferem'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setGlobalError('')
    try {
      await api.post('/auth/register/client', {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.toLowerCase().trim(),
        password: form.password,
      })
      setSuccess(true)
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
               style={{ background: 'rgba(74,222,128,0.12)' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                 style={{ color: '#4ADE80' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-cream">Conta criada!</h2>
            <p className="text-sm text-cream/50 mt-2">
              Verifique seu e-mail para ativar sua conta antes de entrar.
            </p>
          </div>
          <button onClick={() => navigate('/cliente/login')} className="btn-gold w-full py-3">
            Ir para o login
          </button>
        </div>
      </div>
    )
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

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-cream">Seus dados</h2>

          <InputField label="Nome completo" required error={errors.name}>
            <input
              className={inputClass(errors.name)}
              placeholder="Seu nome completo"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </InputField>

          <InputField label="WhatsApp" required error={errors.phone}>
            <input
              className={inputClass(errors.phone)}
              placeholder="(31) 99999-9999"
              value={maskPhone(form.phone)}
              onChange={(e) => set('phone', e.target.value)}
            />
          </InputField>

          <InputField label="E-mail" required error={errors.email}>
            <input
              type="email"
              className={inputClass(errors.email)}
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </InputField>

          <InputField label="Senha" required error={errors.password}>
            <input
              type="password"
              className={inputClass(errors.password)}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </InputField>

          <InputField label="Confirmar senha" required error={errors.confirmPassword}>
            <input
              type="password"
              className={inputClass(errors.confirmPassword)}
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
            />
          </InputField>

          {globalError && <div className="error-box">{globalError}</div>}

          <button onClick={submit} disabled={loading} className="btn-gold w-full py-3 mt-2">
            {loading ? (
              <div className="animate-spin h-4 w-4 rounded-full border-2 mx-auto"
                   style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
            ) : 'Criar conta'}
          </button>

          <p className="text-center text-xs text-cream/40">
            Já tem conta?{' '}
            <Link to="/cliente/login" className="text-gold font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
