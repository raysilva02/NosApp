'use strict';

/* =========================================================================
 * Nós — SPA (vanilla JS)
 * ========================================================================= */

// ---------- Utilidades ----------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const state = { me: null, csrf: null, conn: null, autoTTS: false };

// ---------- API ----------
async function api(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const headers = Object.assign({}, opts.headers || {});
  let body = opts.body;

  if (body !== undefined && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  if (state.csrf && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers['X-XSRF-TOKEN'] = state.csrf;
  }

  const res = await fetch(path, { method, headers, body, credentials: 'same-origin' });

  if (res.status === 401) { state.me = null; go('login'); throw new Error('nao-autenticado'); }
  if (!res.ok) {
    let msg = 'Algo deu errado.';
    try { const j = await res.json(); if (j.erro) msg = j.erro; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// ---------- Voz ----------
function falar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = 'pt-BR';
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

function sttSuportado() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

function escutar(callback) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { callback(null, 'Reconhecimento de voz não suportado.'); return; }
  const rec = new SR();
  rec.lang = 'pt-BR';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => callback(e.results[0][0].transcript, null);
  rec.onerror = (e) => callback(null, e.error);
  rec.start();
}

async function refreshCsrf() {
  try {
    const r = await fetch('/api/auth/antiforgery');
    if (r.ok) state.csrf = (await r.json()).token;
  } catch {}
}

// ---------- PWA / Push ----------
function registerSw() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) out[i] = rawData.charCodeAt(i);
  return out;
}

async function registrarPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await api('/api/push/publickey');
    if (!publicKey) return;

    let sub = await reg.pushManager.getSubscription();
    if (sub) return;

    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    const json = sub.toJSON();
    await api('/api/push/subscribe', {
      method: 'POST',
      body: { endpoint: json.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' }
    });
  } catch {}
}

// ---------- Router ----------
function go(route) { location.hash = route; }

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = h.split('?');
  return {
    segments: pathPart.split('/').filter(Boolean),
    query: new URLSearchParams(queryPart || '')
  };
}

async function router() {
  const { segments, query } = parseHash();
  const name = segments[0] || '';

  if (!state.me) await loadMe();

  if (name !== 'chat' && state.conn) {
    try { await state.conn.stop(); } catch {}
    state.conn = null;
  }

  if (!state.me) {
    if (name === 'register') return renderRegister(query.get('tipo'));
    return renderLogin();
  }

  try {
    switch (name) {
      case '':           return renderDashboard();
      case 'chat':       return renderChat(Number(segments[1]));
      case 'pacientes':  return renderPacientes();
      case 'remedios':   return renderRemedios();
      default:           return renderDashboard();
    }
  } catch (e) {
    if (e.message !== 'nao-autenticado') renderError(e.message);
  }
}

async function loadMe() {
  try {
    const r = await fetch('/api/auth/me', { credentials: 'same-origin' });
    state.me = r.ok ? await r.json() : null;
  } catch { state.me = null; }
}

// ---------- Layout ----------
function navbar() {
  const nome = esc(state.me?.nomeCompleto || '');
  const mic = sttSuportado()
    ? '<button class="btn btn-sm btn-light me-1" id="navMic" title="Comando de voz"><i class="bi bi-mic"></i></button>'
    : '';
  return `
  <nav class="navbar nos-navbar">
    <div class="container d-flex align-items-center">
      <a class="navbar-brand nos-brand" href="#/">Nós</a>
      <div class="ms-auto d-flex align-items-center gap-2">
        ${mic}
        <span class="nos-user-name">${nome}</span>
        <button class="btn btn-sm btn-light" id="logoutBtn">Sair</button>
      </div>
    </div>
  </nav>`;
}

function footer() {
  return `<footer class="nos-footer text-center py-3 mt-auto"><div class="container">Feito com 💛 para cuidar de quem cuidamos</div></footer>`;
}

function mount(html, { hideNav = false } = {}) {
  document.body.classList.remove('nos-chat-page');
  const nav = hideNav ? '' : navbar();
  const foot = hideNav ? '' : footer();
  $('#app').innerHTML = nav + `<main class="container py-4">${html}</main>` + foot;
  bindNav();
}

function bindNav() {
  const l = $('#logoutBtn');
  if (l) l.addEventListener('click', async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    state.me = null;
    if (state.conn) { try { await state.conn.stop(); } catch {} state.conn = null; }
    go('login');
  });
  const m = $('#navMic');
  if (m) m.addEventListener('click', comandoVoz);
}

function comandoVoz() {
  falar('Diga um comando.');
  escutar((txt, err) => {
    if (!txt) { if (err) falar('Não entendi.'); return; }
    const t = txt.toLowerCase();
    if (/remedio|remédio/.test(t)) { falar('Abrindo remédios.'); go('remedios'); }
    else if (/sair|logout|encerrar/.test(t)) { $('#logoutBtn')?.click(); }
    else if (/paciente/.test(t) && state.me?.tipoUsuario === 'Cuidador') { falar('Abrindo pacientes.'); go('pacientes'); }
    else if (/inicio|início|menu|home/.test(t)) { falar('Voltando ao início.'); go(''); }
    else falar('Comando não reconhecido.');
  });
}

function renderError(msg) {
  mount(`
    <div class="nos-empty-state">
      <i class="bi bi-exclamation-triangle" style="font-size:3rem"></i>
      <h4 class="mt-3">Ops!</h4>
      <p>${esc(msg)}</p>
      <a class="nos-link" href="#/">Voltar ao início</a>
    </div>`);
}

// ---------- Views ----------
function renderLogin() {
  document.body.classList.remove('nos-chat-page');
  $('#app').innerHTML = `
  <div class="nos-auth-bg d-flex align-items-center justify-content-center p-3">
    <div class="nos-auth-card">
      <div class="text-center mb-4">
        <div class="nos-logo-circle">💛</div>
        <h1 class="nos-brand-title mt-3">Nós</h1>
        <p class="nos-brand-subtitle">Cuidado e conexão</p>
      </div>
      <div id="loginError" class="alert alert-danger d-none"></div>
      <form id="loginForm">
        <div class="mb-3">
          <label class="nos-label" for="telefone">Telefone</label>
          <div class="input-group">
            <span class="input-group-text nos-input-icon"><i class="bi bi-telephone"></i></span>
            <input type="tel" id="telefone" class="form-control nos-input" placeholder="(11) 99999-9999" required>
          </div>
        </div>
        <div class="mb-3">
          <label class="nos-label" for="senha">Senha</label>
          <div class="input-group">
            <span class="input-group-text nos-input-icon"><i class="bi bi-lock"></i></span>
            <input type="password" id="senha" class="form-control nos-input" placeholder="Sua senha" required>
          </div>
        </div>
        <div class="form-check mb-3">
          <input class="form-check-input nos-check" type="checkbox" id="lembrar" checked>
          <label class="form-check-label" for="lembrar">Lembrar de mim</label>
        </div>
        <button type="submit" class="btn nos-btn-primary w-100">Entrar</button>
      </form>
      <div class="text-center mt-4">
        <p class="nos-hint mb-2">Não tem conta?</p>
        <a href="#/register?tipo=idoso" class="nos-link d-block">Cadastrar como Idoso</a>
        <a href="#/register?tipo=cuidador" class="nos-link d-block">Cadastrar como Cuidador</a>
      </div>
    </div>
  </div>`;

  const err = $('#loginError');
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('d-none');
    try {
      state.me = await api('/api/auth/login', {
        method: 'POST',
        body: { telefone: $('#telefone').value, senha: $('#senha').value, lembrarMe: $('#lembrar').checked }
      });
      await refreshCsrf();
      registrarPush();
      go('');
    } catch (ex) { err.textContent = ex.message; err.classList.remove('d-none'); }
  });
}

function renderRegister(tipo) {
  const isIdoso = tipo !== 'cuidador';
  const titulo = isIdoso ? 'Cadastro de Idoso' : 'Cadastro de Cuidador';
  document.body.classList.remove('nos-chat-page');
  $('#app').innerHTML = `
  <div class="nos-auth-bg d-flex align-items-center justify-content-center p-3">
    <div class="nos-auth-card">
      <div class="text-center mb-4">
        <div class="nos-logo-circle">💛</div>
        <h1 class="nos-brand-title mt-3">${titulo}</h1>
        <p class="nos-brand-subtitle">${isIdoso ? 'Crie sua conta de idoso' : 'Crie sua conta de cuidador'}</p>
      </div>
      <div id="regError" class="alert alert-danger d-none"></div>
      <form id="regForm">
        <div class="mb-3">
          <label class="nos-label" for="nome">Nome completo</label>
          <input type="text" id="nome" class="form-control nos-input" placeholder="Seu nome" required>
        </div>
        <div class="mb-3">
          <label class="nos-label" for="telefone">Telefone</label>
          <input type="tel" id="telefone" class="form-control nos-input" placeholder="(11) 99999-9999" required>
        </div>
        <div class="mb-3">
          <label class="nos-label" for="senha">Senha</label>
          <input type="password" id="senha" class="form-control nos-input" placeholder="Mínimo 6 caracteres" required>
        </div>
        <div class="mb-3">
          <label class="nos-label" for="confirmar">Confirmar senha</label>
          <input type="password" id="confirmar" class="form-control nos-input" placeholder="Repita a senha" required>
        </div>
        <button type="submit" class="btn nos-btn-primary w-100">Cadastrar</button>
      </form>
      <div class="text-center mt-3">
        <a href="#/login" class="nos-link">Já tenho conta — entrar</a>
      </div>
    </div>
  </div>`;

  const err = $('#regError');
  $('#regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('d-none');
    if ($('#senha').value !== $('#confirmar').value) {
      err.textContent = 'As senhas não coincidem.'; err.classList.remove('d-none'); return;
    }
    try {
      state.me = await api('/api/auth/register', {
        method: 'POST',
        body: {
          nomeCompleto: $('#nome').value,
          telefone: $('#telefone').value,
          senha: $('#senha').value,
          tipoUsuario: isIdoso ? 'Idoso' : 'Cuidador'
        }
      });
      await refreshCsrf();
      registrarPush();
      go('');
    } catch (ex) { err.textContent = ex.message; err.classList.remove('d-none'); }
  });
}

async function renderDashboard() {
  const d = await api('/api/dashboard');
  if (d.me.tipoUsuario === 'Idoso') dashboardIdoso(d);
  else dashboardCuidador(d);
}

function dashboardIdoso(d) {
  const remedios = d.remedios.map(r => `
    <div class="col-12 col-md-6">
      <div class="nos-remedio-card h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="nos-remedio-nome">${esc(r.nome)}</div>
            <div class="nos-remedio-dose">${esc(r.dose)}</div>
            ${r.descricao ? `<div class="nos-remedio-desc mt-1">${esc(r.descricao)}</div>` : ''}
          </div>
          <span class="nos-badge-horario"><i class="bi bi-clock me-1"></i>${esc(r.horario)}</span>
        </div>
        <button class="btn nos-btn-yellow-sm mt-3" onclick="falar('${esc(r.nome)}, dose ${esc(r.dose)}, às ${esc(r.horario)}')">
          <i class="bi bi-volume-up me-1"></i>Ouvir
        </button>
      </div>
    </div>`).join('');

  const cuidadores = d.cuidadores.map(c => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="nos-cuidador-card h-100 d-flex flex-column">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="nos-avatar">${esc(c.nomeCompleto.charAt(0))}</div>
          <div>
            <div class="fw-bold">${esc(c.nomeCompleto)}</div>
            <div class="nos-text-muted small">Cuidador(a)</div>
          </div>
        </div>
        <a class="btn nos-btn-chat mt-auto" href="#/chat/${c.relacionamentoId}">
          <i class="bi bi-chat-dots me-1"></i>Conversar
        </a>
      </div>
    </div>`).join('');

  mount(`
    <div class="nos-hero-card mb-4">
      <h2 class="mb-1">Olá, ${esc(d.me.nomeCompleto)} 💛</h2>
      <p class="mb-0" style="opacity:.9">Aqui você vê seus cuidadores e seus remédios.</p>
    </div>
    <div class="nos-section-card mb-4">
      <div class="nos-section-header">👩‍⚕️ Meus cuidadores</div>
      <div class="nos-section-body">
        <div class="row g-3">${cuidadores || '<div class="nos-empty-state">Nenhum cuidador vinculado ainda.</div>'}</div>
      </div>
    </div>
    <div class="nos-section-card">
      <div class="nos-section-header nos-header-yellow">💊 Meus remédios</div>
      <div class="nos-section-body">
        <div class="row g-3">${remedios || '<div class="nos-empty-state">Nenhum remédio cadastrado.</div>'}</div>
      </div>
    </div>`);
}

function dashboardCuidador(d) {
  const pacientes = d.pacientes.map(p => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="nos-paciente-card h-100 d-flex flex-column">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div class="nos-avatar">${esc(p.nomeCompleto.charAt(0))}</div>
          <div>
            <div class="fw-bold">${esc(p.nomeCompleto)}</div>
            <div class="nos-text-muted small">${esc(p.telefone)}</div>
          </div>
        </div>
        <div class="nos-remedios-mini mb-3">
          <div class="small fw-bold mb-1">Remédios (${p.remedios.length})</div>
          ${p.remedios.slice(0, 3).map(r => `<span class="nos-remedio-tag">${esc(r.nome)}</span>`).join('') || '<span class="nos-text-muted small">Sem remédios</span>'}
        </div>
        <div class="mt-auto d-grid gap-2">
          <a class="btn nos-btn-chat" href="#/chat/${p.relacionamentoId}"><i class="bi bi-chat-dots me-1"></i>Conversar</a>
          <a class="btn nos-btn-outline-sm" href="#/pacientes"><i class="bi bi-capsule me-1"></i>Ver remédios</a>
        </div>
      </div>
    </div>`).join('');

  mount(`
    <div class="nos-hero-card nos-hero-cuidador mb-4">
      <h2 class="mb-1">Olá, ${esc(d.me.nomeCompleto)} 💛</h2>
      <p class="mb-0" style="opacity:.9">Gerencie seus pacientes e seus remédios.</p>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <a class="nos-quick-action" href="#/pacientes"><i class="bi bi-person-plus"></i>Adicionar paciente</a>
      </div>
      <div class="col-6 col-md-3">
        <a class="nos-quick-action nos-qa-yellow" href="#/pacientes"><i class="bi bi-people"></i>Meus pacientes</a>
      </div>
    </div>
    <div class="nos-section-card">
      <div class="nos-section-header">👴 Meus pacientes</div>
      <div class="nos-section-body">
        <div class="row g-3">${pacientes || '<div class="nos-empty-state">Nenhum paciente vinculado. Adicione um pelo telefone.</div>'}</div>
      </div>
    </div>`);
}

async function renderChat(relId) {
  const chat = await api(`/api/chat/${relId}`);
  if (state.conn) { try { await state.conn.stop(); } catch {} state.conn = null; }

  document.body.classList.add('nos-chat-page');

  const quick = chat.isIdoso ? quickMessages() : '';
  $('#app').innerHTML = `
    <div class="nos-chat-container">
      <div class="nos-chat-header ${chat.isIdoso ? '' : 'nos-chat-header-yellow'}">
        <a href="#/" class="me-3" style="color:inherit"><i class="bi bi-arrow-left" style="font-size:1.4rem"></i></a>
        <div class="nos-avatar-sm me-2">${esc(chat.outroUsuarioNome.charAt(0))}</div>
        <div class="flex-grow-1">
          <div class="fw-bold">${esc(chat.outroUsuarioNome)}</div>
          <div class="small" style="opacity:.85">${chat.isIdoso ? 'Cuidador(a)' : 'Idoso'}</div>
        </div>
        <button class="btn btn-sm btn-light" id="ttsToggle" title="Ler mensagens em voz alta">
          <i class="bi bi-volume-up"></i>
        </button>
      </div>
      <div class="nos-chat-messages" id="chatMessages"></div>
      ${quick}
      <div class="nos-chat-input-area">
        <form id="chatForm" class="d-flex gap-2">
          ${sttSuportado() ? '<button type="button" class="btn nos-btn-outline-sm" id="micBtn" title="Falar"><i class="bi bi-mic"></i></button>' : ''}
          <input id="msgInput" class="form-control nos-chat-input flex-grow-1" autocomplete="off" placeholder="Escreva uma mensagem..." />
          <button type="submit" class="btn nos-btn-send"><i class="bi bi-send"></i></button>
        </form>
      </div>
    </div>`;

  const box = $('#chatMessages');
  chat.mensagens.forEach(m => addMsg(m.remetenteId, m.conteudo, m.dataHora));

  $('#ttsToggle').addEventListener('click', () => {
    state.autoTTS = !state.autoTTS;
    $('#ttsToggle').innerHTML = `<i class="bi ${state.autoTTS ? 'bi-volume-up-fill' : 'bi-volume-up'}"></i>`;
    falar(state.autoTTS ? 'Leitura de mensagens ativada.' : 'Leitura de mensagens desativada.');
  });

  $('#chatForm').addEventListener('submit', (e) => { e.preventDefault(); sendMsg(); });
  const mic = $('#micBtn');
  if (mic) mic.addEventListener('click', () => {
    escutar((txt, err) => {
      if (txt) { $('#msgInput').value = txt; falar('Ouvi: ' + txt); }
      else if (err) falar('Não entendi.');
    });
  });

  window.sendMsg = async function () {
    const v = $('#msgInput').value.trim();
    if (!v || !state.conn) return;
    $('#msgInput').value = '';
    await state.conn.invoke('SendMessage', relId, v);
  };
  window.sendQ = async function (m) {
    if (!state.conn) return;
    await state.conn.invoke('SendMessage', relId, m);
  };

  // SignalR
  const conn = new signalR.HubConnectionBuilder()
    .withUrl('/chatHub')
    .withAutomaticReconnect()
    .build();
  conn.on('ReceiveMessage', m => addMsg(m.remetenteId, m.conteudo, m.dataHora));
  await conn.start();
  await conn.invoke('JoinRoom', relId.toString());
  state.conn = conn;
  scrollBottom();
}

function quickMessages() {
  const items = [
    ['Preciso de ajuda!', ''], ['Estou bem', 'nos-qb-green'],
    ['Venha para casa', 'nos-qb-blue'], ['Estou com dor', 'nos-qb-orange'],
    ['Preciso do remedio', 'nos-qb-purple'], ['Estou com fome', 'nos-qb-teal'],
    ['Obrigado!', 'nos-qb-yellow'], ['Estou com sono', 'nos-qb-yellow']
  ];
  const btns = items.map(([t, c]) =>
    `<button class="nos-quick-btn ${c}" onclick="sendQ('${esc(t)}')">${esc(t)}</button>`).join('');
  return `
    <div class="nos-quick-msgs">
      <div class="nos-quick-msgs-title">Mensagens rápidas</div>
      <div class="nos-quick-btns-grid">${btns}</div>
    </div>`;
}

function addMsg(remetenteId, conteudo, dataHora) {
  const box = $('#chatMessages');
  if (!box) return;
  const me = remetenteId === state.me.id;
  const bubble = document.createElement('div');
  bubble.className = 'nos-msg-wrapper ' + (me ? 'nos-msg-right' : 'nos-msg-left');
  bubble.innerHTML = `
    <div class="nos-msg-bubble ${me ? 'nos-msg-me' : 'nos-msg-other'}" title="Toque para ouvir">
      ${esc(conteudo)}
      <span class="nos-msg-time">${esc(dataHora)}</span>
    </div>`;
  bubble.querySelector('.nos-msg-bubble').addEventListener('click', () => falar(conteudo));
  box.appendChild(bubble);
  if (state.autoTTS && !me) falar(conteudo);
  scrollBottom();
}

function scrollBottom() {
  const box = $('#chatMessages');
  if (box) box.scrollTop = box.scrollHeight;
}

// ---------- Pacientes (cuidador) ----------
async function renderPacientes() {
  const pacientes = await api('/api/pacientes');
  const list = pacientes.map(p => `
    <div class="col-12">
      <div class="nos-paciente-card">
        <div class="d-flex align-items-center gap-3 mb-2">
          <div class="nos-avatar">${esc(p.nomeCompleto.charAt(0))}</div>
          <div class="flex-grow-1">
            <div class="fw-bold">${esc(p.nomeCompleto)}</div>
            <div class="nos-text-muted small">${esc(p.telefone)}</div>
          </div>
          <a class="btn nos-btn-chat" href="#/chat/${p.relacionamentoId}"><i class="bi bi-chat-dots"></i></a>
        </div>
        <div class="mb-2">
          ${p.remedios.map(r => `
            <span class="nos-remedio-tag">${esc(r.nome)} · ${esc(r.horario)}
              <a href="#" data-del="${r.id}" title="Remover" style="color:inherit;margin-left:.3rem"><i class="bi bi-x-circle"></i></a>
            </span>`).join('') || '<span class="nos-text-muted small">Sem remédios</span>'}
        </div>
        <button class="btn nos-btn-yellow-sm" data-toggle="form-${p.idosoId}"><i class="bi bi-capsule me-1"></i>Adicionar remédio</button>
        <form id="form-${p.idosoId}" class="d-none mt-3 row g-2">
          <div class="col-12"><input name="nome" class="form-control nos-input" placeholder="Nome do remédio" required></div>
          <div class="col-6"><input name="horario" type="time" class="form-control nos-input" required></div>
          <div class="col-6"><input name="dose" class="form-control nos-input" placeholder="Dose" required></div>
          <div class="col-12"><input name="descricao" class="form-control nos-input" placeholder="Descrição (opcional)"></div>
          <div class="col-12"><button class="btn nos-btn-primary w-100">Salvar</button></div>
        </form>
      </div>
    </div>`).join('');

  mount(`
    <div class="nos-section-card mb-4">
      <div class="nos-section-header">➕ Adicionar paciente</div>
      <div class="nos-section-body">
        <div id="addError" class="alert alert-danger d-none"></div>
        <form id="addPaciente" class="row g-2">
          <div class="col-12 col-md-9">
            <input id="telPaciente" type="tel" class="form-control nos-input" placeholder="Telefone do paciente (idoso)" required>
          </div>
          <div class="col-12 col-md-3">
            <button class="btn nos-btn-primary w-100">Vincular</button>
          </div>
        </form>
      </div>
    </div>
    <div class="nos-section-card">
      <div class="nos-section-header">👴 Meus pacientes</div>
      <div class="nos-section-body"><div class="row g-3">${list || '<div class="nos-empty-state">Nenhum paciente.</div>'}</div></div>
    </div>`);

  const err = $('#addError');
  $('#addPaciente').addEventListener('submit', async (e) => {
    e.preventDefault();
    err.classList.add('d-none');
    try {
      await api('/api/pacientes', { method: 'POST', body: { telefonePaciente: $('#telPaciente').value } });
      router();
    } catch (ex) { err.textContent = ex.message; err.classList.remove('d-none'); }
  });

  $$('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    $('#form-' + btn.dataset.toggle.split('-')[1]).classList.toggle('d-none');
  }));

  $$('form[id^="form-"]').forEach(f => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idosoId = Number(f.id.split('-')[1]);
    const g = (n) => f.querySelector(`[name="${n}"]`).value;
    try {
      await api('/api/remedios', { method: 'POST', body: {
        idosoId, nome: g('nome'), horario: g('horario'), dose: g('dose'), descricao: g('descricao') || null
      }});
      router();
    } catch (ex) { falar(ex.message); alert(ex.message); }
  }));

  $$('[data-del]').forEach(a => a.addEventListener('click', async (e) => {
    e.preventDefault();
    try { await api('/api/remedios/' + a.dataset.del, { method: 'DELETE' }); router(); }
    catch (ex) { alert(ex.message); }
  }));
}

// ---------- Remédios (idoso) ----------
async function renderRemedios() {
  const remedios = await api('/api/remedios');
  const list = remedios.map(r => `
    <div class="col-12 col-md-6">
      <div class="nos-remedio-card h-100">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="nos-remedio-nome">${esc(r.nome)}</div>
            <div class="nos-remedio-dose">${esc(r.dose)}</div>
            ${r.descricao ? `<div class="nos-remedio-desc mt-1">${esc(r.descricao)}</div>` : ''}
          </div>
          <span class="nos-badge-horario"><i class="bi bi-clock me-1"></i>${esc(r.horario)}</span>
        </div>
        <button class="btn nos-btn-yellow-sm mt-3" onclick="falar('${esc(r.nome)}, dose ${esc(r.dose)}, às ${esc(r.horario)}')">
          <i class="bi bi-volume-up me-1"></i>Ouvir
        </button>
      </div>
    </div>`).join('');

  mount(`
    <h2 class="nos-page-title mb-3"><i class="bi bi-capsule me-2"></i>Meus remédios</h2>
    <div class="row g-3">${list || '<div class="nos-empty-state">Nenhum remédio cadastrado.</div>'}</div>`);
}

// ---------- Boot ----------
(async function init() {
  await refreshCsrf();
  registerSw();
  window.addEventListener('hashchange', router);
  router();
})();
