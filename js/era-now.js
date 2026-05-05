// Era Now — Amazon Nova Sonic (Full-Duplex AI)

class EraNow {
  constructor() {
    this.cfg = CONFIG.eras['now'];
    this.ws = null;
    this.audioCtx = null;
    this.micStream = null;
    this.processor = null;
    this.playbackQueue = [];
    this.isPlaying = false;
    this.isConnected = false;
    this.isMuted = false;
    this.callDuration = 0;
    this.callTimer = null;
    this.container = null;
    this.convPanel = null;
    this.waveAnimFrame = null;
    this.wavePhase = 0;
  }

  init(container, convPanel) {
    this.container = container;
    this.convPanel = convPanel;
    this._render();
    this._setStatus('idle', 'Tap Call to connect to AI agent');
    this._animateWave();
  }

  start() {
    this._connect();
  }

  destroy() {
    this._disconnect();
    cancelAnimationFrame(this.waveAnimFrame);
  }

  // ---- Render ----
  _render() {
    this.container.innerHTML = `
      <div class="phone phone-iphone16">
        <div class="ip16-side-btn ip16-vol-up"></div>
        <div class="ip16-side-btn ip16-vol-down"></div>
        <div class="ip16-side-btn ip16-action"></div>
        <div class="ip16-side-btn ip16-power"></div>
        <div class="ip16-screen-frame">
          <div class="ip16-screen" id="ip16-screen">
            <div class="ip16-screen-bg"></div>
            <div class="ip16-dynamic-island small" id="ip16-island">
              <canvas class="ip16-waveform-canvas" id="ip16-wave" width="60" height="20"></canvas>
            </div>
            <div class="ip16-status-bar">
              <span class="ip16-time" id="ip16-time">${this._time()}</span>
              <span class="ip16-icons">●●● WiFi 🔋</span>
            </div>
            <div class="ip16-call-info">
              <div class="ip16-call-title">${CONFIG.bank.name}</div>
              <div class="ip16-call-duration" id="ip16-duration" style="display:none">00:00</div>
            </div>
            <div class="ip16-chat-area" id="ip16-chat"></div>
            <div class="ip16-controls">
              <button class="ip16-ctrl-btn mute" id="ip16-mute-btn">
                🎙<span>Mute</span>
              </button>
              <button class="ip16-ctrl-btn call" id="ip16-call-btn">
                📞<span>Call</span>
              </button>
              <button class="ip16-ctrl-btn speaker" id="ip16-speaker-btn">
                🔊<span>Speaker</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('ip16-call-btn').onclick = () => this._toggleCall();
    document.getElementById('ip16-mute-btn').onclick = () => this._toggleMute();
    document.getElementById('ip16-speaker-btn').onclick = () => { };
    setInterval(() => {
      const el = document.getElementById('ip16-time');
      if (el) el.textContent = this._time();
    }, 10000);
  }

  // ---- Call ----
  _toggleCall() {
    if (this.isConnected) {
      this._disconnect();
    } else {
      this._connect();
    }
  }

  async _connect() {
    // Demo mode: play pre-recorded script without a live WebSocket connection
    const isAuto = this.cfg.demoMode || window.APP_STATE?.autoplay;
    if (isAuto) {
      this._startDemo();
      return;
    }

    const appCfg = window.APP_CONFIG || {};
    const wsUrl = appCfg.wsUrl || CONFIG.backend.wsUrl;

    // Soft credential warning — show once but still attempt the call
    const hasClientCreds = !!(appCfg.awsKey && appCfg.awsSecret);
    const isLocalhost = wsUrl.includes('localhost') || wsUrl.includes('127.0.0.1');
    if (isLocalhost && !hasClientCreds && !this._credWarningShown) {
      this._credWarningShown = true;
      this._addBubble('ivr',
        '⚠️ No AWS credentials entered. If the backend is running with server-side credentials this will work fine. ' +
        'Otherwise open ⚙ Settings to enter your AWS key and secret.'
      );
    }

    this._setCallBtn('end', '🔴', 'End');
    this._setStatus('speaking', 'Connecting...');
    this._expandIsland('🔴', CONFIG.bank.name, 'Connecting...');

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this._sendSessionConfig();
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this._queueAudio(event.data);
        } else {
          this._handleMessage(JSON.parse(event.data));
        }
      };

      this.ws.onerror = () => {
        this._addBubble('error', 'Connection failed. Is the backend running at ' + wsUrl + '?');
        this._log('error', 'WebSocket connection failed');
        this._disconnect();
      };

      this.ws.onclose = () => {
        if (this.isConnected) this._disconnect();
      };

    } catch (e) {
      this._addBubble('error', 'Failed to connect: ' + e.message);
      this._disconnect();
    }
  }

  // ---- Demo mode (Google neural TTS, no WebSocket needed) ----
  _startDemo() {
    this._setCallBtn('end', '🔴', 'End');
    this._setStatus('speaking', 'Connecting...');
    this._expandIsland('🔴', CONFIG.bank.name, 'Connecting...');
    setTimeout(() => {
      if (!this.isConnected) {
        this.isConnected = true;
        this._startCallTimer();
        this._setStatus('active', 'Connected — AI is listening');
        this._expandIsland('🔴', CONFIG.bank.name, 'Active call');
        this._log('system', 'Demo mode');
        this._playDemoStep(0);
      }
    }, 1200);
  }

  _playDemoStep(idx) {
    if (!this.isConnected) return;
    const script = this.cfg.demoScript || [];
    if (idx >= script.length) {
      setTimeout(() => this._disconnect(), 1500);
      return;
    }
    const line = script[idx];
    const isAI = line.role === 'ai';

    if (isAI) {
      this._setStatus('speaking', 'AI speaking...');
      this._expandIsland('🔴', CONFIG.bank.name, 'Speaking...');
      this._addBubble('ivr', line.text);
      this._log('ivr', line.text);
    } else {
      this._setStatus('listening', 'Listening...');
      this._expandIsland('🔴', CONFIG.bank.name, 'Listening...');
      this._addBubble('user', line.text);
      this._log('user', line.text);
    }

    const baseDelay = line.pauseAfter != null ? line.pauseAfter : (isAI ? 600 : 300);
    const next = () => setTimeout(() => this._playDemoStep(idx + 1), baseDelay);

    if (isAI) {
      audioEngine.speak(line.text, 'agent', next);
    } else {
      audioEngine.speak(line.text, 'customer', next);
    }
  }

  _sendSessionConfig() {
    const appCfg = window.APP_CONFIG || {};
    const config = {
      brainMode: CONFIG.backend.brainMode,
      voiceId: CONFIG.backend.voiceId,
      systemPrompt: CONFIG.backend.systemPrompt,
      enableGuardrails: CONFIG.backend.enableGuardrails,
      selectedTools: [],
      linkedWorkflows: [],
      inactivityEnabled: true,
      inactivityTimeout: 45,
      inactivityMaxChecks: 2
    };

    // Inject credentials if provided via settings
    if (appCfg.awsKey) config.awsAccessKeyId = appCfg.awsKey;
    if (appCfg.awsSecret) config.awsSecretAccessKey = appCfg.awsSecret;
    if (appCfg.awsToken) config.awsSessionToken = appCfg.awsToken;

    this.ws.send(JSON.stringify({ type: 'sessionConfig', config }));
  }

  async _startMic() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = this.audioCtx.createMediaStreamSource(this.micStream);

      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.isMuted) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32767));
        }
        // Ensure even byte length
        const buf = pcm16.buffer;
        const toSend = buf.byteLength % 2 === 0 ? buf : buf.slice(0, buf.byteLength - 1);
        this.ws.send(toSend);
      };

      source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);

    } catch (e) {
      this._addBubble('error', 'Microphone access denied. Please allow microphone access and try again.');
      this._log('error', 'Microphone access denied');
      this._disconnect();
    }
  }

  _handleMessage(msg) {
    switch (msg.type) {
      case 'connected':
        this.isConnected = true;
        this._startCallTimer();
        this._startMic();
        this._setStatus('active', 'Connected — AI is listening');
        this._expandIsland('🔴', CONFIG.bank.name, 'Active call');
        break;

      case 'transcript':
        if (msg.text && msg.text.trim()) {
          if (msg.role === 'assistant') {
            this._addBubble('ivr', msg.text);
            if (msg.isFinal) this._log('ivr', msg.text);
          } else if (msg.role === 'user' && msg.isFinal) {
            this._addBubble('user', msg.text);
            this._log('user', msg.text);
          }
        }
        break;

      case 'ttsOutput':
        if (msg.text) {
          this._setStatus('speaking', 'AI speaking...');
          this._expandIsland('🔴', CONFIG.bank.name, 'Speaking...');
        }
        break;

      case 'status':
        if (msg.message) this._setStatus('active', msg.message);
        break;

      case 'error':
        this._addBubble('error', msg.message || 'An error occurred');
        this._log('error', msg.message || 'Error');
        break;
    }
  }

  // ---- PCM16 playback queue ----
  _queueAudio(arrayBuffer) {
    this._setStatus('speaking', 'AI speaking...');
    this.playbackQueue.push(arrayBuffer);
    if (!this.isPlaying) this._drainQueue();
  }

  async _drainQueue() {
    if (this.playbackQueue.length === 0) {
      this.isPlaying = false;
      this._setStatus('listening', 'Listening...');
      this._expandIsland('🔴', CONFIG.bank.name, 'Listening...');
      return;
    }
    this.isPlaying = true;
    const buf = this.playbackQueue.shift();

    try {
      const playCtx = this.audioCtx || new AudioContext();
      const pcm16 = new Int16Array(buf);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;

      const audioBuf = playCtx.createBuffer(1, float32.length, 24000);
      audioBuf.getChannelData(0).set(float32);

      const src = playCtx.createBufferSource();
      src.buffer = audioBuf;
      src.connect(playCtx.destination);
      src.onended = () => this._drainQueue();
      src.start();
    } catch (e) {
      this._drainQueue();
    }
  }

  _disconnect() {
    this.isConnected = false;
    this._stopCallTimer();

    if (this.processor) { try { this.processor.disconnect(); } catch { } this.processor = null; }
    if (this.micStream) { this.micStream.getTracks().forEach(t => t.stop()); this.micStream = null; }
    if (this.audioCtx) { try { this.audioCtx.close(); } catch { } this.audioCtx = null; }
    if (this.ws) { try { this.ws.close(); } catch { } this.ws = null; }

    this.playbackQueue = [];
    this.isPlaying = false;

    this._setCallBtn('call', '📞', 'Call');
    this._setStatus('idle', 'Tap Call to connect to AI agent');
    this._shrinkIsland();
    document.getElementById('ip16-duration').style.display = 'none';
    this._log('system', 'Call ended');
  }

  _toggleMute() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('ip16-mute-btn');
    if (btn) {
      btn.style.background = this.isMuted
        ? 'rgba(255,59,48,0.4)'
        : 'rgba(255,255,255,0.15)';
      btn.querySelector('span').textContent = this.isMuted ? 'Unmute' : 'Mute';
    }
  }

  // ---- Timer ----
  _startCallTimer() {
    this.callDuration = 0;
    const dur = document.getElementById('ip16-duration');
    if (dur) dur.style.display = 'block';
    this.callTimer = setInterval(() => {
      this.callDuration++;
      const m = String(Math.floor(this.callDuration / 60)).padStart(2, '0');
      const s = String(this.callDuration % 60).padStart(2, '0');
      const el = document.getElementById('ip16-duration');
      if (el) el.textContent = `${m}:${s}`;
    }, 1000);
  }
  _stopCallTimer() {
    clearInterval(this.callTimer);
    this.callTimer = null;
  }

  // ---- Dynamic Island ----
  _expandIsland(icon, title, sub) {
    const el = document.getElementById('ip16-island');
    if (!el) return;
    el.className = 'ip16-dynamic-island expanded';
    el.innerHTML = `
      <div class="ip16-island-content">
        <span class="ip16-island-icon">${icon}</span>
        <div class="ip16-island-text">
          <div class="ip16-island-title">${title}</div>
          <div class="ip16-island-sub">${sub}</div>
        </div>
        <canvas class="ip16-island-wave" id="ip16-wave" width="40" height="20"></canvas>
      </div>
    `;
  }
  _shrinkIsland() {
    const el = document.getElementById('ip16-island');
    if (!el) return;
    el.className = 'ip16-dynamic-island small';
    el.innerHTML = `<canvas class="ip16-waveform-canvas" id="ip16-wave" width="60" height="20"></canvas>`;
  }

  // ---- Waveform animation ----
  _animateWave() {
    const draw = () => {
      this.waveAnimFrame = requestAnimationFrame(draw);
      const canvas = document.getElementById('ip16-wave');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      this.wavePhase += 0.08;
      const amp = this.isConnected ? 5 : 0;
      if (amp === 0) return; // Empty pill if not connected

      ctx.beginPath();
      ctx.strokeStyle = '#34C759';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x++) {
        const y = h / 2 + Math.sin(x * 0.3 + this.wavePhase) * amp
          + Math.sin(x * 0.15 + this.wavePhase * 0.7) * amp * 0.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    draw();
  }

  // ---- UI helpers ----
  _setCallBtn(type, icon, label) {
    const btn = document.getElementById('ip16-call-btn');
    if (!btn) return;
    btn.className = `ip16-ctrl-btn ${type === 'end' ? 'end' : 'call'}`;
    btn.innerHTML = `${icon}<span>${label}</span>`;
  }
  _addBubble(role, text) {
    const chat = document.getElementById('ip16-chat');
    if (!chat) return;
    const div = document.createElement('div');
    div.className = `ip16-bubble ${role === 'error' ? 'ivr' : role}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
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
    const label = role === 'ivr' ? CONFIG.bank.name + ' AI Agent' : role === 'user' ? 'You' : 'System';
    div.innerHTML = `<div class="conv-msg-label">${label}</div>${text}`;
    this.convPanel.appendChild(div);
    this.convPanel.scrollTop = this.convPanel.scrollHeight;
  }
  _time() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
