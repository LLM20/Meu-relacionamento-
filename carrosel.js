(function () {
  'use strict';

  const viewport = document.getElementById('carousel');
  const slide = document.getElementById('carouselSlide');
  const indicator = document.getElementById('carouselIndicator');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!viewport || !slide) return;

  // lista original (vinda do HTML), guardada para poder voltar a ela
  const padraoLista = Array.prototype.map.call(slide.querySelectorAll('img'), function (img) {
    return { src: img.getAttribute('src'), fallback: img.dataset.fallback || '' };
  });
  let total = slide.querySelectorAll('.carousel-item').length;
  const INTERVALO = 8000; // troca automática a cada 8 s

  let index = 0;
  let timer = null;
  let arrastando = false;
  let startX = 0;
  let dx = 0;

  function desenhar(animar) {
    slide.style.transition = animar === false ? 'none' : '';
    slide.style.transform = 'translateX(' + (-index * 100) + '%)';
    indicator.textContent = (index + 1) + ' / ' + total;
  }

  function ir(i) {
    index = (i + total) % total;
    desenhar();
    reiniciarAuto();
  }

  function pararAuto() { clearTimeout(timer); timer = null; }
  function reiniciarAuto() {
    pararAuto();
    if (document.hidden || arrastando) return;
    timer = setTimeout(function () { ir(index + 1); }, INTERVALO);
  }

  // Arrastar com o dedo (ou mouse): a foto acompanha o movimento
  viewport.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.carousel-button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    arrastando = true;
    startX = e.clientX;
    dx = 0;
    slide.style.transition = 'none';
    pararAuto();
    viewport.setPointerCapture(e.pointerId);
  });

  viewport.addEventListener('pointermove', function (e) {
    if (!arrastando) return;
    dx = e.clientX - startX;
    slide.style.transform = 'translateX(calc(' + (-index * 100) + '% + ' + dx + 'px))';
  });

  function soltar() {
    if (!arrastando) return;
    arrastando = false;
    const limite = Math.max(40, viewport.clientWidth * 0.15);
    if (dx < -limite) ir(index + 1);
    else if (dx > limite) ir(index - 1);
    else { desenhar(); reiniciarAuto(); }
    dx = 0;
  }
  viewport.addEventListener('pointerup', soltar);
  viewport.addEventListener('pointercancel', soltar);

  prevBtn && prevBtn.addEventListener('click', function () { ir(index - 1); });
  nextBtn && nextBtn.addEventListener('click', function () { ir(index + 1); });

  viewport.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') ir(index - 1);
    if (e.key === 'ArrowRight') ir(index + 1);
  });

  viewport.addEventListener('mouseenter', pararAuto);
  viewport.addEventListener('mouseleave', reiniciarAuto);
  document.addEventListener('visibilitychange', reiniciarAuto);

  // Troca as fotos do carrossel (usado pelo editor de fotos)
  function definir(lista) {
    slide.textContent = '';
    lista.forEach(function (it, i) {
      const item = document.createElement('div');
      item.className = 'carousel-item';
      const img = document.createElement('img');
      img.alt = 'Nós dois, foto ' + (i + 1);
      img.draggable = false;
      if (it.fallback) {
        img.addEventListener('error', function () {
          if (img.dataset.tentou) return;
          img.dataset.tentou = '1';
          img.src = it.fallback;
        });
      }
      img.src = it.src;
      item.appendChild(img);
      slide.appendChild(item);
    });
    total = lista.length;
    if (index >= total) index = Math.max(0, total - 1);
    desenhar(false);
    reiniciarAuto();
  }

  window.Carrossel = { definir: definir, padrao: function () { return padraoLista.slice(); } };

  desenhar(false);
  reiniciarAuto();
})();
