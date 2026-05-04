# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A fully client-side interactive demo tracing IVR (Interactive Voice Response) technology from 2000s DTMF menus to 2025 AI voice agents. Used for presentations/demos — no build step, no framework, no dependencies.

## Running

```bash
./start.sh            # Serves at http://localhost:8081, opens Chrome automatically
npm start             # Serves at http://localhost:8080 (via npx serve)
python3 -m http.server 8081   # Manual equivalent
```

**Must be served over HTTP** — microphone access and WebSocket require an HTTP origin, not `file://`. Use Chrome or Edge (Firefox/Safari lack the Web Speech API used by the 2010s/2020s eras).

## Architecture

Everything is vanilla JS — no build, no bundler, no modules. Scripts load sequentially via `<script>` tags in `index.html`.

**Load order matters:**
1. `config.js` — `CONFIG` global, all era content/configuration
2. `js/audio-engine.js` — `AudioEngine` class, `window.audioEngine` singleton
3. `js/era-2000.js` through `js/era-2030.js` — one class per era
4. `js/main.js` — app controller, era switching, settings

**Era pattern:** Each era is a self-contained class (`Era2000`, `Era2010`, `Era2020`, `EraNow`, `Era2030`) with `init(container, convPanel)` and `destroy()` methods. `main.js` instantiates and tears down these classes on era switch. All era configuration lives in `config.js` under `CONFIG.eras[eraId]`.

**Cache-busting:** `index.html` loads all CSS/JS with `?v=19` query strings. Increment this version number whenever you change a file that needs to bypass browser cache.

## Eras

| Era | Class | Mode | Notes |
|-----|-------|------|-------|
| 2000s | `Era2000` | Interactive | Functional DTMF keypad, navigates `CONFIG.eras['2000'].menuTree` |
| 2010s | `Era2010` | Demo script | Web Speech API for recognition; `demoMode: true` plays scripted steps instead |
| 2020s | `Era2020` | Demo script | Same pattern; pre-recorded `.wav` files in `audio/2020/` used when `demoMode: true` |
| 2025 (Now) | `EraNow` | Demo or live | `demoMode: true` plays `audio/now/` files; `false` connects via WebSocket to Nova Sonic backend |
| 2027+ | `Era2030` | Interactive | Scripted branching flow — proactive AI calls the user |

## Live AI (Now era)

`EraNow` can connect to a real Amazon Nova Sonic backend via WebSocket:
- Configure `CONFIG.backend.wsUrl` in `config.js` (default: `ws://localhost:8080`)
- Set `demoMode: false` in `CONFIG.eras['now']`
- AWS credentials can be passed via the settings panel (⚙) at runtime, or kept server-side

Audio pipeline: mic → PCM16 16kHz mono 4096-sample chunks → WebSocket binary frames → PCM16 playback queue at 24kHz.

## Audio Files

Pre-recorded `.wav` files for 2020s and Now eras — regenerate with macOS `say`:

```bash
./generate-audio-2020.sh   # 7 clips → audio/2020/ (Samantha voice)
./generate-audio-now.sh    # 9 clips → audio/now/ (Daniel AI, Serena/Kate customer)
```

2010s and 2020s eras fall back to browser `SpeechSynthesis` TTS when `audioFile: null` in the prompt config, or when `demoMode: false`.

## Key Configuration

`config.js` is the single source of truth for all demo content:
- `CONFIG.bank` — bank name, phone number, brand color
- `CONFIG.backend` — WebSocket URL, Nova Sonic brain mode, system prompt, voice ID
- `CONFIG.eras[eraId]` — per-era: title, subtitle, tech badges, tradeoff bar position, phone model, audio noise levels, TTS voice rates, menu trees, demo scripts, intent/slot definitions

To white-label for a different bank: change `CONFIG.bank.name` and the system prompt in `CONFIG.backend.systemPrompt`.

## Presentation Features

- **Theater mode** (🎬): Shows a full-screen hardware render splash (`phones/*.png`) on each era switch; auto-starts from 2000s
- **Arrow key navigation**: `←`/`→` to move between eras, `R` to reset current era
- **Settings panel** (⚙): Override WebSocket URL, AWS credentials, and bank name at runtime without editing files
