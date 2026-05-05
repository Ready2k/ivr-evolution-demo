// Era 2000 — DTMF Touch Tone IVR + Agent Handover

class Era2000 {
  constructor() {
    this.cfg = CONFIG.eras['2000'];
    this.state = 'idle';    // idle | ringing | active | input | agent | done
    this.currentNode = null;
    this.inputBuffer = '';
    this.inputType = null;
    this.previousNode = null;
    this.agentStep = null;  // welcome | get_account | get_dob | complete | farewell
    this.container = null;
    this.convPanel = null;
  }

  init(container, convPanel) {
    this.container = container;
    this.convPanel = convPanel;
    this._render();
    this._setStatus('idle', 'Press Call ☎ or any key to begin');
  }

  start() {
    this._startCall();
  }

  destroy() {
    if (this._autoPlayTimer) clearTimeout(this._autoPlayTimer);
    audioEngine.stopSpeaking();
    audioEngine.stopNoise();
    window.speechSynthesis.cancel();
  }

  // ---- Rendering ----
  _render() {
    this.container.innerHTML = `
      <div class="phone phone-nokia">
        <div class="nokia-earpiece">
          ${Array(5).fill('<div class="nokia-earpiece-dot"></div>').join('')}
        </div>
        <div class="nokia-screen-frame">
          <div class="nokia-screen" id="nokia-screen">
            <div class="nokia-screen-scanlines"></div>
            <div class="nokia-status-bar">
              <span>${CONFIG.bank.shortName}</span>
              <span id="nokia-time">${this._time()}</span>
            </div>
            <div class="nokia-content" id="nokia-content">Ready to call.\n\n${CONFIG.bank.phone}</div>
            <div class="nokia-input-bar" id="nokia-input"></div>
          </div>
        </div>
        <div class="nokia-call-row">
          <button class="nokia-call-btn call" id="nokia-call-btn">📞</button>
          <button class="nokia-call-btn end"  id="nokia-end-btn">🔴</button>
        </div>
        <div class="nokia-nav-row">
          <button class="nokia-soft-btn" id="nokia-back-btn">Back</button>
          <button class="nokia-nav-center" id="nokia-ok-btn">OK</button>
          <button class="nokia-soft-btn" style="text-align:right">Menu</button>
        </div>
        <div class="nokia-keypad">
          ${this._renderKeypad()}
        </div>
      </div>
    `;
    this._attachListeners();
    setInterval(() => {
      const el = document.getElementById('nokia-time');
      if (el) el.textContent = this._time();
    }, 15000);
  }

  _renderKeypad() {
    const rows = [['1','2','3'],['4','5','6'],['7','8','9'],['*','0','#']];
    const labels = {'1':'','2':'ABC','3':'DEF','4':'GHI','5':'JKL','6':'MNO','7':'PQRS','8':'TUV','9':'WXYZ','0':'+','*':'','#':''};
    return rows.map(row => `
      <div class="nokia-keypad-row">
        ${row.map(k => `
          <button class="nokia-key ${k==='*'||k==='#'?'nokia-key-special':''}" data-key="${k}">
            <span class="nokia-key-digit">${k}</span>
            ${labels[k] ? `<span class="nokia-key-letters">${labels[k]}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `).join('');
  }

  _attachListeners() {
    document.getElementById('nokia-call-btn').onclick = () => this._startCall();
    document.getElementById('nokia-end-btn').onclick  = () => this._endCall();
    document.getElementById('nokia-back-btn').onclick = () => this._goBack();
    document.querySelectorAll('.nokia-key').forEach(btn => {
      btn.addEventListener('click', () => this._handleKey(btn.dataset.key));
    });
  }

  // ---- Call flow ----
  _startCall() {
    if (this.state !== 'idle') return;
    this.state = 'ringing';
    this._setContent('Calling...\n\n' + CONFIG.bank.name);
    this._setStatus('speaking', 'Connecting...');
    audioEngine.startNoise(this.cfg.audio.noiseLevel, this.cfg.audio.crackleLevel);
    audioEngine.playRingTone(3).then(() => {
      if (this.state !== 'ringing') return;
      this.state = 'active';
      this._setContent(CONFIG.bank.phone);
      this._setStatus('active', 'Connected');
      this._navigateTo('root');
      
      // Autoplay Automation: Start the sequence
      if (document.body.classList.contains('theater-mode') || window.APP_STATE?.autoplay) {
        this._autoPlaySequence();
      }
    });
  }

  _autoPlaySequence() {
    // Sequence: 1 (English), wait for main menu, 2 (Lost Cards), wait for lost menu, then it goes to agent
    const sequence = [
      { delay: 4500, key: '1' }, // Press 1 for English
      { delay: 9000, key: '2' }  // Press 2 for Lost or Stolen cards
    ];
    
    let step = 0;
    const nextStep = () => {
      if (step >= sequence.length) return;
      const current = sequence[step];
      this._autoPlayTimer = setTimeout(() => {
        this._handleKey(current.key);
        step++;
        nextStep();
      }, current.delay);
    };
    nextStep();
  }

  _endCall() {
    audioEngine.stopSpeaking();
    audioEngine.stopNoise();
    this.state = 'idle';
    this.currentNode = null;
    this.inputBuffer = '';
    this.inputType = null;
    this.agentStep = null;
    this._setContent('Call ended.\n\n' + CONFIG.bank.name);
    this._setInput('');
    this._setStatus('idle', 'Press Call ☎ or any key to begin');
    this._log('system', 'Call ended');
  }

  _goBack() {
    if (this.previousNode && this.state === 'active') {
      this._navigateTo(this.previousNode);
    }
  }

  _handleKey(key) {
    if (this.state === 'idle') { this._startCall(); return; }
    if (this.state === 'done') return;

    audioEngine.playDTMF(key);
    
    // Show digit on screen
    const inputEl = document.getElementById('nokia-input');
    if (inputEl && this.state !== 'input' && this.state !== 'agent_input') {
      inputEl.textContent += key;
    }

    // Agent mode: still accept DTMF input for data entry
    if (this.state === 'agent_input') {
      this.inputBuffer += key;
      this._setInput(this.inputBuffer + '_');
      this._log('user', `[Key: ${key}]`);
      if (key === '#') this._submitAgentInput();
      return;
    }

    // Agent confirmation: 1 = more help, 2 = goodbye
    if (this.state === 'agent_confirm') {
      this._log('user', `[Pressed: ${key}]`);
      if (key === '2') {
        this.state = 'done';
        this._agentSpeak(
          "Brilliant, thank you so much for calling National Bank. I hope you have a lovely rest of your day. Take care now, goodbye!",
          () => { audioEngine.stopNoise(); this._setStatus('idle', 'Call complete'); }
        );
      } else {
        this.state = 'agent';
        this._agentSpeak(
          "Of course, I'm happy to help. What else can I do for you today?",
          () => { this.state = 'agent_confirm'; }
        );
      }
      return;
    }

    if (this.state === 'input') {
      this.inputBuffer += key;
      this._setInput(this.inputBuffer + '_');
      this._log('user', `[Key: ${key}]`);
      if (key === '#') this._submitInput();
      return;
    }

    if (this.state !== 'active') return;
    const node = this.cfg.menuTree[this.currentNode];
    if (!node) return;

    this._log('user', `[Pressed: ${key}]`);
    const next = node.options?.[key];
    if (next) {
      this._navigateTo(next);
    } else if (node.fallback) {
      audioEngine.stopSpeaking();
      this._speak("That is not a valid option. Please try again.", () => {
        this._navigateTo(node.fallback);
      });
    }
  }

  _navigateTo(nodeId) {
    const node = this.cfg.menuTree[nodeId];
    if (!node) return;
    this.previousNode = this.currentNode;
    this.currentNode = nodeId;
    this.inputBuffer = '';
    this._setInput('');

    // Agent handover
    if (node.agent) {
      this.state = 'active';
      this._speakNode(node, () => this._startAgentMode());
      return;
    }

    if (node.end) {
      this.state = 'done';
      this._speakNode(node, () => {
        audioEngine.stopNoise();
        this._setStatus('idle', 'Call complete');
      });
      return;
    }

    if (node.loop) {
      this.state = 'active';
      this._speakNode(node, () => {
        setTimeout(() => {
          if (this.currentNode === nodeId) this._speakNode(node);
        }, 9000);
      });
      return;
    }

    if (node.inputType) {
      this.state = 'active';
      this.inputType = node.inputType;
      this._speakNode(node, () => {
        this.state = 'input';
        this._setInput('_');
        this._setStatus('listening', 'Enter digits — press # when done');
      });
      return;
    }

    if (node.next) {
      this.state = 'active';
      this._speakNode(node, () => this._navigateTo(node.next));
      return;
    }

    this.state = 'active';
    this._speakNode(node);
  }

  _submitInput() {
    const value = this.inputBuffer.replace('#', '');
    this._log('user', `[Entered: ${value}]`);
    const node = this.cfg.menuTree[this.currentNode];
    this.state = 'active';
    this._setStatus('speaking', 'Processing...');
    this._speak('Thank you.', () => {
      if (node.next) this._navigateTo(node.next);
    });
    this.inputBuffer = '';
    this._setInput('');
  }

  // ---- Agent mode ----
  _startAgentMode() {
    this.state = 'agent';
    this.agentStep = 'welcome';
    this._setContent('Please Hold...');
    this._setStatus('speaking', 'On hold — connecting to advisor...');
    this._log('system', '[ On hold — connecting to advisor... ]');

    // IVR hold message → hold music → Amy picks up
    this._speak(
      "Please hold. We are connecting you to one of our advisors now. Your call is very important to us.",
      () => {
        this._setContent('On Hold\n\n♪  ♪  ♪');
        this._log('system', '[ Hold music playing... ]');
        audioEngine.playHoldMusic(4200).then(() => {
          if (this.state !== 'agent') return;
          this._setContent('Call Connected\n\n00:01');
          this._log('ivr', '[Agent Amy joined the call]');
          const tod = this._timeOfDay();
          this._agentSpeak(
            `Good ${tod}, thank you so much for holding. My name is Amy and I'm from the National Bank lost card team. I can see you've been transferred because you need to report a lost card. Not to worry — I can take care of that for you right now. I just need to take a couple of details. Could you please enter your 8-digit account number followed by the hash key?`,
            () => {
              this.state = 'agent_input';
              this.agentStep = 'get_account';
              this._setInput('_');
              this._setStatus('listening', 'Enter 8-digit account number, then #');
            }
          );
        });
      }
    );
  }

  _submitAgentInput() {
    const value = this.inputBuffer.replace('#', '');
    this.inputBuffer = '';
    this._setInput('');
    this._log('user', `[Entered: ${value}]`);
    this.state = 'agent';

    if (this.agentStep === 'get_account') {
      this.agentStep = 'get_dob';
      this._agentSpeak(
        "Thank you. And could I take your 6-digit date of birth please — day, month, year — followed by the hash key?",
        () => {
          this.state = 'agent_input';
          this._setInput('_');
          this._setStatus('listening', 'Enter date of birth (DDMMYY), then #');
        }
      );
    } else if (this.agentStep === 'get_dob') {
      this.agentStep = 'complete';
      this._agentSpeak(
        "Perfect, I've been able to verify your account. I'm cancelling your card right now and I've placed an order for a replacement. " +
        "Your new card will be sent to your registered address and should arrive within 3 to 5 working days. " +
        "I'll also send a text confirmation to your registered mobile. " +
        "Is there anything else I can help you with today? Press 1 for yes, or press 2 to end the call.",
        () => { this.state = 'agent_confirm'; }
      );
    }
  }

  // ---- Speech helpers ----
  _agentSpeak(text, onEnd) {
    this._log('ivr', `[Amy] ${text}`);
    this._setStatus('speaking', 'Agent speaking...');
    audioEngine.speak(text, 'agent', () => {
      this._setStatus('active', 'Listening...');
      if (onEnd) onEnd();
    });
  }

  _speak(text, onEnd) {
    audioEngine.speak(text, '2000', onEnd);
  }

  _speakNode(node, onEnd) {
    this._setStatus('speaking', 'IVR speaking...');
    const text = node.prompt;
    this._log('ivr', text);
    this._speak(text, () => {
      this._setStatus('active', 'Press a key');
      if (onEnd) onEnd();
    });
  }

  // ---- UI helpers ----
  _setContent(text) {
    const el = document.getElementById('nokia-content');
    if (el) el.textContent = text;
  }
  _setInput(text) {
    const el = document.getElementById('nokia-input');
    if (el) el.textContent = text;
  }
  _wrap(text) {
    return text.length > 110 ? text.substring(0, 107) + '...' : text;
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
    const label = role === 'ivr' ? CONFIG.bank.name : role === 'user' ? 'You' : 'System';
    div.innerHTML = `<div class="conv-msg-label">${label}</div>${text}`;
    this.convPanel.appendChild(div);
    this.convPanel.scrollTop = this.convPanel.scrollHeight;
  }
  _time() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  _timeOfDay() {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }
}
