// Era 2030 — Proactive Agentic AI
// The bank calls YOU. Actions already taken. You just confirm.
// Grounded in: AWS AgentCore multi-agent (2025), proactive ambient banking (BofA Erica, JPM),
// always-on context awareness, sub-250ms voice + action latency.

class Era2030 {
  constructor() {
    this.cfg = CONFIG.eras['2030'];
    this.state = 'idle';
    this.ringtoneTimer = null;
    this.stepTimer = null;
    this.container = null;
    this.convPanel = null;

    // Actions the AI has already taken — animate as it speaks
    this.checklist = [
      { id: 'detect',  label: 'Fraudulent transaction flagged',        done: true,  showAt: 0 },
      { id: 'hold',    label: 'Card placed on temporary hold',          done: true,  showAt: 0 },
      { id: 'cancel',  label: 'Card permanently cancelled',             done: false, showAt: 1800 },
      { id: 'dispute', label: 'Dispute raised — £47.80 refund pending', done: false, showAt: 4200 },
      { id: 'replace', label: 'Replacement card dispatched — tomorrow', done: false, showAt: 6500 },
      { id: 'dd',      label: 'Direct debit protected via savings',     done: false, showAt: 9000 },
    ];
  }

  init(container, convPanel) {
    this.container = container;
    this.convPanel = convPanel;
    this._render();
    this._setStatus('idle', 'Incoming call — from National Bank AI');
  }

  destroy() {
    audioEngine.stopSpeaking();
    clearTimeout(this.ringtoneTimer);
    clearTimeout(this.stepTimer);
  }

  // ---- Rendering ----
  _render() {
    this.container.innerHTML = `
      <div class="phone phone-iphone16 phone-future">
        <div class="ip16-side-btn ip16-vol-up"></div>
        <div class="ip16-side-btn ip16-vol-down"></div>
        <div class="ip16-side-btn ip16-action"></div>
        <div class="ip16-side-btn ip16-power"></div>
        <div class="ip16-screen-frame">
          <div class="ip16-screen" id="f-screen">
            <div class="ip16-screen-bg future-bg"></div>

            <!-- Incoming call state -->
            <div class="future-incoming" id="f-incoming">

              <!-- Dynamic Island (evolved — slightly wider in 2027) -->
              <div class="f-dynamic-island">
                <div class="f-island-pill">
                  <div class="f-island-dot"></div>
                  <div class="f-island-dot" style="animation-delay:0.5s"></div>
                  <div class="f-island-dot" style="animation-delay:1s"></div>
                </div>
              </div>

              <!-- Transparent status bar -->
              <div class="f-status-bar">
                <span id="f-time">${this._time()}</span>
                <span class="f-status-icons">●●● WiFi 🔋</span>
              </div>

              <!-- Caller section -->
              <div class="f-caller-area">
                <div class="future-ring-wrap" id="f-ring-wrap">
                  <div class="future-ring-pulse"></div>
                  <div class="future-ring-pulse delay1"></div>
                  <div class="future-ring-pulse delay2"></div>
                  <div class="future-caller-icon">🏦</div>
                </div>
                <div class="f-incoming-tag">Incoming Call</div>
                <div class="future-caller-name">National Bank</div>
                <div class="future-caller-sub" id="f-caller-sub">AI Assistant calling...</div>
              </div>

              <!-- What the AI has already done — shown before the call is even answered -->
              <div class="f-ai-preview">
                <div class="f-ai-preview-title">AI has already handled</div>
                <div class="f-ai-preview-row"><span class="f-ai-check">✓</span>Suspicious transaction flagged</div>
                <div class="f-ai-preview-row"><span class="f-ai-check">✓</span>Card placed on temporary hold</div>
              </div>

              <!-- Answer / Decline with iOS-style labels -->
              <div class="future-answer-row" id="f-answer-row" style="display:none">
                <div class="f-call-action">
                  <button class="future-decline-btn" id="f-decline-btn">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="white" style="display:block;transform:rotate(135deg)"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  </button>
                  <span class="f-action-label">Decline</span>
                </div>
                <div class="f-call-action">
                  <button class="future-answer-btn" id="f-answer-btn">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="white" style="display:block"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  </button>
                  <span class="f-action-label">Accept</span>
                </div>
              </div>

            </div>

            <!-- Active call state -->
            <div class="future-active" id="f-active" style="display:none">
              <div class="future-call-bar">
                <span class="future-call-name">National Bank AI</span>
                <span class="future-call-timer" id="f-timer">00:00</span>
              </div>

              <!-- Autonomous actions checklist -->
              <div class="future-checklist" id="f-checklist">
                <div class="future-checklist-title">Already handled:</div>
                <div id="f-checklist-items"></div>
              </div>

              <!-- Conversation -->
              <div class="future-chat" id="f-chat"></div>

              <!-- Response buttons -->
              <div class="future-responses" id="f-responses"></div>

              <!-- End call -->
              <div class="future-end-row">
                <button class="ip16-ctrl-btn end" id="f-end-btn">🔴<span>End</span></button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    document.getElementById('f-answer-btn')?.addEventListener('click', () => this._answer());
    document.getElementById('f-decline-btn')?.addEventListener('click', () => this._decline());
    document.getElementById('f-end-btn')?.addEventListener('click', () => this._endCall());

    setInterval(() => {
      const el = document.getElementById('f-time');
      if (el) el.textContent = this._time();
    }, 15000);
  }

  start() {
    this.ringtoneTimer = setTimeout(() => this._startRinging(), 1200);
  }

  // ---- Flow ----
  _startRinging() {
    this.state = 'ringing';
    this._setStatus('speaking', 'Incoming call — National Bank AI');
    document.getElementById('f-caller-sub').textContent = 'AI Assistant — Incoming Call';
    document.getElementById('f-answer-row').style.display = 'flex';

    // Show the first two checklist items (already done before calling)
    this._tickItem('detect');
    this._tickItem('hold');

    const isAuto = document.body.classList.contains('theater-mode') || window.APP_STATE?.autoplay;
    audioEngine.playRingTone(isAuto ? 3 : 5, 'futuristic');
    this._log('system', '[ Incoming call from National Bank AI ]');

    // Auto-answer in autoplay mode
    if (isAuto) {
      this.autoAnswerTimer = setTimeout(() => this._answer(), 6500); // answer after ~3 rings
    }
  }

  _answer() {
    this.state = 'active';
    audioEngine.stopSpeaking();

    // Transition to active call view
    document.getElementById('f-incoming').style.display = 'none';
    document.getElementById('f-active').style.display  = 'flex';
    this._renderChecklist();
    this._startTimer();
    this._setStatus('speaking', 'AI Agent speaking...');

    this._log('system', '[ Call answered ]');
    
    // Use live high-quality TTS for the Gemini experience
    this._speak(
      "Hi there — good " + this._tod() + ". This is your National Bank AI assistant. I hope I'm not disturbing you. I'm calling because I spotted something unusual on your account about twenty minutes ago.",
      () => {
        this._speak(
          "Your debit card was used at a petrol station in Glasgow at two forty-three this afternoon for forty-seven pounds eighty. Based on your spending patterns and the fact that your phone has been in London all day, this really doesn't look like you. I've placed a temporary hold on the card while I check with you. Were you in Glasgow this afternoon?",
          () => {
            const isAuto = document.body.classList.contains('theater-mode') || window.APP_STATE?.autoplay;
            if (isAuto) {
              setTimeout(() => this._stepNotMe(), 2000);
            } else {
              this._showResponses([
                { label: "Yes, that was me",      action: () => this._stepItWasMe() },
                { label: "No, that wasn't me",    action: () => this._stepNotMe() },
              ]);
            }
          }
        );
      }
    );
    this._log('ivr', 'Possible fraudulent transaction detected — confirming with customer');
  }

  _decline() {
    audioEngine.stopSpeaking();
    this.state = 'idle';
    document.getElementById('f-answer-row').style.display = 'none';
    document.getElementById('f-caller-sub').textContent = 'Call declined — AI will try again later';
    this._setStatus('idle', 'Call declined');
    this._log('system', '[ Call declined — AI will retry via push notification ]');
  }

  _stepItWasMe() {
    this._clearResponses();
    this._log('user', "Yes, that was me");
    this._addBubble('user', "Yes, that was me");
    this._speak(
      `Not a problem at all — I'll remove the hold on your card now. ` +
      `If you'd like me to set up a travel notification so I don't flag future transactions in unusual locations, just say the word. ` +
      `Is there anything else I can help with?`,
      () => {
        this._tickItem('cancel');
        this._showResponses([
          { label: "Set up travel notifications", action: () => this._stepTravel() },
          { label: "No, that's everything",       action: () => this._stepDone() },
        ]);
      }
    );
  }

  _stepNotMe() {
    this._clearResponses();
    this._log('user', "No, that wasn't me");
    this._addBubble('user', "No, that wasn't me");

    // Use live high-quality TTS for the user as well
    audioEngine.speak("No, that wasn't me", 'customer', () => {
      // Then AI response
      this._speak(
        "That's what I suspected — thank you for confirming. Right, I've permanently cancelled that card now. I've also automatically raised a dispute for the forty-seven pounds eighty — you'll see a full refund credited within twenty-four hours.",
        () => {
          this._speak(
            "I've already placed the order for your replacement card — it'll arrive at your home address tomorrow by first class. One more thing I've taken care of: I noticed you have a direct debit for eight hundred and fifty pounds going out tomorrow morning. I've made sure that won't be affected — I've temporarily routed it through your savings account so you won't miss a payment. Is there anything else you'd like me to look into while I have you?",
            () => {
              const isAuto = document.body.classList.contains('theater-mode') || window.APP_STATE?.autoplay;
              if (isAuto) {
                setTimeout(() => this._stepCheckMore(), 2500);
              } else {
                this._showResponses([
                  { label: "That's brilliant, thank you",     action: () => this._stepDone() },
                  { label: "Has it been used anywhere else?", action: () => this._stepCheckMore() },
                  { label: "What about my Apple Pay?",        action: () => this._stepApplePay() },
                ]);
              }
            }
          );
        }
      );
    });

    // Tick checklist progressively as AI speaks
    setTimeout(() => this._tickItem('cancel'),  1800);
    setTimeout(() => this._tickItem('dispute'),  4200);
    setTimeout(() => this._tickItem('replace'),  6500);
    setTimeout(() => this._tickItem('dd'),       9000);
  }

  _stepCheckMore() {
    this._clearResponses();
    this._log('user', "Has it been used anywhere else?");
    this._addBubble('user', "Has it been used anywhere else?");
    this._speak(
      `Good question — I've already scanned your last 72 hours of transactions. ` +
      `The Glasgow transaction was the only anomalous one. All other activity matches your typical patterns. ` +
      `I'll keep monitoring and will alert you immediately if I see anything else. ` +
      `Is there anything else you'd like me to do?`,
      () => {
        const isAuto = document.body.classList.contains('theater-mode') || window.APP_STATE?.autoplay;
        if (isAuto) {
          setTimeout(() => this._stepDone(), 2500);
        } else {
          this._showResponses([
            { label: "That's everything, thanks", action: () => this._stepDone() },
            { label: "What about my Apple Pay?",  action: () => this._stepApplePay() },
          ]);
        }
      }
    );
    this._log('ivr', 'Multi-agent: Fraud scan agent queried 72h transaction history');
  }

  _stepApplePay() {
    this._clearResponses();
    this._log('user', "What about my Apple Pay?");
    this._addBubble('user', "What about my Apple Pay?");
    this._speak(
      `Already done — I suspended your Apple Pay and Google Pay links for the cancelled card at the same time I cancelled it. ` +
      `Your new card will automatically relink to both when it arrives and you tap to activate it. ` +
      `You won't need to do anything manually. Is there anything else?`,
      () => {
        this._showResponses([
          { label: "No, that's perfect", action: () => this._stepDone() },
        ]);
      }
    );
    this._log('ivr', 'Multi-agent: Digital wallet agent suspended Apple Pay / Google Pay automatically');
  }

  _stepTravel() {
    this._clearResponses();
    this._log('user', "Set up travel notifications");
    this._addBubble('user', "Yes please");
    this._speak(
      `Done — I've enabled travel mode on your account. ` +
      `From now on I'll check with you before flagging international transactions. ` +
      `You can manage this anytime in your app. Anything else?`,
      () => {
        this._tickItem('cancel');
        this._showResponses([
          { label: "No, that's everything", action: () => this._stepDone() },
        ]);
      }
    );
  }

  _stepDone() {
    this._clearResponses();
    this.state = 'done';
    
    this._log('user', "That's brilliant, thank you");
    this._addBubble('user', "That's brilliant, thank you");
    
    // Live high-quality TTS
    audioEngine.speak("That's brilliant, thank you", 'customer', () => {
      this._speak(
        "Perfect. I've sent a full summary of everything to your registered email, and you'll get a text shortly with your replacement card tracking link. Your account is secure. Sorry for the brief interruption — you have a lovely " + (this._tod() === 'morning' ? 'day' : 'evening') + ". Goodbye.",
        () => {
          this._stopTimer();
          this._setStatus('idle', 'Call complete — everything resolved');
        }
      );
    });
    this._log('system', 'All actions completed — call ended');
  }

  _endCall() {
    audioEngine.stopSpeaking();
    this._stopTimer();
    this.state = 'idle';
    this._setStatus('idle', 'Call ended');
    this._log('system', 'Call ended by user');
  }

  // ---- Checklist ----
  _renderChecklist() {
    const container = document.getElementById('f-checklist-items');
    if (!container) return;
    container.innerHTML = this.checklist.map(item => `
      <div class="future-check-item ${item.done ? 'done' : 'pending'}" id="fcheck-${item.id}">
        <span class="future-check-icon">${item.done ? '✓' : '○'}</span>
        <span class="future-check-label">${item.label}</span>
      </div>
    `).join('');
  }

  _tickItem(id) {
    const item = this.checklist.find(c => c.id === id);
    if (!item) return;
    item.done = true;
    const el = document.getElementById(`fcheck-${id}`);
    if (el) {
      el.className = 'future-check-item done ticking';
      el.querySelector('.future-check-icon').textContent = '✓';
      setTimeout(() => el.classList.remove('ticking'), 600);
    }
    this._log('system', `[ Agent: ${item.label} ]`);
  }

  // ---- Responses ----
  _showResponses(options) {
    const container = document.getElementById('f-responses');
    if (!container) return;
    container.innerHTML = options.map((opt, i) => `
      <button class="future-resp-btn" data-idx="${i}">${opt.label}</button>
    `).join('');
    container.querySelectorAll('.future-resp-btn').forEach((btn, i) => {
      btn.addEventListener('click', () => {
        this._clearResponses();
        options[i].action();
      });
    });
  }

  _clearResponses() {
    const container = document.getElementById('f-responses');
    if (container) container.innerHTML = '';
  }

  // ---- Timer ----
  _startTimer() {
    let secs = 0;
    this._timerInterval = setInterval(() => {
      secs++;
      const el = document.getElementById('f-timer');
      if (el) {
        const m = String(Math.floor(secs/60)).padStart(2,'0');
        const s = String(secs%60).padStart(2,'0');
        el.textContent = `${m}:${s}`;
      }
    }, 1000);
  }
  _stopTimer() { clearInterval(this._timerInterval); }

  // ---- Helpers ----
  _speak(text, onEnd) {
    this._streamBubble('ivr', text);
    audioEngine.speak(text, 'gemini', onEnd);
  }
  _speakFile(file, text, onEnd) {
    this._streamBubble('ivr', text);
    audioEngine.playFile(file, onEnd, () => {
      // Fallback to TTS if file fails
      audioEngine.speak(text, 'gemini', onEnd);
    });
  }
  _streamBubble(role, text) {
    const chat = document.getElementById('f-chat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = `future-bubble ${role}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    const words = text.split(' ');
    let i = 0;
    const tick = () => {
      if (i >= words.length) return;
      div.textContent += (i > 0 ? ' ' : '') + words[i++];
      chat.scrollTop = chat.scrollHeight;
      setTimeout(tick, 72);
    };
    tick();
  }
  _addBubble(role, text) {
    const chat = document.getElementById('f-chat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = `future-bubble ${role}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
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
    const label = role === 'ivr' ? 'National Bank AI' : role === 'user' ? 'You' : 'System';
    div.innerHTML = `<div class="conv-msg-label">${label}</div>${text}`;
    this.convPanel.appendChild(div);
    this.convPanel.scrollTop = this.convPanel.scrollHeight;
  }
  _time() { return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}); }
  _tod()  { const h = new Date().getHours(); return h<12?'morning':h<17?'afternoon':'evening'; }
}
