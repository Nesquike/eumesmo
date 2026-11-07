/* ==========================================================================
   main.js — Portfólio
   Ponto de entrada. Cada componente se inicializa de forma isolada
   (IIFE) e pode ser extraído para um módulo próprio no futuro.
   Tudo aqui é melhoria progressiva: sem JS, a página funciona igual.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Componente: Photo Lens
   Lupa circular que segue o mouse sobre a foto, mostrando a imagem
   ampliada e sem filtros. Hook: [data-photo-lens] em um <figure> com <img>.
   O JS só informa posição/medidas via custom properties; o visual é CSS.
   -------------------------------------------------------------------------- */
(function photoLens() {
  'use strict';

  /* Só faz sentido em dispositivos com mouse (sem hover no toque) */
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!hasFinePointer.matches) return;

  document.querySelectorAll('[data-photo-lens]').forEach(initLens);

  function initLens(figure) {
    const image = figure.querySelector('img');
    if (!image) return;

    figure.appendChild(createZoomLayer(image));

    let frame = 0;

    /* Mede a foto dentro da moldura (tamanho de layout, sem a rotação) */
    function measure() {
      figure.style.setProperty('--lens-offset-x', `${image.offsetLeft}px`);
      figure.style.setProperty('--lens-offset-y', `${image.offsetTop}px`);
      figure.style.setProperty('--lens-width', `${image.offsetWidth}px`);
      figure.style.setProperty('--lens-height', `${image.offsetHeight}px`);
    }

    /* offsetX/Y já vêm nas coordenadas locais da foto, mesmo com rotação */
    function moveLens(event) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        figure.style.setProperty('--lens-x', `${event.offsetX}px`);
        figure.style.setProperty('--lens-y', `${event.offsetY}px`);
      });
    }

    image.addEventListener('pointerenter', (event) => {
      measure();
      moveLens(event);
      figure.classList.add('is-lens-active');
    });

    image.addEventListener('pointermove', moveLens);

    image.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      figure.classList.remove('is-lens-active');
    });
  }

  /* Camada ampliada: cópia da foto dentro de uma "janela" do tamanho dela,
     para o zoom nunca vazar sobre a moldura. Decorativa para leitores de tela. */
  function createZoomLayer(image) {
    const viewport = document.createElement('span');
    viewport.className = 'photo-lens__viewport';
    viewport.setAttribute('aria-hidden', 'true');

    const copy = image.cloneNode(false);
    copy.className = 'photo-lens__zoom';
    copy.alt = '';
    copy.loading = 'eager';
    copy.removeAttribute('id');

    viewport.appendChild(copy);
    return viewport;
  }
})();
