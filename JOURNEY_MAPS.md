# Customer Experience Journey Maps

All five eras follow the same scenario: a customer has left their debit card at the supermarket and needs to report it lost/compromised.

---

## 2000s — Touch Tone

**Interactive menu tree navigation**

1. **Root**: "Thank you for calling National Bank…" → Press `1` for English (Press `2` gives a Welsh apology, loops back)
2. **Main menu**: Press `1` accounts / `2` lost cards / `3` loans / `9` hold (22 min wait)
3. **Lost card** → `2`: "Lost and stolen card requests cannot be completed via automated service for security reasons" → placed on hold
4. **Accounts** → `1`: Balance unavailable / `2`: Transactions unavailable / `9`: back to main
5. **Hold**: "Current waiting time approximately 22 minutes" — loops indefinitely

**The failure moment**: there is no self-service resolution. Lost card = hold queue. Every path ends in waiting.

---

## 2010s — Early ASR

**Scripted demo (demoMode: true), 25% deliberate misrecognition rate**

| # | Speaker | Line |
|---|---------|------|
| 1 | AI | Welcome — say "lost card", "check my balance", or "speak to someone" |
| 2 | Customer | "I've lost my debit card." |
| 3 | AI | ❌ Mishear: "I heard 'cost card'. I'm sorry, I didn't understand." |
| 4 | Customer | "Lost. Card." (spoken slowly) |
| 5 | AI | "I think I heard you say 'lost card'. Yes or no?" |
| 6 | Customer | "Yes." |
| 7 | AI | "Can you please say the last four digits of your card?" |
| 8 | Customer | "Four, five, two, one." |
| 9 | AI | (2s verification pause) "Can you confirm the first line of your address?" |
| 10 | Customer | "42 Maple Street." |
| 11 | AI | ❌ Mishear: "I'm sorry, I didn't catch that. Repeat more slowly." |
| 12 | Customer | "Forty... two... Maple... Street." |
| 13 | AI | ❌ Mishear: "Still having difficulty. Say house number first, then street name only." |
| 14 | Customer | "Four. Two. Maple." |
| 15 | AI | (2.8s cancel pause) "I'm now cancelling your card. Replacement arrives 5–7 working days." |
| 16 | Customer | "No, that's all. Thank you." |
| 17 | AI | "Thank you for calling National Bank. Goodbye." |

**The failure moment**: simple conversational address "42 Maple Street" fails 3 times before structured decomposition works.

---

## 2020s — Conversational AI

**Scripted demo (demoMode: true), pre-recorded WAV files from `audio/2020/`**

| # | Speaker | Line | System event |
|---|---------|------|--------------|
| 1 | AI | "Hi, I'm your National Bank virtual assistant…" | `01-ai.wav` |
| 2 | Customer | "I've lost my debit card at the supermarket checkout." | Intent: `REPORT_LOST_CARD` — 94% confidence |
| 3 | AI | "I can take care of that right away. Last four digits of your card?" | `02-ai.wav` |
| 4 | Customer | "Four, five, two, one." | Slot filled: `accountNumber` |
| 5 | AI | "For security, could you confirm your date of birth?" | `03-ai.wav`, 2s pause |
| 6 | Customer | "14th March, nineteen eighty-nine." | Slot filled: `dateOfBirth` |
| 7 | AI | "And the first line of your registered address?" | `04-ai.wav` |
| 8 | Customer | "42 Maple Street." | Slot filled: `addressLine1` |
| 9 | AI | "I'm cancelling your card ending 4521 and ordering a replacement — 3–5 working days." | `05-ai.wav`, 2.8s pause |
| 10 | Customer | "My Apple Pay is linked — will that still work?" | Off-script question |
| 11 | AI | "Removing Apple Pay tokens isn't available through this service… I'd recommend removing it manually or I can transfer you." | `06-ai.wav`, limitation flag |
| 12 | Customer | "OK, I'll sort that myself. Thanks." | — |
| 13 | AI | "Thanks for calling National Bank. Goodbye." | `07-ai.wav` |

**The failure moment**: any question outside the defined intent/slot schema hits a wall. Apple Pay = structured failure, graceful deflect.

---

## 2025 — AI Voice Agent

**Scripted demo (demoMode: true), pre-recorded WAV files from `audio/now/`**

| # | Speaker | Line |
|---|---------|------|
| 1 | AI | "Hello, thanks for calling National Bank. How can I help you today?" |
| 2 | Customer | "I've just got home and realised I left my debit card at the supermarket. I'm really worried someone might use it." |
| 3 | AI | "Oh I completely understand — that's such a stressful thing to happen. Don't worry, I'm going to get this sorted for you right now. Can you confirm your date of birth?" |
| 4 | Customer | "Yes, it's the fourteenth of March, nineteen eighty-nine." |
| 5 | AI | "Perfect. And the first line of your address?" |
| 6 | Customer | "42 Maple Street." |
| 7 | AI | "Brilliant. I've confirmed your identity. I'm cancelling your card right now… done. You're fully protected. Replacement arriving 3–5 days. And you can still pay via the National Bank app or Apple Pay — they're both already linked." |
| 8 | Customer | "Oh, that's brilliant. What a relief. Thank you so much." |
| 9 | AI | "You're very welcome. You did the right thing calling straight away. Take care. Goodbye." |

**Key contrast vs 2020s**: empathy in turn 3, Apple Pay handled proactively in turn 7 (not as an afterthought), no structured slot elicitation, natural flow throughout.

---

## 2027+ — Proactive Agentic AI

**Interactive branching flow — the bank calls the customer**

Before the call is answered, the screen shows what the AI has already done:
- ✓ Fraudulent transaction flagged
- ✓ Card placed on temporary hold

**Call answered** → AI speaks:
> "I spotted something unusual — your card was used at a Glasgow petrol station at 2:43pm for £47.80. Your phone has been in London all day. Were you in Glasgow?"

### Branch A — "Yes, that was me"
AI removes the hold and offers to set up travel notifications → done.

### Branch B — "No, that wasn't me" *(autoplay default)*
AI permanently cancels card, raises £47.80 dispute, dispatches replacement (arriving tomorrow), reroutes tomorrow's £850 direct debit through savings account.

Checklist ticks in real time as the AI speaks:
- ○ → ✓ Card permanently cancelled (+1.8s)
- ○ → ✓ Dispute raised — £47.80 refund pending (+4.2s)
- ○ → ✓ Replacement card dispatched — tomorrow (+6.5s)
- ○ → ✓ Direct debit protected via savings (+9s)

Three response options presented:

| Response | AI reply |
|----------|----------|
| "That's brilliant, thank you" | Summary email + tracking text sent. Goodbye. |
| "Has it been used anywhere else?" | "Scanned your 72h history — Glasgow only. I'll keep monitoring." |
| "What about my Apple Pay?" | "Already suspended Apple Pay and Google Pay. They'll auto-relink when your new card arrives." |

**If call declined**: "AI will retry via push notification" — no journey ends here, the AI persists.

---

## The Arc

The same scenario across five eras:

| Era | Outcome | Self-service? | Time | Effort |
|-----|---------|--------------|------|--------|
| 2000s | 22-minute hold queue | No | 22+ min | High |
| 2010s | Card cancelled, 5–7 day replacement | Yes (barely) | ~5 min | High (3 mishear failures) |
| 2020s | Card cancelled, 3–5 day replacement. Apple Pay unresolved. | Partial | ~3 min | Medium |
| 2025 | Card cancelled, replacement ordered, Apple Pay confirmed safe, digital banking alternatives offered | Yes | ~2 min | Low |
| 2027+ | Everything already done before the customer knew. Call is just confirmation. | N/A — AI acted first | ~1 min | None |
