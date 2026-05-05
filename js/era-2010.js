// Era 2010 — Early Speech Recognition IVR
// Short phrases only — fails on natural conversational sentences

class Era2010 {
  constructor() {
    this.cfg = CONFIG.eras['2010'];
    this.state = 'idle';
    this.step = 'welcome';
    this.failCount = 0;
    this.recognition = null;
    this.container = null;
    this.convPanel = null;
  }

  init(container, convPanel) {
    this.container = container;
    this.convPanel = convPanel;
    this._render();
    this._setStatus('idle', 'Tap Call to connect');
  }

  start() {
    this._startCall();
  }

  destroy() {
    this._stopListening();
    audioEngine.stopSpeaking();
    audioEngine.stopNoise();
  }

  // ---- Rendering ----
  _render() {
    this.container.innerHTML = `
      <div class="phone phone-blackberry">
        <div class="bb-speaker">
          ${Array(6).fill('<div class="bb-speaker-hole"></div>').join('')}
        </div>
        <div class="bb-screen-frame">
          <div class="bb-screen" id="bb-screen">
            <div class="bb-screen-top">
              <div class="bb-carrier">${CONFIG.bank.name}</div>
              <div class="bb-time" id="bb-time">${this._time()}</div>
            </div>
            <div class="bb-screen-content">
              <div class="bb-call-status" id="bb-call-status">Ready</div>
              <div class="bb-ivr-text" id="bb-ivr-text">Tap Call to connect.</div>
              <div class="bb-user-speech" id="bb-user-speech"></div>
            </div>
          </div>
        </div>

        <!-- Classic BB Nav Row -->
        <div class="bb-nav-row">
          <button class="bb-nav-btn call" id="bb-call-btn">📞</button>
          <button class="bb-nav-btn">📱</button>
          <div class="bb-trackpad"></div>
          <button class="bb-nav-btn">🔙</button>
          <button class="bb-nav-btn end" id="bb-end-btn">🔴</button>
        </div>

        <!-- Classic BB QWERTY Keypad -->
        <div class="bb-keypad">
          <div class="bb-key-row"><div class="bb-key">Q</div><div class="bb-key">W</div><div class="bb-key">E</div><div class="bb-key">R</div><div class="bb-key">T</div><div class="bb-key">Y</div><div class="bb-key">U</div><div class="bb-key">I</div><div class="bb-key">O</div><div class="bb-key">P</div></div>
          <div class="bb-key-row"><div class="bb-key">A</div><div class="bb-key">S</div><div class="bb-key">D</div><div class="bb-key">F</div><div class="bb-key">G</div><div class="bb-key">H</div><div class="bb-key">J</div><div class="bb-key">K</div><div class="bb-key">L</div></div>
          <div class="bb-key-row"><div class="bb-key">alt</div><div class="bb-key">Z</div><div class="bb-key">X</div><div class="bb-key">C</div><div class="bb-key">V</div><div class="bb-key">B</div><div class="bb-key">N</div><div class="bb-key">M</div><div class="bb-key">$</div></div>
          <div class="bb-key-row"><div class="bb-key space"></div><div class="bb-key sym">sym</div></div>
        </div>

        <!-- Software mic button for demo purposes -->
        <div class="bb-mic-row">
          <button class="bb-mic-btn idle" id="bb-mic-btn">🎤</button>
        </div>
      </div>
    `;

    document.getElementById('bb-call-btn').onclick = () => this._startCall();
    document.getElementById('bb-end-btn').onclick = () => this._endCall();
    document.getElementById('bb-mic-btn').onclick = () => this._toggleMic();

    setInterval(() => {
      const el = document.getElementById('bb-time');
      if (el) el.textContent = this._time();
    }, 15000);
  }

  // ---- Call flow ----
  _startCall() {
    if (this.state !== 'idle') return;
    this.state = 'ringing';
    this._setIVR('Connecting...');
    this._setStatus('speaking', 'Connecting...');
    audioEngine.startNoise(this.cfg.audio.noiseLevel, this.cfg.audio.crackleLevel);
    audioEngine.playRingTone(2).then(() => {
      if (this.state !== 'ringing') return;
      this.state = 'ivr-speaking';
      this.step = 'welcome';
      this.failCount = 0;
      const isAuto = this.cfg.demoMode || window.APP_STATE?.autoplay;
      if (isAuto) {
        this._startDemo();
      } else {
        this._playPrompt('welcome', () => this._awaitSpeech());
      }
    });
  }

  _endCall() {
    this._stopListening();
    audioEngine.stopSpeaking();
    audioEngine.stopNoise();
    this.state = 'idle';
    this.step = 'welcome';
    this._setIVR('Call ended.');
    this._setUserSpeech('');
    this._setStatus('idle', 'Tap Call to connect');
    this._setCallStatus('Ready');
    this._setMicBtn(false);
    this._log('system', 'Call ended');
  }

  _toggleMic() {
    if (this.state === 'listening') {
      this._stopListening();
      this.state = 'ivr-speaking';
      this._setUserSpeech('');
    } else if (this.state === 'waiting') {
      this._startListening();
    }
  }

  _awaitSpeech() {
    if (this.state === 'idle' || this.state === 'done') return;
    this.state = 'waiting';
    this._setCallStatus('Waiting...');
    this._setStatus('listening', 'Tap mic to speak');
    this._setMicBtn(false);
    setTimeout(() => {
      if (this.state === 'waiting') this._startListening();
    }, 700);
  }

  _startListening() {
    if (this.state === 'idle' || this.state === 'done') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this._setIVR('Speech recognition not supported.\nPlease use Chrome or Edge.');
      return;
    }
    this.state = 'listening';
    this._setMicBtn(true);
    this._setUserSpeech('Listening...');
    this._setStatus('listening', 'Listening — speak clearly');
    this._setCallStatus('Listening...');

    this.recognition = new SR();
    this.recognition.lang = 'en-GB';
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('').trim();
      this._setUserSpeech(`"${transcript}"`);
      if (e.results[e.results.length - 1].isFinal) {
        this._handleUtterance(transcript);
      }
    };
    this.recognition.onerror = () => this._onNoSpeech();
    this.recognition.onend = () => {
      if (this.state === 'listening') this._onNoSpeech();
    };
    this.recognition.start();
  }

  _stopListening() {
    if (this.recognition) { try { this.recognition.stop(); } catch { } this.recognition = null; }
    this._setMicBtn(false);
  }

  _onNoSpeech() {
    this._stopListening();
    if (this.state === 'idle' || this.state === 'done') return;
    this.failCount++;
    if (this.failCount >= 3) {
      this.state = 'ivr-speaking';
      this._playPrompt('tooManyAttempts', () => this._endCall());
      return;
    }
    this.state = 'ivr-speaking';
    this._setUserSpeech('');
    this._playPrompt('didntCatch', () => this._awaitSpeech());
  }

  _handleUtterance(text) {
    this._stopListening();
    if (this.state === 'idle' || this.state === 'done') return;
    this.state = 'processing';
    this._log('user', text);
    this._setCallStatus('Processing...');

    const lower = text.toLowerCase().trim();
    const wordCount = lower.split(/\s+/).filter(w => w.length > 1).length;

    // Too many words — early NLU fails on natural sentences
    if (wordCount > 4) {
      const mishear = this.cfg.misrecognitionPhrases[
        Math.floor(Math.random() * this.cfg.misrecognitionPhrases.length)
      ];
      this.state = 'ivr-speaking';
      this._setUserSpeech('');
      const p = { text: this.cfg.prompts.misheard.text.replace('{HEARD}', mishear) };
      this._speakPrompt(p, () => this._awaitSpeech());
      return;
    }

    // Random misrecognition on any input (25% chance for short phrases too)
    if (Math.random() < this.cfg.misrecognitionChance && this.step === 'welcome') {
      const mishear = this.cfg.misrecognitionPhrases[
        Math.floor(Math.random() * this.cfg.misrecognitionPhrases.length)
      ];
      this.state = 'ivr-speaking';
      this._setUserSpeech('');
      const p = { text: this.cfg.prompts.misheard.text.replace('{HEARD}', mishear) };
      this._speakPrompt(p, () => this._awaitSpeech());
      return;
    }

    const intent = this._classify(lower);
    this._processStep(intent, text);
  }

  // Very restrictive — only specific short phrases
  _classify(lower) {
    // Only accept: "lost card", "lost my card", "card lost", "missing card", "lost"
    if (/\blost\b.{0,8}\bcard\b|\bcard\b.{0,8}\blost\b|\bmissing\b.{0,8}\bcard\b/i.test(lower)) return 'LOST_CARD';
    if (/^(lost|card lost|lost card|missing card|my card)$/i.test(lower.trim())) return 'LOST_CARD';

    // Balance: very short only
    if (/^balance$|^my balance$|^check balance$/i.test(lower.trim())) return 'BALANCE';

    // Agent: exact keywords only
    if (/^(agent|advisor|person|help|speak to someone)$/i.test(lower.trim())) return 'AGENT';

    return 'UNKNOWN';
  }

  _processStep(intent, raw) {
    this.state = 'ivr-speaking';
    this._setUserSpeech('');

    switch (this.step) {
      case 'welcome':
        if (intent === 'LOST_CARD') {
          this.step = 'confirm_lost';
          this._playPrompt('lostCardQuery', () => this._awaitSpeech());
        } else if (intent === 'BALANCE') {
          this._speak("I can help with your balance. You'll need to speak to an advisor for that service. Connecting you now.", () => this._endCall());
        } else if (intent === 'AGENT') {
          this._speak("Connecting you to an advisor. Please hold. Current estimated wait time is eighteen minutes.", () => this._endCall());
        } else {
          this.failCount++;
          if (this.failCount >= 3) { this._playPrompt('tooManyAttempts', () => this._endCall()); return; }
          this._playPrompt('didntCatch', () => this._awaitSpeech());
        }
        break;

      case 'confirm_lost':
        if (this.cfg.keywords.YES.some(w => raw.toLowerCase().includes(w))) {
          this.step = 'get_account';
          this._playPrompt('lostCardStart', () => this._awaitSpeech());
        } else if (this.cfg.keywords.NO.some(w => raw.toLowerCase().includes(w))) {
          this.step = 'welcome';
          this._playPrompt('welcome', () => this._awaitSpeech());
        } else {
          this._playPrompt('didntCatch', () => this._awaitSpeech());
        }
        break;

      case 'get_account':
        if (/\d/.test(raw)) {
          this.step = 'get_address';
          this._setStatus('processing', 'Verifying account details…');
          setTimeout(() => this._playPrompt('accountGot', () => this._awaitSpeech()), 2000);
        } else {
          this._speak("I'm sorry, I couldn't make out the account number. Please say the digits clearly.", () => this._awaitSpeech());
        }
        break;

      case 'get_address':
        this.step = 'done';
        this.state = 'done';
        this._setStatus('processing', 'Cancelling card and ordering replacement…');
        setTimeout(() => this._playPrompt('addressGot', () => setTimeout(() => this._endCall(), 2000)), 2800);
        break;
    }
  }

  // ---- Prompt helpers ----
  _playPrompt(key, onEnd) {
    const p = this.cfg.prompts[key];
    if (!p) return;
    this._setIVR(p.text);
    this._log('ivr', p.text);
    this._setCallStatus('Speaking...');
    this._setStatus('speaking', 'IVR speaking...');
    audioEngine.playPrompt(p, '2010', () => {
      this._setCallStatus('Ready');
      if (onEnd) onEnd();
    });
  }

  _speakPrompt(p, onEnd) {
    this._setIVR(p.text);
    this._log('ivr', p.text);
    this._setCallStatus('Speaking...');
    this._setStatus('speaking', 'IVR speaking...');
    audioEngine.playPrompt(p, '2010', () => {
      this._setCallStatus('Ready');
      if (onEnd) onEnd();
    });
  }

  _speak(text, onEnd) {
    this._setIVR(text);
    this._log('ivr', text);
    this._setStatus('speaking', 'IVR speaking...');
    audioEngine.speak(text, '2010', onEnd);
  }

  // ---- UI helpers ----
  _setIVR(text) {
    const el = document.getElementById('bb-ivr-text');
    if (el) el.textContent = text;
  }
  _setUserSpeech(text) {
    const el = document.getElementById('bb-user-speech');
    if (el) el.textContent = text;
  }
  _setCallStatus(text) {
    const el = document.getElementById('bb-call-status');
    if (el) el.textContent = text;
  }
  _setMicBtn(active) {
    const btn = document.getElementById('bb-mic-btn');
    if (!btn) return;
    btn.className = `bb-mic-btn ${active ? 'listening' : 'idle'}`;
  }
  _setStatus(type, msg) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (dot) dot.className = 'status-dot' + (type !== 'idle' ? ' ' + type : '');
    if (text) text.textContent = msg;
  }
  _log(role, text) {
    if (!this.convPanel) return;
    const empty = this.convPanel.querySelector('.conv-empty');
    if (empty) empty.remove();
    const div = document.createElement('div');
    div.className = `conv-msg ${role}`;
    const label = role === 'ivr' ? CONFIG.bank.name + ' IVR' : role === 'user' ? 'You' : 'System';
    div.innerHTML = `<div class="conv-msg-label">${label}</div>${text}`;
    this.convPanel.appendChild(div);
    this.convPanel.scrollTop = this.convPanel.scrollHeight;
  }
  _startDemo() {
    this._playDemoStep(0);
  }

  _playDemoStep(idx) {
    if (this.state === 'idle') return;
    const script = this.cfg.demoScript || [];
    if (idx >= script.length) {
      setTimeout(() => this._endCall(), 1500);
      return;
    }
    const line = script[idx];
    const isAI = line.role === 'ai';

    if (isAI) {
      const playLine = () => {
        this._setIVR(line.text);
        this._log('ivr', line.text);
        this._setStatus('speaking', line.mishear ? 'Misrecognition…' : 'IVR speaking...');
        this._setCallStatus(line.mishear ? 'Error' : 'Speaking');
        const done = () => {
          this._setStatus('active', 'Listening...');
          setTimeout(() => this._playDemoStep(idx + 1), 600);
        };
        audioEngine.speak(line.text, '2010', done);
      };

      if (line.pauseBefore) {
        this._setStatus('processing', line.pauseBefore.status);
        this._setCallStatus('Processing...');
        setTimeout(playLine, line.pauseBefore.ms);
      } else {
        playLine();
      }
    } else {
      this._setUserSpeech(line.text);
      this._log('user', line.text);
      this._setStatus('listening', 'Customer speaking...');
      this._setCallStatus('Listening');
      const next = () => setTimeout(() => this._playDemoStep(idx + 1), 400);
      audioEngine.speak(line.text, 'customer', next);
    }
  }

  _time() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
