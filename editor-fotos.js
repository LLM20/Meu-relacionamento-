// Editor de fotos do carrossel. As fotos ficam salvas no próprio aparelho (IndexedDB).
(function () {
  'use strict';
  if (!window.Carrossel || !('indexedDB' in window)) return;

  const BANCO = 'nosso-amor', LOJA = 'galeria', CHAVE = 'lista', MAX_FOTOS = 30, LADO_MAX = 1600;
  let itens = window.Carrossel.padrao().map(function (p) { return { tipo: 'padrao', src: p.src, fallback: p.fallback }; });

  // ---------- banco local ----------
  function abrir() {
    return new Promise(function (ok, erro) {
      const r = indexedDB.open(BANCO, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(LOJA); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { erro(r.error); };
    });
  }
  function ler() {
    return abrir().then(function (db) {
      return new Promise(function (ok, erro) {
        const q = db.transaction(LOJA).objectStore(LOJA).get(CHAVE);
        q.onsuccess = function () { ok(q.result || null); };
        q.onerror = function () { erro(q.error); };
      });
    });
  }
  function gravar(valor) {
    return abrir().then(function (db) {
      return new Promise(function (ok, erro) {
        const t = db.transaction(LOJA, 'readwrite');
        if (valor === null) t.objectStore(LOJA).delete(CHAVE); else t.objectStore(LOJA).put(valor, CHAVE);
        t.oncomplete = function () { ok(); };
        t.onerror = function () { erro(t.error); };
      });
    });
  }
  function serializar() {
    return itens.map(function (i) {
      return i.tipo === 'foto' ? { tipo: 'foto', blob: i.blob } : { tipo: 'padrao', src: i.src, fallback: i.fallback };
    });
  }

  // ---------- fotos ----------
  function urlDe(i) {
    if (i.tipo === 'foto') { if (!i.url) i.url = URL.createObjectURL(i.blob); return i.url; }
    return i.src;
  }
  function aplicar() {
    window.Carrossel.definir(itens.map(function (i) { return { src: urlDe(i), fallback: i.fallback || '' }; }));
  }
  function reduzir(arquivo) {
    return new Promise(function (ok, erro) {
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = function () {
        const k = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : erro(new Error('falha')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); erro(new Error('imagem inválida')); };
      img.src = url;
    });
  }

  // ---------- painel ----------
  const painel = document.createElement('div');
  painel.className = 'editor';
  painel.hidden = true;
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-modal', 'true');
  painel.setAttribute('aria-label', 'Editar fotos');

  const caixa = document.createElement('div');
  caixa.className = 'editor-box';
  const titulo = document.createElement('h3'); titulo.textContent = 'Editar fotos';
  const aviso = document.createElement('p'); aviso.className = 'editor-aviso';
  aviso.textContent = 'As mudanças ficam salvas só neste aparelho.';
  const status = document.createElement('p'); status.className = 'editor-status'; status.setAttribute('aria-live', 'polite');
  const grade = document.createElement('div'); grade.className = 'editor-grade';

  const acoes = document.createElement('div'); acoes.className = 'editor-acoes';
  const rotuloAdd = document.createElement('label'); rotuloAdd.className = 'editor-add';
  rotuloAdd.append('➕ Adicionar fotos');
  const entrada = document.createElement('input');
  entrada.type = 'file'; entrada.accept = 'image/*'; entrada.multiple = true; entrada.hidden = true;
  rotuloAdd.appendChild(entrada);
  const btnReset = document.createElement('button'); btnReset.type = 'button'; btnReset.className = 'sec'; btnReset.textContent = '↩️ Fotos originais';
  const btnFechar = document.createElement('button'); btnFechar.type = 'button'; btnFechar.textContent = 'Concluir';
  acoes.append(rotuloAdd, btnReset, btnFechar);

  caixa.append(titulo, aviso, status, grade, acoes);
  painel.appendChild(caixa);
  document.body.appendChild(painel);

  function mensagem(t) { status.textContent = t || ''; }

  function salvar() {
    return gravar(serializar()).catch(function () { mensagem('Não consegui salvar neste aparelho.'); });
  }

  function mudou() { aplicar(); desenharGrade(); return salvar(); }

  function botao(txt, rotulo, desativado, acao) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', rotulo); b.disabled = !!desativado;
    b.addEventListener('click', acao);
    return b;
  }

  function desenharGrade() {
    grade.textContent = '';
    itens.forEach(function (it, i) {
      const cartao = document.createElement('div'); cartao.className = 'editor-item';
      const img = document.createElement('img'); img.alt = 'Foto ' + (i + 1); img.src = urlDe(it);
      if (it.fallback) img.addEventListener('error', function () { if (!img.dataset.t) { img.dataset.t = '1'; img.src = it.fallback; } });
      const num = document.createElement('div'); num.className = 'num'; num.textContent = String(i + 1);
      const bs = document.createElement('div'); bs.className = 'botoes';
      bs.append(
        botao('◀', 'Mover para antes', i === 0, function () { itens.splice(i - 1, 0, itens.splice(i, 1)[0]); mudou(); }),
        botao('🗑', 'Remover foto', itens.length <= 1, function () {
          const [r] = itens.splice(i, 1);
          if (r.url) URL.revokeObjectURL(r.url);
          mudou();
        }),
        botao('▶', 'Mover para depois', i === itens.length - 1, function () { itens.splice(i + 1, 0, itens.splice(i, 1)[0]); mudou(); })
      );
      cartao.append(img, num, bs);
      grade.appendChild(cartao);
    });
  }

  entrada.addEventListener('change', function () {
    const arquivos = Array.prototype.slice.call(entrada.files || []);
    entrada.value = '';
    if (!arquivos.length) return;
    const vaga = MAX_FOTOS - itens.length;
    if (vaga <= 0) { mensagem('Limite de ' + MAX_FOTOS + ' fotos. Remova alguma antes.'); return; }
    const usar = arquivos.slice(0, vaga);
    mensagem('Preparando ' + usar.length + ' foto(s)…');
    Promise.all(usar.map(function (f) { return reduzir(f).catch(function () { return null; }); })).then(function (blobs) {
      const boas = blobs.filter(Boolean);
      boas.forEach(function (b) { itens.push({ tipo: 'foto', blob: b }); });
      const falhas = usar.length - boas.length;
      mensagem(boas.length ? (boas.length + ' foto(s) adicionada(s).' + (falhas ? ' ' + falhas + ' não pôde ser lida.' : '')) : 'Não consegui ler essas imagens.');
      if (boas.length) { itens.forEach(function () {}); mudou(); }
    });
  });

  btnReset.addEventListener('click', function () {
    if (!window.confirm('Voltar para as fotos originais do site? As fotos que você adicionou neste aparelho serão apagadas.')) return;
    itens.forEach(function (i) { if (i.url) URL.revokeObjectURL(i.url); });
    itens = window.Carrossel.padrao().map(function (p) { return { tipo: 'padrao', src: p.src, fallback: p.fallback }; });
    aplicar(); desenharGrade(); mensagem('Fotos originais restauradas.');
    gravar(null).catch(function () {});
  });

  let voltarFoco = null;
  function abrirPainel() {
    voltarFoco = document.activeElement;
    mensagem(''); desenharGrade();
    painel.hidden = false;
    btnFechar.focus();
  }
  function fecharPainel() {
    painel.hidden = true;
    if (voltarFoco && voltarFoco.focus) voltarFoco.focus();
  }
  btnFechar.addEventListener('click', fecharPainel);
  painel.addEventListener('click', function (e) { if (e.target === painel) fecharPainel(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !painel.hidden) fecharPainel(); });

  const btnAbrir = document.getElementById('btnEditarFotos');
  if (btnAbrir) btnAbrir.addEventListener('click', abrirPainel);

  // ---------- carrega o que foi salvo ----------
  ler().then(function (salvo) {
    if (!salvo || !salvo.length) return;
    itens = salvo.map(function (s) {
      return s.tipo === 'foto' ? { tipo: 'foto', blob: s.blob } : { tipo: 'padrao', src: s.src, fallback: s.fallback };
    });
    aplicar();
  }).catch(function () {});
})();
