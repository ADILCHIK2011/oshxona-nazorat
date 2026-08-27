(function () {
  'use strict';

  var TOKEN_KEY = 'kassir_token';
  var QUEUE_KEY = 'kassir_offline_queue';

  var loginScreen = document.getElementById('loginScreen');
  var scanScreen = document.getElementById('scanScreen');
  var tokenInput = document.getElementById('tokenInput');
  var loginBtn = document.getElementById('loginBtn');
  var loginError = document.getElementById('loginError');
  var codeInput = document.getElementById('codeInput');
  var pinInput = document.getElementById('pinInput');
  var pinBtn = document.getElementById('pinBtn');
  var resultEl = document.getElementById('result');
  var offlineBadge = document.getElementById('offlineBadge');
  var queueCountEl = document.getElementById('queueCount');

  // Token FAQAT joriy brauzer sessiyasi davomida saqlanadi
  // (sessionStorage) — localStorage'ga ATAYIN yozilmaydi, shunda
  // qurilma boshqa kimgadir o'tsa ham token uzoq muddat qolib
  // ketmaydi (tab/brauzer yopilsa avtomatik o'chadi).
  var token = sessionStorage.getItem(TOKEN_KEY);

  function getQueue() {
    try {
      return JSON.parse(sessionStorage.getItem(QUEUE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function setQueue(queue) {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    queueCountEl.textContent = String(queue.length);
    offlineBadge.classList.toggle('hidden', queue.length === 0 && navigator.onLine);
  }

  function playTone(freq, duration) {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio mavjud bo'lmasa ham davom etaveramiz.
    }
  }

  function playSuccess() {
    playTone(880, 0.15);
  }

  function playError() {
    playTone(220, 0.35);
  }

  function showLoginError(message) {
    loginError.textContent = message;
  }

  function enterScanScreen() {
    loginScreen.classList.add('hidden');
    scanScreen.classList.remove('hidden');
    setQueue(getQueue());
    codeInput.focus();
  }

  function backToLogin(message) {
    token = null;
    sessionStorage.removeItem(TOKEN_KEY);
    scanScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    tokenInput.value = '';
    tokenInput.focus();
    showLoginError(message || '');
  }

  async function loadUserPhoto(userId) {
    try {
      var res = await fetch('/api/user-photo/' + encodeURIComponent(userId), {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) return null;
      var blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      return null;
    }
  }

  function showResult(ok, message, user) {
    resultEl.className = ok ? 'ok' : 'fail';
    resultEl.innerHTML = '';

    var msgEl = document.createElement('div');
    msgEl.className = 'message';
    msgEl.textContent = message;
    resultEl.appendChild(msgEl);

    if (ok && user && (user.firstName || user.lastName)) {
      var nameEl = document.createElement('div');
      nameEl.className = 'name';
      nameEl.textContent = (user.firstName + ' ' + user.lastName).trim();
      resultEl.appendChild(nameEl);
    }

    if (ok && user && user.userId) {
      var img = document.createElement('img');
      img.className = 'photo';
      img.alt = '';
      resultEl.appendChild(img);
      loadUserPhoto(user.userId).then(function (url) {
        if (url) img.src = url;
      });
    }

    if (ok) playSuccess();
    else playError();
  }

  // Natija: true = serverga yetib bordi (muvaffaqiyatli yoki rad
  // etilgan farqi muhim emas — asosiysi so'rov BAJARILDI), false =
  // tarmoq xatosi (offline navbatga qo'shish kerak).
  async function sendScan(code) {
    var res;
    try {
      res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ code: code }),
      });
    } catch (networkErr) {
      return false;
    }

    if (res.status === 401) {
      backToLogin('Token noto\'g\'ri yoki eskirgan. Qayta kiriting.');
      return true;
    }

    var data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (!data) {
      showResult(false, '❌ Kod yaroqsiz', null);
      return true;
    }

    showResult(!!data.ok, data.message || (data.ok ? '✅ Tasdiqlandi' : '❌ Kod yaroqsiz'), data.user);
    return true;
  }

  async function sendPin(pin) {
    var res;
    try {
      res = await fetch('/api/emergency-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ pin: pin }),
      });
    } catch (networkErr) {
      showResult(false, '📴 Tarmoq xatosi. Qayta urinib ko\'ring.', null);
      return;
    }

    if (res.status === 401) {
      backToLogin('Token noto\'g\'ri yoki eskirgan. Qayta kiriting.');
      return;
    }

    var data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (!data) {
      showResult(false, '❌ PIN yaroqsiz', null);
      return;
    }

    showResult(!!data.ok, data.message || (data.ok ? '✅ Tasdiqlandi' : '❌ PIN yaroqsiz'), data.user);
  }

  pinBtn.addEventListener('click', function () {
    var pin = pinInput.value.trim();
    pinInput.value = '';
    if (!/^\d{4}$/.test(pin)) {
      showResult(false, '❌ PIN 4 ta raqamdan iborat bo\'lishi kerak', null);
      return;
    }
    sendPin(pin);
  });

  pinInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') pinBtn.click();
  });

  async function processQueue() {
    if (!navigator.onLine || !token) return;
    var queue = getQueue();
    while (queue.length > 0) {
      var item = queue[0];
      // eslint-disable-next-line no-await-in-loop
      var delivered = await sendScan(item.code);
      if (!delivered) break;
      queue = queue.slice(1);
      setQueue(queue);
    }
  }

  function queueOffline(code) {
    var queue = getQueue();
    queue.push({ code: code, timestamp: Date.now() });
    setQueue(queue);
  }

  loginBtn.addEventListener('click', function () {
    // Nusxalashda tasodifan qo'shilib qolishi mumkin bo'lgan
    // bo'shliq/qator ko'chirish belgilarini butunlay olib tashlaymiz
    // (token hech qachon o'z ichida bo'shliq bo'lmagan hex qator).
    var value = tokenInput.value.replace(/\s+/g, '');
    if (!value) return;
    token = value;
    sessionStorage.setItem(TOKEN_KEY, token);
    showLoginError('');
    enterScanScreen();
    processQueue();
  });

  tokenInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') loginBtn.click();
  });

  codeInput.addEventListener('keydown', async function (e) {
    if (e.key !== 'Enter') return;
    var code = codeInput.value.trim();
    codeInput.value = '';
    if (!code) return;

    if (!navigator.onLine) {
      queueOffline(code);
      showResult(false, '📴 Oflayn — navbatga qo\'shildi', null);
      return;
    }

    var delivered = await sendScan(code);
    if (!delivered) {
      queueOffline(code);
      showResult(false, '📴 Tarmoq xatosi — navbatga qo\'shildi', null);
    }
  });

  // Skaner har doim shu inputga "yozishi" kerak — fokus qochib
  // ketsa avtomatik qaytaramiz. Lekin foydalanuvchi ATAYIN PIN
  // maydoniga yoki tugmaga bossa, fokusni tortib olmaymiz.
  document.addEventListener('click', function (e) {
    var isPinArea = e.target === pinInput || e.target === pinBtn;
    if (!scanScreen.classList.contains('hidden') && !isPinArea) {
      codeInput.focus();
    }
  });

  window.addEventListener('online', function () {
    offlineBadge.classList.toggle('hidden', getQueue().length === 0);
    processQueue();
  });

  window.addEventListener('offline', function () {
    offlineBadge.classList.remove('hidden');
  });

  if (token) {
    enterScanScreen();
    processQueue();
  } else {
    tokenInput.focus();
  }
})();
