// IVR Evolution Demo — Configuration
// Edit this file to customise all aspects of the demo.

const CONFIG = {

  bank: {
    name: "National Bank",
    shortName: "NatBank",
    phone: "0800 123 456",
    color: "#1B3A6B"
  },

  // Nova Sonic backend (used for the "Now" era)
  // Voice name overrides — null = auto-select heuristic, set to exact voice.name to pin
  voices: {
    customer: null,
    '2000':   null,
    '2010':   null,
    '2020':   null,
    'agent':  null,
    'gemini': null
  },

  backend: {
    wsUrl: "ws://localhost:8080",
    brainMode: "raw_nova",
    voiceId: "tiffany",
    enableGuardrails: false,
    systemPrompt: `You are a caring, empathetic customer service agent for National Bank.
A customer has just called in a panic — they've left their debit card at the supermarket and are now at home, worried.
Your job is to:
1. Immediately acknowledge their worry and reassure them calmly
2. Verify their identity (ask for date of birth and first line of their address)
3. Cancel their lost card
4. Order a replacement card (arrives 3–5 working days)
5. Let them know they can use digital banking in the meantime
Be warm, human, and conversational. Do not use a script. Respond naturally to what they say.
If they sound distressed, acknowledge it. This is a real person in a stressful moment.`
  },

  eras: {

    "2000": {
      id: "2000",
      title: "2000s — Touch Tone Era",
      subtitle: "Navigate by pressing numbers. No voice. No context. Just menus.",
      techBadges: ["DTMF Keypad", "PSTN", "IVR Menu Tree", "Pre-recorded Prompts"],
      challenge: "Navigate the touch-tone menu tree to report your lost card. No shortcuts, no voice — just patience.",
      hint: "Press 2 to reach the lost card section, then follow the prompts.",
      phone: "nokia",
      techDetail: "DTMF tone signalling over PSTN · Pre-recorded prompts · No speech recognition whatsoever",
      tradeoff: {
        position: 5,
        caption: "On the Rails — every path defined in advance, change requires rebuilding the track"
      },
      controlLayer: {
        icon: "📋",
        name: "Menu Tree Config",
        desc: "The track IS the config file. A new journey = a rebuild."
      },
      failMode: "Press 9 from the main menu — experience a 22-minute hold queue. That's the only alternative.",
      audio: { noiseLevel: 0, crackleLevel: 0 },
      voice: { rate: 0.82, pitch: 0.72 },

      menuTree: {
        root: {
          prompt: "Thank you for calling National Bank. This call may be recorded for training and quality purposes. For English, press 1. For Welsh, press 2.",
          options: { "1": "main", "2": "welsh" }, fallback: "root"
        },
        welsh: {
          prompt: "We're sorry, Welsh language services are temporarily unavailable. Returning you to the main menu.",
          next: "main"
        },
        main: {
          prompt: "Main menu. For account services and balance, press 1. For lost or stolen cards, press 2. For loans and overdrafts, press 3. To speak with an advisor, press 9.",
          options: { "1": "accounts", "2": "lost_menu", "3": "loans", "9": "hold" }, fallback: "main"
        },
        accounts: {
          prompt: "Account services. For your balance, press 1. For recent transactions, press 2. To return to the main menu, press 9.",
          options: { "1": "balance_unavail", "2": "trans_unavail", "9": "main" }, fallback: "accounts"
        },
        balance_unavail: {
          prompt: "We're sorry, balance information is not available on this service at this time. Please visit our website or call during business hours. Press 9 to return.",
          options: { "9": "accounts" }, fallback: "accounts"
        },
        trans_unavail: {
          prompt: "Transaction history is not available on the automated service. Press 9 to return.",
          options: { "9": "accounts" }, fallback: "accounts"
        },
        lost_menu: {
          prompt: "I'm sorry, lost and stolen card requests cannot be completed via our automated service for security reasons. Please hold while we connect you to one of our advisors.",
          next: "agent_connect"
        },
        agent_connect: {
          prompt: "Please continue to hold. Your call is very important to us.",
          agent: true
        },
        stolen: {
          prompt: "Your card has been blocked immediately. Please hold while we connect you to our fraud team.",
          next: "hold"
        },
        fraud: {
          prompt: "Connecting you to our fraud team now. Please hold.",
          next: "hold"
        },
        loans: {
          prompt: "For loan and overdraft enquiries, please hold and an advisor will assist you. Press 9 to return to the main menu.",
          options: { "9": "main" }, fallback: "hold"
        },
        hold: {
          prompt: "Your call is important to us. Please hold and an advisor will be with you shortly. Current waiting time is approximately 22 minutes.",
          loop: true
        },
        goodbye: {
          prompt: "Thank you for calling National Bank. Goodbye.",
          end: true
        }
      }
    },

    "2010": {
      id: "2010",
      title: "2010s — Early Speech Recognition",
      subtitle: "Say what you want... if the system can understand you.",
      techBadges: ["Basic ASR", "Keyword Spotting", "VXML 2.0", "~50 Word Vocabulary"],
      challenge: "Tell the system you've lost your card. Prepare to repeat yourself — early ASR wasn't great.",
      hint: "Say 'lost card' clearly. The system only understands specific keywords.",
      phone: "blackberry",
      techDetail: "VXML 2.0 · Keyword grammar-based ASR · Nuance speech engine · Pre-recorded prompt audio",
      tradeoff: {
        position: 22,
        caption: "First Steering — ~50 permitted words. Anything outside the vocabulary fails."
      },
      controlLayer: {
        icon: "📝",
        name: "Keyword Grammar File",
        desc: "A whitelist of ~50 words. Everything else is treated as noise."
      },
      failMode: "Say the full sentence naturally: \"I've left my card at the supermarket and I'm at home now\" — watch it fail to recognise a perfectly clear sentence.",
      audio: { noiseLevel: 0, crackleLevel: 0 },
      voice: { rate: 0.9, pitch: 0.88 },

      misrecognitionChance: 0.25,
      misrecognitionPhrases: ["press one", "last guard", "cost card", "lost car", "most hard", "ghost card", "lost hard"],

      keywords: {
        LOST_CARD: ["lost", "card", "left", "missing", "forgot", "misplaced", "can't find", "cannot find", "debit", "supermarket"],
        BALANCE: ["balance", "money", "funds", "how much", "account", "statement"],
        AGENT: ["agent", "person", "human", "speak", "someone", "advisor", "help"],
        YES: ["yes", "yeah", "yep", "correct", "that's right", "affirmative"],
        NO: ["no", "nope", "wrong", "incorrect", "that's wrong"],
        REPEAT: ["repeat", "pardon", "again", "what", "sorry", "can you"]
      },

      demoMode: true,
      demoScript: [
        {
          role: "ai",
          text: "Welcome to National Bank. You can say things like... 'lost card'... 'check my balance'... or 'speak to someone'. What can I help you with today?"
        },
        {
          role: "user",
          text: "I've lost my debit card."
        },
        {
          role: "ai",
          text: "I heard 'cost card'. I'm sorry, I didn't understand. Please say 'lost card' to report a lost card, or 'balance' to check your account.",
          mishear: true
        },
        {
          role: "user",
          text: "Lost. Card."
        },
        {
          role: "ai",
          text: "I think I heard you say 'lost card'. Is that correct? Please say yes or no."
        },
        {
          role: "user",
          text: "Yes."
        },
        {
          role: "ai",
          text: "OK. I can help you with that. Can you please say the last four digits of your card?"
        },
        {
          role: "user",
          text: "Four, five, two, one."
        },
        {
          role: "ai",
          text: "Thank you. I've located your account. Can you please confirm the first line of your registered address?",
          pauseBefore: { ms: 2000, status: "Verifying account details…" }
        },
        {
          role: "user",
          text: "42 Maple Street."
        },
        {
          role: "ai",
          text: "I'm sorry, I didn't catch that. Could you please repeat your address again, more slowly and clearly?",
          mishear: true,
          pauseBefore: { ms: 900, status: "Matching address…" }
        },
        {
          role: "user",
          text: "Forty... two... Maple... Street."
        },
        {
          role: "ai",
          text: "I'm still having difficulty recognising your address. Please say each part separately. Say the house number first, then the street name only.",
          mishear: true,
          pauseBefore: { ms: 900, status: "Matching address…" }
        },
        {
          role: "user",
          text: "Four. Two. Maple."
        },
        {
          role: "ai",
          text: "Thank you. I'm now cancelling your card and ordering a replacement. Your new card will arrive within five to seven working days. Is there anything else I can help you with today?",
          pauseBefore: { ms: 2800, status: "Cancelling card and ordering replacement…" }
        },
        {
          role: "user",
          text: "No, that's all. Thank you."
        },
        {
          role: "ai",
          text: "Thank you for calling National Bank. Goodbye."
        }
      ],

      // Set audioFile to a path (e.g. "./audio/2010/welcome.mp3") to use pre-recorded audio.
      // If null, falls back to Text-to-Speech.
      prompts: {
        welcome: { text: "Welcome to National Bank. You can say things like... 'lost card'... 'check my balance'... or 'speak to someone'. What can I help you with today?", audioFile: null },
        lostCardQuery: { text: "I think I heard you say 'lost card'. Is that correct? Please say yes or no.", audioFile: null },
        lostCardStart: { text: "OK. I can help you with that. Can you please say your eight digit account number?", audioFile: null },
        accountGot: { text: "Thank you. I've located your account. Can you please confirm the first line of your registered address?", audioFile: null },
        addressGot: { text: "Thank you. I'm now cancelling your card and ordering a replacement. Your new card will arrive within five to seven working days. Is there anything else I can help you with today?", audioFile: null },
        didntCatch: { text: "I'm sorry, I didn't quite catch that. Could you please repeat that more clearly?", audioFile: null },
        misheard: { text: "I heard '{HEARD}'. I'm sorry, I didn't understand. Please say 'lost card' to report a lost card, or 'balance' to check your account.", audioFile: null },
        tooManyAttempts: { text: "I'm having trouble understanding you. Let me connect you with an advisor. Please hold.", audioFile: null },
        done: { text: "Is there anything else I can help you with today?", audioFile: null },
        goodbye: { text: "Thank you for calling National Bank. Goodbye.", audioFile: null }
      }
    },

    "2020": {
      id: "2020",
      demoMode: true,   // set false to re-enable live speech recognition
      demoScript: [
        {
          role: "ai",
          file: "./audio/2020/01-ivr.wav",
          text: "Hi, I'm your National Bank virtual assistant. I can help with lost or stolen cards, balance queries, and more. How can I help you today?"
        },
        {
          role: "user",
          text: "Hi yes, I've lost my debit card. I left it at the supermarket checkout.",
          showIntent: { intent: "REPORT_LOST_CARD", confidence: 94 }
        },
        {
          role: "ai",
          file: "./audio/2020/02-ivr.wav",
          text: "I've detected that you'd like to report a lost card. I can take care of that for you right away. Could you please tell me your account number, or the last four digits of your card?"
        },
        {
          role: "user",
          text: "It's four, five, two, one.",
          fillSlot: "accountNumber"
        },
        {
          role: "ai",
          file: "./audio/2020/03-ivr.wav",
          text: "Thank you. For security purposes, could you confirm your date of birth?",
          pauseBefore: { ms: 2000, status: "Verifying account details…" }
        },
        {
          role: "user",
          text: "14th March, nineteen eighty-nine.",
          fillSlot: "dateOfBirth"
        },
        {
          role: "ai",
          file: "./audio/2020/04-ivr.wav",
          text: "And the first line of your registered address?"
        },
        {
          role: "user",
          text: "42 Maple Street.",
          fillSlot: "addressLine1"
        },
        {
          role: "ai",
          file: "./audio/2020/05-ivr.wav",
          text: "Perfect. I've got all the details I need. I'm cancelling your card ending in 4521 now and ordering a replacement, which will arrive within 3 to 5 working days. Is there anything else I can help you with?",
          pauseBefore: { ms: 2800, status: "Cancelling card and ordering replacement…" }
        },
        {
          role: "user",
          text: "My Apple Pay is linked to this card — will that still work?"
        },
        {
          role: "ai",
          file: "./audio/2020/06-ivr.wav",
          text: "I understand your concern. Unfortunately, removing Apple Pay tokens isn't available through this automated service — that process requires a separate step in your Wallet app. Your physical card has been cancelled, but the digital token may still be active. I'd recommend removing it manually, or I can transfer you to our digital banking team.",
          limitation: true
        },
        {
          role: "user",
          text: "OK, I'll sort that myself. Thanks."
        },
        {
          role: "ai",
          file: "./audio/2020/07-ivr.wav",
          text: "Thanks for calling National Bank. Have a great day. Goodbye."
        }
      ],
      title: "2020s — Conversational AI",
      subtitle: "Intent detection, slot filling, structured dialogue. Getting closer.",
      techBadges: ["Amazon Lex", "Intent Classification", "Slot Filling", "NLU", "AWS Lambda"],
      challenge: "Have a conversation — the AI understands intent but still follows a rigid script.",
      hint: "Just say you've lost your card. The system will detect the intent and ask for details.",
      phone: "iphone7",
      techDetail: "Amazon Lex V2 · Apache TVM NLU engine · Slot elicitation · Lambda fulfilment hooks",
      tradeoff: {
        position: 58,
        caption: "Bounded Intelligence — environment defined by us, decisions delegated within it"
      },
      controlLayer: {
        icon: "🗂️",
        name: "Intent + Slot Schema",
        desc: "We define the intents and required slots. The AI fills them — it cannot improvise beyond."
      },
      failMode: "Once intent is detected, ask something completely off-topic — the system can't handle it gracefully.",
      audio: { noiseLevel: 0, crackleLevel: 0 },
      voice: { rate: 1.05, pitch: 1.0 },

      intents: {
        REPORT_LOST_CARD: {
          phrases: ["lost", "left", "missing", "can't find", "cannot find", "forgot", "misplaced", "card", "debit"],
          threshold: 2
        },
        CHECK_BALANCE: {
          phrases: ["balance", "how much", "money", "funds", "account"],
          threshold: 1
        },
        SPEAK_TO_AGENT: {
          phrases: ["agent", "human", "person", "speak to", "someone", "advisor"],
          threshold: 1
        }
      },

      slots: [
        {
          key: "accountNumber",
          label: "Account Number",
          prompt: "I can help with that. Could you please tell me your 8-digit account number?",
          pattern: /\b\d{6,10}\b/,
          extract: (t) => t.match(/\b\d{6,10}\b/)?.[0] ?? null
        },
        {
          key: "dateOfBirth",
          label: "Date of Birth",
          prompt: "Thank you. For security, could you confirm your date of birth?",
          pattern: null,
          extract: (t) => t.trim().length > 2 ? t.trim() : null
        },
        {
          key: "addressLine1",
          label: "Address",
          prompt: "And the first line of your registered address?",
          pattern: null,
          extract: (t) => t.trim().length > 2 ? t.trim() : null
        }
      ],

      prompts: {
        welcome: "Hi, I'm your National Bank virtual assistant. I can help with lost cards, balance queries, and more. How can I help you today?",
        intentDetected: "I understand you'd like to report a lost card. I can take care of that for you right now.",
        notUnderstood: "I'm not quite sure I understand. Could you try saying something like 'I've lost my card' or 'check my balance'?",
        complete: "Perfect. I've got everything I need. I'm cancelling your card ending in 4521 now and ordering a replacement. It will arrive at your registered address within 3 to 5 working days. You'll also receive a confirmation text message shortly. Is there anything else I can help you with?",
        agentTransfer: "Of course, let me connect you with one of our advisors now. Please hold for just a moment.",
        goodbye: "Thanks for calling National Bank. Have a great day. Goodbye."
      }
    },

    "now": {
      id: "now",
      demoMode: true,   // set false to use live Nova Sonic WebSocket instead
      demoScript: [
        {
          role: "ai",
          file: "./audio/now/01-ai.wav",
          text: "Hello, thanks for calling National Bank. I'm your AI assistant. I can see this is about your account — how can I help you today?"
        },
        {
          role: "user",
          file: "./audio/now/02-user.wav",
          text: "Hi, yes. I've just got home and realised I left my debit card at the supermarket checkout. I'm really worried someone might use it."
        },
        {
          role: "ai",
          file: "./audio/now/03-ai.wav",
          text: "Oh I completely understand — that's such a stressful thing to happen. Don't worry, I'm going to get this sorted for you right now. I just need to quickly verify your identity. Can you confirm your date of birth for me?"
        },
        {
          role: "user",
          file: "./audio/now/04-user.wav",
          text: "Yes, it's the fourteenth of March, nineteen eighty-nine.",
          pauseAfter: 2000
        },
        {
          role: "ai",
          file: "./audio/now/05-ai.wav",
          text: "Perfect. And the first line of your address?"
        },
        {
          role: "user",
          file: "./audio/now/06-user.wav",
          text: "42 Maple Street."
        },
        {
          role: "ai",
          file: "./audio/now/07-ai.wav",
          text: "Brilliant, thank you. I've confirmed your identity. I'm cancelling your card right now… done. Your card is completely blocked and you're fully protected against any unauthorised transactions. I've also ordered you a replacement which will arrive within 3 to 5 working days. And while you're waiting, you can still make payments using the National Bank app or Apple Pay — they're both already linked to your account, so you won't be without access."
        },
        {
          role: "user",
          file: "./audio/now/08-user.wav",
          text: "Oh, that's brilliant. What a relief. Thank you so much."
        },
        {
          role: "ai",
          file: "./audio/now/09-ai.wav",
          text: "You're very welcome. You absolutely did the right thing calling us straight away. Please don't hesitate to call if you need anything else. Take care. Goodbye."
        }
      ],
      title: "2026 — AI Voice Agent",
      subtitle: "Real-time, empathetic, contextual. Like talking to a human.",
      techBadges: ["SST & TTS", "Full-Duplex Audio", "Real-time AI", "Tool Use", "Emotional Intelligence"],
      challenge: "Just talk naturally. Tell the AI exactly what happened — it will listen, understand, and help.",
      hint: "Just speak normally. No keywords, no menus. Say anything.",
      phone: "iphone16",
      techDetail: "Speech to Text (SST) and Text to Speech (TTS) · Full-duplex streaming · Real-time tool orchestration · Empathetic response generation",
      tradeoff: {
        position: 93,
        caption: "Agentic — operates within boundaries we define, decides dynamically, same input ≠ same output"
      },
      controlLayer: {
        icon: "🛡️",
        name: "System Prompt + Guardrails",
        desc: "We define the environment and constraints — not the path. The AI navigates."
      },
      offScriptPrompts: [
        "I think someone saw my PIN at the checkout — what do I do?",
        "I'm really panicking, what if someone's using it right now?",
        "I don't have my account number, I can't remember anything",
        "Can you just freeze everything on my account immediately?",
        "I'm so stressed, I've had the worst day — this is the last thing I needed"
      ]
    },

    "2030": {
      id: "2030",
      title: "2027+ — Proactive Agentic AI",
      subtitle: "The bank calls you. Actions already taken. You just confirm.",
      techBadges: ["Speech to Speech", "Humanised Voice", "AWS AgentCore", "Multi-Agent Orchestration", "Proactive Outreach"],
      challenge: "You don't have to do anything. The AI already resolved it — it's just calling to confirm.",
      hint: "Answer the call and watch what the AI has already done on your behalf.",
      phone: "iphone16",
      techDetail: "S2S orchestrated via AWS AgentCore · Multi-agent proactive monitoring · <200ms voice latency · Emotional intelligence grounding",
      tradeoff: {
        position: 99,
        caption: "Proactive Agent — acts before you call, resolves without you navigating anything"
      },
      controlLayer: {
        icon: "⚖️",
        name: "Policy Engine + Action Boundaries",
        desc: "You define what the AI can do autonomously. Control is in governance, not the conversation."
      },
      failMode: "The trade-off: in exchange for this capability, outcomes are probabilistic. The AI might occasionally act on a false positive — which is why the policy engine and human confirmation loop still exist.",

      script: {
        opening1:  "Hi there — good {tod}. This is your National Bank AI assistant. I hope I'm not disturbing you. I'm calling because I spotted something unusual on your account about twenty minutes ago.",
        opening2:  "Your debit card was used at a petrol station in Glasgow at two forty-three this afternoon for forty-seven pounds eighty. Based on your spending patterns and the fact that your phone has been in London all day, this really doesn't look like you. I've placed a temporary hold on the card while I check with you. Were you in Glasgow this afternoon?",
        itWasMe:   "Not a problem at all — I'll remove the hold on your card now. If you'd like me to set up a travel notification so I don't flag future transactions in unusual locations, just say the word. Is there anything else I can help with?",
        notMe1:    "That's what I suspected — thank you for confirming. Right, I've permanently cancelled that card now. I've also automatically raised a dispute for the forty-seven pounds eighty — you'll see a full refund credited within twenty-four hours.",
        notMe2:    "I've already placed the order for your replacement card — it'll arrive at your home address tomorrow by first class. One more thing I've taken care of: I noticed you have a direct debit for eight hundred and fifty pounds going out tomorrow morning. I've made sure that won't be affected — I've temporarily routed it through your savings account so you won't miss a payment. Is there anything else you'd like me to look into while I have you?",
        checkMore: "Good question — I've already scanned your last 72 hours of transactions. The Glasgow transaction was the only anomalous one. All other activity matches your typical patterns. I'll keep monitoring and will alert you immediately if I see anything else. Is there anything else you'd like me to do?",
        applePay:  "Already done — I suspended your Apple Pay and Google Pay links for the cancelled card at the same time I cancelled it. Your new card will automatically relink to both when it arrives and you tap to activate it. You won't need to do anything manually. Is there anything else?",
        travel:    "Done — I've enabled travel mode on your account. From now on I'll check with you before flagging international transactions. You can manage this anytime in your app. Anything else?",
        done:      "Perfect. I've sent a full summary of everything to your registered email, and you'll get a text shortly with your replacement card tracking link. Your account is secure. Sorry for the brief interruption — you have a lovely {tod_part}. Goodbye."
      }
    }

  }
};
