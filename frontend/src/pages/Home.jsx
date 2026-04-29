import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Home() {
  const navigate = useNavigate()
  const [techCount, setTechCount] = useState(null)

  useEffect(() => {
    api.get('/stats/technicians')
      .then(({ data }) => setTechCount(data.approved_technicians))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-primary-700">UaiFix</h1>
          <p className="text-xs text-gray-400">Assistência técnica em Minas Gerais</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full flex flex-col gap-6">

          {/* Headline */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-800 leading-tight">
              Geladeira ou lavadora<br />com problema?
            </h2>
            <p className="text-sm text-gray-500 mt-3">
              Técnicos verificados na sua cidade, prontos para atender.
            </p>
          </div>

          {/* Botão principal — cliente */}
          <button
            onClick={() => navigate('/cliente/login')}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white rounded-2xl py-4 text-base font-bold transition shadow-sm"
          >
            Sou Cliente
            <span className="block text-xs font-normal opacity-80 mt-0.5">Chamar técnico agora</span>
          </button>

          {/* Botão secundário — técnico */}
          <button
            onClick={() => navigate('/tecnico/login')}
            className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-2xl py-3 text-sm font-semibold transition"
          >
            Sou Técnico
            <span className="block text-xs font-normal text-gray-400 mt-0.5">Cadastrar ou entrar</span>
          </button>

          {/* Contador */}
          <div className="text-center">
            {techCount === null ? (
              <div className="flex justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-primary-400 border-t-transparent rounded-full" />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                <span className="text-primary-700 font-bold text-lg">{techCount}</span>
                {' '}técnico{techCount !== 1 ? 's' : ''} verificado{techCount !== 1 ? 's' : ''} na plataforma
              </p>
            )}
          </div>

        </div>
      </main>

      <footer className="pb-6 text-center">
        <button
          onClick={() => navigate('/admin/login')}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Acesso administrativo
        </button>
      </footer>
    </div>
  )
}
