import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import Logo from '../components/Logo'

const HOW_STEPS = [
  {
    step: '1',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h1.5" />
      </svg>
    ),
    title: 'Abra um chamado',
    desc: 'Escolha o aparelho, descreva o problema e informe seu endereço.',
  },
  {
    step: '2',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Técnico aceita',
    desc: 'Todos os técnicos da sua cidade veem seu chamado. O primeiro aceita em minutos.',
  },
  {
    step: '3',
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Acompanhe e avalie',
    desc: 'Veja em tempo real: a caminho, chegou, concluído. Avalie com estrelas.',
  },
]

const WHY_ITEMS = [
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'Técnicos verificados',
    desc: 'CPF conferido e perfil com avaliações reais de outros clientes.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Resposta em minutos',
    desc: 'Sem esperar dias por orçamento. Técnico disponível na sua cidade.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    title: 'Acompanhamento em tempo real',
    desc: 'Saiba quando o técnico está a caminho, chegou e concluiu o serviço.',
  },
  {
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#3B82F6" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Preço transparente',
    desc: 'Veja o valor estimado antes de chamar. Sem surpresas no pagamento.',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [techCount, setTechCount] = useState(null)

  useEffect(() => {
    api.get('/stats/technicians')
      .then(({ data }) => setTechCount(data.approved_technicians))
      .catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', color: '#1A1A1A', fontFamily: 'inherit' }}>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F0E8 100%)',
        padding: '56px 20px 64px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <Logo size="lg" />
          </div>

          <h1 style={{
            fontSize: 'clamp(26px, 7vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.2,
            color: '#1A1A1A',
            marginBottom: 14,
          }}>
            Técnico de confiança<br />na palma da mão
          </h1>

          <p style={{
            fontSize: 17,
            color: 'rgba(26,26,26,0.6)',
            lineHeight: 1.65,
            maxWidth: 380,
            margin: '0 auto 32px',
          }}>
            Geladeira quebrou? Máquina de lavar parou? Em minutos você tem um técnico verificado a caminho.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/cliente/login')}
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 24,
                padding: '16px 28px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                flex: '1 1 auto',
                maxWidth: 230,
              }}
            >
              Preciso de um técnico
            </button>
            <button
              onClick={() => navigate('/tecnico/login')}
              style={{
                background: 'transparent',
                color: '#3B82F6',
                border: '2px solid #3B82F6',
                borderRadius: 24,
                padding: '16px 28px',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                flex: '1 1 auto',
                maxWidth: 180,
              }}
            >
              Sou técnico
            </button>
          </div>

          <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
            Grátis para o cliente · Sem baixar app
          </p>

          {techCount !== null && techCount > 0 && (
            <p style={{ marginTop: 6, fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
              <strong style={{ color: '#3B82F6' }}>{techCount}</strong>{' '}
              técnico{techCount !== 1 ? 's' : ''} verificado{techCount !== 1 ? 's' : ''} na plataforma
            </p>
          )}
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section style={{ padding: '56px 20px', maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 36, color: '#1A1A1A' }}>
          Como funciona
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {HOW_STEPS.map((item) => (
            <div
              key={item.step}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26,26,26,0.08)',
                borderRadius: 12,
                padding: '28px 24px',
              }}
            >
              <div style={{ marginBottom: 14 }}>{item.icon}</div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#3B82F6',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 10,
              }}>
                {item.step}
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>{item.title}</p>
              <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.55)', lineHeight: 1.65 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POR QUE UAIFIX ── */}
      <section style={{ padding: '0 20px 56px', maxWidth: 860, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, marginBottom: 36, color: '#1A1A1A' }}>
          Por que escolher o UaiFix?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {WHY_ITEMS.map((item) => (
            <div
              key={item.title}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26,26,26,0.08)',
                borderRadius: 12,
                padding: '20px 20px',
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{item.title}</p>
                <p style={{ fontSize: 14, color: 'rgba(26,26,26,0.55)', lineHeight: 1.55 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARA TÉCNICOS ── */}
      <section style={{ background: '#EDE8DC', padding: '56px 20px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', marginBottom: 14, lineHeight: 1.3 }}>
            É técnico? Receba clientes<br />sem fazer marketing.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(26,26,26,0.6)', lineHeight: 1.7, marginBottom: 28 }}>
            Por R$59/mês você recebe chamados de toda a sua cidade. Sem comissão — fique com 100% do serviço.{' '}
            <strong style={{ color: '#1A1A1A' }}>30 dias grátis</strong> para testar.
          </p>
          <button
            onClick={() => navigate('/tecnico/cadastro')}
            style={{
              background: '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 24,
              padding: '16px 32px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
              maxWidth: 320,
              display: 'block',
              margin: '0 auto',
            }}
          >
            Cadastrar como técnico
          </button>
          <p style={{ marginTop: 12, fontSize: 13, color: 'rgba(26,26,26,0.4)' }}>
            30 dias grátis · Sem cartão de crédito
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: '#1A1A1A',
        color: 'rgba(255,255,255,0.55)',
        padding: '36px 20px',
        textAlign: 'center',
      }}>
        <p style={{ fontWeight: 700, color: '#FFFFFF', fontSize: 16, marginBottom: 4 }}>UaiFix</p>
        <p style={{ fontSize: 13, marginBottom: 16 }}>
          Assistência técnica de confiança · Contagem, MG
        </p>
        <a
          href="https://wa.me/5531971263573"
          target="_blank"
          rel="noreferrer"
          style={{
            color: '#4ADE80',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Suporte via WhatsApp
        </a>
        <p style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate('/admin/login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.12)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Acesso administrativo
          </button>
        </p>
      </footer>
    </div>
  )
}
