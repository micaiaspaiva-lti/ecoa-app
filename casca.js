/* Casca do Ecoa (GitHub Pages): abre o web app do Apps Script num iframe em tela cheia.
   Configuração no <body>: data-exec (URL /exec), data-modo ("participante" | "apresentador"). */
(function () {
  var corpo = document.body;
  var EXEC = corpo.getAttribute('data-exec');
  var MODO = corpo.getAttribute('data-modo');
  var TIMEOUT_MS = MODO === 'apresentador' ? 25000 : 30000; // sem resposta do app até aqui: falta login ou falhou
  var frame = document.getElementById('app');
  var splash = document.getElementById('splash');
  var help = document.getElementById('help');
  var pct = 0, pctTimer = null, timer = null;

  // participante: ?pin=123456 (vem do QR) · apresentador: #/rota do app
  function destino() {
    if (MODO === 'participante') {
      var pin = (new URLSearchParams(location.search).get('pin') || '').replace(/\D/g, '').slice(0, 6);
      return EXEC + (pin ? '?pin=' + pin : '');
    }
    return EXEC + (/^#\/[\w\/-]*$/.test(location.hash) ? location.hash : '');
  }

  function carregar() {
    help.hidden = true;
    splash.hidden = false;
    splash.classList.remove('fade');
    frame.src = destino();
    clearTimeout(timer);
    timer = setTimeout(falhou, TIMEOUT_MS);
    iniciarPercentual();
  }
  // percentual: avança rápido no começo, desacelera perto do fim e chega a 100% quando o app avisa que abriu
  function mostrarPct(v) { pct = v; document.getElementById('pct').textContent = Math.floor(v) + '%'; document.getElementById('barraPct').style.width = v + '%'; }
  function iniciarPercentual() {
    clearInterval(pctTimer);
    mostrarPct(0);
    pctTimer = setInterval(function () { if (pct < 95) mostrarPct(pct + Math.max(0.4, (95 - pct) * 0.06)); }, 120);
  }
  function pronto() {
    clearTimeout(timer);
    help.hidden = true;
    if (splash.hidden || splash.classList.contains('fade')) return;
    clearInterval(pctTimer);
    mostrarPct(100);
    setTimeout(function () { splash.classList.add('fade'); }, 250);
    setTimeout(function () { splash.hidden = true; }, 650);
  }
  function falhou() {
    clearInterval(pctTimer);
    splash.hidden = true;
    var on = navigator.onLine;
    var titulo = document.getElementById('helpTitle'), texto = document.getElementById('helpText');
    if (!on) { titulo.textContent = 'Você está sem conexão'; texto.textContent = 'Conecte-se à internet para entrar no Ecoa.'; }
    help.hidden = false;
    var login = document.getElementById('btnLogin');
    if (login) login.hidden = !on;
  }

  // mensagens do app (iframe do Apps Script, servido por *.googleusercontent.com)
  window.addEventListener('message', function (ev) {
    if (!/^https:\/\/[a-z0-9.-]+\.googleusercontent\.com$/.test(ev.origin)) return;
    var d = ev.data || {};
    if (d.type === 'ecoa:ready') {
      pronto();
      // avisa o app que está dentro da casca (daí ele pede a tela cheia para cá)
      try { ev.source.postMessage({ type: 'ecoa:casca' }, ev.origin); } catch (e) { /* segue sem */ }
    } else if (d.type === 'ecoa:rota' && MODO === 'apresentador' && /^#\/[\w\/-]*$/.test(d.hash || '')) {
      pronto();
      history.replaceState(null, '', location.pathname + (d.hash === '#/' ? '' : d.hash));
    } else if (d.type === 'ecoa:telaCheia') {
      var el = document.documentElement;
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
    }
  });
  window.addEventListener('online', function () { if (!help.hidden) carregar(); });
  window.addEventListener('focus', function () { if (!help.hidden) carregar(); });
  var tentar = document.getElementById('btnTentar');
  if (tentar) tentar.addEventListener('click', carregar);
  var login = document.getElementById('btnLogin');
  if (login) login.addEventListener('click', function () {
    // o Google só volta para endereços do próprio Google: depois de entrar, abre o app direto nele
    location.href = 'https://accounts.google.com/AccountChooser?continue=' + encodeURIComponent(destino());
  });

  carregar();
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register(corpo.getAttribute('data-sw') || 'sw.js'); });
})();
