import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import ProgressSteps from '../../components/ProgressSteps'
import FileUpload from '../../components/FileUpload'
import Logo from '../../components/Logo'

const STEPS = ['Dados', 'Endereço', 'CPF', 'Documentos', 'Termos']

const TERMS_TEXT = `TERMO DE RESPONSABILIDADE — UAIFIX

1. O técnico cadastrado na plataforma UaiFix é profissional autônomo ou MEI, sem qualquer vínculo empregatício com a UaiFix.

2. O técnico é responsável pela qualidade, segurança e legalidade dos serviços prestados.

3. A UaiFix é intermediária entre técnicos e clientes. Não garante volume mínimo de chamados.

4. O técnico concorda em cumprir as regras da plataforma, incluindo limites de atendimento, avaliações e condutas com clientes.

5. Dados falsos no cadastro implicam suspensão imediata e possível ação legal.

6. O técnico autoriza a UaiFix a compartilhar seu nome, foto e avaliações com os clientes dentro da plataforma.

7. A mensalidade de R$59,00 dá direito de acesso à plataforma. Não há reembolso por "falta de chamados".

8. Reembolso é garantido apenas em: cancelamento antes de utilizar o serviço, cobrança duplicada ou plataforma fora do ar por mais de 48 horas consecutivas.`

function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false
  for (let i = 9; i <= 10; i++) {
    let sum = 0
    for (let j = 0; j < i; j++) sum += parseInt(cpf[j]) * (i + 1 - j)
    let rem = (sum * 10) % 11
    if (rem === 10 || rem === 11) rem = 0
    if (rem !== parseInt(cpf[i])) return false
  }
  return true
}

function maskCPF(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(v) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskCEP(v) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')
}

const InputField = ({ label, required, error, children }) => (
  <div>
    <label className="form-label">
      {label} {required && <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs" style={{ color: '#F87171' }}>{error}</p>}
  </div>
)

const inputClass = (error) => `form-input${error ? ' error' : ''}`

export default function TechnicianRegister() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    zip_code: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    cpf: '',
    termsAccepted: false,
  })
  const [files, setFiles] = useState({ selfie: null, proof_of_address: null })
  const [cepLoading, setCepLoading] = useState(false)

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
    if (step === 3) {
      if (!validateCPF(form.cpf)) e.cpf = 'CPF inválido'
    }
    if (step === 4) {
      if (!files.selfie) e.selfie = 'Selfie obrigatória'
      if (!files.proof_of_address) e.proof_of_address = 'Comprovante obrigatório'
    }
    if (step === 5) {
      if (!form.termsAccepted) e.termsAccepted = 'Você deve aceitar os termos para continuar'
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
    setStep((s) => s + 1)
    window.scrollTo(0, 0)
  }

  const back = () => {
    setStep((s) => s - 1)
    window.scrollTo(0, 0)
  }

  const submit = async () => {
    if (!validateStep()) return
    setLoading(true)
    setGlobalError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('phone', form.phone.replace(/\D/g, ''))
      fd.append('email', form.email.toLowerCase().trim())
      fd.append('password', form.password)
      fd.append('zip_code', form.zip_code.replace(/\D/g, ''))
      fd.append('street', form.street.trim())
      fd.append('number', form.number.trim())
      if (form.complement.trim()) fd.append('complement', form.complement.trim())
      fd.append('neighborhood', form.neighborhood.trim())
      fd.append('city', form.city.trim())
      fd.append('state', form.state.toUpperCase().trim())
      fd.append('cpf', form.cpf.replace(/\D/g, ''))
      fd.append('selfie', files.selfie)
      fd.append('proof_of_address', files.proof_of_address)

      await api.post('/auth/register/technician', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/tecnico/aguardando')
    } catch (err) {
      setGlobalError(err.response?.data?.detail || 'Erro ao enviar cadastro. Tente novamente.')
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
          <p className="text-cream/40 text-sm mt-2">Cadastro de Técnico</p>
        </div>

        <div className="card p-6">
          <ProgressSteps steps={STEPS} current={step} />

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">Dados de Acesso</h2>

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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">CPF</h2>

              <div className="info-box">
                <p className="font-semibold mb-1">Por que pedimos seu CPF?</p>
                <p>
                  Usamos o CPF <strong>apenas para verificar sua identidade</strong> durante a análise do cadastro.
                  Ele nunca é exibido para clientes nem compartilhado com terceiros.
                </p>
              </div>

              <InputField label="CPF" required error={errors.cpf}>
                <input className={inputClass(errors.cpf)} placeholder="000.000.000-00" value={maskCPF(form.cpf)} onChange={(e) => set('cpf', e.target.value)} />
              </InputField>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-cream">Documentos</h2>
              <p className="text-sm text-cream/45">
                Seus documentos são analisados pela equipe UaiFix em até 48 horas e não são compartilhados com clientes.
              </p>

              <FileUpload
                label="Selfie"
                hint="Foto do rosto com boa iluminação. Sem óculos escuros ou boné."
                value={files.selfie}
                onChange={(f) => setFiles((prev) => ({ ...prev, selfie: f }))}
                required
              />
              {errors.selfie && <p className="text-xs" style={{ color: '#F87171' }}>{errors.selfie}</p>}

              <FileUpload
                label="Comprovante de endereço"
                hint="Conta de água, luz, gás ou internet dos últimos 3 meses."
                value={files.proof_of_address}
                onChange={(f) => setFiles((prev) => ({ ...prev, proof_of_address: f }))}
                required
              />
              {errors.proof_of_address && <p className="text-xs" style={{ color: '#F87171' }}>{errors.proof_of_address}</p>}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-cream">Termos de Responsabilidade</h2>

              <div className="rounded-xl p-4 h-56 overflow-y-auto text-xs text-cream/55 whitespace-pre-wrap leading-relaxed"
                   style={{ background: 'rgba(13,17,23,0.4)', border: '1px solid rgba(201,168,76,0.15)' }}>
                {TERMS_TEXT}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded"
                  style={{ accentColor: '#C9A84C' }}
                  checked={form.termsAccepted}
                  onChange={(e) => set('termsAccepted', e.target.checked)}
                />
                <span className="text-sm text-cream/60">
                  Li e concordo com os Termos de Responsabilidade da UaiFix. Entendo que sou profissional autônomo e que a UaiFix não garante volume de chamados.
                </span>
              </label>
              {errors.termsAccepted && <p className="text-xs" style={{ color: '#F87171' }}>{errors.termsAccepted}</p>}

              {globalError && <div className="error-box">{globalError}</div>}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={back} disabled={loading} className="btn-muted flex-1 py-3">
                Voltar
              </button>
            )}
            {step < 5 ? (
              <button onClick={next} className="btn-gold flex-1 py-3">Próximo</button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn-gold flex-1 py-3">
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 rounded-full border-2" style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
                    Enviando...
                  </>
                ) : 'Enviar Cadastro'}
              </button>
            )}
          </div>

          {step === 1 && (
            <p className="text-center text-xs text-cream/40 mt-4">
              Já tem conta?{' '}
              <a href="/tecnico/login" className="text-gold font-medium hover:underline">Entrar</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
