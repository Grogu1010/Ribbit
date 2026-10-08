// Small presentation helpers for the host lobby.
// Core multiplayer/game logic stays in stick_grow.js.
(() => {
  if (!document.querySelector('link[href$="stick_grow_controller.css"]')) {
    const controllerCss = document.createElement('link');
    controllerCss.rel = 'stylesheet';
    controllerCss.href = 'stick_grow_controller.css';
    document.head.appendChild(controllerCss);
  }

  const $ = id => document.getElementById(id);
  let lastRoom = '';
  let qrRetryTimer = null;

  function roomCode() {
    const value = ($('roomCode')?.textContent || '').trim().toUpperCase();
    return /^[A-Z0-9]{5}$/.test(value) ? value : '';
  }

  function joinLink(code) {
    return `${location.origin}/Stick_Grow/stick_grow.html?room=${encodeURIComponent(code)}`;
  }

  function renderFallback(box, code) {
    box.replaceChildren();
    const fallback = document.createElement('div');
    fallback.className = 'qr-fallback';
    fallback.innerHTML = `QR unavailable.<br>Use join code<br><strong>${code}</strong>`;
    box.appendChild(fallback);
  }

  function qrLooksRendered(box) {
    const canvas = box.querySelector('canvas');
    const img = box.querySelector('img');
    return !!(canvas || (img && (img.complete || img.src)));
  }

  function ensureQR(code) {
    const box = $('qrCode');
    if (!box || !code || qrLooksRendered(box)) return;

    clearTimeout(qrRetryTimer);
    qrRetryTimer = setTimeout(() => {
      if (qrLooksRendered(box)) return;

      try {
        if (window.QRCode) {
          box.replaceChildren();
          new window.QRCode(box, {
            text: joinLink(code),
            width: 220,
            height: 220,
            colorDark: '#102016',
            colorLight: '#ffffff'
          });
        }
      } catch (error) {
        console.warn('QR retry failed', error);
      }

      setTimeout(() => {
        if (!qrLooksRendered(box)) renderFallback(box, code);
      }, 450);
    }, 450);
  }

  function syncRoom() {
    const code = roomCode();
    if (!code) return;

    const big = $('bigRoomCode');
    const url = $('joinUrl');
    const targetUrl = joinLink(code);

    if (big && big.textContent.trim() !== code) big.textContent = code;
    if (url && url.textContent !== targetUrl) url.textContent = targetUrl;

    if (code !== lastRoom) lastRoom = code;
    ensureQR(code);
  }

  function syncStartButton() {
    const start = $('start');
    const count = Number($('playerCount')?.textContent || 0);
    if (!start || count !== 0) return;

    const title = start.querySelector('span');
    const note = start.querySelector('small');
    if (title && title.textContent !== 'WAITING FOR PLAYERS') title.textContent = 'WAITING FOR PLAYERS';
    if (note && note.textContent !== 'Share the QR or join code to begin') note.textContent = 'Share the QR or join code to begin';
  }

  const copyCode = $('copyCode');
  if (copyCode) {
    copyCode.addEventListener('click', async () => {
      const code = roomCode();
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        copyCode.textContent = '✓';
        copyCode.setAttribute('aria-label', 'Room code copied');
        setTimeout(() => {
          copyCode.textContent = '⧉';
          copyCode.setAttribute('aria-label', 'Copy room code');
        }, 1400);
      } catch {
        copyCode.textContent = code;
        setTimeout(() => { copyCode.textContent = '⧉'; }, 1600);
      }
    });
  }

  const roomNode = $('roomCode');
  const countNode = $('playerCount');
  if (roomNode) new MutationObserver(syncRoom).observe(roomNode, { childList: true, characterData: true, subtree: true });
  if (countNode) new MutationObserver(syncStartButton).observe(countNode, { childList: true, characterData: true, subtree: true });

  window.addEventListener('load', () => {
    syncRoom();
    syncStartButton();
  });
  syncRoom();
  syncStartButton();
})();
