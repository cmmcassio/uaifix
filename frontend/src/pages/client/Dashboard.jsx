import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ClientDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (!user || user.role !== 'client') navigate('/cliente/login')
  }, [user, navigate])

  if (!user) return null

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-primary-700">UaiFix</h1>
          <p className="text-xs text-gray-400">Olá, {user.name?.split(' ')[0]}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 transition"
        >
          Sair
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
          <div className="w-14 h-14 bg-primary-700/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Bem-vindo, {user.name?.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-500 mt-1">Sua conta está ativa e pronta para usar.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-700 mb-4">O que você precisa?</h3>

          <button
            disabled
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 text-left opacity-70 cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-primary-700/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-700">Abrir chamado</p>
              <p className="text-xs text-gray-500">Geladeira ou máquina de lavar com problema</p>
            </div>
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full shrink-0">
              Em breve
            </span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Como funciona</h3>
          <ol className="space-y-3">
            {[
              'Você abre um chamado descrevendo o problema e equipamento',
              'Encontramos um técnico disponível na sua região',
              'O técnico entra em contato e vai até você',
              'Após o serviço, você avalia o técnico',
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 bg-primary-700/10 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  )
}
