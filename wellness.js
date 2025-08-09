(function () {
  const STORAGE_KEY = 'eyeCareSettings';
  const DEFAULTS = { enabled: true, intervalMin: 20, breakMin: 2, snoozeMin: 5 };

  function loadSettings() {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
    } catch (_) {
      return { ...DEFAULTS };
    }
  }
  function saveSettings(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {}
  }

  let settings = loadSettings();
  let activeSeconds = 0;
  let ticking = false;
  let onBreak = false;
  let intervalId = null;
  let countdownId = null;

  function startTick() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (!settings.enabled || onBreak) return;
      if (document.hidden) return;
      activeSeconds += 1;
      if (activeSeconds >= settings.intervalMin * 60) {
        showPrompt();
      }
    }, 1000);
  }

  function createStyles() {
    const css = `
      .eye-care-overlay{position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center}
      .eye-care-card{background:#fff;border-radius:16px;max-width:480px;width:90%;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.2);text-align:center}
      .eye-care-title{font-weight:800;font-size:20px;margin-bottom:8px}
      .eye-care-desc{color:#4b5563;font-size:14px;margin-bottom:14px}
      .eye-care-actions{display:flex;gap:8px;justify-content:center;margin-top:10px}
      .eye-care-btn{padding:10px 14px;border-radius:9999px;border:none;font-weight:700;cursor:pointer}
      .eye-care-primary{background:#4F46E5;color:#fff}
      .eye-care-secondary{background:#E5E7EB;color:#374151}
      .eye-care-badge{display:inline-block;background:#EEF2FF;color:#4F46E5;border-radius:9999px;padding:4px 10px;font-weight:700;margin-bottom:10px}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function showPrompt() {
    if (document.querySelector('.eye-care-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'eye-care-overlay';
    const card = document.createElement('div');
    card.className = 'eye-care-card';
    const mins = settings.breakMin;
    card.innerHTML = `
      <div class="eye-care-badge">爱眼小提示</div>
      <div class="eye-care-title">休息一下，保护眼睛 👀</div>
      <div class="eye-care-desc">已连续使用 ${Math.floor(activeSeconds/60)} 分钟。建议眺望远方、闭眼放松 ${mins} 分钟。</div>
      <div id="eye-care-countdown" class="text-2xl font-extrabold text-indigo-600 mb-2" style="display:none">${mins}:00</div>
      <div class="eye-care-actions">
        <button id="eye-care-start" class="eye-care-btn eye-care-primary">开始 ${mins} 分钟休息</button>
        <button id="eye-care-snooze" class="eye-care-btn eye-care-secondary">稍后提醒</button>
        <button id="eye-care-disable" class="eye-care-btn eye-care-secondary">关闭本提示</button>
      </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const countdownEl = card.querySelector('#eye-care-countdown');
    const btnStart = card.querySelector('#eye-care-start');
    const btnSnooze = card.querySelector('#eye-care-snooze');
    const btnDisable = card.querySelector('#eye-care-disable');

    function startBreak() {
      onBreak = true;
      activeSeconds = 0;
      countdownEl.style.display = 'block';
      let remain = settings.breakMin * 60;
      updateCountdown();
      document.dispatchEvent(new CustomEvent('eye-care-break-start'));
      if (countdownId) clearInterval(countdownId);
      countdownId = setInterval(() => {
        remain -= 1;
        updateCountdown();
        if (remain <= 0) {
          clearInterval(countdownId);
          onBreak = false;
          document.dispatchEvent(new CustomEvent('eye-care-break-end'));
          document.body.removeChild(overlay);
        }
      }, 1000);

      function updateCountdown() {
        const m = Math.floor(remain / 60).toString().padStart(2, '0');
        const s = Math.floor(remain % 60).toString().padStart(2, '0');
        countdownEl.textContent = `${m}:${s}`;
      }
    }

    btnStart.addEventListener('click', startBreak);
    btnSnooze.addEventListener('click', () => {
      // 延后提醒：把已用时回退 snooze 分钟
      activeSeconds = Math.max(0, activeSeconds - settings.snoozeMin * 60);
      document.body.removeChild(overlay);
    });
    btnDisable.addEventListener('click', () => {
      settings.enabled = false; saveSettings(settings);
      document.body.removeChild(overlay);
    });
  }

  function createToggle() {
    const btn = document.createElement('button');
    btn.title = '护眼提醒设置';
    btn.style.position = 'fixed';
    btn.style.bottom = '16px';
    btn.style.right = '16px';
    btn.style.zIndex = '999998';
    btn.className = 'eye-care-btn eye-care-secondary';
    btn.textContent = settings.enabled ? '护眼提醒: 开' : '护眼提醒: 关';
    btn.addEventListener('click', () => {
      settings.enabled = !settings.enabled; saveSettings(settings);
      btn.textContent = settings.enabled ? '护眼提醒: 开' : '护眼提醒: 关';
      if (settings.enabled) activeSeconds = 0;
    });
    document.body.appendChild(btn);
  }

  document.addEventListener('visibilitychange', () => {
    // 暂停/恢复计时仅依赖 hidden 检测；无需处理额外逻辑
  });

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  function init() {
    createStyles();
    createToggle();
    startTick();
  }
  // 允许页面内动态调整设置
  document.addEventListener('eye-care-settings-updated', (e) => {
    try {
      const next = { ...settings, ...(e.detail || {}) };
      settings = next;
      saveSettings(settings);
      activeSeconds = 0; // 重新计时
    } catch (_) {}
  });

  // 跨标签页同步
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try {
        settings = { ...DEFAULTS, ...(JSON.parse(ev.newValue) || {}) };
        activeSeconds = 0;
      } catch (_) {}
    }
  });
})();

