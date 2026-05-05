#!/bin/bash
# Generate pre-recorded audio for the "2027+ — Proactive Agentic AI" era.
# Uses macOS built-in 'say' + 'afconvert'.
#
# Reed (English UK) = Gemini Voice AI Agent (The very best)
# Flo (English UK)  = Customer (Keeping the user consistent with 'now' era)

set -e
cd "$(dirname "$0")"
mkdir -p audio/2030

AI_VOICE="Reed"
USER_VOICE="Flo"

# Check Reed is installed; fall back to Daniel
if ! say -v "$AI_VOICE" "" 2>/dev/null; then
  AI_VOICE="Daniel"
  echo "Note: Reed not found — using Daniel for AI voice"
fi

# Check Flo is installed; fall back to Daniel (or whatever is available)
if ! say -v "$USER_VOICE" "" 2>/dev/null; then
  USER_VOICE="Daniel"
  echo "Note: Flo not found — using Daniel for customer voice"
fi

speak() {
  local voice="$1" text="$2" outfile="$3"
  local aiff="${outfile%.wav}.aiff"
  echo "  → $outfile"
  # Using a slightly higher rate for the 'future' AI to sound more efficient
  say -v "$voice" "$text" -o "$aiff" --rate 185
  afconvert "$aiff" "$outfile" -d LEI16@22050 -f WAVE
  rm -f "$aiff"
}

echo "Generating 2027+ Gemini Proactive AI audio..."
echo "Voice: $AI_VOICE (Gemini AI) / $USER_VOICE (Customer)"
echo ""

# Get time of day for the greeting
TOD="day"
HOUR=$(date +%H)
if [ $HOUR -lt 12 ]; then TOD="morning"; elif [ $HOUR -lt 17 ]; then TOD="afternoon"; else TOD="evening"; fi

speak "$AI_VOICE" \
  "Hi there — good $TOD. This is your National Bank AI assistant. I hope I'm not disturbing you. I'm calling because I spotted something unusual on your account about twenty minutes ago." \
  "audio/2030/01-ai.wav"

speak "$AI_VOICE" \
  "Your debit card was used at a petrol station in Glasgow at two forty-three this afternoon for forty-seven pounds eighty. Based on your spending patterns and the fact that your phone has been in London all day, this really doesn't look like you. I've placed a temporary hold on the card while I check with you. Were you in Glasgow this afternoon?" \
  "audio/2030/02-ai.wav"

speak "$USER_VOICE" \
  "No, that wasn't me." \
  "audio/2030/03-user.wav"

speak "$AI_VOICE" \
  "That's what I suspected — thank you for confirming. Right, I've permanently cancelled that card now. I've also automatically raised a dispute for the forty-seven pounds eighty — you'll see a full refund credited within twenty-four hours." \
  "audio/2030/04-ai.wav"

speak "$AI_VOICE" \
  "I've already placed the order for your replacement card — it'll arrive at your home address tomorrow by first class. One more thing I've taken care of: I noticed you have a direct debit for eight hundred and fifty pounds going out tomorrow morning. I've made sure that won't be affected — I've temporarily routed it through your savings account so you won't miss a payment. Is there anything else you'd like me to look into while I have you?" \
  "audio/2030/05-ai.wav"

speak "$USER_VOICE" \
  "That's brilliant, thank you." \
  "audio/2030/06-user.wav"

speak "$AI_VOICE" \
  "Perfect. I've sent a full summary of everything to your registered email, and you'll get a text shortly with your replacement card tracking link. Your account is secure. Sorry for the brief interruption — you have a lovely day. Goodbye." \
  "audio/2030/07-ai.wav"

echo ""
echo "✅  7 clips written to audio/2030/"
ls -lh audio/2030/
