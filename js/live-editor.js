(function () {
  const DEFAULT_W = 600;
  const DEFAULT_H = 320;

  function canvasSize(row, fr) {
    const w = +(row.dataset.canvasW || fr.dataset.canvasW) || DEFAULT_W;
    const h = +(row.dataset.canvasH || fr.dataset.canvasH) || DEFAULT_H;
    return { w, h };
  }

  function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    return Promise.resolve();
  }

  function addCopyButton(editor) {
    const ta = editor.querySelector('textarea.live-code');
    const hint = editor.querySelector('.live-hint');
    if (!ta || !hint || hint.querySelector('.live-copy-btn')) return;

    const label = document.createElement('span');
    label.className = 'live-hint-label';
    while (hint.firstChild) label.appendChild(hint.firstChild);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'live-copy-btn';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code to clipboard');

    btn.addEventListener('click', () => {
      copyToClipboard(ta.value)
        .then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        })
        .catch(() => {
          btn.textContent = 'Failed';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        });
    });

    hint.appendChild(label);
    hint.appendChild(btn);
  }

  document.querySelectorAll('.live-editor').forEach(addCopyButton);

  document.querySelectorAll('.example-row').forEach((row) => {
    const ta = row.querySelector('textarea.live-code');
    const fr = row.querySelector('iframe.example-frame');
    if (!ta || !fr) return;

    const { w, h } = canvasSize(row, fr);
    row.style.setProperty('--canvas-w', w);
    row.style.setProperty('--canvas-h', h);

    function resize() {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
    resize();

    function send() {
      if (fr.contentWindow) {
        fr.contentWindow.postMessage({ type: 'run', code: ta.value, width: w, height: h }, '*');
      }
    }

    let timer;
    ta.addEventListener('input', () => {
      resize();
      clearTimeout(timer);
      timer = setTimeout(send, 700);
    });

    fr.addEventListener('load', send);
  });
})();
