// ═══════════════════════════════════════════════════════════
// PMF LAB — PARALLAX EARTH SCENARIO
// data/scenarios.js
//
// Single scenario. Three acts. Four ambiguous segments.
// No correct answer — only better and worse sequencing.
// ═══════════════════════════════════════════════════════════

// ── SEGMENT DEFINITIONS ─────────────────────────────────────
// Hidden true profiles. Students never see these directly.
// They are revealed progressively through research actions.
// Each value is 0–100.

const SEGMENTS = {
  reinsurance: {
    id: "reinsurance",
    name: "Reinsurance & Cat Risk",
    shortName: "Reinsurance",
    icon: "🌊",
    colour: "#1A5276",

    // True hidden profile
    pain: 78,           // High — catastrophe exposure mapping is genuinely broken
    wtp: 85,            // Very high — reinsurers pay for data that prices risk correctly
    urgency: 42,        // Volatile — spikes after disasters, disappears between them
    salesCycle: 35,     // Moderate — procurement is faster than government
    dmrComplexity: 55,  // Medium — actuary + Chief Risk Officer + Procurement

    // What research actions reveal about this segment (partial truth)
    // Keys match action IDs in actions.js
    signalProfile: {
      customer_interview:    { pain: 70, wtp: null, urgency: 38 },  // Pain clear, WTP hidden
      pricing_experiment:    { pain: null, wtp: 82, urgency: null }, // WTP revealed
      jtbd_interview:        { pain: 75, wtp: null, urgency: 44 },  // Urgency pattern clearer
      competitive_analysis:  { pain: null, wtp: null, urgency: 40 },// Urgency context
      dmu_mapping:           { pain: null, wtp: 80, urgency: null }, // WTP + buyer clarity
      smoke_test:            { pain: null, wtp: 78, urgency: 50 },  // WTP + urgency spike
      landing_page:          { pain: 65, wtp: null, urgency: 35 },  // Moderate surface signal
    },

    // Debrief context — shown in results screen
    debrief: {
      strength: "Highest peak WTP in the dataset. When urgency spikes post-disaster, budget moves fast.",
      weakness: "Urgency is episodic. Between major weather events, procurement stalls. You need a disaster to close deals.",
      bestSequence: "JTBD → Smoke Test → Pricing Experiment reveals the urgency pattern. Groups that skipped JTBD often missed this.",
      transferLesson: "This is the Hair on Fire archetype — but only after the fire. Your PMF is real but seasonal. How do you build a business on episodic urgency?"
    }
  },

  sovereign: {
    id: "sovereign",
    name: "Sovereign Wealth & Infrastructure Investors",
    shortName: "Sovereign Funds",
    icon: "🏛️",
    colour: "#4A235A",

    pain: 71,
    wtp: 92,            // Highest WTP — but nearly unreachable
    urgency: 38,
    salesCycle: 88,     // Very long — 18+ month procurement cycles
    dmrComplexity: 82,  // Very high — multiple approval layers

    signalProfile: {
      customer_interview:    { pain: 60, wtp: null, urgency: 30 },  // Low access = weak signal
      pricing_experiment:    { pain: null, wtp: 88, urgency: null },
      jtbd_interview:        { pain: 68, wtp: null, urgency: 35 },
      competitive_analysis:  { pain: null, wtp: null, urgency: 32 },
      dmu_mapping:           { pain: null, wtp: 90, urgency: null }, // DMU reveals huge WTP
      smoke_test:            { pain: null, wtp: 70, urgency: 28 },  // Hard to reach for smoke test
      landing_page:          { pain: 45, wtp: null, urgency: 25 },  // Low signal — wrong channel
    },

    debrief: {
      strength: "Highest WTP of any segment by a significant margin. One deal funds 18 months of runway.",
      weakness: "Nearly unreachable through standard discovery methods. Landing pages don't work. Cold outreach doesn't work. You need warm introductions.",
      bestSequence: "DMU Mapping first — it reveals that you need a specific type of access that most discovery tools can't provide. Groups that discovered this early could adapt. Groups that found out in Act 2 were stuck.",
      transferLesson: "This is the 'right answer, wrong timing' problem. Sovereign funds may be your Series B customer, not your Series A beachhead. Runway math matters."
    }
  },

  compliance: {
    id: "compliance",
    name: "EU Industrial Carbon Compliance",
    shortName: "EU Compliance",
    icon: "⚖️",
    colour: "#0E6655",

    pain: 74,
    wtp: 68,
    urgency: 82,        // Very high — CBAM deadline is real
    salesCycle: 72,     // Long — government procurement friction
    dmrComplexity: 68,  // Medium-high — multiple approvers

    signalProfile: {
      customer_interview:    { pain: 72, wtp: null, urgency: 78 },  // Urgency very clear
      pricing_experiment:    { pain: null, wtp: 62, urgency: null }, // WTP lower than expected
      jtbd_interview:        { pain: 70, wtp: null, urgency: 80 },
      competitive_analysis:  { pain: null, wtp: null, urgency: 85 }, // Deadline very visible
      dmu_mapping:           { pain: null, wtp: 65, urgency: null }, // Procurement friction revealed
      smoke_test:            { pain: null, wtp: 58, urgency: 75 },
      landing_page:          { pain: 68, wtp: null, urgency: 76 },  // Good signal — they're searching
    },

    debrief: {
      strength: "Clearest urgency signal of any segment. Regulatory deadlines create forced buying events. Easy to find via landing pages — they're already searching.",
      weakness: "WTP is lower than it first appears. Government procurement adds 3–6 months to every deal. The urgency is real but the money moves slowly.",
      bestSequence: "Landing Page + Competitive Analysis reveals the urgency fast. But Pricing Experiment is essential — many groups overestimated WTP and built the wrong pricing model.",
      transferLesson: "Urgency without WTP is a crowded market of underfunded buyers. Regulatory deadlines create demand but also create competitors. What's your moat once everyone builds for this?"
    }
  },

  maritime: {
    id: "maritime",
    name: "Port & Maritime Logistics",
    shortName: "Maritime Ops",
    icon: "🚢",
    colour: "#784212",

    pain: 58,           // Moderate — AIS alternatives exist
    wtp: 62,
    urgency: 55,
    salesCycle: 48,     // Faster — commercial procurement
    dmrComplexity: 44,  // Simpler — operations director can often decide

    signalProfile: {
      customer_interview:    { pain: 55, wtp: null, urgency: 52 },
      pricing_experiment:    { pain: null, wtp: 58, urgency: null },
      jtbd_interview:        { pain: 60, wtp: null, urgency: 55 },  // Reveals AIS alternative clearly
      competitive_analysis:  { pain: null, wtp: null, urgency: 50 },// Competitor landscape clear
      dmu_mapping:           { pain: null, wtp: 60, urgency: null },
      smoke_test:            { pain: null, wtp: 55, urgency: 48 },
      landing_page:          { pain: 52, wtp: null, urgency: 50 },
    },

    debrief: {
      strength: "Fastest sales cycle, simplest DMU, most accessible for early discovery. Good for building early revenue and learning commercial GTM.",
      weakness: "Pain is moderate because AIS data partially solves their problem already. WTP ceiling is lower. Hard to build a defensible business here long-term.",
      bestSequence: "JTBD Interview is the critical action — it surfaces the AIS alternative quickly. Groups that skipped JTBD often overestimated the pain level and over-invested.",
      transferLesson: "Accessibility is not the same as fit. The segment that's easiest to reach is often the segment that needs you least. Fast early revenue can mask a weak PMF signal."
    }
  }
};

// ── ACT DEFINITIONS ──────────────────────────────────────────

const ACTS = {
  1: {
    id: 1,
    name: "Act I — Discovery",
    tagline: "Find the signal before you spend the money.",
    daysAvailable: 30,       // Days 1–30
    dailyBurn: 600,          // €600/day — lean team, no product costs yet
    unlockedTypes: ["research"],
    lockedTypes: ["product", "channel", "pivot"],
    minActionsRequired: 3,   // Must complete 3 research actions before gate
    gatePrompt: {
      title: "Discovery Complete",
      instruction: "Before Act II unlocks, write your PMF thesis on the card provided.",
      question: "We believe our beachhead segment is ___ because the evidence from Act I shows ___.",
      warning: "You cannot change your thesis once Act II begins. Choose deliberately."
    },
    lockedMessage: "Research before you build. Act I: Discovery actions only.",
    hint: "You have €18,000 in discovery budget (30 days × €600). Choose your three research actions carefully — they determine which segments you understand going into Act II."
  },

  2: {
    id: 2,
    name: "Act II — Build & Validate",
    tagline: "Build for the segment you understand. Validate before you scale.",
    daysAvailable: 45,       // Days 31–75
    dailyBurn: 900,          // €900/day — team growing, product costs
    unlockedTypes: ["research", "product", "pivot"],
    lockedTypes: ["channel"],
    minActionsRequired: 2,
    pivotGate: {
      triggerDay: 50,        // Pause at day 50 for pivot decision
      title: "Midpoint Decision",
      instruction: "Write your pivot decision on the card provided before continuing.",
      question: "Based on the evidence so far, we will: STAY THE COURSE / PIVOT because ___.",
      pivotCost: { days: 14, budget: 8000 },
      warning: "Pivoting costs 14 days and €8,000. Stay if your evidence supports it. Pivot if it doesn't."
    },
    gatePrompt: {
      title: "Validation Complete",
      instruction: "Write your scaling thesis on the card before Act III unlocks.",
      question: "We are ready to scale because our retention signal shows ___ and our PMF score is ___.",
      warning: "Scaling before retention is proven is the most common cause of startup failure. Be honest."
    },
    hint: "Channel actions are locked until Act III. Focus on product-market evidence first."
  },

  3: {
    id: 3,
    name: "Act III — Scale or Die",
    tagline: "Scale what works. Everything else is noise.",
    daysAvailable: 15,       // Days 76–90
    dailyBurn: 1200,         // €1,200/day — scaling costs money
    unlockedTypes: ["research", "product", "channel", "pivot"],
    lockedTypes: [],
    minActionsRequired: 1,
    warning: "Premature scaling failure is live. If D30 retention is below 25% when you spend on channels, your CAC will exceed LTV. You will run out of runway.",
    hint: "You have 15 days and €18,000 in Act III budget. Only scale what your retention data supports."
  }
};

// ── MAIN SCENARIO OBJECT ─────────────────────────────────────

const SCENARIOS = [
  {
    id: "parallax_earth",
    name: "Parallax Earth",
    tagline: "SAR analytics. Four segments. 90 days. One beachhead.",
    sector: "Earth Observation · Deep Tech · B2B",
    difficulty: 2,

    // Company brief shown on splash screen
    brief: {
      company: "Parallax Earth",
      founders: "Dr. Sofia Reyes (remote sensing, DLR background) and Marcus Webb (ex-BCG, infrastructure finance)",
      technology: "Proprietary change-detection algorithms processing Sentinel-1 SAR and commercial optical data. Sub-5m resolution, 72-hour revisit, cloud-penetrating radar. The technology works. The market is unknown.",
      situation: "€120,000 in seed funding. 90 days of runway at current burn. Four potential customer segments, each plausible, none proven. The founders need to identify their beachhead segment and generate enough PMF evidence to raise a €2M Series A.",
      tension: "Every segment has a credible story. None has been tested. Your job is to find the one where Pain × WTP × Urgency is real — and prove it before the runway runs out.",
    },

    // Financials
    startBudget: 120000,     // €120,000
    totalDays: 90,
    currency: "€",
    currencySymbol: "€",

    // Acts
    acts: ACTS,

    // Segments
    segments: SEGMENTS,

    // Starting state
    startingPmf: 5,          // Low but not zero — they have a working technology
    startingUsers: 0,
    startingInsights: 0,

    // Failure thresholds
    failureConditions: {
      runwayExhaustion: {
        trigger: "budget <= 0",
        title: "Runway Exhausted",
        message: "Parallax Earth has run out of money before finding a beachhead. The technology still works. The market question is still unanswered. This is the most common cause of deep-tech startup failure — not bad technology, but running out of time to find the right customer.",
        debrief: "Where did the budget go? Which actions cost the most relative to the signal they generated? What would you cut in the first 30 days if you ran this again?"
      },
      prematureScaling: {
        trigger: "channelSpendPct > 0.25 && d30retention < 25",
        title: "Premature Scaling",
        message: "Parallax Earth scaled before retention was proven. Users arrived, didn't find consistent value, and churned. CAC exceeded LTV. The remaining runway wasn't enough to fix the retention problem and scale simultaneously.",
        debrief: "What retention signal did you have when you started spending on channels? What would the D30 retention number have needed to be before scaling made sense?"
      },
      timeExpired: {
        trigger: "day >= 90",
        title: "Time Expired",
        message: "90 days elapsed. Parallax Earth has not raised its Series A. Without PMF evidence strong enough to convince investors, the round didn't close.",
        debrief: "What PMF score did you reach? What evidence do you have for your chosen segment? What would an investor need to see that you didn't produce?"
      },
      pivotTrap: {
        trigger: "pivotCount >= 2",
        title: "Pivot Trap",
        message: "Parallax Earth pivoted twice. Each pivot cost 14 days and €8,000 — and reset the segment evidence accumulation. The company never built deep enough signal in any single segment to prove PMF.",
        debrief: "What caused each pivot? Was the first pivot justified by evidence or driven by anxiety? What would it have taken to stay the course?"
      }
    },

    // Win conditions — shown in debrief
    winConditions: {
      strong: {
        pmfThreshold: 65,
        retentionThreshold: 35,
        title: "Series A Ready",
        message: "Parallax Earth has generated strong PMF evidence in a specific beachhead segment. The retention signal is real, the WTP is validated, and the PMF score reflects genuine customer pull. This is the evidence package that closes a Series A round.",
      },
      moderate: {
        pmfThreshold: 40,
        retentionThreshold: 20,
        title: "Promising Signal, More Work Needed",
        message: "Parallax Earth has found a signal but hasn't proven it deeply enough to close institutional capital. Another 30–45 days of focused validation in the right segment would get there. The thesis is credible. The evidence is thin.",
      },
      weak: {
        pmfThreshold: 0,
        retentionThreshold: 0,
        title: "Inconclusive",
        message: "Parallax Earth has spread effort across too many segments or chosen the wrong actions for its chosen segment. The PMF score reflects effort without direction. This is the 'busy but lost' failure mode.",
      }
    },

    // Debrief questions — displayed on results screen for facilitator
    debriefQuestions: [
      "Look at your Act I hypothesis card. Which segment did you choose as your beachhead? What evidence from Act I drove that decision?",
      "Compare your PMF score at the end of Act I, Act II, and Act III. Where did you gain the most? Where did you stall?",
      "Which action produced the most surprising outcome — better or worse than you predicted on your card?",
      "If you ran Act I again with the same budget, which three research actions would you choose and why?",
      "Your beachhead segment's debrief profile is now visible. What did the simulation know about your segment that you didn't discover?"
    ],

    // Segment signal panel labels — shown in the UI
    evidenceLabels: {
      pain: "Pain Signal",
      wtp: "WTP Signal",
      urgency: "Urgency Signal",
      overall: "Evidence Strength"
    }
  }
];

// ── EXPORT ───────────────────────────────────────────────────
// Support both module.exports (Node) and browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS, SEGMENTS, ACTS };
} else {
  window.SCENARIOS = SCENARIOS;
  window.SEGMENTS  = SEGMENTS;
  window.ACTS      = ACTS;
}
