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
  let endWatchChannel = null;
  let endWatchRoom = '';
  let controlChannel = null;
  let controlRoom = '';
  let sawHostPresence = false;

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
    if (!start) return;

    const title = start.querySelector('span');
    const note = start.querySelector('small');
    if (count === 0) {
      if (title && title.textContent !== 'WAITING FOR PLAYERS') title.textContent = 'WAITING FOR PLAYERS';
      if (note && note.textContent !== 'Share the QR or join code to begin') note.textContent = 'Share the QR or join code to begin';
    }

    const mobile = $('mobileHostStart');
    if (mobile) {
      mobile.disabled = start.disabled;
      mobile.textContent = start.disabled ? 'WAITING FOR PLAYERS' : (count === 1 ? 'START SOLO' : 'START RACE');
      mobile.classList.toggle('hidden', $('hostLobby')?.classList.contains('hidden') ?? true);
    }
  }

  function installMobileHostStart() {
    if ($('mobileHostStart') || !$('host')) return;
    const button = document.createElement('button');
    button.id = 'mobileHostStart';
    button.className = 'mobile-host-start hidden';
    button.type = 'button';
    button.textContent = 'WAITING FOR PLAYERS';
    button.disabled = true;
    button.addEventListener('click', () => $('start')?.click());
    $('host').appendChild(button);

    if (!document.getElementById('mobileHostStyles')) {
      const style = document.createElement('style');
      style.id = 'mobileHostStyles';
      style.textContent = `
        .mobile-host-start{display:none}
        @media(max-width:700px){
          .host-screen{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}
          .mobile-host-start:not(.hidden){position:fixed;left:14px;right:14px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:90;display:block;min-height:64px;border:0;border-radius:19px;background:linear-gradient(135deg,var(--lime),#95ed50);color:#102014;font:inherit;font-size:1rem;font-weight:1000;letter-spacing:.04em;box-shadow:0 8px 0 #528932,0 18px 40px #0008}
          .mobile-host-start:disabled{background:#647b5c;color:#17301e;box-shadow:0 7px 0 #40543b;opacity:1}
        }
      `;
      document.head.appendChild(style);
    }
  }

  function clearControlChannel() {
    try { if (controlChannel && typeof db !== 'undefined') db.removeChannel(controlChannel); } catch {}
    controlChannel = null;
    controlRoom = '';
    sawHostPresence = false;
  }

  function kickPlayerToMain() {
    try { if (typeof stopConnection === 'function') stopConnection(); } catch {}
    try { sessionStorage.removeItem('ribbit-player'); } catch {}
    try { if (endWatchChannel && typeof db !== 'undefined') db.removeChannel(endWatchChannel); } catch {}
    endWatchChannel = null;
    endWatchRoom = '';
    clearControlChannel();
    location.replace('/Stick_Grow/stick_grow.html?ended=1');
  }

  function watchForEndedRoom() {
    try {
      if (typeof db === 'undefined' || typeof mode === 'undefined' || typeof room === 'undefined') return;
      if (mode !== 'player' || !room || endWatchRoom === room) return;

      if (endWatchChannel) db.removeChannel(endWatchChannel).catch(() => {});
      endWatchRoom = room;
      endWatchChannel = db.channel(`ribbit-room-ended-${room}-${Date.now()}`)
        .on('postgres_changes', { event:'DELETE', schema:'public', table:'ribbit_updates' }, payload => {
          if (payload?.old?.room_code === endWatchRoom) kickPlayerToMain();
        })
        .subscribe();
    } catch (error) {
      console.warn('Could not watch room end', error);
    }
  }

  function watchHostPresence() {
    try {
      if (typeof db === 'undefined' || typeof mode === 'undefined' || typeof room === 'undefined') return;
      if (!room || !['host','player'].includes(mode) || controlRoom === room) return;

      clearControlChannel();
      controlRoom = room;
      const role = mode;
      const key = `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const watchedRoom = room;

      controlChannel = db.channel(`ribbit-control-${watchedRoom}`, { config:{ presence:{ key } } })
        .on('presence', { event:'sync' }, () => {
          if (!controlChannel || controlRoom !== watchedRoom) return;
          const state = controlChannel.presenceState();
          const presences = Object.values(state).flat();
          const hasHost = presences.some(item => item?.role === 'host');

          if (role === 'player') {
            if (hasHost) sawHostPresence = true;
            else if (sawHostPresence) kickPlayerToMain();
          }
        })
        .subscribe(async status => {
          if (status === 'SUBSCRIBED' && role === 'host' && controlChannel && controlRoom === watchedRoom) {
            try { await controlChannel.track({ role:'host', room:watchedRoom }); } catch {}
          }
        });
    } catch (error) {
      console.warn('Could not watch host presence', error);
    }
  }

  // Core refresh already catches "Room not found". This makes the fallback
  // navigate cleanly to the game's main screen instead of leaving stale state.
  try {
    if (typeof leaveEndedRoom === 'function') leaveEndedRoom = kickPlayerToMain;
  } catch {}

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

  // Hosting is supported on phones too; make that clear on the landing screen.
  const launchNote = $('launch')?.querySelector('small');
  if (launchNote) launchNote.textContent = 'Works on phone, tablet, TV or laptop';

  installMobileHostStart();

  const roomNode = $('roomCode');
  const countNode = $('playerCount');
  const startNode = $('start');
  const lobbyNode = $('hostLobby');
  if (roomNode) new MutationObserver(syncRoom).observe(roomNode, { childList:true, characterData:true, subtree:true });
  if (countNode) new MutationObserver(syncStartButton).observe(countNode, { childList:true, characterData:true, subtree:true });
  if (startNode) new MutationObserver(syncStartButton).observe(startNode, { attributes:true, childList:true, characterData:true, subtree:true });
  if (lobbyNode) new MutationObserver(syncStartButton).observe(lobbyNode, { attributes:true, attributeFilter:['class'] });

  setInterval(() => {
    watchForEndedRoom();
    watchHostPresence();
  }, 700);

  window.addEventListener('load', () => {
    syncRoom();
    syncStartButton();
    watchForEndedRoom();
    watchHostPresence();
  });
  syncRoom();
  syncStartButton();
  watchForEndedRoom();
  watchHostPresence();
})();
