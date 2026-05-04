#!/bin/bash
# Generate pre-recorded audio for the "2025 — AI Voice Agent" era.
# Uses macOS built-in 'say' + 'afconvert' — no AWS credentials required.
# Outputs M4A (AAC) which plays in Chrome, Firefox and Safari.
#
# Daniel (UK English Male)           = National Bank AI Agent
# Serena (UK English Female Neural)  = Customer  [falls back to Kate]

set -e
cd "$(dirname "$0")"
mkdir -p audio/now

AI_VOICE="Daniel"
USER_VOICE="Serena"

# Check Serena is installed; fall back to Kate
if ! say -v Serena "" 2>/dev/null; then
  USER_VOICE="Kate"
  echo "Note: Serena not found — using Kate for customer voice"
fi

speak() {
  local voice="$1" text="$2" outfile="$3"
  local aiff="${outfile%.wav}.aiff"
  echo "  → $outfile"
  say -v "$voice" "$text" -o "$aiff"
  afconvert "$aiff" "$outfile" -d LEI16@22050 -f WAVE
  rm -f "$aiff"
}

echo "Generating National Bank AI Voice Agent demo audio..."
echo "Voice: $AI_VOICE (AI) / $USER_VOICE (Customer)"
echo ""

speak "$AI_VOICE" \
  "Hello, thanks for calling National Bank. I'm your AI assistant. I can see this is about your account — how can I help you today?" \
  "audio/now/01-ai.wav"

speak "$USER_VOICE" \
  "Hi, yes. I've just got home and realised I left my debit card at the supermarket checkout. I'm really worried someone might use it." \
  "audio/now/02-user.wav"

speak "$AI_VOICE" \
  "Oh I completely understand — that's such a stressful thing to happen. Don't worry, I'm going to get this sorted for you right now. I just need to quickly verify your identity. Can you confirm your date of birth for me?" \
  "audio/now/03-ai.wav"

speak "$USER_VOICE" \
  "Yes, it's the fourteenth of March, nineteen eighty-nine." \
  "audio/now/04-user.wav"

speak "$AI_VOICE" \
  "Perfect. And the first line of your address?" \
  "audio/now/05-ai.wav"

speak "$USER_VOICE" \
  "42 Maple Street." \
  "audio/now/06-user.wav"

speak "$AI_VOICE" \
  "Brilliant, thank you. I've confirmed your identity. I'm cancelling your card right now. [[slnc 1400]] Done. Your card is completely blocked and you're fully protected against any unauthorised transactions. I've also ordered you a replacement which will arrive within 3 to 5 working days. And while you're waiting, you can still make payments using the National Bank app or Apple Pay — they're both already linked to your account, so you won't be without access." \
  "audio/now/07-ai.wav"

speak "$USER_VOICE" \
  "Oh, that's brilliant. What a relief. Thank you so much." \
  "audio/now/08-user.wav"

speak "$AI_VOICE" \
  "You're very welcome. You absolutely did the right thing calling us straight away. Please don't hesitate to call if you need anything else. Take care. Goodbye." \
  "audio/now/09-ai.wav"

echo ""
echo "✅  9 clips written to audio/now/"
ls -lh audio/now/
