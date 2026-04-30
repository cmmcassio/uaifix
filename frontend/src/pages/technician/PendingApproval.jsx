import Logo from '../../components/Logo'

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <Logo size="sm" showTagline={false} />
        </div>

        <div className="card p-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}>
            <svg className="w-8 h-8" style={{ color: '#F59E0B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-cream mb-2">Cadastro em análise</h1>
          <p className="text-cream/50 text-sm leading-relaxed mb-6">
            Seu cadastro foi enviado com sucesso e está sendo analisado pela equipe UaiFix.
            Você receberá uma notificação por e-mail em até <strong className="text-cream/80">48 horas</strong>.
          </p>

          <div className="rounded-xl p-4 text-left space-y-3 text-sm mb-6"
               style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)' }}>
            <p className="font-semibold text-gold/80">O que acontece agora:</p>
            {[
              'Nossa equipe verifica seus documentos e referência comercial',
              'Você recebe um e-mail com o resultado (aprovado ou reprovado com motivo)',
              'Se aprovado, você terá acesso à plataforma por 30 dias gratuitos',
            ].map((txt, i) => (
              <div key={i} className="flex gap-2 text-cream/60">
                <span className="text-gold/60 shrink-0">{i + 1}.</span>
                <span>{txt}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-cream/30">
            Dúvidas?{' '}
            <a href="mailto:suporte@uaifix.com.br" className="text-gold/60 font-medium hover:underline">
              suporte@uaifix.com.br
            </a>
          </p>
        </div>

        <p className="text-xs text-cream/25 mt-4">UaiFix — Assistência técnica em MG</p>
      </div>
    </div>
  )
}
