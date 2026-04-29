import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../api/client'

const APPLIANCE_LABEL = { refrigerator: 'Geladeira', washing_machine: 'Máquina de lavar' }
const APPLIANCE_ICON = {
  refrigerator: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h12a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-2.25z" />
    </svg>
  ),
  washing_machine: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z" />
    </svg>
  ),
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

function fmtPhone(p) {
  const d = p.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}

function AvailableCard({ call, onAccept, accepting }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-accent-500/10 text-accent-600 rounded-xl flex items-center justify-center shrink-0">
          {APPLIANCE_ICON[call.appliance_type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {APPLIANCE_LABEL[call.appliance_type]} {call.brand}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">{call.symptom}</p>
          {call.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{call.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        {call.neighborhood}, {call.city} · {timeAgo(call.created_at)}
      </div>

      <button
        onClick={() => onAccept(call.id)}
        disabled={accepting === call.id}
        className="w-full bg-accent-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-accent-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {accepting === call.id ? (
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
        ) : 'Aceitar chamado'}
      </button>
    </div>
  )
}

function ActiveJobCard({ call }) {
  return (
    <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-green-100 text-green-700 rounded-xl flex items-center justify-center shrink-0">
          {APPLIANCE_ICON[call.appliance_type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {APPLIANCE_LABEL[call.appliance_type]} {call.brand}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">{call.symptom}</p>
        </div>
        <span className="shrink-0 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
          Aceito
        </span>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
        <p className="font-semibold text-gray-700">{call.client_name}</p>
        <a
          href={`https://wa.me/55${call.client_phone.replace(/\D/g,'')}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-green-700 font-medium hover:underline"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {fmtPhone(call.client_phone)}
        </a>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {call.street}, {call.number}{call.complement ? ` — ${call.complement}` : ''} · {call.neighborhood}, {call.city}
        </p>
      </div>
    </div>
  )
}

export default function TechnicianDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('available')
  const [available, setAvailable] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || user.role !== 'technician') navigate('/tecnico/login')
  }, [user, navigate])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [avRes, jobRes] = await Promise.all([
        api.get('/calls/available'),
        api.get('/calls/my-jobs'),
      ])
      setAvailable(avRes.data)
      setMyJobs(jobRes.data)
    } catch (err) {
      if (err.response?.status !== 401) {
        setError('Erro ao carregar chamados. Verifique sua conexão.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchAll()
  }, [user, fetchAll])

  const accept = async (callId) => {
    setAccepting(callId)
    setError('')
    try {
      await api.post(`/calls/${callId}/accept`)
      await fetchAll()
      setTab('jobs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao aceitar chamado.')
    } finally {
      setAccepting(null)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-primary-700">UaiFix</h1>
          <p className="text-xs text-gray-400">Olá, {user.name?.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-40"
            title="Atualizar"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-800 transition">
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-2xl mx-auto flex">
          {[
            { key: 'available', label: 'Disponíveis', count: available.length },
            { key: 'jobs', label: 'Meus atendimentos', count: myJobs.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === key
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  tab === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-7 w-7 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        ) : tab === 'available' ? (
          available.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Nenhum chamado disponível</p>
              <p className="text-xs text-gray-400">Novos chamados da sua região aparecem aqui.</p>
            </div>
          ) : (
            available.map((call) => (
              <AvailableCard key={call.id} call={call} onAccept={accept} accepting={accepting} />
            ))
          )
        ) : (
          myJobs.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Nenhum atendimento ativo</p>
              <p className="text-xs text-gray-400">Aceite um chamado disponível para começar.</p>
            </div>
          ) : (
            myJobs.map((call) => <ActiveJobCard key={call.id} call={call} />)
          )
        )}
      </main>
    </div>
  )
}
