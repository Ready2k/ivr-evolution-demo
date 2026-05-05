// Audio Engine — DTMF tones, telephone noise, TTS with era voices

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.noiseNode = null;
    this.noiseGain = null;
    this.voices = [];
    this._voicesLoaded = false;
    this._loadVoices();
  }

  _ensureContext() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  _loadVoices() {
    const load = () => {
      this.voices = window.speechSynthesis.getVoices();
      this._voicesLoaded = true;
    };
    if (window.speechSynthesis.getVoices().length) { load(); return; }
    window.speechSynthesis.onvoiceschanged = load;
  }

  // ---- DTMF ----
  // Row frequencies: 697, 770, 852, 941 Hz
  // Column frequencies: 1209, 1336, 1477 Hz
  static DTMF = {
    '1':[697,1209],'2':[697,1336],'3':[697,1477],
    '4':[770,1209],'5':[770,1336],'6':[770,1477],
    '7':[852,1209],'8':[852,1336],'9':[852,1477],
    '*':[941,1209],'0':[941,1336],'#':[941,1477]
  };

  playDTMF(key, duration = 0.18, volume = 0.55) {
    this._ensureContext();
    const freqs = AudioEngine.DTMF[key];
    if (!freqs) return;
    const now = this.ctx.currentTime;
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.005);
      gain.gain.setValueAtTime(volume, now + duration - 0.01);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // ---- Telephone crackle ----
  startNoise(level = 0.04, crackle = 0.02) {
    if (level === 0 && crackle === 0) return;
    this._ensureContext();
    this.stopNoise();

    const bufferSize = 4096;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Telephone bandpass: 300–3400 Hz
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = level;

    this.noiseNode.connect(hp);
    hp.connect(lp);
    lp.connect(this.noiseGain);
    this.noiseGain.connect(this.ctx.destination);
    this.noiseNode.start();
  }

  stopNoise() {
    if (this.noiseNode) { try { this.noiseNode.stop(); } catch {} this.noiseNode = null; }
    if (this.noiseGain) { this.noiseGain.disconnect(); this.noiseGain = null; }
  }

  // ---- Ring tone ---- (two-tone UK ring pattern or futuristic)
  playRingTone(cycles = 3, type = 'standard') {
    this._ensureContext();
    return new Promise(resolve => {
      let c = 0;
      const playOne = () => {
        if (c >= cycles) { resolve(); return; }
        c++;
        const now = this.ctx.currentTime;
        
        if (type === 'futuristic') {
          // More ethereal, multi-tonal ring (harmonic series)
          [440, 660, 880, 1100].forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.frequency.value = freq;
            o.type = 'sine';
            const start = now + (i * 0.04);
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(0.08 / (i + 1), start + 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(start); o.stop(start + 1.2);
          });
          setTimeout(playOne, 2000);
        } else {
          // Standard UK ring
          [400, 450].forEach(freq => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.frequency.value = freq;
            o.type = 'sine';
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.2, now + 0.02);
            g.gain.setValueAtTime(0.2, now + 0.38);
            g.gain.linearRampToValueAtTime(0, now + 0.4);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(now); o.stop(now + 0.4);
          });
          setTimeout(playOne, 800);
        }
      };
      playOne();
    });
  }

  // ---- TTS ----
  _pickVoice(era) {
    // Always refresh — Google neural voices load async after system voices
    this.voices = window.speechSynthesis.getVoices();
    const en = this.voices.filter(v => v.lang.startsWith('en'));
    if (!en.length) return null;

    // Gemini (2027+): The absolute best Google neural voices (server-side in Chrome)
    if (era === 'gemini') {
      return en.find(v => /google uk english female/i.test(v.name)) ||
             en.find(v => /google us english female/i.test(v.name)) ||
             en.find(v => /google/i.test(v.name)) ||
             en.find(v => v.lang === 'en-GB' && /serena|samantha/i.test(v.name)) ||
             en[0];
    }

    // Human agent (2025): UK English female (distinct from the now-male customer)
    if (era === 'agent') {
      return en.find(v => /google uk english female/i.test(v.name)) ||
             en.find(v => v.lang === 'en-GB' && /serena|kate|victoria/i.test(v.name)) ||
             en.find(v => v.lang === 'en-GB') ||
             en[0];
    }
    // Customer (User): UK English male
    if (era === 'customer') {
      return en.find(v => /google uk english male/i.test(v.name)) ||
             en.find(v => v.lang === 'en-GB' && /daniel|oliver/i.test(v.name)) ||
             en.find(v => v.lang === 'en-GB') ||
             en[0];
    }
    // 2000s: prefer robotic Microsoft voice
    if (era === '2000') {
      return en.find(v => /david|zira|microsoft/i.test(v.name)) || en[0];
    }
    // 2010s: system TTS quality — avoid Google neural voices (worse than 2020s Polly-level)
    if (era === '2010') {
      return en.find(v => v.lang === 'en-GB' && !/google/i.test(v.name)) ||
             en.find(v => v.lang === 'en-US' && !/google/i.test(v.name)) ||
             en.find(v => !/google/i.test(v.name)) ||
             en[0];
    }
    // 2020s: Polly-equivalent quality — Samantha is the target level
    if (era === '2020') {
      return en.find(v => /samantha|ava|victoria/i.test(v.name)) ||
             en.find(v => v.lang === 'en-US' && !/google/i.test(v.name)) ||
             en.find(v => !/google/i.test(v.name)) ||
             en[0];
    }
    return en[0];
  }

  speak(text, era = '2000', onEnd) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    if (era === 'gemini') {
      utter.rate = 0.98; utter.pitch = 1.02; // Slightly slower, more thoughtful
    } else if (era === 'agent') {
      utter.rate = 1.0; utter.pitch = 1.1; // Bright, helpful female agent
    } else if (era === 'customer') {
      utter.rate = 1.02; utter.pitch = 0.95; // Distinct male customer voice
    } else {
      const cfg = CONFIG.eras[era]?.voice || {};
      utter.rate  = cfg.rate  ?? 0.9;
      utter.pitch = cfg.pitch ?? 1.0;
    }
    utter.volume = 0.9;
    const v = this._pickVoice(era);
    if (v) utter.voice = v;
    if (onEnd) utter.onend = onEnd;
    window.speechSynthesis.speak(utter);
    return utter;
  }

  stopSpeaking() {
    window.speechSynthesis.cancel();
  }

  // Synthesised 2000s-bank-style hold music (telephone filtered)
  playHoldMusic(durationMs = 4000) {
    this._ensureContext();
    return new Promise(resolve => {
      const master = this.ctx.createGain();
      master.gain.value = 0.18;

      // Telephone bandpass
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 300;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 3400;

      // Subtle compression
      const comp = this.ctx.createDynamicsCompressor();
      comp.ratio.value = 8; comp.threshold.value = -18;

      master.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(this.ctx.destination);

      // Simple ascending 4-note motif: C4 E4 G4 C5, then descend G4 E4
      const motif = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
      const noteLen = 0.28;
      const gap     = 0.06;
      const barLen  = motif.length * (noteLen + gap);

      let t = this.ctx.currentTime + 0.05;
      const endT = t + durationMs / 1000;

      while (t < endT) {
        motif.forEach((freq, i) => {
          const start = t + i * (noteLen + gap);
          if (start >= endT) return;
          const osc = this.ctx.createOscillator();
          const env = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          env.gain.setValueAtTime(0, start);
          env.gain.linearRampToValueAtTime(0.85, start + 0.015);
          env.gain.setValueAtTime(0.85, start + noteLen - 0.04);
          env.gain.linearRampToValueAtTime(0, start + noteLen);
          osc.connect(env); env.connect(master);
          osc.start(start); osc.stop(start + noteLen + 0.01);
        });
        t += barLen + 0.25; // pause between bars
      }

      setTimeout(resolve, durationMs);
    });
  }

  // Play a WAV/audio file via Web Audio API (no autoplay restrictions)
  playFile(url, onEnd, onError) {
    this._ensureContext();
    const ctx = this.ctx;
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => {
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        src.onended = onEnd || null;
        src.start();
      })
      .catch(onError || onEnd || (() => {}));
  }

  // Play audio file (for pre-recorded prompts), falls back to TTS
  playPrompt(promptObj, era, onEnd) {
    if (promptObj.audioFile) {
      this.playFile(promptObj.audioFile, onEnd, () => this.speak(promptObj.text, era, onEnd));
    } else {
      this.speak(promptObj.text, era, onEnd);
    }
  }
}

window.audioEngine = new AudioEngine();
