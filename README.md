# UaiFix — Setup Local

## Pré-requisitos
- Python 3.11+
- Node.js 20+
- MongoDB rodando em localhost:27017

## Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API disponível em: http://localhost:8000  
Docs automáticos: http://localhost:8000/docs

## Frontend

```bash
cd frontend
npm install
npm run dev
```

App disponível em: http://localhost:5173

## Rotas principais

| URL | O que é |
|-----|---------|
| /tecnico/cadastro | Formulário de cadastro do técnico (5 etapas) |
| /tecnico/aguardando | Tela de aguardo após cadastro |
| /admin/login | Login do painel admin |
| /admin/tecnicos | Fila de aprovação de técnicos |
| /admin/tecnicos/:id | Detalhes e aprovação/reprovação |

## Credenciais Admin (dev)
- Email: cassio@uaifix.com.br
- Senha: uaifix2024admin

Altere em `backend/.env` antes de subir para produção.
