// Main app controller — era switching, settings, browser warning, reset

(function() {

  const ERA_ORDER = ['2000', '2010', '2020', 'now', '2030'];

  const ERA_META = {
    '2000': { bodyClass: 'era-2000', EraCls: () => new Era2000() },
    '2010': { bodyClass: 'era-2010', EraCls: () => new Era2010() },
    '2020': { bodyClass: 'era-2020', EraCls: () => new Era2020() },
    'now':  { bodyClass: 'era-now',  EraCls: () => new EraNow()  },
    '2030': { bodyClass: 'era-2030', EraCls: () => new Era2030() },
  };

  let currentEraId  = null;
  let currentInstance = null;

  window.APP_CONFIG = {
    wsUrl:     CONFIG.backend.wsUrl,
    awsKey:    '',
    awsSecret: '',
    awsToken:  ''
  };

  window.APP_STATE = {
    autoplay: false
  };

  // ---- Browser warning ----
  function checkBrowser() {
    const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!hasSR) {
      const banner = document.createElement('div');
      banner.className = 'browser-warning';
      banner.innerHTML =
        '⚠️ <strong>Speech recognition requires Chrome or Edge.</strong> ' +
        'The 2010s and 2020s eras will not work in this browser. ' +
        '<a href="https://www.google.com/chrome/" target="_blank" style="color:inherit;text-decoration:underline">Get Chrome →</a>';
      document.body.insertBefore(banner, document.body.firstChild);
    }
  }

  // ---- Era switching ----
  function switchEra(eraId, force) {
    if (eraId === currentEraId && !force) return;

    if (currentInstance?.destroy) currentInstance.destroy();
    currentInstance = null;

    document.body.classList.add('era-transitioning');

    setTimeout(() => {
      currentEraId = eraId;
      const meta = ERA_META[eraId];
      const cfg  = CONFIG.eras[eraId];

      ERA_ORDER.forEach(id => document.body.classList.remove(ERA_META[id].bodyClass));
      document.body.classList.add(meta.bodyClass);

      document.querySelectorAll('.era-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.era === eraId)
      );

      // Header text
      document.getElementById('era-title').textContent    = cfg.title;
      document.getElementById('era-subtitle').textContent = cfg.subtitle;
      document.getElementById('era-challenge').textContent = cfg.challenge;
      document.getElementById('era-hint').textContent     = cfg.hint;
      document.getElementById('tech-detail').textContent  = cfg.techDetail || '';

      // Tech badges
      document.getElementById('era-tech-badges').innerHTML =
        (cfg.techBadges || []).map(b => `<span class="era-badge">${b}</span>`).join('');

      // Trade-off bar
      if (cfg.tradeoff) {
        const pct = cfg.tradeoff.position;
        document.getElementById('tradeoff-fill').style.width = pct + '%';
        document.getElementById('tradeoff-thumb').style.left = `calc(${pct}% - 8px)`;
        document.getElementById('tradeoff-caption').textContent = cfg.tradeoff.caption;
      }

      // Control layer
      if (cfg.controlLayer) {
        document.getElementById('ctrl-icon').textContent = cfg.controlLayer.icon;
        document.getElementById('ctrl-name').textContent = cfg.controlLayer.name;
        document.getElementById('ctrl-desc').textContent = cfg.controlLayer.desc;
      }

      // Fail mode vs off-script panel
      const failCard  = document.getElementById('failmode-card');
      const offscript = document.getElementById('offscript-card');

      if (eraId === 'now' && cfg.offScriptPrompts) {
        failCard.style.display  = 'none';
        offscript.style.display = 'block';
        document.getElementById('offscript-list').innerHTML =
          cfg.offScriptPrompts.map(p => `<div class="offscript-prompt">"${p}"</div>`).join('');
      } else {
        offscript.style.display = 'none';
        failCard.style.display  = 'block';
        const ft = document.getElementById('failmode-text');
        if (ft) ft.textContent = cfg.failMode || '';
      }

      // Clear conversation log
      const conv = document.getElementById('conv-messages');
      conv.innerHTML = '<p class="conv-empty">Start the conversation to see the transcript here.</p>';

      // Render phone
      const wrapper = document.getElementById('phone-wrapper');
      wrapper.innerHTML = '';
      currentInstance = meta.EraCls();
      currentInstance.init(wrapper, conv);

      // Autoplay logic
      const isTheater = document.body.classList.contains('theater-mode');
      const isAutoplay = isTheater || window.APP_STATE.autoplay;

      if (isAutoplay) {
        // Wait 6 seconds (5s splash + 1s fade) if theater mode, otherwise start shortly
        const delay = isTheater ? 6000 : 500;
        setTimeout(() => {
          if (typeof currentInstance?.start === 'function') {
            currentInstance.start();
          }
        }, delay);
      }

      // Presentation mode Hardware Render Splash
      const renderOverlay = document.getElementById('render-overlay');
      const renderImg = document.getElementById('render-img');
      const phoneStage = document.querySelector('.phone-stage');
      
      const renders = {
        '2000': 'phones/2000s.png?v=17',
        '2010': 'phones/2010s.png?v=17',
        '2020': 'phones/2020s.png?v=17',
        'now': 'phones/now.png?v=17',
        '2030': 'phones/2030s.png?v=17'
      };

      if (document.body.classList.contains('theater-mode') && renders[eraId]) {
        renderImg.src = renders[eraId];
        
        // Reset animation
        renderImg.style.animation = 'none';
        renderImg.offsetHeight; // trigger reflow
        renderImg.style.animation = null;
        
        renderOverlay.hidden = false;
        renderOverlay.classList.remove('fade-out');
        phoneStage.classList.add('render-active');
        
        // Clear any previous timeout
        if (window._renderSplashTimeout) clearTimeout(window._renderSplashTimeout);
        
        window._renderSplashTimeout = setTimeout(() => {
          renderOverlay.classList.add('fade-out');
          phoneStage.classList.remove('render-active');
          setTimeout(() => renderOverlay.hidden = true, 1000);
        }, 5000);
      } else {
        renderOverlay.hidden = true;
        phoneStage.classList.remove('render-active');
        if (window._renderSplashTimeout) clearTimeout(window._renderSplashTimeout);
      }

      document.body.classList.remove('era-transitioning');
    }, 300);
  }

  // ---- Reset current era ----
  function resetEra() {
    if (!currentEraId) return;
    switchEra(currentEraId, true);
  }

  // ---- Settings ----
  function openSettings() {
    document.getElementById('settings-overlay').hidden = false;
    document.getElementById('settings-panel').hidden   = false;
    document.getElementById('cfg-ws-url').value   = window.APP_CONFIG.wsUrl || '';
    document.getElementById('cfg-aws-key').value  = window.APP_CONFIG.awsKey || '';
    document.getElementById('cfg-bank-name').value = CONFIG.bank.name || '';
  }

  function closeSettings() {
    document.getElementById('settings-overlay').hidden = true;
    document.getElementById('settings-panel').hidden   = true;
  }

  function saveSettings() {
    const wsUrl     = document.getElementById('cfg-ws-url').value.trim();
    const awsKey    = document.getElementById('cfg-aws-key').value.trim();
    const awsSecret = document.getElementById('cfg-aws-secret').value.trim();
    const awsToken  = document.getElementById('cfg-aws-token').value.trim();
    const bankName  = document.getElementById('cfg-bank-name').value.trim();

    if (wsUrl)     window.APP_CONFIG.wsUrl     = wsUrl;
    if (awsKey)    window.APP_CONFIG.awsKey    = awsKey;
    if (awsSecret) window.APP_CONFIG.awsSecret = awsSecret;
    if (awsToken)  window.APP_CONFIG.awsToken  = awsToken;
    if (bankName)  CONFIG.bank.name = bankName;

    closeSettings();
    const era = currentEraId;
    currentEraId = null;
    switchEra(era);
  }

  // ---- Bootstrap ----
  document.addEventListener('DOMContentLoaded', () => {
    checkBrowser();

    document.querySelectorAll('.era-btn').forEach(btn =>
      btn.addEventListener('click', () => switchEra(btn.dataset.era))
    );

    document.getElementById('theater-btn').addEventListener('click', () => {
      const isEnteringTheater = document.body.classList.toggle('theater-mode');
      document.getElementById('theater-btn').classList.toggle('active');
      
      if (isEnteringTheater) {
        // Always start the presentation from the beginning with the Nokia intro
        switchEra('2000', true);
      }
    });

    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('settings-close').addEventListener('click', closeSettings);
    document.getElementById('settings-overlay').addEventListener('click', closeSettings);
    document.getElementById('settings-save').addEventListener('click', saveSettings);

    document.getElementById('conv-clear').addEventListener('click', () => {
      document.getElementById('conv-messages').innerHTML =
        '<p class="conv-empty">Start the conversation to see the transcript here.</p>';
    });

    document.getElementById('reset-btn').addEventListener('click', resetEra);

    const autoplayToggle = document.getElementById('autoplay-toggle-chk');
    autoplayToggle.addEventListener('change', () => {
      window.APP_STATE.autoplay = autoplayToggle.checked;
      if (window.APP_STATE.autoplay && currentInstance && typeof currentInstance.start === 'function') {
        // If era is already in a call, don't restart, but if it has a specific start check, call it
        currentInstance.start();
      }
    });

    // Arrow key navigation
    document.addEventListener('keydown', e => {
      const idx = ERA_ORDER.indexOf(currentEraId);
      if (e.key === 'ArrowRight' && idx < ERA_ORDER.length - 1) switchEra(ERA_ORDER[idx + 1]);
      if (e.key === 'ArrowLeft'  && idx > 0)                    switchEra(ERA_ORDER[idx - 1]);
      if (e.key === 'r' || e.key === 'R') resetEra();
    });

    switchEra('2000');
  });

})();
