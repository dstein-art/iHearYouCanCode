(function () {
  const DEFAULT_W = 600;
  const DEFAULT_H = 320;

  function canvasSize(row, fr) {
    const w = +(row.dataset.canvasW || fr.dataset.canvasW) || DEFAULT_W;
    const h = +(row.dataset.canvasH || fr.dataset.canvasH) || DEFAULT_H;
    return { w, h };
  }

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
