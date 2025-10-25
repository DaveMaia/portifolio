# Sistema de presença com QR Code

Aplicação Next.js integrada ao Supabase para emissão de tickets e validação de presença via QR Code.

## 🚀 Tecnologias

- Next.js 14 (App Router) + React 18
- Supabase (Postgres + Auth)
- html5-qrcode para leitura de QR Codes
- pdf-lib e qrcode para geração de tickets em PDF

## 📦 Estrutura principal

```
app/
  ├─ (admin)/events         # CRUD de eventos
  ├─ (admin)/tickets        # Emissão de tickets
  ├─ (auth)/login           # Tela de autenticação
  ├─ api/
  │   ├─ tickets/generate   # API para gerar tokens/tickets
  │   └─ validate           # API para validação (usa função RPC validate_ticket_once)
  └─ scan                   # Scanner com html5-qrcode
lib/supabase.ts             # Clientes Supabase (browser, server e service role)
scripts/seed.ts             # Popula evento e 5 tickets de teste
```

## 🗄️ Banco de dados

Execute no Supabase o SQL disponibilizado no playbook do projeto para criar as tabelas `events`, `tickets`, `attendance_logs` e a função `validate_ticket_once`. Ajuste as políticas RLS conforme necessário (ex.: somente admins conseguem ler/emitir tickets, a API de validação usa Service Role).

## 🔧 Configuração

1. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.local.example .env.local
   ```
2. Preencha os valores:
   - `NEXT_PUBLIC_SITE_URL`: URL pública da aplicação (ex.: `http://localhost:3000`).
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: dados do seu projeto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave Service Role (usada apenas no servidor).
   - `NEXT_PUBLIC_VALIDATE_SERVICE_KEY`: segredo utilizado pela tela de scanner para autenticar a chamada à API `/api/validate`. Ele deve corresponder à `SUPABASE_SERVICE_ROLE_KEY`, portanto distribua-o somente para dispositivos confiáveis.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
5. Abra `http://localhost:3000` no navegador. A rota `/scan` funciona melhor em dispositivos móveis.

## 🔐 Autenticação e acesso

- A tela de login (`/(auth)/login`) utiliza o Supabase Auth UI. Configure provedores/e-mail conforme suas regras.
- Somente usuários com `role='admin'` (armazenado em `app_metadata` ou `user_metadata`) podem acessar rotas dentro de `(admin)`.
- O formulário de logout envia POST para `/auth/signout`.

## 🎟️ Fluxo de emissão

1. Crie um evento em `/(admin)/events`.
2. Vá até `/(admin)/tickets`, escolha o evento e a quantidade de tickets.
3. Os tokens são armazenados apenas como hash `sha256` no banco. A interface mostra os QR Codes e permite baixar cada ticket em PDF individual.

## 📲 Validação

- A tela `/scan` lê o QR Code, extrai o parâmetro `tok` e chama `POST /api/validate` enviando o cabeçalho `x-service-role-key`.
- A API calcula o hash, chama a função `validate_ticket_once` (que deve executar a lógica transacional de validação e log) e devolve o status.

## 🌱 Seed de dados

Para cadastrar um evento de teste e 5 tickets:
```bash
npm run seed
```
Os tokens gerados serão exibidos no terminal.

## 📝 Scripts úteis

- `npm run dev` — inicia o servidor Next.js em modo desenvolvimento.
- `npm run build` — cria o build de produção.
- `npm run start` — inicia o servidor em modo produção.
- `npm run seed` — executa `scripts/seed.ts` usando `dotenv-cli`.

## ✅ Checklist para produção

- Defina as variáveis de ambiente em `Vercel`/`Supabase`.
- Garanta HTTPS para usar a câmera no mobile.
- Distribua o segredo `NEXT_PUBLIC_VALIDATE_SERVICE_KEY` apenas para dispositivos confiáveis.
- Monitore `attendance_logs` para auditoria das entradas.
