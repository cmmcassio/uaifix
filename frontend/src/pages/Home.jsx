import { useNavigate } from 'react-router-dom'

function RoleCard({ title, description, icon, onLogin, onRegister, accent }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col gap-4 ${
      accent ? 'border-accent-500/30' : 'border-primary-500/20'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        accent ? 'bg-accent-500/10' : 'bg-primary-700/10'
      }`}>
        {icon}
      </div>

      <div>
        <h2 className={`text-lg font-bold ${accent ? 'text-accent-600' : 'text-primary-700'}`}>
          {title}
        </h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={onLogin}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
            accent
              ? 'bg-accent-500 text-white hover:bg-accent-600'
              : 'bg-primary-700 text-white hover:bg-primary-800'
          }`}
        >
          Entrar
        </button>
        <button
          onClick={onRegister}
          className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          Criar conta
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-primary-700">UaiFix</h1>
          <p className="text-xs text-gray-400">Assistência técnica em Minas Gerais</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-700/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Bem-vindo ao UaiFix</h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Conectamos clientes a técnicos especializados em geladeiras e máquinas de lavar em MG.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RoleCard
              title="Sou Cliente"
              description="Preciso de um técnico para consertar minha geladeira ou máquina de lavar."
              icon={
                <svg className="w-6 h-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
              onLogin={() => navigate('/cliente/login')}
              onRegister={() => navigate('/cliente/cadastro')}
              accent={false}
            />

            <RoleCard
              title="Sou Técnico"
              description="Quero receber chamados de clientes na minha região e ampliar minha renda."
              icon={
                <svg className="w-6 h-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              }
              onLogin={() => navigate('/tecnico/login')}
              onRegister={() => navigate('/tecnico/cadastro')}
              accent={true}
            />
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Painel administrativo?{' '}
            <button
              onClick={() => navigate('/admin/login')}
              className="text-primary-700 hover:underline font-medium"
            >
              Acesso restrito
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
