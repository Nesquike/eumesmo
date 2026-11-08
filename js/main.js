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


/* --------------------------------------------------------------------------
   Componente: Contact Form
   Valida os campos com mensagens acessíveis e envia via fetch (Formspree),
   sem sair da página. Hook: [data-contact-form]. Sem JS, o formulário
   envia normalmente pelo atributo action.
   -------------------------------------------------------------------------- */
(function contactForm() {
  'use strict';

  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const status = form.querySelector('.contact-form__status');
  const submitButton = form.querySelector('[type="submit"]');
  const fields = [...form.elements].filter((element) => element.willValidate);

  const ERROR_MESSAGES = {
    valueMissing: 'Este campo é obrigatório.',
    typeMismatch: 'Digite um e-mail válido, como nome@exemplo.com.',
  };

  let isSending = false;

  /* Com JS ativo, a validação passa a ser nossa (mensagens em português) */
  form.noValidate = true;

  /* Erro de cada campo fica em #<id-do-campo>-error */
  function validateField(field) {
    const error = document.getElementById(`${field.id}-error`);
    const isValid = field.checkValidity();

    if (isValid) {
      field.removeAttribute('aria-invalid');
    } else {
      field.setAttribute('aria-invalid', 'true');
    }

    if (error) {
      const reason = Object.keys(ERROR_MESSAGES).find((key) => field.validity[key]);
      error.textContent = isValid ? '' : ERROR_MESSAGES[reason] || field.validationMessage;
    }

    return isValid;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.classList.toggle('contact-form__status--success', type === 'success');
    status.classList.toggle('contact-form__status--error', type === 'error');
  }

  /* Revalida enquanto a pessoa corrige um campo já marcado como inválido */
  form.addEventListener('input', (event) => {
    if (event.target.getAttribute('aria-invalid') === 'true') {
      validateField(event.target);
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSending) return;

    const invalidFields = fields.filter((field) => !validateField(field));
    if (invalidFields.length > 0) {
      setStatus('Revise os campos destacados.', 'error');
      invalidFields[0].focus();
      return;
    }

    isSending = true;
    submitButton.setAttribute('aria-disabled', 'true'); // não usa disabled para manter o foco
    setStatus('Enviando…');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      form.reset();
      setStatus('Mensagem enviada! Respondo em breve.', 'success');
    } catch {
      setStatus('Não foi possível enviar agora. Tente de novo ou me chame por e-mail.', 'error');
    } finally {
      isSending = false;
      submitButton.removeAttribute('aria-disabled');
    }
  });
})();
