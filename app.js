(function () {
  'use strict';

  // 1) Registra o service worker (precisa de https ou localhost)
  const seguro = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && seguro) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  const jaEhApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 2) Convite de instalação (só na página que tem data-install e fora do app)
  if (!document.body.hasAttribute('data-install') || jaEhApp) return;

  const CHAVE = 'convitePwaAdiado';
  const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;
  try {
    const t = parseInt(localStorage.getItem(CHAVE) || '0', 10);
    if (t && Date.now() - t < SETE_DIAS) return;
  } catch (e) {}

  let barra = null;
  function adiar() {
    try { localStorage.setItem(CHAVE, String(Date.now())); } catch (e) {}
    if (barra) barra.hidden = true;
  }

  function mostrar(texto, rotulo, aoClicar) {
    if (barra) barra.remove();
    barra = document.createElement('div');
    barra.className = 'install-bar';
    barra.setAttribute('role', 'dialog');

    const p = document.createElement('p');
    p.textContent = texto;

    const ok = document.createElement('button');
    ok.type = 'button';
    ok.textContent = rotulo;
    ok.addEventListener('click', aoClicar);

    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'fechar';
    x.setAttribute('aria-label', 'Fechar');
    x.textContent = '✕';
    x.addEventListener('click', adiar);

    barra.append(p, ok, x);
    document.body.appendChild(barra);
  }

  // Android / Chrome / Edge
  let convite = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    convite = e;
    mostrar('Instale o nosso app na tela inicial 💖', 'Instalar', function () {
      convite.prompt();
      convite.userChoice.finally(function () { convite = null; if (barra) barra.hidden = true; });
    });
  });
  window.addEventListener('appinstalled', function () { if (barra) barra.hidden = true; });

  // iPhone / iPad (Safari não dispara o evento acima)
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) {
    setTimeout(function () {
      mostrar('Para instalar: toque em Compartilhar (⬆️) e depois em “Adicionar à Tela de Início”.', 'Entendi', adiar);
    }, 2500);
  }
})();
