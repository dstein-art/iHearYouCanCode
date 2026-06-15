(function () {
  document.querySelectorAll('.example-row').forEach((row) => {
    const ta = row.querySelector('textarea.live-code');
    const fr = row.querySelector('iframe.example-frame');
    if (!ta || !fr) return;

    function resize() {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
    resize();

    function send() {
      if (fr.contentWindow) {
        fr.contentWindow.postMessage({ type: 'run', code: ta.value }, '*');
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
