# CLAUDE.md — UaiFix

Referência completa de regras de negócio, arquitetura e convenções de desenvolvimento.
Consulte este arquivo antes de implementar qualquer feature.

---

## 1. O que é o UaiFix

Marketplace que conecta clientes a técnicos de refrigeração e lavadora em Minas Gerais.
- **Cliente** usa gratuitamente.
- **Técnico** paga R$ 59/mês após o trial.
- UaiFix **não intermedia pagamento** — técnico e cliente acertam diretamente.
- Objetivo estratégico: todo dado fica no UaiFix (não no WhatsApp). Cassio controla a base de clientes.

---

## 2. Stack

| Camada     | Tecnologia                        | Deploy     |
|------------|-----------------------------------|------------|
| Backend    | FastAPI + Python 3.11             | Render     |
| Banco      | MongoDB (motor assíncrono)        | MongoDB Atlas |
| Frontend   | React + Vite + Tailwind CSS       | Vercel     |
| Mobile     | Android nativo (Fase 1)           | Play Store |
| iOS        | Fase 2                            | App Store  |

Repositório de referência: github.com/cmmcassio/tecnuber-mvp-2025-09-06

---

## 3. Fases de Crescimento

| Fase | Escopo                                        | Gatilho para avançar              |
|------|-----------------------------------------------|-----------------------------------|
| 0    | 10 técnicos da rede do irmão, sem anúncios    | Validação do fluxo completo       |
| 1    | BH Metro (BH, Contagem, Betim, Nova Lima)     | Crescimento orgânico              |
| 2    | Uberlândia, Juiz de Fora, Montes Claros       | 10 técnicos ativos → Google Ads R$30/dia |
| 3    | Todo MG                                       | Estratégia de conteúdo (irmão)    |
| 4    | Todo MG + Meta Ads para técnicos              | —                                 |
| Futuro | Santiago, Chile                            | —                                 |

---

## 4. Cadastro e Aprovação de Técnico

### Fluxo
1. Técnico preenche formulário de 5 etapas (web).
2. Backend salva com `status: "pending"`.
3. Admin analisa no painel — aprova ou reprova com motivo.
4. Ao aprovar: `trial_started_at` é definido, `status → "approved"`.
5. Técnico reprovado recebe motivo e pode reenviar (novo cadastro).

### Dados coletados no cadastro
- Nome, CPF (validado com dígitos verificadores), e-mail, telefone, senha (mín. 8 chars)
- Endereço completo (CEP, rua, número, complemento, bairro, cidade, estado)
- Selfie + comprovante de endereço (JPG/PNG/WebP, máx. 5 MB cada)
- Referência comercial (nome, contato, tipo: fornecedor ou cliente)
- Aceite dos termos (registra timestamp + IP)

### Status do técnico
```
pending → approved → active (com trial ou assinante)
pending → rejected
approved → suspended (3 advertências)
```

---

## 5. Trial do Técnico

- **Duração:** 30 dias **ou** 10 chamados aceitos — o que vier primeiro.
- Contagem: `trial_started_at` (data) + `trial_calls_accepted` (contador).
- Ao expirar: técnico deve assinar para continuar recebendo chamados.
- Durante o trial: acesso completo igual ao assinante.

---

## 6. Assinatura

- **Valor:** R$ 59,00 / mês.
- **Pagamento:** PIX manual na Fase 1 — admin confirma no painel.
- **Inadimplência:** técnico bloqueado da fila até regularizar.
- Fase 2+: gateway automático (a definir).

---

## 7. Regras de Despacho de Chamados

### Raio expandido
O sistema tenta encontrar técnico disponível em raios crescentes:
1. 20 km
2. 35 km
3. 50 km

Se nenhum técnico disponível em 50 km → chamado fica em espera ou é cancelado (a definir).

### Round-robin por zona
Dentro de cada raio, a oferta segue fila circular (round-robin) — técnicos elegíveis recebem na vez deles, sem favoritismo.

### Oferta exclusiva
- Cada técnico recebe a oferta por **120 segundos** (exclusivo).
- Se não aceitar em 120s → oferta expira → próximo técnico na fila.
- Apenas **um técnico por vez** pode ver e aceitar um chamado — sem corrida.
- Aceite é **atômico** (transação com lock otimista no MongoDB para evitar duplicidade).

### Critérios de elegibilidade do técnico para receber oferta
- `status: "approved"`
- Trial válido **ou** assinatura ativa
- Não está em cooldown (30 min após completar chamado)
- Não atingiu limite diário (máx. 3 chamados/dia)
- Não está em suspensão temporária por recusas

---

## 8. Limites e Penalidades do Técnico

| Regra                          | Valor         | Consequência                     |
|--------------------------------|---------------|----------------------------------|
| Chamados por dia               | máx. 3        | Fora da fila pelo resto do dia   |
| Cooldown entre chamados        | 30 minutos    | Fora da fila durante o cooldown  |
| Recusas consecutivas           | 3 recusas     | 2 horas fora da fila             |
| Advertências acumuladas        | 3 advertências| Suspensão de 30 dias             |

**Advertência** é emitida pelo admin manualmente (ex.: cliente reclamou, não compareceu).
**Recusa** é automática: técnico rejeitou a oferta ou deixou expirar os 120s.

---

## 9. Regras do Cliente

- Máx. **1 chamado aberto** por vez.
- Antes de abrir novo chamado, deve **avaliar o técnico** (prazo: 24 horas após conclusão).
- Se não avaliar em 24h: avaliação automática neutra (3 estrelas) e chamado liberado.
- Não há cadastro obrigatório na Fase 0/1 — cliente abre chamado com nome e telefone (ou conta simples, a definir).

### Níveis de confiança do cliente
| Nível     | Critério                              |
|-----------|---------------------------------------|
| Novo      | Primeiro chamado                      |
| Regular   | ≥ 3 chamados concluídos sem disputa   |
| Confiável | ≥ 10 chamados concluídos sem disputa  |

Nível é exibido ao técnico no momento da oferta (contexto para aceitar ou recusar).

---

## 10. Avaliações

- Após conclusão: cliente avalia técnico (1–5 estrelas + comentário opcional).
- Técnico pode avaliar cliente (1–5 estrelas, sem comentário público).
- Avaliações ficam visíveis no perfil público do técnico.
- Admin pode remover avaliação abusiva.

---

## 11. Disputas

- Cliente ou técnico pode abrir disputa em até **48 horas** após conclusão.
- Admin resolve manualmente na Fase 1.
- Resolução possível: reembolso, advertência, cancelamento de avaliação.
- UaiFix não estorna dinheiro (pagamento é direto entre técnico e cliente).

---

## 12. Papéis e Permissões

| Role        | Acesso                                                     |
|-------------|------------------------------------------------------------|
| `admin`     | Tudo: aprovar técnicos, ver fila, resolver disputas, confirmar PIX |
| `technician`| App mobile: receber/aceitar chamados, ver histórico, perfil |
| `client`    | Web/app: abrir chamado, acompanhar, avaliar                |

Auth via JWT (Bearer token). Token expira em 7 dias.
Admin autentica via e-mail+senha fixos no `.env`.

---

## 13. Estrutura de Arquivos

```
uaifix/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py       # Settings (env vars)
│   │   │   └── security.py     # JWT, bcrypt, validação CPF
│   │   ├── models/             # Modelos Pydantic para o MongoDB
│   │   ├── schemas/            # Request/response schemas
│   │   ├── routes/
│   │   │   ├── auth.py         # Cadastro e login (técnico + admin)
│   │   │   └── admin.py        # Painel admin (aprovação de técnicos)
│   │   ├── database.py         # Conexão motor + get_db
│   │   └── main.py             # FastAPI app, CORS, lifespan
│   ├── uploads/                # Selfies e comprovantes (local dev)
│   ├── requirements.txt
│   └── .env                    # Variáveis de ambiente (não commitar)
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Axios com baseURL e interceptors
│   │   ├── contexts/           # AuthContext (JWT storage + decode)
│   │   ├── components/         # ProgressSteps, FileUpload
│   │   └── pages/
│   │       ├── technician/     # Register (5 etapas), PendingApproval
│   │       └── admin/          # Login, TechnicianQueue, TechnicianDetail
│   └── App.jsx                 # Rotas React
└── CLAUDE.md
```

---

## 14. Variáveis de Ambiente (backend/.env)

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=uaifix
SECRET_KEY=<chave-forte-para-producao>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ADMIN_EMAIL=cassio@uaifix.com.br
ADMIN_PASSWORD=<senha-forte>
UPLOADS_DIR=uploads
FRONTEND_URL=http://localhost:5173
```

**Nunca commitar `.env` com credenciais de produção.**

---

## 15. O que já está implementado

- [x] Cadastro de técnico (5 etapas, upload de documentos, validação de CPF)
- [x] Login de técnico (JWT)
- [x] Login de admin (JWT)
- [x] Painel admin: fila de técnicos pendentes, detalhes, aprovação e reprovação
- [x] Tela de aguardo pós-cadastro

## 16. O que ainda precisa ser construído (backlog)

- [ ] Dashboard do técnico (app/web): receber e aceitar chamados
- [ ] Fluxo do cliente: abrir chamado, acompanhar status
- [ ] Motor de despacho (round-robin + raio + 120s de oferta atômica)
- [ ] Sistema de avaliações (cliente avalia técnico, técnico avalia cliente)
- [ ] Controle de trial (expirar por data ou por 10 chamados)
- [ ] Assinatura: tela de pagamento PIX + confirmação manual pelo admin
- [ ] Penalidades automáticas (cooldown, 3 recusas → 2h fora, advertências → suspensão)
- [ ] Notificações push (Firebase) — Android
- [ ] Disputas: abertura e resolução pelo admin
- [ ] Histórico de chamados (técnico + cliente)
- [ ] Perfil público do técnico (avaliações, especialidades)
- [ ] Níveis de confiança do cliente

---

## 17. Convenções de Desenvolvimento

- **Idioma do código:** inglês (variáveis, funções, classes). Mensagens de erro para o usuário: português brasileiro.
- **Commits:** mensagens em português descritivo (ex.: `feat: adiciona motor de despacho com round-robin`).
- **Testes:** verificar sempre que o servidor sobe sem erro antes de fechar uma tarefa.
- **Segurança:** nunca expor CPF completo em respostas de API — mascarar (ex.: `***.123.456-**`).
- **Datas:** sempre UTC no banco; converter para horário de Brasília (UTC-3) apenas na exibição.
- **Uploads:** em produção usar S3/R2 — `uploads/` local é só para desenvolvimento.
- **Paginação:** listas de admin com limite padrão de 50 itens.
