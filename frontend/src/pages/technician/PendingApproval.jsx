export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-gray-800 mb-2">Cadastro em análise</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Seu cadastro foi enviado com sucesso e está sendo analisado pela equipe UaiFix.
            Você receberá uma notificação por e-mail em até <strong>48 horas</strong>.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-3 text-sm text-blue-800 mb-6">
            <p className="font-semibold">O que acontece agora:</p>
            <div className="flex gap-2">
              <span>1.</span>
              <span>Nossa equipe verifica seus documentos e referência comercial</span>
            </div>
            <div className="flex gap-2">
              <span>2.</span>
              <span>Você recebe um e-mail com o resultado (aprovado ou reprovado com motivo)</span>
            </div>
            <div className="flex gap-2">
              <span>3.</span>
              <span>Se aprovado, você terá acesso à plataforma por 30 dias gratuitos</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Dúvidas? Entre em contato pelo e-mail{' '}
            <a href="mailto:suporte@uaifix.com.br" className="text-primary-700 font-medium">
              suporte@uaifix.com.br
            </a>
          </p>
        </div>

        <p className="text-xs text-gray-400 mt-4">UaiFix — Assistência técnica em MG</p>
      </div>
    </div>
  )
}
