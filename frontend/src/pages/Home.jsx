import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Logo from '../components/Logo'

export default function Home() {
  const navigate = useNavigate()
  const [techCount, setTechCount] = useState(null)

  useEffect(() => {
    api.get('/stats/technicians')
      .then(({ data }) => setTechCount(data.approved_technicians))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full flex flex-col items-center gap-8">

          <Logo size="lg" />

          <div className="text-center">
            <h2 className="text-3xl font-bold text-cream leading-tight">
              Geladeira ou lavadora<br />com problema?
            </h2>
            <p className="text-sm text-cream/50 mt-3">
              Técnicos verificados na sua cidade, prontos para atender.
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/cliente/login')}
              className="w-full py-4 rounded-[8px] font-bold transition-all flex flex-col items-center"
              style={{ background: '#C9A84C', color: '#0D1117' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#E8C96E' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#C9A84C' }}
            >
              Sou Cliente
              <span className="text-xs font-normal mt-0.5" style={{ opacity: 0.65 }}>Chamar técnico agora</span>
            </button>

            <button
              onClick={() => navigate('/tecnico/login')}
              className="w-full py-3 rounded-[8px] font-semibold transition-all flex flex-col items-center"
              style={{ background: 'transparent', color: '#F0EDE4', border: '1px solid #C9A84C' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: '#555555' }}>Sou Técnico</span>
              <span className="text-xs font-normal mt-0.5" style={{ color: '#555555' }}>Cadastrar ou entrar</span>
            </button>
          </div>

          <div className="text-center">
            {techCount === null ? (
              <div className="flex justify-center">
                <div className="spinner h-4 w-4 border-2" />
              </div>
            ) : (
              <p className="text-sm text-cream/40">
                <span className="text-gold font-bold text-lg">{techCount}</span>
                {' '}técnico{techCount !== 1 ? 's' : ''} verificado{techCount !== 1 ? 's' : ''} na plataforma
              </p>
            )}
          </div>

        </div>
      </main>

      <footer className="pb-6 text-center">
        <button
          onClick={() => navigate('/admin/login')}
          className="text-xs text-cream/22 hover:text-cream/50 transition"
          style={{ color: 'rgba(240,237,228,0.22)' }}
        >
          Acesso administrativo
        </button>
      </footer>
    </div>
  )
}
