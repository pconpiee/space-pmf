// ═══════════════════════════════════════════════════════════
// PMF LAB — ACTION LIBRARY
// data/actions.js
//
// 32 actions across 4 categories and 3 acts.
// Every action has a card prompt — the question students
// write their hypothesis answer to before confirming.
// ═══════════════════════════════════════════════════════════

const ACTIONS = [

  // ══════════════════════════════════════════════════════
  // CATEGORY: RESEARCH
  // Available: Act I (primary), Act II (diminishing value)
  // Purpose: Generate segment signal — Pain, WTP, Urgency
  // ══════════════════════════════════════════════════════

  {
    id: "customer_interview",
    name: "Customer Discovery Interview",
    category: "research",
    icon: "🎤",
    act: [1, 2],
    segment: null,            // Player chooses which segment to interview
    segmentChoice: true,      // Triggers segment selection UI before confirming

    cost: { days: 7, budget: 1200 },
    insightGain: 3,

    cardPrompt: {
      question: "Which segment are you interviewing, and what is the one question you most need answered?",
      hint: "Write the segment name and your question before you confirm."
    },

    outcomes: [
      {
        id: "rich_signal",
        weight: 35,
        title: "Rich Discovery Signal",
        icon: "💡",
        body: "Three interviews with {segment} operators. The pain articulation is specific and unprompted — they describe workarounds, costs, and frustrations without being led. One interviewee asks if they can be a pilot customer.",
        pmfDelta: 6,
        segmentSignal: { pain: "high" },
        insights: 4,
        users: 0,
        learning: "Specific, unprompted pain articulation is the strongest early discovery signal. 'Workaround stories' are gold — they prove the problem is real and currently unsolved."
      },
      {
        id: "polite_interest",
        weight: 40,
        title: "Polite but Shallow",
        icon: "🤝",
        body: "Interviews completed. {Segment} contacts are engaged and friendly. The problem resonates when you describe it — but they don't volunteer it unprompted. No requests for follow-up. The signal is ambiguous.",
        pmfDelta: 2,
        segmentSignal: { pain: "medium" },
        insights: 2,
        users: 0,
        learning: "Agreement is not signal. Customers will confirm any problem you describe if you describe it well enough. Listen for what they bring up before you mention it."
      },
      {
        id: "wrong_person",
        weight: 15,
        title: "Wrong Person in the Room",
        icon: "🚪",
        body: "You got meetings — but with the wrong stakeholders. The people who took your call don't feel the problem directly and can't speak to budget. You've mapped the user, not the buyer.",
        pmfDelta: 1,
        segmentSignal: { pain: "low" },
        insights: 3,
        users: 0,
        learning: "Access is not the same as the right access. Mapping who you need to reach — the economic buyer, not just the end user — is itself a discovery output."
      },
      {
        id: "strong_disconfirmation",
        weight: 10,
        title: "Clear Disconfirmation",
        icon: "❌",
        body: "{Segment} contacts are polite but clear: they already have a solution that works well enough, or the problem you're solving is not a priority. This is useful data — it may mean the wrong segment.",
        pmfDelta: -2,
        segmentSignal: { pain: "none" },
        insights: 4,
        users: 0,
        learning: "Disconfirmation is valuable. A clear 'no' from a segment is better than an ambiguous 'maybe' — it frees you to investigate segments where the signal is real."
      }
    ]
  },

  {
    id: "jtbd_interview",
    name: "Jobs-to-Be-Done Interview",
    category: "research",
    icon: "🔍",
    act: [1, 2],
    segment: null,
    segmentChoice: true,

    cost: { days: 8, budget: 1400 },
    insightGain: 4,

    cardPrompt: {
      question: "What job do you think {segment} customers are hiring a solution to do — and what did they 'fire' before you?",
      hint: "Write your hypothesis about the switching story before you confirm."
    },

    outcomes: [
      {
        id: "switching_story",
        weight: 30,
        title: "The Switching Story Emerges",
        icon: "🔄",
        body: "A {segment} contact describes in detail what they fired before — manual field surveys, consultant reports, a competitor's product. The switching story reveals the real job and the real WTP benchmark: whatever they were paying before.",
        pmfDelta: 7,
        segmentSignal: { pain: "high", urgency: "medium" },
        insights: 5,
        users: 0,
        learning: "The 'what did you fire?' question is the most valuable in JTBD. The answer reveals true WTP (what they paid before), the real job (functional, emotional, social), and the competitive landscape simultaneously."
      },
      {
        id: "functional_job_only",
        weight: 35,
        title: "Functional Job Identified",
        icon: "⚙️",
        body: "The functional job is clear: {segment} customers need accurate change detection faster than current methods provide. But the emotional and social dimensions are murky — the urgency driver is not yet visible.",
        pmfDelta: 4,
        segmentSignal: { pain: "medium" },
        insights: 3,
        users: 0,
        learning: "Functional jobs are necessary but not sufficient for high WTP. The emotional job (I need to feel confident in my decision) and the social job (I need to look competent to my board) are where premium pricing lives."
      },
      {
        id: "no_switch",
        weight: 25,
        title: "No Switch Intended",
        icon: "😑",
        body: "{Segment} contacts don't have a clear incumbent to switch from — because they're not currently solving the problem at all. They've accepted it as a hard fact. This changes the sales motion entirely.",
        pmfDelta: 2,
        segmentSignal: { urgency: "low" },
        insights: 4,
        users: 0,
        learning: "A market with no incumbent isn't empty — it's often a Hard Fact market. Customers have accepted the status quo. Your job is not to out-compete an incumbent; it's to change a mental model. Completely different motion."
      },
      {
        id: "hidden_decision_maker",
        weight: 10,
        title: "Hidden Decision-Maker Surfaces",
        icon: "👤",
        body: "The JTBD process surfaces a stakeholder you hadn't mapped — a compliance officer, a board member, a procurement team — whose sign-off is required for any purchase. The DMU is more complex than it appeared.",
        pmfDelta: 1,
        segmentSignal: { pain: "medium" },
        insights: 5,
        users: 0,
        learning: "Complex B2B deals almost always have a hidden veto-holder. Finding them in discovery costs time. Finding them during a sale costs the deal."
      }
    ]
  },

  {
    id: "dmu_mapping",
    name: "Decision-Making Unit Mapping",
    category: "research",
    icon: "🗺️",
    act: [1, 2],
    segment: null,
    segmentChoice: true,

    cost: { days: 6, budget: 800 },
    insightGain: 5,

    cardPrompt: {
      question: "For {segment}: who feels the pain, who has the budget, and who can block the deal?",
      hint: "Write all three roles before you confirm — even if you're guessing."
    },

    outcomes: [
      {
        id: "dmu_mapped",
        weight: 45,
        title: "DMU Fully Mapped",
        icon: "🗂️",
        body: "Five stakeholder interviews across {segment}. The map is clear: the end user feels the pain, the CFO controls the budget, and the Legal/Compliance team has veto authority on data contracts. Your champion is the Head of Risk — they want the solution and have access to all three.",
        pmfDelta: 5,
        segmentSignal: { wtp: "high" },
        insights: 6,
        users: 0,
        learning: "Knowing the DMU lets you design your value proposition for the right person (the Economic Buyer), your product for the right person (the End User), and your risk mitigation for the right person (the Gatekeeper). Three different messages, one coherent strategy."
      },
      {
        id: "champion_identified",
        weight: 30,
        title: "Champion Identified, No Budget Authority",
        icon: "🏆",
        body: "A strong internal champion identified in {segment} — enthusiastic, well-connected, genuinely believes in the value. But they have no direct budget authority. They can open doors but can't close the deal alone.",
        pmfDelta: 3,
        segmentSignal: { pain: "high" },
        insights: 4,
        users: 0,
        learning: "Champions are essential but insufficient. Your job is to give your champion the tools to sell internally: ROI calculations, risk mitigation narratives, competitive comparisons. They're your internal sales rep. Equip them."
      },
      {
        id: "no_clear_buyer",
        weight: 25,
        title: "No Clear Economic Buyer",
        icon: "❓",
        body: "In {segment}, budget for this problem is genuinely diffuse — spread across departments, project budgets, or discretionary funds. Nobody owns this problem financially. This creates a very long and uncertain sales cycle.",
        pmfDelta: -1,
        segmentSignal: { wtp: "low" },
        insights: 3,
        users: 0,
        learning: "Diffuse budget is not zero budget — it's a sales motion problem. The question is whether you can create a budget category that didn't exist before. This is possible but takes 12–18 months. Does your runway allow it?"
      }
    ]
  },

  {
    id: "competitive_analysis",
    name: "Competitive Landscape Analysis",
    category: "research",
    icon: "🔭",
    act: [1, 2],
    segment: null,
    segmentChoice: false,     // General — applies to all segments

    cost: { days: 5, budget: 600 },
    insightGain: 3,

    cardPrompt: {
      question: "Who is the competition in your target segment — and why would a customer choose you over them?",
      hint: "Write the competitor name and your differentiation hypothesis before confirming."
    },

    outcomes: [
      {
        id: "white_space",
        weight: 25,
        title: "White Space Identified",
        icon: "⬜",
        body: "No direct competitor in your target segment. Customers either use manual methods, generic GIS tools, or nothing at all. The white space is real — but so is the question of why nobody has filled it. Is it a market opportunity or a market signal?",
        pmfDelta: 4,
        segmentSignal: { urgency: "medium" },
        insights: 3,
        users: 0,
        learning: "White space is not automatically good. Ask why it's empty: is it undiscovered opportunity, or have others tried and failed? 'Graveyard analysis' — why did previous attempts fail — is as important as competitive mapping."
      },
      {
        id: "indirect_competition",
        weight: 40,
        title: "Strong Indirect Competition",
        icon: "🔀",
        body: "No direct SAR analytics competitors — but customers in your target segment solve the problem through expensive consultants, manual field surveys, or satellite imagery from providers like Maxar or Planet who offer raw data without your analytics layer. You're competing with inertia and existing contracts.",
        pmfDelta: 3,
        segmentSignal: { pain: "medium", urgency: "medium" },
        insights: 4,
        users: 0,
        learning: "Indirect competition is often harder to displace than direct competition. A customer who uses consultants isn't just buying analysis — they're buying a relationship, accountability, and a person to blame if it goes wrong. Your value proposition needs to address the emotional job, not just the functional one."
      },
      {
        id: "direct_competition",
        weight: 25,
        title: "Direct Competitor with Market Share",
        icon: "⚔️",
        body: "A funded competitor is already operating in your target segment with paying customers. They have 18 months of market presence and a reference list. You are not first.",
        pmfDelta: 1,
        segmentSignal: { urgency: "high" },
        insights: 4,
        users: 0,
        learning: "A funded competitor validates the market — it proves customers pay for this. The question becomes: what is your 10× differentiation for a specific sub-segment? Finding the sub-segment the competitor ignores is often faster than competing head-to-head."
      },
      {
        id: "regulatory_moat",
        weight: 10,
        title: "Regulatory Moat Opportunity",
        icon: "🏰",
        body: "The competitive analysis reveals a regulatory barrier that your technology uniquely satisfies. Competitors either can't meet the new EU CBAM data provenance requirements or aren't certified for defence-adjacent use. This is a defensible position.",
        pmfDelta: 6,
        segmentSignal: { urgency: "high", wtp: "medium" },
        insights: 5,
        users: 0,
        learning: "Regulatory moats are underrated in deep tech. Compliance certification that costs you 6 months costs your competitors the same — and they have to decide whether the market is worth pursuing. First-mover advantage in regulatory compliance is durable."
      }
    ]
  },

  {
    id: "smoke_test",
    name: "Smoke Test / Pre-Sell",
    category: "research",
    icon: "💨",
    act: [1, 2],
    segment: null,
    segmentChoice: true,

    cost: { days: 8, budget: 2000 },
    insightGain: 4,

    cardPrompt: {
      question: "What specific offer are you pre-selling to {segment} — and what counts as a 'yes'?",
      hint: "Write the exact offer (price, deliverable, timeline) and your success threshold before confirming."
    },

    outcomes: [
      {
        id: "pre_order",
        weight: 20,
        title: "Pre-Order Received",
        icon: "💳",
        body: "One {segment} prospect signs a letter of intent for a €15K pilot. No product yet — they're committing to the value proposition. Real money signal: they have budget, they have urgency, and they believe you can deliver.",
        pmfDelta: 10,
        segmentSignal: { wtp: "high", urgency: "high" },
        insights: 5,
        users: 1,
        learning: "A signed LOI is the strongest early PMF signal available. It reveals WTP (actual number), urgency (timeline), and DMU (who signed). One LOI in discovery is worth twenty enthusiastic conversations."
      },
      {
        id: "strong_interest",
        weight: 30,
        title: "Strong Interest, No Commitment",
        icon: "🤔",
        body: "{Segment} prospects engage seriously with the pre-sell. Three say they 'would definitely consider' at the price point. Nobody signs. The gap between interest and commitment is where most early PMF work lives.",
        pmfDelta: 5,
        segmentSignal: { wtp: "medium", urgency: "medium" },
        insights: 3,
        users: 0,
        learning: "The interest-to-commitment gap is where you discover the real objection. What specifically stopped them from signing? That answer is your next hypothesis."
      },
      {
        id: "price_resistance",
        weight: 30,
        title: "Price Resistance Surfaces",
        icon: "💸",
        body: "Strong interest in the problem — but prospects push back on price. 'We'd pay €5K for this, not €15K.' The WTP floor is lower than your model requires. You either need a different segment, a different pricing model, or a cheaper delivery mechanism.",
        pmfDelta: 2,
        segmentSignal: { wtp: "low" },
        insights: 4,
        users: 0,
        learning: "Price resistance is specific signal. It tells you the WTP ceiling for this segment at this value proposition framing. Before concluding the segment is wrong, test whether a different framing — or a smaller starting offer — changes the number."
      },
      {
        id: "no_response",
        weight: 20,
        title: "No Response",
        icon: "📭",
        body: "Outreach sent. Minimal response from {segment}. Either your channel is wrong for this segment, your message doesn't resonate, or the segment isn't actively seeking solutions. Hard to distinguish without a follow-up experiment.",
        pmfDelta: 0,
        segmentSignal: { urgency: "low" },
        insights: 2,
        users: 0,
        learning: "No response is ambiguous data. It could mean wrong message, wrong channel, wrong timing, or wrong segment. Run a channel experiment before concluding the segment is wrong — you may just not be reaching them."
      }
    ]
  },

  {
    id: "pricing_experiment",
    name: "Pricing Experiment",
    category: "research",
    icon: "🏷️",
    act: [1, 2],
    segment: null,
    segmentChoice: true,

    cost: { days: 6, budget: 1000 },
    insightGain: 4,

    cardPrompt: {
      question: "What price are you testing with {segment} — and what WTP number would change your business model?",
      hint: "Write your price point and the minimum viable WTP before confirming."
    },

    outcomes: [
      {
        id: "wtp_validated",
        weight: 25,
        title: "WTP Validated Above Model",
        icon: "✅",
        body: "Three {segment} prospects respond to the pricing anchor with 'that seems reasonable' or better. One says 'we'd pay more for quarterly reports.' WTP is at or above your business model requirement.",
        pmfDelta: 7,
        segmentSignal: { wtp: "high" },
        insights: 4,
        users: 0,
        learning: "WTP above your model is a signal to test higher price points before settling. Price communicates quality in B2B — premium pricing often attracts better customers with higher retention. Don't race to the bottom."
      },
      {
        id: "wtp_at_model",
        weight: 35,
        title: "WTP at Model — Tight",
        icon: "📊",
        body: "WTP in {segment} is at the level your model requires — but with no margin for error. Unit economics work if retention is high and CAC stays low. Any deterioration in either breaks the model.",
        pmfDelta: 4,
        segmentSignal: { wtp: "medium" },
        insights: 3,
        users: 0,
        learning: "A business model that requires everything to go right is fragile. WTP at model means you need to either increase WTP (better value prop), reduce CAC (better channel), or improve retention (better product). Which is most actionable right now?"
      },
      {
        id: "wtp_below_model",
        weight: 30,
        title: "WTP Below Model",
        icon: "📉",
        body: "{Segment} WTP is materially below what your business model requires. The segment may have the problem — but not the budget to pay for your solution at the scale you need.",
        pmfDelta: -2,
        segmentSignal: { wtp: "low" },
        insights: 4,
        users: 0,
        learning: "Low WTP doesn't always mean wrong segment. Sometimes it means wrong packaging (annual vs. monthly), wrong buyer (engineer vs. CFO), or wrong framing (cost centre vs. revenue enabler). Test the framing before abandoning the segment."
      },
      {
        id: "wtp_varies",
        weight: 10,
        title: "Wide WTP Variance Across Respondents",
        icon: "📐",
        body: "WTP in {segment} varies enormously — from €5K to €80K for the same offering. The segment is not homogeneous. There's a high-WTP sub-segment hiding inside a lower-WTP majority. Find and target the sub-segment.",
        pmfDelta: 3,
        segmentSignal: { wtp: "medium" },
        insights: 5,
        users: 0,
        learning: "Wide WTP variance is a segmentation problem masquerading as a pricing problem. The high-WTP responders share a characteristic — company size, use case urgency, data maturity, regulatory exposure — that defines your real beachhead sub-segment."
      }
    ]
  },

  {
    id: "landing_page",
    name: "Landing Page Signal Test",
    category: "research",
    icon: "🖥️",
    act: [1, 2],
    segment: null,
    segmentChoice: true,

    cost: { days: 5, budget: 1800 },
    insightGain: 2,

    cardPrompt: {
      question: "What is the one value proposition headline you're testing with {segment}?",
      hint: "Write the exact headline before confirming — specificity is everything."
    },

    outcomes: [
      {
        id: "strong_conversion",
        weight: 20,
        title: "Strong Conversion Signal",
        icon: "📈",
        body: "2.4% click-to-demo conversion from {segment}-targeted channels. Three inbound requests from companies that match your ICP exactly. The message is landing. The channel is working. The segment is actively searching for this.",
        pmfDelta: 6,
        segmentSignal: { pain: "high", urgency: "medium" },
        insights: 3,
        users: 0,
        learning: "Inbound from ICPs is the best channel signal available. If your target segment finds you through a landing page, it means they're actively looking — which means urgency is real. The problem with inbound: you can only find the customers who are already searching."
      },
      {
        id: "moderate_signal",
        weight: 35,
        title: "Moderate Signal, Wrong ICP Mix",
        icon: "🎯",
        body: "Decent click-through rate — but the companies booking demos don't match your target ICP. Too small, wrong sector, wrong geography. The message resonates broadly but not specifically. You're attracting the curious, not the urgent.",
        pmfDelta: 2,
        segmentSignal: { pain: "medium" },
        insights: 3,
        users: 0,
        learning: "Message resonance and ICP fit are different things. A message that attracts everyone often attracts nobody with budget. Making your landing page more specific — naming the exact use case, the exact regulation, the exact role — will reduce volume and increase quality."
      },
      {
        id: "low_signal",
        weight: 30,
        title: "Low Signal",
        icon: "📉",
        body: "Low click-through, almost no demo requests from {segment}. Either the channel is wrong, the message is wrong, or the segment isn't actively searching for solutions. Landing pages work for Hair on Fire markets — not for segments that haven't accepted they have a problem.",
        pmfDelta: 0,
        segmentSignal: { urgency: "low" },
        insights: 2,
        users: 0,
        learning: "Low landing page signal in a Future Vision or Hard Fact market is expected — customers can't search for something they don't know they need. This is not disconfirmation of the segment; it's confirmation that you need a different discovery channel (outbound, events, warm intros)."
      },
      {
        id: "message_learning",
        weight: 15,
        title: "Message Learning — Unexpected Resonance",
        icon: "💬",
        body: "The headline you expected to convert didn't. A secondary headline — buried in the page body — drove all the engagement. {Segment} responds to a different framing of the value proposition than you predicted.",
        pmfDelta: 3,
        segmentSignal: { pain: "medium" },
        insights: 4,
        users: 0,
        learning: "Unexpected resonance is the most valuable landing page outcome. The message that worked reveals what {segment} customers actually care about — which may be different from what you think you're selling. Rebuild your pitch around what worked."
      }
    ]
  },

  // ══════════════════════════════════════════════════════
  // CATEGORY: PRODUCT
  // Available: Act II (primary), Act III (diminishing)
  // Purpose: Build signal into what you ship
  // ══════════════════════════════════════════════════════

  {
    id: "concierge_mvp",
    name: "Concierge MVP",
    category: "product",
    icon: "🤲",
    act: [2],
    segment: null,
    segmentChoice: true,

    cost: { days: 10, budget: 3500 },
    insightGain: 5,

    cardPrompt: {
      question: "What specific deliverable will you produce manually for {segment} — and what would make them pay for it?",
      hint: "Write the exact deliverable and your payment hypothesis before confirming."
    },

    outcomes: [
      {
        id: "pays_for_manual",
        weight: 25,
        title: "Customer Pays for Manual Delivery",
        icon: "💰",
        body: "A {segment} customer pays €8,000 for a manually produced change-detection report — knowing it's manual. They don't care how it's produced. They care that it's accurate and delivered on time. WTP is proven at manual unit economics.",
        pmfDelta: 12,
        segmentSignal: { wtp: "high", pain: "high" },
        insights: 5,
        users: 2,
        learning: "Customers paying for manual delivery is the strongest early PMF signal: it proves WTP independent of automation. If they pay for the manual version, they'll pay more for the automated version. Your job is now to automate what they're already buying."
      },
      {
        id: "value_but_no_pay",
        weight: 35,
        title: "Value Clear, Payment Stalls",
        icon: "🤝",
        body: "{Segment} customer uses the concierge service enthusiastically — praises the output, requests more analysis, refers a colleague. But when the invoice arrives, procurement pushes back. Budget wasn't pre-approved. Deal goes into a queue.",
        pmfDelta: 6,
        segmentSignal: { pain: "high", wtp: "medium" },
        insights: 4,
        users: 1,
        learning: "The gap between 'this is valuable' and 'I will pay for this now' is a procurement process problem, not a PMF problem. Ask what it would take to get a purchase order approved in less than 30 days. That answer redesigns your sales motion."
      },
      {
        id: "scope_creep",
        weight: 25,
        title: "Scope Creep Reveals the Real Job",
        icon: "🔍",
        body: "The {segment} customer keeps asking for things that are outside the original scope. Each request reveals a deeper job they're trying to do — one that's adjacent to what you thought you were building. The concierge process is showing you the real product.",
        pmfDelta: 5,
        segmentSignal: { pain: "high" },
        insights: 6,
        users: 1,
        learning: "Scope creep in a concierge MVP is signal, not a problem. Document every out-of-scope request. They form a ranked list of jobs the customer actually needs done — which may be more valuable than the product you originally designed."
      },
      {
        id: "churn_after_delivery",
        weight: 15,
        title: "Churn After First Delivery",
        icon: "👋",
        body: "{Segment} customer receives the deliverable, thanks you, and doesn't return. The output was good — they said so. But the job was done. There's no recurring need at the frequency your business model requires.",
        pmfDelta: -3,
        segmentSignal: { urgency: "low" },
        insights: 4,
        users: 0,
        learning: "One-time value is not a business model. The retention question is frequency: how often does the customer need this job done? If the answer is once a year, your revenue model needs to reflect that — or you need a segment with higher-frequency needs."
      }
    ]
  },

  {
    id: "wizard_of_oz",
    name: "Wizard of Oz MVP",
    category: "product",
    icon: "🎩",
    act: [2],
    segment: null,
    segmentChoice: true,

    cost: { days: 8, budget: 2800 },
    insightGain: 4,

    cardPrompt: {
      question: "What will the customer think is automated — and what will you actually be doing manually behind the scenes?",
      hint: "Write both sides of the illusion before confirming."
    },

    outcomes: [
      {
        id: "seamless_illusion",
        weight: 30,
        title: "Seamless — Customer Doesn't Notice",
        icon: "🎭",
        body: "{Segment} pilot customer uses the 'automated' interface without questioning it. They report faster insights, better decisions, and ask about scaling to additional sites. The value proposition is proven. Now build the real automation.",
        pmfDelta: 10,
        segmentSignal: { pain: "high", wtp: "high" },
        insights: 4,
        users: 2,
        learning: "A successful Wizard of Oz test proves two things: the value proposition lands, and the output quality is good enough. You now know exactly what to automate — because you've been doing it manually. This is the most efficient path to a real product."
      },
      {
        id: "latency_problem",
        weight: 30,
        title: "Manual Latency Breaks the Value Prop",
        icon: "⏰",
        body: "The {segment} customer expects outputs within 2 hours. Manual production takes 6. The latency gap undermines the value proposition — their use case requires speed that only automation can provide. The job is real. The manual process can't deliver it.",
        pmfDelta: 4,
        segmentSignal: { urgency: "high" },
        insights: 5,
        users: 0,
        learning: "Latency requirements are product requirements. If the value proposition requires speed that manual production can't achieve, you've learned something important: the automation is not optional. The job is real, and it demands a real product."
      },
      {
        id: "curtain_pulled",
        weight: 20,
        title: "Customer Pulls Back the Curtain",
        icon: "🙈",
        body: "The {segment} pilot customer asks detailed questions about the system — and figures out it's manual. They're not angry, but they want to know the automation timeline before committing further. Trust maintained, but timeline pressure added.",
        pmfDelta: 3,
        segmentSignal: { pain: "medium" },
        insights: 3,
        users: 1,
        learning: "Sophisticated B2B customers often suspect or detect a Wizard of Oz setup. This is fine if you handle it well: frame it as 'we're validating the value proposition before full automation to ensure we build exactly what you need.' Transparency about the stage can build trust."
      },
      {
        id: "quality_insufficient",
        weight: 20,
        title: "Manual Quality Insufficient",
        icon: "📉",
        body: "The {segment} customer flags accuracy issues with the manual outputs. The value proposition assumes a level of precision that manual production doesn't achieve consistently. The algorithm needs to be better before any delivery model — manual or automated — works.",
        pmfDelta: -2,
        segmentSignal: { pain: "medium" },
        insights: 4,
        users: 0,
        learning: "Quality floor failures in Wizard of Oz tests are useful: they tell you the minimum viable accuracy threshold for the segment before you build. This is much cheaper to discover in a manual test than after a full build."
      }
    ]
  },

  {
    id: "pilot_programme",
    name: "Paid Pilot Programme",
    category: "product",
    icon: "🚀",
    act: [2],
    segment: null,
    segmentChoice: true,

    cost: { days: 14, budget: 2000 },
    insightGain: 6,

    cardPrompt: {
      question: "What does success look like for the {segment} pilot — for them and for you?",
      hint: "Write their success metric and your success metric before confirming. They should be different."
    },

    outcomes: [
      {
        id: "pilot_renews",
        weight: 20,
        title: "Pilot Renewed at Customer's Initiative",
        icon: "🔁",
        body: "The {segment} pilot customer proactively asks to renew and expand before the pilot period ends. They've integrated Parallax Earth outputs into their workflow. The renewal request comes from the economic buyer, not just the champion. This is the strongest B2B PMF signal available.",
        pmfDelta: 14,
        segmentSignal: { pain: "high", wtp: "high", urgency: "high" },
        insights: 6,
        users: 3,
        learning: "Unsolicited pilot renewal from the economic buyer is the B2B equivalent of 40% 'very disappointed' on the Sean Ellis test. It means the product has been integrated into the workflow, the economic buyer has validated the ROI, and the switch cost is now real."
      },
      {
        id: "pilot_completes",
        weight: 35,
        title: "Pilot Completes — Conversion Uncertain",
        icon: "⏸️",
        body: "{Segment} pilot completes successfully by technical measures. Customer is positive. But conversion to paid contract requires a new budget approval cycle — 60–90 days minimum. The PMF signal is real; the revenue timeline is long.",
        pmfDelta: 8,
        segmentSignal: { pain: "high", wtp: "medium" },
        insights: 5,
        users: 1,
        learning: "Pilot completion with delayed conversion is the most common B2B deep-tech outcome. The PMF is real — the procurement process is the constraint. Your sales motion needs to account for a 90-day conversion lag in your runway planning."
      },
      {
        id: "pilot_ignored",
        weight: 25,
        title: "Pilot Deprioritised Mid-Run",
        icon: "😴",
        body: "The {segment} pilot starts well — then the champion goes quiet. Emails unanswered. The pilot is deprioritised internally. When you reconnect, you learn there's been a leadership change or a budget freeze. You've lost your champion.",
        pmfDelta: 1,
        segmentSignal: { urgency: "low" },
        insights: 3,
        users: 0,
        learning: "Champion dependency is a structural risk in B2B sales. Before entering a pilot, identify your champion's backup — who else in the organisation understands the value and has access to the economic buyer? One champion is a single point of failure."
      },
      {
        id: "pilot_failure",
        weight: 20,
        title: "Pilot Fails on Delivery",
        icon: "💥",
        body: "A data quality issue surfaces during the {segment} pilot. One output is materially wrong — the customer catches it. Trust damaged. The champion is now on the defensive internally. Recovery is possible but takes time and a root-cause explanation.",
        pmfDelta: -5,
        segmentSignal: { pain: "medium" },
        insights: 5,
        users: 0,
        learning: "Technical failure in a pilot is recoverable if handled with radical transparency and speed. Customers in B2B expect problems — they don't expect companies to pretend problems don't exist. A fast, honest response to a failure often builds more trust than a flawless delivery."
      }
    ]
  },

  {
    id: "retention_analysis",
    name: "Cohort Retention Analysis",
    category: "product",
    icon: "📊",
    act: [2, 3],
    segment: null,
    segmentChoice: false,

    cost: { days: 4, budget: 600 },
    insightGain: 5,

    cardPrompt: {
      question: "What D30 retention number would give you confidence to scale — and what would make you pause?",
      hint: "Write both thresholds before confirming. Commit to them before you see the data."
    },

    outcomes: [
      {
        id: "strong_retention",
        weight: 25,
        title: "Strong Retention Signal",
        icon: "📈",
        body: "D30 retention: 68% across active pilot customers. Users who integrated the platform in week 1 are still active in week 4. The workflow integration is sticky. You are now part of their process.",
        pmfDelta: 8,
        segmentSignal: { pain: "high" },
        insights: 5,
        users: 0,
        retention: 68,
        learning: "D30 retention above 40% for B2B means the product has crossed the workflow integration threshold. The switch cost is now real. This is the green light for channel investment — you know what you're scaling is sticky."
      },
      {
        id: "moderate_retention",
        weight: 35,
        title: "Moderate Retention — Segment Gap",
        icon: "📊",
        body: "D30 retention varies significantly by segment: 52% for your primary segment, 18% for secondary. The product is sticky for one cohort and not for the other. This is useful — it confirms your beachhead and disconfirms the secondary bet.",
        pmfDelta: 5,
        segmentSignal: { pain: "medium" },
        insights: 6,
        users: 0,
        retention: 52,
        learning: "Retention variance by segment is the most actionable data you can have at this stage. Double down on the high-retention segment. Deprioritise the low-retention one — not because it's wrong forever, but because it's wrong now."
      },
      {
        id: "low_retention",
        weight: 30,
        title: "Low Retention — Workflow Gap",
        icon: "📉",
        body: "D30 retention: 19%. Users engage with the platform in week 1, then usage drops sharply. The product doesn't integrate into the workflow naturally. Either onboarding is broken, the use case frequency is wrong, or the value isn't being delivered consistently.",
        pmfDelta: -3,
        segmentSignal: { pain: "low" },
        insights: 5,
        users: 0,
        retention: 19,
        learning: "Low retention before channel investment is critical information. Scaling at 19% D30 retention means every new user you acquire will churn — multiplying the problem. Fix retention before spending on growth. This is the most common premature scaling trap."
      },
      {
        id: "no_data",
        weight: 10,
        title: "Insufficient Data",
        icon: "❓",
        body: "Too few active users to draw statistically meaningful retention conclusions. The cohort size is too small. You know directionally — but not confidently. You need more users before retention data is actionable.",
        pmfDelta: 1,
        segmentSignal: {},
        insights: 2,
        users: 0,
        retention: null,
        learning: "Retention analysis requires minimum cohort sizes to be meaningful. With fewer than 20 active users, a single churned customer moves the retention number by 5%. Focus on getting more pilots active before relying on cohort analysis for scaling decisions."
      }
    ]
  },

  {
    id: "sean_ellis_survey",
    name: "Sean Ellis Survey",
    category: "product",
    icon: "📋",
    act: [2, 3],
    segment: null,
    segmentChoice: false,

    cost: { days: 3, budget: 400 },
    insightGain: 4,

    cardPrompt: {
      question: "What percentage 'very disappointed' would make you confident — and what would make you pivot?",
      hint: "Write both thresholds before you see the result. Your pre-committed answer is what matters."
    },

    outcomes: [
      {
        id: "above_40",
        weight: 15,
        title: "Above 40% — Strong PMF Signal",
        icon: "🎯",
        body: "47% of respondents would be 'very disappointed' if Parallax Earth disappeared. The promoter group is specific: infrastructure compliance leads at industrial sites with active CBAM exposure. The segment is clear. The signal is real.",
        pmfDelta: 10,
        segmentSignal: { pain: "high", wtp: "high" },
        insights: 5,
        users: 0,
        learning: "Above 40% is Superhuman-tier PMF signal. The most valuable follow-up: read every 'very disappointed' response and find the characteristic they share. That characteristic defines your ICP more precisely than any persona exercise."
      },
      {
        id: "twenty_to_forty",
        weight: 35,
        title: "20–40% — Signal Present, Segment Unclear",
        icon: "📊",
        body: "28% 'very disappointed.' PMF signal exists — but it's distributed unevenly across segments. Some respondents are the right ICP with strong signal. Others are curious bystanders with weak signal. The average masks the real picture.",
        pmfDelta: 5,
        segmentSignal: { pain: "medium" },
        insights: 4,
        users: 0,
        learning: "20–40% is the Superhuman starting range — real but insufficient. Segment the respondents by company type, role, and use case. The 'very disappointed' cluster within your ICP may be well above 40%. Find the cluster before concluding PMF is weak."
      },
      {
        id: "below_20",
        weight: 40,
        title: "Below 20% — Insufficient Signal",
        icon: "📉",
        body: "14% 'very disappointed.' Not enough to confidently build or scale. Either the segment mix is wrong, the product hasn't delivered sufficient value yet, or the survey reached the wrong people. More product work or segment refinement needed before this number is meaningful.",
        pmfDelta: -2,
        segmentSignal: { pain: "low" },
        insights: 3,
        users: 0,
        learning: "Below 20% is not a verdict — it's a direction. Read the 'somewhat disappointed' responses carefully. They want to love you. What would move them to 'very disappointed'? The answer is your next product sprint."
      },
      {
        id: "wrong_respondents",
        weight: 10,
        title: "Wrong Respondents Surfaced",
        icon: "🎭",
        body: "The survey reveals you've been measuring the wrong cohort. The respondents who are 'very disappointed' are not the segment you're building for — they're an adjacent group you didn't know was using the product. Unexpected discovery.",
        pmfDelta: 3,
        segmentSignal: {},
        insights: 6,
        users: 0,
        learning: "Unexpected PMF signal from an unintended cohort is one of the most valuable outcomes in early-stage discovery. Before pivoting to chase it, run 3 customer discovery interviews with this cohort to understand why they love it. You may have found your real beachhead."
      }
    ]
  },

  {
    id: "pmf_narrative",
    name: "Write the PMF Narrative",
    category: "product",
    icon: "📝",
    act: [1, 2, 3],
    segment: null,
    segmentChoice: false,

    cost: { days: 2, budget: 0 },
    insightGain: 6,

    cardPrompt: {
      question: "Complete in one sentence: 'We solve [problem] for [specific segment] because [unique insight] and they will pay because [urgency driver].'",
      hint: "Write the full sentence before confirming. If you can't complete it, that's the most important thing you've learned today."
    },

    outcomes: [
      {
        id: "narrative_clear",
        weight: 40,
        title: "Narrative Is Clear and Testable",
        icon: "✅",
        body: "The PMF Narrative crystallises three weeks of discovery into one coherent thesis. Every member of the team can state it in one sentence without prompting. The three 'what must be true' assumptions are specific enough to test. You know what your next three experiments are.",
        pmfDelta: 5,
        segmentSignal: {},
        insights: 8,
        users: 0,
        learning: "A clear PMF Narrative is not a summary of what you know — it's a commitment to what you believe and a map of what you don't yet know. The assumptions section is the most valuable part: it converts ambiguity into a sequenced experiment queue."
      },
      {
        id: "narrative_contested",
        weight: 35,
        title: "Team Disagrees on the Narrative",
        icon: "⚡",
        body: "The process of writing the PMF Narrative surfaces a fundamental disagreement between founders about the target segment. Sofia believes it's compliance. Marcus believes it's sovereign funds. The disagreement is not resolvable with current evidence — which means you need more evidence.",
        pmfDelta: 2,
        segmentSignal: {},
        insights: 7,
        users: 0,
        learning: "A contested PMF Narrative is more valuable than an unchallenged one. The disagreement reveals the assumption with the least supporting evidence — which is always the assumption you should test next. Alignment around a wrong belief is worse than productive disagreement."
      },
      {
        id: "narrative_too_broad",
        weight: 25,
        title: "Narrative Is Too Broad to Be Useful",
        icon: "🌫️",
        body: "The PMF Narrative produced is accurate but not specific enough to generate clear experiments. 'We help organisations monitor infrastructure changes' is true — but it's true for four different segments in four different ways. The narrative needs to name one.",
        pmfDelta: 1,
        segmentSignal: {},
        insights: 5,
        users: 0,
        learning: "Broad narratives are comfort documents. They feel like progress because they're written down — but they don't generate testable hypotheses. Force yourself to name one specific segment, one specific problem, and one specific reason they'll pay. Broad → Specific is the work."
      }
    ]
  },

  // ══════════════════════════════════════════════════════
  // CATEGORY: CHANNEL
  // Available: Act III only (hard gate)
  // Purpose: Find and validate acquisition channels
  // ══════════════════════════════════════════════════════

  {
    id: "channel_experiment",
    name: "3-Channel Experiment",
    category: "channel",
    icon: "📡",
    act: [3],
    segment: null,
    segmentChoice: false,

    cost: { days: 10, budget: 8000 },
    insightGain: 5,

    cardPrompt: {
      question: "Which three channels are you testing — and what CAC would make each one viable?",
      hint: "Write all three channels and your CAC threshold for each before confirming."
    },

    outcomes: [
      {
        id: "channel_found",
        weight: 25,
        title: "Dominant Channel Identified",
        icon: "🎯",
        body: "One channel produces 70% of demo bookings at one-third the CAC of the other two. Conference outreach to compliance leads outperforms LinkedIn and cold email by a significant margin. The channel is found. Concentrate budget here.",
        pmfDelta: 10,
        segmentSignal: {},
        insights: 5,
        users: 5,
        learning: "Finding a channel that outperforms alternatives by 3× or more is the channel equivalent of PMF signal. Concentrate, don't diversify. The temptation to maintain multiple channels 'in case' dilutes the budget and obscures the signal."
      },
      {
        id: "no_dominant",
        weight: 40,
        title: "No Dominant Channel — All Moderate",
        icon: "📊",
        body: "All three channels produce similar CAC and similar conversion rates — none dramatically better than the others. The signal is ambiguous. Either you haven't found the right channel yet or the segment doesn't have a dominant acquisition channel.",
        pmfDelta: 4,
        segmentSignal: {},
        insights: 4,
        users: 2,
        learning: "No dominant channel after three simultaneous tests usually means the tests were run at insufficient scale to produce clear signal. Each channel needs minimum 200 impressions to be meaningful. With a small budget, test one channel deeply rather than three channels shallowly."
      },
      {
        id: "cac_too_high",
        weight: 25,
        title: "CAC Exceeds LTV Projection",
        icon: "💸",
        body: "All tested channels produce a CAC that exceeds your LTV projection at current WTP and retention. The unit economics don't work at any tested CAC. Either WTP needs to increase, retention needs to improve, or a fundamentally different (lower-CAC) channel exists.",
        pmfDelta: -3,
        segmentSignal: {},
        insights: 5,
        users: 0,
        learning: "CAC exceeding LTV is not a marketing problem — it's a PMF problem. The segment doesn't value the product enough to justify the cost of reaching them. Fix WTP or retention before spending more on channels. More channel spend accelerates the burn, not the solution."
      },
      {
        id: "partnership_channel",
        weight: 10,
        title: "Partnership Channel Emerges",
        icon: "🤝",
        body: "The channel experiment reveals that the lowest-CAC path is not direct — it's through an industry association, a complementary software vendor, or a regulatory advisory firm that already serves your target segment. The partnership channel wasn't on your original list.",
        pmfDelta: 8,
        segmentSignal: {},
        insights: 6,
        users: 3,
        learning: "Partnership channels are underexplored by most early-stage companies because they take longer to establish. But in complex B2B markets, the right partner provides warm introductions, credibility, and access at near-zero marginal CAC. One good partner can replace months of outbound."
      }
    ]
  },

  {
    id: "outbound_sequence",
    name: "Outbound Sequence Test",
    category: "channel",
    icon: "📤",
    act: [3],
    segment: null,
    segmentChoice: true,

    cost: { days: 7, budget: 3000 },
    insightGain: 3,

    cardPrompt: {
      question: "What is the opening line of your outreach to {segment} — and what reply rate would prove the message works?",
      hint: "Write the opening line and your reply rate threshold before confirming."
    },

    outcomes: [
      {
        id: "strong_reply",
        weight: 20,
        title: "Strong Reply Rate",
        icon: "📬",
        body: "12% reply rate on 200-contact outbound sequence to {segment} ICP. Four meeting requests from companies that match the profile exactly. One reply that says 'we've been looking for exactly this.' Message confirmed, channel works.",
        pmfDelta: 8,
        segmentSignal: {},
        insights: 4,
        users: 2,
        learning: "A 12% reply rate on cold outbound is exceptional — industry benchmark is 2–5%. This means the message, the ICP targeting, and the channel are all aligned. Double the sequence size. Do not change the message."
      },
      {
        id: "moderate_reply",
        weight: 40,
        title: "Moderate Reply Rate — Wrong ICP Mix",
        icon: "📭",
        body: "4% reply rate. Meetings booked — but the companies that respond are smaller than your ICP or outside your target segment. The message works on the wrong audience. Tighten the ICP definition and rerun.",
        pmfDelta: 3,
        segmentSignal: {},
        insights: 3,
        users: 0,
        learning: "Reply rate without ICP fit is noise. The goal is not maximum reply rate — it's maximum reply rate from the right ICP. Tighten your list criteria even if it reduces volume. Fewer, better conversations close faster."
      },
      {
        id: "low_reply",
        weight: 30,
        title: "Low Reply Rate",
        icon: "📭",
        body: "1.5% reply rate. Below industry benchmark. Either the list quality is poor, the message doesn't resonate with {segment}, or outbound is not the right channel for this segment. Test a different opening or a different channel before scaling.",
        pmfDelta: 0,
        segmentSignal: {},
        insights: 2,
        users: 0,
        learning: "Low reply rate on a well-targeted list means the message isn't working. Change one variable at a time: subject line first, then opening sentence, then call-to-action. Don't change all three simultaneously — you won't know which change caused the improvement."
      },
      {
        id: "referral_trigger",
        weight: 10,
        title: "Referral Triggered by Outbound",
        icon: "🔗",
        body: "A {segment} contact who doesn't convert themselves forwards your outreach to a colleague who does. One outbound sequence generates a warm introduction to a senior economic buyer. CAC for this deal: €0.",
        pmfDelta: 6,
        segmentSignal: {},
        insights: 4,
        users: 1,
        learning: "Unsolicited referrals from outbound are the signal that your message is so relevant that recipients want to share it. This is the early signal of word-of-mouth — which is the most scalable, lowest-CAC channel available. Note what triggered the referral and replicate it."
      }
    ]
  },

  {
    id: "conference_demo",
    name: "Conference & Demo Loop",
    category: "channel",
    icon: "🎪",
    act: [3],
    segment: null,
    segmentChoice: false,

    cost: { days: 6, budget: 6000 },
    insightGain: 3,

    cardPrompt: {
      question: "What is the one demo moment that you believe will make a prospect ask for a follow-up?",
      hint: "Write the specific moment before confirming — the data visualisation, the before/after, the specific use case reveal."
    },

    outcomes: [
      {
        id: "qualified_pipeline",
        weight: 30,
        title: "Strong Qualified Pipeline",
        icon: "🏆",
        body: "Eight demo conversations at the conference. Three qualify as genuine pipeline: right ICP, confirmed budget exists, decision timeline of 90 days or less. One asks for a pilot proposal on the spot.",
        pmfDelta: 9,
        segmentSignal: {},
        insights: 4,
        users: 3,
        learning: "Conference pipeline quality is measured by ICP fit and decision timeline, not volume. Three qualified opportunities from eight conversations is excellent. The one on-the-spot pilot request is the signal to prioritise — urgency is live."
      },
      {
        id: "curiosity_not_urgency",
        weight: 40,
        title: "High Interest, Low Urgency",
        icon: "😌",
        body: "Great conversations. Genuine interest in the technology. Business cards exchanged, follow-ups promised. But nobody has an active project budget or a decision timeline. They're interested — not buying.",
        pmfDelta: 3,
        segmentSignal: {},
        insights: 3,
        users: 0,
        learning: "Conferences attract the curious before the urgent. The urgency qualification question — 'do you have an active project budget for this in the next 90 days?' — should be asked in the first three minutes. It filters polite interest from active demand."
      },
      {
        id: "competitor_intelligence",
        weight: 20,
        title: "Competitor Intelligence Gathered",
        icon: "🔭",
        body: "Demo loop produced limited pipeline — but conversations reveal that a competitor is closing deals at a price point 40% below your model, with a different feature emphasis. Your positioning needs to evolve before the next conference.",
        pmfDelta: 1,
        segmentSignal: {},
        insights: 6,
        users: 0,
        learning: "Conferences are the most efficient competitive intelligence environment available. Every conversation where a prospect mentions an alternative is signal. Log every competitor mentioned, the context, and the feature they cited. This is your positioning brief."
      },
      {
        id: "wrong_conference",
        weight: 10,
        title: "Wrong Audience",
        icon: "🗺️",
        body: "The conference attracted a different segment than your target ICP. The conversations were interesting but not commercially relevant. Budget, authority, and urgency were absent from almost every conversation.",
        pmfDelta: -1,
        segmentSignal: {},
        insights: 2,
        users: 0,
        learning: "Conference selection is a targeting decision, not a networking decision. Before booking, answer: what percentage of attendees match my ICP? If the answer is below 20%, the conference is probably wrong — or requires a very specific fringe event within it."
      }
    ]
  },

  // ══════════════════════════════════════════════════════
  // CATEGORY: STRATEGIC
  // Available: All acts — but consequences vary significantly
  // Purpose: Reposition, pivot, or clarify the thesis
  // ══════════════════════════════════════════════════════

  {
    id: "segment_pivot",
    name: "Segment Pivot",
    category: "strategic",
    icon: "🔀",
    act: [1, 2, 3],
    segment: null,
    segmentChoice: true,   // Must choose new segment

    cost: { days: 14, budget: 8000 },  // Always costs the pivot fee
    insightGain: 3,
    isPivot: true,         // Triggers pivot counter in state

    cardPrompt: {
      question: "What evidence from your current segment made you pivot — and what evidence points to the new segment?",
      hint: "Write both answers before confirming. If you can't answer the second question, you're not ready to pivot."
    },

    outcomes: [
      {
        id: "intelligence_led_pivot",
        weight: 30,
        title: "Evidence-Led Pivot — Strong New Signal",
        icon: "🎯",
        body: "The pivot to the new segment is immediately productive. Three customer discovery calls in the new segment produce the specific, unprompted pain articulation that was absent in the previous segment. The evidence was right. The pivot was right.",
        pmfDelta: 8,
        segmentSignal: { pain: "high" },
        insights: 5,
        users: 0,
        learning: "An evidence-led pivot that immediately produces stronger signal is the ideal outcome. Note what specifically was different: was it the pain articulation, the WTP conversation, or the urgency signal? That difference tells you what your original segment was missing."
      },
      {
        id: "lateral_move",
        weight: 35,
        title: "Lateral Move — Similar Signal Level",
        icon: "↔️",
        body: "The new segment produces similar signal to the old one — not better, not worse. The pivot resolved the founder disagreement but didn't improve the PMF trajectory. You've spent 14 days and €8,000 to move sideways.",
        pmfDelta: 2,
        segmentSignal: { pain: "medium" },
        insights: 3,
        users: 0,
        learning: "A lateral pivot is often anxiety-driven rather than evidence-driven. Before pivoting, ask: 'What specifically would be different about the new segment that would change our PMF trajectory?' If you can't answer that question precisely, the pivot is probably premature."
      },
      {
        id: "pivot_too_late",
        weight: 20,
        title: "Right Move, Wrong Timing",
        icon: "⏰",
        body: "The new segment shows genuinely stronger signal — but the 14-day pivot cost and reduced runway means you can't generate enough evidence to prove PMF before time expires. The insight is right. The timing is wrong.",
        pmfDelta: 4,
        segmentSignal: { pain: "high" },
        insights: 4,
        users: 0,
        learning: "Pivots have a minimum runway requirement: you need enough time after the pivot to generate proof of PMF in the new segment. If you're within 30 days of runway exhaustion, a pivot almost never recovers in time. The time to pivot is when you have runway, not when you're desperate."
      },
      {
        id: "pivot_trap_warning",
        weight: 15,
        title: "Second Pivot — Warning Signal",
        icon: "⚠️",
        body: "This is your second pivot. The combined cost is 28 days and €16,000 — more than 20% of your total runway spent on repositioning. The market is sending a consistent signal that something more fundamental needs to change.",
        pmfDelta: -4,
        segmentSignal: {},
        insights: 4,
        users: 0,
        learning: "Two pivots in 90 days is a pattern, not a strategy. The common cause: weak discovery in Act I that didn't generate enough segment evidence to make a confident beachhead choice. The fix is always more research before the first build, not faster pivoting after."
      }
    ]
  },

  {
    id: "beachhead_narrowing",
    name: "Beachhead Narrowing",
    category: "strategic",
    icon: "🎯",
    act: [1, 2],
    segment: null,
    segmentChoice: false,

    cost: { days: 4, budget: 500 },
    insightGain: 5,

    cardPrompt: {
      question: "What is the smallest market you could completely own — and why can't a competitor easily take it from you?",
      hint: "Write both answers before confirming. The second answer is your moat hypothesis."
    },

    outcomes: [
      {
        id: "sub_segment_found",
        weight: 45,
        title: "High-Value Sub-Segment Identified",
        icon: "💎",
        body: "The narrowing exercise identifies a sub-segment within your target market that has 3× the pain, 2× the WTP, and a clear reason why it's underserved by current alternatives. It's smaller — but it's winnable. Own it completely before expanding.",
        pmfDelta: 7,
        segmentSignal: { pain: "high", wtp: "high" },
        insights: 6,
        users: 0,
        learning: "The right beachhead is the smallest segment you can own completely before you need to expand. 'Completely own' means: you're the category leader, customers refer other customers, and competitors don't consider you worth attacking. That's a defensible foundation."
      },
      {
        id: "narrowing_confirms",
        weight: 35,
        title: "Narrowing Confirms Current Direction",
        icon: "✅",
        body: "The exercise produces the same conclusion you already held — your current segment focus is already appropriately narrow. You haven't over-diversified. The analysis confirms the beachhead without revealing a better one.",
        pmfDelta: 3,
        segmentSignal: {},
        insights: 3,
        users: 0,
        learning: "Confirmation of your beachhead choice is a legitimate output of the narrowing exercise — not a waste. It means you can stop second-guessing and execute. The cost of continued uncertainty about beachhead choice is higher than the time spent confirming it."
      },
      {
        id: "too_narrow",
        weight: 20,
        title: "Sub-Segment Too Small for Unit Economics",
        icon: "🔬",
        body: "The narrowing reveals a sub-segment with perfect PMF characteristics — but the total addressable market at full penetration doesn't support the revenue model. The beachhead is a niche, not a launching pad.",
        pmfDelta: 1,
        segmentSignal: {},
        insights: 4,
        users: 0,
        learning: "Beachheads need to be small enough to win and large enough to fund expansion. The test: can 30% penetration of this sub-segment generate enough revenue to hire a sales team and move to the next segment? If not, it's a niche, not a beachhead."
      }
    ]
  },

  {
    id: "investor_signal_test",
    name: "Investor Signal Test",
    category: "strategic",
    icon: "💼",
    act: [2, 3],
    segment: null,
    segmentChoice: false,

    cost: { days: 5, budget: 500 },
    insightGain: 4,

    cardPrompt: {
      question: "What is the objection you most expect from an informed investor — and what evidence do you have to address it?",
      hint: "Write both before confirming. If you can't address the objection, it's your next experiment."
    },

    outcomes: [
      {
        id: "specific_objections",
        weight: 40,
        title: "Specific Objections — Clear Next Experiments",
        icon: "🎯",
        body: "Two angel investors with deep sector experience surface three specific objections: the sales cycle assumption is too short, the defence segment requires accreditation you don't have, and the WTP in compliance is lower than your model projects. Each objection is a testable hypothesis.",
        pmfDelta: 4,
        segmentSignal: {},
        insights: 7,
        users: 0,
        learning: "Specific objections from informed investors are the most efficient source of hypothesis generation available. Each objection is something they've seen fail before. Treat investor objections as a ranked list of PMF experiments — starting with whichever would most change your trajectory if resolved."
      },
      {
        id: "positive_signal",
        weight: 25,
        title: "Positive Signal — Interest Without Commitment",
        icon: "🌱",
        body: "Two investors express genuine interest in the thesis. One asks to stay in touch. Neither commits. But the conversations are substantive — no fundamental questions about the market, the technology, or the team. The thesis is credible. The evidence is thin.",
        pmfDelta: 5,
        segmentSignal: {},
        insights: 4,
        users: 0,
        learning: "Investor interest without commitment is not a failure — it's a milestone. 'Stay in touch' from an investor who sees 200 pitches means you're in the top 10%. The gap from interest to commitment is almost always evidence — specifically, PMF evidence in the form of paying customers."
      },
      {
        id: "fundamental_doubt",
        weight: 25,
        title: "Fundamental Market Doubt",
        icon: "❓",
        body: "An experienced investor raises a question you can't answer: 'We've seen three companies try this exact approach in the compliance segment. All three struggled with procurement cycle length. What's different about your approach?' You don't have a good answer.",
        pmfDelta: -1,
        segmentSignal: {},
        insights: 5,
        users: 0,
        learning: "Fundamental market doubt from an experienced investor is the most valuable feedback available — and the hardest to hear. Before dismissing it, find out who the three companies were and what specifically they struggled with. The graveyard analysis may save you 6 months."
      },
      {
        id: "wrong_investors",
        weight: 10,
        title: "Wrong Investors — No Sector Depth",
        icon: "🎭",
        body: "The investors you met are generalists without deep sector experience. Their feedback is positive but shallow. You haven't reached the investors who've seen this market, so you haven't tested the thesis against informed scrutiny.",
        pmfDelta: 1,
        segmentSignal: {},
        insights: 2,
        users: 0,
        learning: "Investor feedback is only as valuable as the investor's sector depth. A generalist saying 'this sounds interesting' is not the same as a deep-tech B2B specialist saying 'I've seen this work.' Find the investors with relevant scars before drawing conclusions from conversations."
      }
    ]
  }
];

// ── EXPORT ───────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACTIONS };
} else {
  window.ACTIONS = ACTIONS;
}
