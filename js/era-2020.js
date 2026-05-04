// Era 2020 — Lex-style Conversational AI (Intent + Slot Filling)

class Era2020 {
  constructor() {
    this.cfg = CONFIG.eras['2020'];
    this.state = 'idle';
    this.detectedIntent = null;
    this.slots = {};
    this.slotQueue = [];
    this.recognition = null;
    this.callTimer = null;
    this.callSeconds = 0;
    this.container = null;
    this.convPanel = null;
  }

  init(container, convPanel) {
    this.container = container;
    this.convPanel = convPanel;
    this._render();
    this._setStatus('idle', 'Tap the call button to connect');
  }

  destroy() {
    this._stopListening();
    audioEngine.stopSpeaking();
    clearInterval(this.callTimer);
  }

  // ---- Render ----
  _render() {
    this.container.innerHTML = `
      <div class="phone phone-pixel">
        <div class="pixel-side-btn pixel-power"></div>
        <div class="pixel-side-btn pixel-vol"></div>
        
        <div class="pixel-screen-frame">
          <div class="pixel-screen" id="ip7-screen">
            <div class="pixel-hole-punch"></div>
            
            <div class="pixel-status-bar">
              <span class="pixel-time" id="ip7-time">${this._time()}</span>
              <div class="pixel-icons"><span>●●●</span><span> WiFi </span><span>🔋</span></div>
            </div>

            <!-- Call info bar (contact name + timer) -->
            <div class="ip7-call-info-bar">
              <div class="ip7-contact-name">${CONFIG.bank.name}</div>
              <div class="ip7-call-timer" id="ip7-timer" style="visibility:hidden">Calling...</div>
            </div>

            <!-- Chat / transcript area -->
            <div class="ip7-chat-area" id="ip7-chat"></div>

            <!-- Pre-call state -->
            <div class="ip7-precall" id="ip7-precall">
              <button class="ip7-big-call-btn" id="ip7-call-btn">📞</button>
              <div class="ip7-precall-label">Call ${CONFIG.bank.name}</div>
            </div>

            <!-- In-call iOS-style controls -->
            <div class="ip7-incall" id="ip7-incall" style="display:none">
              <div class="ip7-ios-ctrl-grid">
                <div class="ip7-ios-ctrl-btn" id="ip7-mute-btn">
                  <span class="ios-ctrl-icon">🔇</span>
                  <span class="ios-ctrl-label">mute</span>
                </div>
                <div class="ip7-ios-ctrl-btn">
                  <span class="ios-ctrl-icon">⌨️</span>
                  <span class="ios-ctrl-label">keypad</span>
                </div>
                <div class="ip7-ios-ctrl-btn">
                  <span class="ios-ctrl-icon">🔊</span>
                  <span class="ios-ctrl-label">speaker</span>
                </div>
                <div class="ip7-ios-ctrl-btn">
                  <span class="ios-ctrl-icon">➕</span>
                  <span class="ios-ctrl-label">add call</span>
                </div>
                <div class="ip7-ios-ctrl-btn ip7-mic-ctrl" id="ip7-mic-btn">
                  <span class="ios-ctrl-icon">🎤</span>
                  <span class="ios-ctrl-label">speak</span>
                </div>
                <div class="ip7-ios-ctrl-btn">
                  <span class="ios-ctrl-icon">👤</span>
                  <span class="ios-ctrl-label">contacts</span>
                </div>
              </div>
              <button class="ip7-ios-end-btn" id="ip7-end-btn">🔴</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // AI analysis panel — outside the phone screen, visible to presenter not customer
    const aiPanel = document.createElement('div');
    aiPanel.id = 'ip7-ai-panel';
    aiPanel.className = 'ip7-ai-panel';
    aiPanel.style.display = 'none';
    aiPanel.innerHTML = `
      <div class="ip7-ai-panel-header">⚡ AI BACKEND PROCESSING</div>
      <div class="ip7-ai-panel-label">DETECTED INTENT</div>
      <div id="ip7-intent-chip"></div>
      <div class="ip7-ai-panel-label" style="margin-top:8px">SLOT FILLING</div>
      <div id="ip7-slots"></div>
    `;
    this.container.appendChild(aiPanel);

    document.getElementById('ip7-call-btn').onclick = () => this._startCall();
    document.getElementById('ip7-mic-btn').onclick   = () => this._toggleMic();
    document.getElementById('ip7-end-btn').onclick   = () => this._endCall();

    setInterval(() => {
      const el = document.getElementById('ip7-time');
      if (el) el.textContent = this._time();
    }, 15000);
  }

  // ---- Call flow ----
  _startCall() {
    if (this.state !== 'idle') return;
    this.state = 'starting';
    this.detectedIntent = null;
    this.slots = {};
    this.slotQueue = [...this.cfg.slots];

    document.getElementById('ip7-precall').style.display = 'none';
    document.getElementById('ip7-incall').style.display  = 'flex';
    document.getElementById('ip7-timer').style.visibility = 'visible';
    document.getElementById('ip7-timer').textContent = 'Calling...';
    this._setStatus('speaking', 'Connecting...');

    if (this.cfg.demoMode) {
      audioEngine.playRingTone(1).then(() => {
        if (this.state !== 'starting') return;
        this.state = 'active';
        this._startTimer();
        this._playDemoStep(0);
      });
      return;
    }

    audioEngine.playRingTone(1).then(() => {
      if (this.state !== 'starting') return;
      this.state = 'active';
      this._startTimer();
      this._playIVR(this.cfg.prompts.welcome, () => this._listen());
    });
  }

  // ---- Demo mode (auto-driven, no mic needed) ----
  _playDemoStep(idx) {
    if (this.state === 'idle') return;
    const script = this.cfg.demoScript || [];
    if (idx >= script.length) {
      setTimeout(() => this._endCall(), 1500);
      return;
    }
    const line = script[idx];
    const isAI = line.role === 'ai';
    const next = () => setTimeout(() => this._playDemoStep(idx + 1), isAI ? 600 : 400);

    if (isAI) {
      const playLine = () => {
        this._addBubble('ivr', line.text);
        this._log('ivr', line.text);
        this._setStatus('speaking', 'Virtual assistant speaking...');

        const done = () => { this._setStatus('active', 'Listening...'); setTimeout(() => this._playDemoStep(idx + 1), 600); };

        // Try pre-recorded WAV first; fall back to Samantha TTS if file missing
        let ivrFallbackUsed = false;
        const ivrFallback = () => {
          if (ivrFallbackUsed) return;
          ivrFallbackUsed = true;
          audioEngine.speak(line.text, '2020', done);
        };

        const audio = new Audio(line.file);
        audio.onended = done;
        audio.onerror = ivrFallback;
        audio.play().catch(ivrFallback);
      };

      if (line.pauseBefore) {
        this._setStatus('processing', line.pauseBefore.status);
        setTimeout(playLine, line.pauseBefore.ms);
      } else {
        playLine();
      }

    } else {
      // Customer line: show intent/slot triggers first, then speak
      if (line.showIntent) {
        this.detectedIntent = line.showIntent.intent;
        this._showIntentBadge(line.showIntent.intent, line.showIntent.confidence);
      }
      if (line.fillSlot) {
        this.slots[line.fillSlot] = '✓';
        this.slotQueue = this.slotQueue.filter(s => s.key !== line.fillSlot);
        this._updateSlotUI();
      }

      this._addBubble('user', line.text);
      this._log('user', line.text);
      this._setStatus('listening', 'Customer speaking...');
      audioEngine.speak(line.text, 'customer', next);
    }
  }

  _endCall() {
    this._stopListening();
    audioEngine.stopSpeaking();
    clearInterval(this.callTimer);
    this.callTimer = null;
    this.state = 'idle';

    document.getElementById('ip7-precall').style.display = 'flex';
    document.getElementById('ip7-incall').style.display  = 'none';
    document.getElementById('ip7-timer').style.visibility = 'hidden';
    const aiPanel = document.getElementById('ip7-ai-panel');
    if (aiPanel) aiPanel.style.display = 'none';

    this._setStatus('idle', 'Tap the call button to connect');
    this._setMicBtn(false);
    this._log('system', 'Call ended');
  }

  _toggleMic() {
    if (this.state === 'listening') {
      this._stopListening();
      this.state = 'active';
      this._setMicBtn(false);
    } else if (this.state === 'active' || this.state === 'waiting') {
      this._listen();
    }
  }

  _listen() {
    if (this.state === 'idle' || this.state === 'done') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this._addBubble('ivr', 'Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }
    this.state = 'listening';
    this._setMicBtn(true);
    this._setStatus('listening', 'Listening — speak naturally');

    this.recognition = new SR();
    this.recognition.lang = 'en-GB';
    this.recognition.interimResults = true;

    let interimBubble = null;
    this.recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('').trim();
      if (!interimBubble) {
        interimBubble = this._addBubble('user', transcript);
        if (interimBubble) interimBubble.style.opacity = '0.6';
      } else {
        interimBubble.textContent = transcript;
      }
      if (e.results[e.results.length - 1].isFinal) {
        if (interimBubble) interimBubble.style.opacity = '1';
        this._handleUtterance(transcript);
      }
    };

    this.recognition.onerror = () => {
      this._stopListening();
      if (this.state !== 'idle') {
        this.state = 'active';
        this._playIVR("I'm sorry, I didn't catch that. Could you try again?", () => this._listen());
      }
    };

    this.recognition.onend = () => {
      if (this.state === 'listening') {
        this._stopListening();
        if (this.state !== 'idle') {
          this.state = 'active';
          setTimeout(() => this._listen(), 600);
        }
      }
    };

    this.recognition.start();
  }

  _stopListening() {
    if (this.recognition) { try { this.recognition.stop(); } catch {} this.recognition = null; }
    this._setMicBtn(false);
  }

  _handleUtterance(text) {
    this._stopListening();
    if (this.state === 'idle' || this.state === 'done') return;
    this.state = 'processing';
    this._log('user', text);

    const lower = text.toLowerCase();

    // Fill next outstanding slot
    if (this.detectedIntent === 'REPORT_LOST_CARD' && this.slotQueue.length > 0) {
      const slot = this.slotQueue[0];
      const value = slot.extract(text);
      if (value) {
        this.slots[slot.key] = value;
        this.slotQueue.shift();
        this._updateSlotUI();
        if (this.slotQueue.length === 0) {
          setTimeout(() => {
            this.state = 'done';
            this._showIntentBadge('REPORT_LOST_CARD', 99);
            this._playIVR(this.cfg.prompts.complete, () => this._showExtensionOptions());
          }, 400);
        } else {
          const nextSlot = this.slotQueue[0];
          setTimeout(() => {
            this.state = 'active';
            this._playIVR(nextSlot.prompt, () => this._listen());
          }, 400);
        }
        return;
      } else {
        setTimeout(() => {
          this.state = 'active';
          this._playIVR("I'm sorry, I didn't quite get that. " + slot.prompt, () => this._listen());
        }, 300);
        return;
      }
    }

    const intent = this._classifyIntent(lower);
    setTimeout(() => {
      if (intent === 'REPORT_LOST_CARD') {
        this.detectedIntent = 'REPORT_LOST_CARD';
        const confidence = Math.floor(88 + Math.random() * 10);
        this._showIntentBadge('REPORT_LOST_CARD', confidence);
        this.state = 'active';
        this._playIVR(this.cfg.prompts.intentDetected, () => {
          if (this.slotQueue.length > 0) {
            this._playIVR(this.slotQueue[0].prompt, () => this._listen());
          }
        });
      } else if (intent === 'SPEAK_TO_AGENT') {
        this.state = 'done';
        this._playIVR(this.cfg.prompts.agentTransfer, () => setTimeout(() => this._endCall(), 2000));
      } else if (intent === 'CHECK_BALANCE') {
        this.state = 'done';
        this._playIVR("I'll need to verify your identity before I can show your balance. Let me connect you to our secure service.", () => setTimeout(() => this._endCall(), 2000));
      } else {
        this.state = 'active';
        this._playIVR(this.cfg.prompts.notUnderstood, () => this._listen());
      }
    }, 600);
  }

  // ---- 2020s extension scenarios ----
  _showExtensionOptions() {
    const chat = document.getElementById('ip7-chat');
    if (!chat) return;
    const wrap = document.createElement('div');
    wrap.id = 'ip7-ext-options';
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:4px 0;';
    const opts = [
      { label: '💳  My Apple Pay is linked to this card',  fn: () => this._extApplePay() },
      { label: '🔍  Has it been used anywhere else?',       fn: () => this._extOtherUse() },
      { label: '💵  I need access to emergency cash',       fn: () => this._extEmergencyCash() },
      { label: '✓   No, that\'s everything — thank you',   fn: () => this._endCall() },
    ];
    opts.forEach(o => {
      const btn = document.createElement('button');
      btn.textContent = o.label;
      btn.style.cssText = `padding:8px 12px;border-radius:12px;border:1px solid #ccc;
        background:#fff;color:#333;font-size:11px;font-family:-apple-system,sans-serif;
        text-align:left;cursor:pointer;line-height:1.4;`;
      btn.addEventListener('click', () => { wrap.remove(); o.fn(); });
      wrap.appendChild(btn);
    });
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  _extApplePay() {
    this.state = 'active';
    this._playUserLine('My Apple Pay is linked to this card', () => {
      this._log('system', '[ 2020s AI: Apple Pay token removal out of scope — manual or transfer required ]');
      this._playIVR(
        "I understand your concern. Unfortunately, I'm not able to remove Apple Pay tokens directly from this service — that requires a separate identity verification step in the wallet app itself. " +
        "Your physical card has been cancelled, but the digital token may still be active. I'd recommend opening your Wallet app and removing the card manually, or I can transfer you to our digital banking team who can action this immediately.",
        () => this._showExtensionOptions()
      );
    });
  }

  _extOtherUse() {
    this.state = 'active';
    this._playUserLine('Has it been used anywhere else?', () => {
      this._log('system', '[ 2020s AI: Limited to 3-transaction window — no real-time fraud feed access ]');
      this._playIVR(
        "That's a great question. I'm able to see the last three authorised transactions on your account, and nothing unusual appears in that window. " +
        "However, I don't have access to real-time pending transactions or cross-channel fraud signals — our fraud team has visibility across all transaction types. " +
        "Would you like me to transfer you to them for a full account review?",
        () => this._showExtensionOptions()
      );
    });
  }

  _extEmergencyCash() {
    this.state = 'active';
    this._playUserLine('I need access to emergency cash', () => {
      this._log('system', '[ 2020s AI: Emergency cash requires human specialist — out of intent schema ]');
      this._playIVR(
        "I completely understand — that's a stressful situation. I can see your account is in good standing, so there are a couple of options. " +
        "You could use your mobile banking app with a temporary one-time code, or I can arrange for you to withdraw cash at a branch using a passbook verification. " +
        "However, to set up an emergency access code I'll need to transfer you to our specialist team — that process isn't available through this automated service.",
        () => this._showExtensionOptions()
      );
    });
  }

  _classifyIntent(text) {
    let best = null;
    let bestScore = 0;
    for (const [intent, def] of Object.entries(this.cfg.intents)) {
      const score = def.phrases.filter(p => text.includes(p.toLowerCase())).length;
      if (score >= def.threshold && score > bestScore) { best = intent; bestScore = score; }
    }
    return best;
  }

  // ---- Timer ----
  _startTimer() {
    this.callSeconds = 0;
    this.callTimer = setInterval(() => {
      this.callSeconds++;
      const m = String(Math.floor(this.callSeconds / 60)).padStart(2, '0');
      const s = String(this.callSeconds % 60).padStart(2, '0');
      const el = document.getElementById('ip7-timer');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  }

  // ---- Intent + slot UI ----
  _showIntentBadge(intent, confidence) {
    const bar = document.getElementById('ip7-ai-panel');
    if (!bar) return;
    bar.style.display = 'block';

    const chip = document.getElementById('ip7-intent-chip');
    if (chip) {
      chip.innerHTML = `
        <div class="ip7-intent-chip">
          ${intent} <span class="ip7-confidence">${confidence}%</span>
        </div>`;
    }
    this._updateSlotUI();
  }

  _updateSlotUI() {
    const container = document.getElementById('ip7-slots');
    if (!container) return;
    container.innerHTML = this.cfg.slots.map(slot => {
      const filled = this.slots[slot.key] !== undefined;
      const active = !filled && this.slotQueue[0]?.key === slot.key;
      const cls = filled ? 'filled' : active ? 'active' : '';
      const icon = filled ? '✓' : active ? '…' : '○';
      return `<div class="ip7-slot ${cls}">${icon} ${slot.label}</div>`;
    }).join('');
  }

  // ---- IVR speech ----
  _playIVR(text, onEnd) {
    this._addBubble('ivr', text);
    this._log('ivr', text);
    this._setStatus('speaking', 'Virtual assistant speaking...');
    audioEngine.speak(text, 'agent', () => {
      this._setStatus('active', 'Tap speak when ready');
      if (onEnd) onEnd();
    });
  }

  // Customer voice — speaks the line then chains onEnd
  _playUserLine(text, onEnd) {
    this._addBubble('user', text);
    this._log('user', text);
    audioEngine.speak(text, 'customer', onEnd);
  }

  // ---- UI helpers ----
  _addBubble(role, text) {
    const chat = document.getElementById('ip7-chat');
    if (!chat) return null;
    const div = document.createElement('div');
    div.className = `ip7-bubble ${role}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    return div;
  }
  _setMicBtn(active) {
    const btn = document.getElementById('ip7-mic-btn');
    if (!btn) return;
    btn.className = `ip7-ios-ctrl-btn ip7-mic-ctrl${active ? ' listening' : ''}`;
    const lbl = btn.querySelector('.ios-ctrl-label');
    if (lbl) lbl.textContent = active ? 'listening…' : 'speak';
  }
  _setStatus(type, msg) {
    const dot  = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (dot)  dot.className = 'status-dot' + (type !== 'idle' ? ' ' + type : '');
    if (text) text.textContent = msg;
  }
  _log(role, text) {
    if (!this.convPanel) return;
    const empty = this.convPanel.querySelector('.conv-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = `conv-msg ${role}`;
    const label = role === 'ivr' ? CONFIG.bank.name + ' AI' : role === 'user' ? 'You' : 'System';
    div.innerHTML = `<div class="conv-msg-label">${label}</div>${text}`;
    this.convPanel.appendChild(div);
    this.convPanel.scrollTop = this.convPanel.scrollHeight;
  }
  _time() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
