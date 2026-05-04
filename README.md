# IVR Evolution Demo

An interactive, browser-based presentation that traces the evolution of banking phone systems — from 2000s touch-tone menus to 2025 AI voice agents. Each era is a live, playable simulation with period-accurate audio and UI.

## Overview

The demo follows a single scenario across five eras: a customer who has left their debit card at a supermarket and needs to report it lost. The same problem, five radically different experiences.

| Era | Technology | Experience |
|-----|------------|------------|
| **2000s** | DTMF Touch Tone | Press numbers to navigate a menu tree |
| **2010s** | Early Speech Recognition | Say keywords — but it mishears you |
| **2020s** | Conversational AI (Amazon Lex) | Natural language with intent detection |
| **2025** | AI Voice Agent (Amazon Nova Sonic) | Fully conversational, empathetic, agentic |
| **2027+** | Proactive Agentic AI | The bank calls *you* — it's already fixed it |

---

## Quick Start

```bash
./start.sh
```

Opens Chrome at `http://localhost:8081`. That's it.

Alternatively:

```bash
npm start        # http://localhost:8080
# or
python3 -m http.server 8081
```

> **Important:** Open via `http://` not `file://`. Microphone access and WebSocket connections require an HTTP origin.

---

## Browser Requirements

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Full demo | ✅ | ✅ | ⚠️ | ⚠️ |
| 2000s & 2027+ eras | ✅ | ✅ | ✅ | ✅ |
| 2010s & 2020s (speech input) | ✅ | ✅ | ❌ | ❌ |

Firefox and Safari lack the Web Speech API. The 2010s and 2020s eras will not function in those browsers.

---

## Presenting the Demo

### Navigation

- **Click** the era buttons in the top navigation bar
- **Arrow keys** `←` / `→` to move between eras
- **`R`** to reset the current era

### Theater Mode

Click the 🎬 button to enter theater mode. On each era switch, a full-screen hardware render of the phone appears briefly before the interactive demo. Theater mode always resets to the 2000s era — ideal for live presentations.

### Settings Panel

Click ⚙ to configure at runtime:
- **Backend WebSocket URL** — for connecting to a live Nova Sonic backend
- **AWS credentials** — Access Key ID, Secret, and optional Session Token
- **Bank Name** — white-label the demo on the fly

---

## Era Guide

### 2000s — Touch Tone
A fully functional Nokia-style keypad connected to a real menu tree. Navigate with number presses. Try pressing `9` from the main menu to experience a 22-minute hold queue — the only escape route.

### 2010s — Early Speech Recognition
A BlackBerry-era system with keyword-spotting ASR. The demo runs a scripted conversation (with deliberate misrecognition) to illustrate the limitations. In live mode (`demoMode: false`), real browser speech recognition is used — try saying natural sentences to trigger failures.

### 2020s — Conversational AI
Simulates an Amazon Lex-style NLU system with intent classification and slot filling. The demo plays pre-recorded audio clips. Deliberate limitation: ask something off-topic mid-flow to watch it fail gracefully.

### 2025 — AI Voice Agent
**Demo mode** (default): plays pre-recorded AI + customer audio with a transcript. Showcases empathy, contextual understanding, and proactive information (Apple Pay status, digital banking alternatives).

**Live mode**: connects via WebSocket to an Amazon Nova Sonic backend for real full-duplex voice AI. Requires a running backend (see [Live AI Setup](#live-ai-setup)).

The "Go off-script" panel in demo mode lists example prompts that showcase agentic flexibility — things that would break every previous era.

### 2027+ — Proactive Agentic AI
The bank calls you. The AI has already detected a fraudulent transaction, temporarily blocked the card, and is calling to confirm. Answer the call and choose your responses. The "Already handled" checklist ticks off in real-time as the AI narrates what it has done.

---

## Live AI Setup

To use a real Nova Sonic backend for the 2025 era:

1. In `config.js`, set `demoMode: false` in `CONFIG.eras['now']`
2. Set `CONFIG.backend.wsUrl` to your backend WebSocket URL (default: `ws://localhost:8080`)
3. Either configure `CONFIG.backend` with credentials, or enter them via the ⚙ settings panel
4. Start a compatible Nova Sonic WebSocket backend (expects PCM16, 16kHz, 4096-sample chunks)

The backend receives raw PCM16 audio over binary WebSocket frames and sends back PCM16 audio + JSON transcript messages.

---

## Customisation

All demo content is in `config.js` — no other files need editing for content changes.

**White-labelling:**
```js
CONFIG.bank.name      = "Your Bank Name"
CONFIG.bank.shortName = "YourBank"
CONFIG.bank.phone     = "0800 000 000"
CONFIG.bank.color     = "#003087"
```

**System prompt** for the live AI era: `CONFIG.backend.systemPrompt`

**Per-era content**: titles, subtitles, tech badges, tradeoff bar position, hint text, and fail-mode descriptions are all in `CONFIG.eras[eraId]`.

---

## Regenerating Audio Files

The 2020s and 2025 demo audio is pre-recorded using macOS `say`. To regenerate (macOS only):

```bash
./generate-audio-2020.sh   # 7 IVR clips → audio/2020/
./generate-audio-now.sh    # 9 AI + customer clips → audio/now/
```

Requires macOS with the **Samantha** (2020s) and **Daniel** (2025 AI) voices installed. The 2025 customer voice uses **Serena** with a fallback to **Kate**.

---

## Project Structure

```
├── index.html              # Single-page app shell
├── config.js               # All era content, menu trees, scripts, AI config
├── css/
│   ├── main.css            # Layout, nav, panels
│   ├── phones.css          # Phone hardware renders (Nokia, BlackBerry, iPhone)
│   └── eras.css            # Era-specific colour themes and animations
├── js/
│   ├── audio-engine.js     # DTMF, noise, ring tone, TTS, hold music, PCM playback
│   ├── era-2000.js         # Touch-tone IVR with menu tree navigation
│   ├── era-2010.js         # Keyword ASR with misrecognition simulation
│   ├── era-2020.js         # Intent + slot filling demo
│   ├── era-now.js          # Nova Sonic WebSocket client + demo mode
│   ├── era-2030.js         # Proactive AI branching flow
│   └── main.js             # Era switching, settings, keyboard shortcuts
├── audio/
│   ├── 2020/               # Pre-recorded IVR prompts (WAV)
│   └── now/                # Pre-recorded AI agent + customer lines (WAV)
├── phones/                 # Phone hardware render images (PNG)
├── generate-audio-2020.sh  # Regenerate 2020s audio (macOS)
├── generate-audio-now.sh   # Regenerate Now era audio (macOS)
└── start.sh                # Launch script
```
