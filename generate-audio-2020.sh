#!/bin/bash
# Generate pre-recorded IVR audio for the "2020s — Conversational AI" era.
# Uses macOS 'say -v Samantha' (US English, Polly-equivalent quality).
# Customer lines use live browser speechSynthesis — no files needed for those.

set -e
cd "$(dirname "$0")"
mkdir -p audio/2020

IVR_VOICE="Samantha"

speak() {
  local text="$1" outfile="$2"
  local aiff="${outfile%.wav}.aiff"
  echo "  → $outfile"
  say -v "$IVR_VOICE" "$text" -o "$aiff"
  afconvert "$aiff" "$outfile" -d LEI16@22050 -f WAVE
  rm -f "$aiff"
}

echo "Generating 2020s IVR demo audio..."
echo "Voice: $IVR_VOICE (US English — Amazon Polly equivalent)"
echo ""

speak \
  "Hi, I'm your National Bank virtual assistant. I can help with lost or stolen cards, balance queries, and more. How can I help you today?" \
  "audio/2020/01-ivr.wav"

speak \
  "I've detected that you'd like to report a lost card. I can take care of that for you right away. Could you please tell me your account number, or the last four digits of your card?" \
  "audio/2020/02-ivr.wav"

speak \
  "Thank you. For security purposes, could you confirm your date of birth?" \
  "audio/2020/03-ivr.wav"

speak \
  "And the first line of your registered address?" \
  "audio/2020/04-ivr.wav"

speak \
  "Perfect. I've got all the details I need. I'm cancelling your card ending in four five two one now, and ordering a replacement which will arrive within 3 to 5 working days. You'll also receive a confirmation text shortly. Is there anything else I can help you with?" \
  "audio/2020/05-ivr.wav"

speak \
  "I understand your concern. Unfortunately, removing Apple Pay tokens isn't available through this automated service — that process requires a separate step in your Wallet app. Your physical card has been cancelled, but the digital token may still be active. I'd recommend removing it manually in your Wallet app, or I can transfer you to our digital banking team who can action this for you." \
  "audio/2020/06-ivr.wav"

speak \
  "Thanks for calling National Bank. Have a great day. Goodbye." \
  "audio/2020/07-ivr.wav"

echo ""
echo "✅  7 IVR clips written to audio/2020/"
ls -lh audio/2020/
