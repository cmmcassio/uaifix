import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../../components/Logo'

export default function ClientLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, 'client')
      navigate('/cliente/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="flex flex-col items-center mb-8">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition">
            <Logo size="sm" showTagline={false} />
          </button>
          <p className="text-cream/40 text-sm mt-2">Área do Cliente</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-cream">Entrar</h2>

          {error && <div className="error-box">{error}</div>}

          <div>
            <label className="form-label">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Senha</label>
            <input
              type="password"
              autoComplete="current-password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3"
          >
            {loading ? (
              <div className="animate-spin h-4 w-4 rounded-full border-2" style={{ borderColor: 'rgba(13,17,23,0.25)', borderTopColor: '#0D1117' }} />
            ) : 'Entrar'}
          </button>

          <p className="text-center text-xs text-cream/40">
            Não tem conta?{' '}
            <Link to="/cliente/cadastro" className="text-gold font-medium hover:underline">
              Criar conta grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
