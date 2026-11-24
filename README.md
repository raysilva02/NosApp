# 💛 Nós — Cuidado e Conexão

Aplicativo que aproxima **idosos** e **cuidadores**, tirando do idoso a
burocracia de um app comum: ele não precisa adicionar contatos — o cuidador
vincula o paciente pelo telefone.

> **Design inclusivo como prioridade:** fonte grande, botões grandes (alvo de
> toque ≥48px), alto contraste (WCAG AA), navegação linear sem abas, leitura em
> voz (TTS) e mensagens rápidas.

---

## 🧱 Arquitetura

| Peça          | Tecnologia                                   |
|---------------|----------------------------------------------|
| **App mobile**| React Native + Expo (Android)                |
| Backend (API) | ASP.NET Core 8 + JWT + PostgreSQL            |
| Tempo real    | SignalR (web) + polling REST (mobile)        |
| Web (PWA)     | React + TypeScript + Vite (opcional/secundário) |

```
NosApp/
├── server/       # API .NET 8 (JWT, EF Core + PostgreSQL)
├── mobile/       # App React Native + Expo (Android)
├── client/       # Web PWA (React + Vite) — secundário
└── docker-compose.yml   # PostgreSQL 16 local
```

**Autenticação:** a API usa **JWT (Bearer)**. O login devolve `{ token, me }`,
e o app envia `Authorization: Bearer <token>`. (Troquei o cookie/CSRF por JWT
porque cookie não funciona em app nativo.)

---

## ✅ Funcionalidades

### 👴 Idoso
- Login por telefone e senha
- Vê seus cuidadores e seus remédios (botão **Ouvir**)
- Chat com **mensagens rápidas** e leitura em voz (TTS)

### 👩‍⚕️ Cuidador
- Vincula pacientes pelo telefone
- Cadastra/remove remédios de cada paciente
- Chat com cada paciente

### ⚙️ Geral
- Dois perfis, sessão de 30 dias (JWT)
- PWA instalável (web) + notificações push (web)
- Design inclusivo para idosos
- **Comando de voz** (navegação por fala) no app e no web
- **Modo offline** (cache local + fila de mensagens que sincroniza ao reconectar)

---

## 🗣️ Voz e offline

### Comando de voz
O botão **🎤 no topo do app** (e no PWA) ouve comandos por fala e navega:

| Comando | Ação |
|---------|------|
| "remédio" | abre os remédios |
| "início" / "menu" | volta à tela inicial |
| "sair" | encerra a sessão |
| "paciente" | abre os pacientes (só cuidador) |

- **Leitura em voz (TTS)** — botão "🔊 Ouvir" nos remédios e tocar numa bolha do chat — funciona **offline** em qualquer aparelho.
- **Reconhecimento (STT)** — por padrão usa a rede. No **Android 13+**, o app baixa o modelo de voz pt-BR e passa a reconhecer **offline** (`expo-speech-recognition`). No **iOS**, o reconhecimento exige internet (a Apple processa em servidor próprio).

### Modo offline
O app é **offline-first**:

- **Cache local** (SQLite) de dashboard, remédios, pacientes e chats — abre e mostra os dados salvos mesmo sem internet.
- **Fila de mensagens** — mensagens (texto e áudio) enviadas offline ficam marcadas como "⏳ enviando…" e sincronizam sozinhas quando a rede volta.
- **Áudios em cache** — áudios já ouvidos são baixados e reproduzidos offline.
- **Sessão persistente** — sem rede o app **não desloga**; mantém o perfil salvo localmente.
- Uma barra amarela "⚠️ Sem internet — mostrando dados salvos" indica o estado offline.

> O login em si ainda exige internet na primeira vez (valida a senha no servidor).

---

## 🚀 Como rodar o backend

### Pré-requisitos
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou PostgreSQL 16)
- [Node.js LTS](https://nodejs.org/) (20+)

### 1. Suba o banco

```bash
docker compose up -d
```

### 2. Gere e aplique as migrations

```bash
cd server
dotnet ef migrations add Initial
dotnet ef database update
```

### 3. Configure a chave JWT

A chave de desenvolvimento já está em `server/appsettings.Local.json` (ignorado
pelo git). Para produção, troque por uma chave forte.

### 4. Rode a API

```bash
cd server
dotnet run
```

- API: `https://localhost:7035` / `http://localhost:5076`
- Health check: `GET /health`

---

## 📱 Como rodar o app mobile (Android)

### 1. Instale as dependências

```bash
cd mobile
npm install
```

### 2. Aponte para o backend

O app lê a URL em `mobile/src/api/config.ts`:
- **Emulador Android**: já vem `http://10.0.2.2:5076` (aponta pro seu Mac).
- **Celular físico**: troque para `http://SEU_IP:5076` e rode o backend com
  `dotnet run --urls http://0.0.0.0:5076`. Ou defina `EXPO_PUBLIC_API_URL`.

### 3. Rode o app

```bash
cd mobile
npx expo start
```

> ⚠️ **Development build é obrigatório.** O app usa libs com código nativo
> (`expo-speech-recognition`, `expo-sqlite`, `expo-network`), que **não** vêm no
> Expo Go. Instale um dev client primeiro:

```bash
cd mobile
npx eas-cli@latest build --profile development   # build na nuvem (sem Android Studio)
# ou, localmente (precisa Android Studio + celular no USB):
npx expo run:android
```

Depois de instalado, abra o app pelo **dev client** (não pelo Expo Go).

### 4. Gerar o APK (opcional, para instalar de verdade)

```bash
cd mobile
npx eas-cli@latest build --platform android --profile preview
```

(Exige conta Expo, gratuita. Sem precisar de Android Studio local.)

---

## 🌐 Web PWA (opcional)

O app web continua disponível em `client/`:

```bash
cd client
npm install
npm run dev   # http://localhost:5173 (proxy para a API)
```

---

## 📝 Observações

- **Chat no mobile** usa polling (2,5s) via REST — mais robusto que SignalR em
  React Native. O SignalR continua no backend e no web.
- **Push no mobile** (FCM/APNs) é um próximo passo; hoje o push é só web (Web Push/VAPID).
  O registro do token Expo já está pronto, mas exige configurar credenciais FCM/APNs
  no `app.json` para funcionar de verdade.
- As migrations antigas (SQL Server) foram removidas — recrie com o passo 2.
- Os áudios enviados via chat ficam em `server/wwwroot/uploads/` (ignorados pelo git).
