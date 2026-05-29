
# 💛❤️ Nós — Cuidado e Conexão

> Aplicação web desenvolvida para facilitar a comunicação entre **idosos** e seus **cuidadores**, promovendo segurança, autonomia e carinho no dia a dia.

---

## 🚀 Status do Projeto

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet)
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoftsqlserver&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Identidade Visual](#-identidade-visual)
- [Progresso](#-progresso)
- [Como Rodar](#-como-rodar)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Autora](#-autora)

---

## 💡 Sobre o Projeto

O **Nós** é uma aplicação MVC desenvolvida em **ASP.NET Core (.NET 8)** com o objetivo de aproximar idosos e cuidadores por meio de uma interface simples, acessível e intuitiva.

A aplicação conta com dois perfis de usuário distintos:

| Perfil | Descrição |
|--------|-----------|
| 👴 **Idoso** | Visualiza seus cuidadores, troca mensagens e acompanha seus remédios |
| 👩‍⚕️ **Cuidador** | Gerencia seus pacientes, cadastra remédios e se comunica com os idosos |

---

## ✅ Funcionalidades

### 👴 Perfil Idoso
- [x] Cadastro e login por telefone e senha
- [x] Visualização dos cuidadores vinculados
- [x] Chat em tempo real com cuidadores
- [x] **Mensagens rápidas pré-definidas** para facilitar a comunicação
- [x] Visualização dos remédios (nome, horário, dose e descrição)

### 👩‍⚕️ Perfil Cuidador
- [x] Cadastro e login por telefone e senha
- [x] Gerenciamento de pacientes (idosos)
- [x] Vinculação de novos pacientes por telefone
- [x] Chat em tempo real com pacientes
- [x] Cadastro de remédios para os pacientes

### ⚙️ Geral
- [x] Autenticação via ASP.NET Core Identity
- [x] Sessão persistente (lembrar por 30 dias)
- [x] Chat em tempo real com **SignalR**
- [x] Interface responsiva para celular
- [x] Suporte a **PWA** (Progressive Web App) — instalável no celular

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | ASP.NET Core MVC (.NET 8) |
| **Linguagem** | C# |
| **Banco de Dados** | SQL Server |
| **ORM** | Entity Framework Core |
| **Autenticação** | ASP.NET Core Identity |
| **Tempo Real** | SignalR |
| **Frontend** | Bootstrap 5, Bootstrap Icons |
| **PWA** | Service Worker, Web App Manifest |

---

## 🎨 Identidade Visual

A identidade visual do **Nós** é baseada nas cores **vermelho claro** e **amarelo**, transmitindo carinho, cuidado e aconchego.

| Cor | Hex | Uso |
|-----|-----|-----|
| 🔴 Vermelho | `#E53935` | Cor primária, botões, headers |
| 🟡 Amarelo | `#FFD600` | Cor secundária, destaques |
| 🩷 Vermelho claro | `#FFEBEE` | Fundos, cards |
| 🟡 Amarelo claro | `#FFF9C4` | Fundos de mensagens rápidas |

---

## 📊 Progresso

### Funcionalidades Implementadas

```
Autenticação         ████████████████████ 100%
Perfil Idoso         ████████████████████ 100%
Perfil Cuidador      ████████████████████ 100%
Chat em Tempo Real   ████████████████████ 100%
Remédios             ████████████████████ 100%
Responsividade       ████████████████████ 100%
PWA                  ████████████████████ 100%
Push Notifications   ░░░░░░░░░░░░░░░░░░░░   0%
Deploy Produção      ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## ⚡ Como Rodar

### Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/sql-server) ou SQL Server Express
- [Visual Studio 2022](https://visualstudio.microsoft.com/) ou VS Code

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/seu-usuario/nos.git
cd nos
```

### 2️⃣ Configure a conexão com o banco

No arquivo `appsettings.json`, edite a connection string:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=SEU_SERVIDOR;Database=Nos;User Id=sa;Password=SUA_SENHA;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```

### 3️⃣ Aplique as migrations

No **Package Manager Console** do Visual Studio:

```powershell
Add-Migration Initial
Update-Database
```

Ou pelo terminal:

```bash
dotnet ef migrations add Initial
dotnet ef database update
```

### 4️⃣ Rode o projeto

```bash
dotnet run
```

Ou clique em **▶️ Run** no Visual Studio.

### 5️⃣ Acesse no navegador

```
https://localhost:7035
```

---

## 📁 Estrutura do Projeto

```
Nos/
├── Controllers/
│   ├── AccountController.cs     # Login, Registro, Logout
│   ├── ChatController.cs        # Chat idoso e cuidador
│   ├── HomeController.cs        # Páginas iniciais
│   ├── PacienteController.cs    # Gerenciamento de pacientes
│   └── RemedioController.cs     # Cadastro de remédios
├── Data/
│   └── ApplicationDbContext.cs  # Contexto do banco
├── Hubs/
│   └── ChatHub.cs               # SignalR Hub (chat em tempo real)
├── Models/
│   ├── ApplicationUser.cs       # Usuário base (Identity)
│   ├── Cuidador.cs
│   ├── Idoso.cs
│   ├── Mensagem.cs
│   ├── RelacionamentoCuidadorIdoso.cs
│   └── Remedio.cs
├── ViewModels/                  # ViewModels das telas
├── Views/                       # Views Razor
│   ├── Account/                 # Login e Registro
│   ├── Chat/                    # Chat idoso e cuidador
│   ├── Home/                    # Páginas iniciais
│   ├── Paciente/                # Gerenciamento de pacientes
│   ├── Remedio/                 # Remédios
│   └── Shared/                  # Layout e partials
├── wwwroot/
│   ├── css/site.css             # Estilos customizados
│   ├── icons/                   # Ícones do PWA
│   ├── manifest.json            # Manifesto PWA
│   └── sw.js                    # Service Worker
└── Program.cs                   # Configuração da aplicação
```

---

## 🔮 Próximas Funcionalidades

- [ ] 🔔 Push Notifications para novas mensagens
- [ ] 🚀 Deploy em produção (Azure / Railway)
- [ ] 📊 Histórico de remédios tomados
- [ ] 🔒 Melhorias de segurança para produção

---

## 👩‍💻 Autora

Desenvolvido com ❤️ por **Rayana Silva**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)

---
