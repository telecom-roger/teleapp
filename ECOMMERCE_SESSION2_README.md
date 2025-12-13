# Configuração do Sistema de E-mails

## Sessão 2 - Checkpoint Completo ✅

### 🎯 O que foi entregue

1. **Checkout Completo (5 páginas)**
   - ✅ Tipo de Cliente (PF/PJ)
   - ✅ Dados Cadastrais
   - ✅ Endereço (com integração ViaCEP)
   - ✅ Upload de Documentos
   - ✅ Confirmação e Criação do Pedido
   - ✅ Página de Obrigado

2. **Carrinho de Compras**
   - ✅ Context React com localStorage
   - ✅ Sidebar fixa (desktop) + bottom bar (mobile)
   - ✅ Gerenciamento de itens (add/remove/update)
   - ✅ Suporte a linhas adicionais (PJ)
   - ✅ Cálculo automático de totais

3. **Kanban Visual Admin**
   - ✅ Visualização em colunas por etapa
   - ✅ Cards de pedidos arrastáveis visualmente
   - ✅ Dialog de detalhes completo
   - ✅ Mudança de status via Select
   - ✅ API endpoint PUT /orders/:id/status

4. **Sistema de E-mails**
   - ✅ Templates HTML responsivos
   - ✅ E-mail de boas-vindas com credenciais
   - ✅ E-mail de confirmação de pedido
   - ✅ E-mail de atualização de status
   - ✅ Integração com nodemailer

---

## 📧 Configuração do SMTP

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto e adicione:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM="TeleApp" <noreply@teleapp.com>

# App URL (para links nos emails)
APP_URL=http://localhost:5000
```

### 2. Configuração Gmail (Recomendado para testes)

Se usar Gmail, você precisa gerar uma **Senha de App**:

1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá em **Segurança** → **Verificação em duas etapas** (ative se não estiver)
3. Procure por **Senhas de app**
4. Crie uma nova senha de app para "Mail" ou "Outro"
5. Copie a senha gerada (16 caracteres sem espaços)
6. Use essa senha em `SMTP_PASS`

### 3. Outros Provedores SMTP

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha
```

#### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=sua-access-key
SMTP_PASS=sua-secret-key
```

---

## 🧪 Testar o Sistema de E-mails

### Verificar se SMTP está configurado
```javascript
// O sistema detecta automaticamente
// Se não configurado, apenas loga no console sem enviar emails
```

### Testar manualmente
1. Faça um pedido completo pelo checkout
2. Verifique o console do servidor para mensagens de log
3. Verifique sua caixa de entrada (e spam)

### E-mails esperados:
- **Boas-vindas**: Enviado quando um novo cliente é criado via e-commerce
- **Pedido recebido**: Enviado após confirmação do pedido
- **Status atualizado**: Enviado quando admin move pedido no Kanban

---

## 🛠️ Desenvolvimento sem SMTP

Se não quiser configurar SMTP agora:

1. As senhas temporárias aparecem no console:
```
Novo usuário criado: cliente@exemplo.com / Senha: AB12cd34
```

2. Os emails não são enviados, mas o sistema funciona normalmente

3. Configure SMTP mais tarde quando for para produção

---

## 📝 Estrutura de Templates

Os templates estão em `server/emailService.ts`:

### Template de Boas-vindas
- Inclui credenciais de acesso
- Link para login no sistema
- Gradiente purple/blue (identidade visual)

### Template de Pedido Recebido
- Número do pedido
- Lista de produtos
- Gradiente green (sucesso)

### Template de Status
- Pedido ID
- Novo status em badge
- Gradiente blue (informativo)

---

## 🔐 Segurança

⚠️ **NUNCA commite o arquivo .env**

Adicione ao `.gitignore`:
```
.env
.env.local
.env.production
```

Para produção, use variáveis de ambiente do servidor/hosting:
- Heroku: `heroku config:set SMTP_USER=...`
- Vercel: Dashboard → Settings → Environment Variables
- AWS: Systems Manager → Parameter Store
- Docker: `docker run -e SMTP_USER=...`

---

## 📊 Monitoramento

Para produção, recomendamos adicionar:
- Logs de emails enviados com sucesso/falha
- Rate limiting (ex: max 100 emails/hora)
- Queue system (ex: Bull/Redis) para emails em fila
- Templates mais sofisticados (Handlebars/Pug)
- Tracking de abertura (pixels/links)

---

## ✅ Checklist Sessão 2

- [x] CartContext com localStorage
- [x] CartSidebar responsivo (desktop + mobile)
- [x] 5 páginas de checkout completas
- [x] Página de obrigado
- [x] Integração com API de pedidos
- [x] Kanban visual com colunas
- [x] Dialog de detalhes do pedido
- [x] Mudança de status com select
- [x] 3 templates de email HTML
- [x] Integração SMTP com nodemailer
- [x] Detecção automática de SMTP configurado
- [x] Envio assíncrono sem bloquear API
- [x] Documentação completa

## 🚀 Próximos Passos Sugeridos

**Sessão 3 (opcional):**
- Drag & drop no Kanban (react-beautiful-dnd)
- Upload real de documentos com storage
- Painel do cliente (visualizar meus pedidos)
- Filtros avançados no Kanban
- Relatórios de vendas
- Histórico de mudanças de status (timeline)
- Notificações push
- Chat integrado com pedidos

---

**Desenvolvido por: GitHub Copilot**
**Data: Janeiro 2025**
