
```javascript
// ═══════════════════════════════════════════════════════════
// PMF LAB — GAME STATE
// engine/state.js
//
// Single source of truth for all runtime game state.
// Logic.js reads from here. UI components read from here.
// Nothing else writes to G directly.
// ═══════════════════════════════════════════════════════════

// ── THE G OBJECT ─────────────────────────────────────────
// Initialised by resetState(). Never mutated directly by UI.

let G = {

  // ── Core simulation clock ────────────────────────────
  day:          0,
  totalDays:    90,
  isOver:       false,
  failureMode:  null,   // 'runway' | 'time' | 'premature_scaling' | 'pivot_trap'

  // ── Financials ────────────────────────────────────────
  budget:       0,
  startBudget:  0,

  // ── PMF signal ────────────────────────────────────────
  pmfScore:     0,      // 0–100 overall PMF score
  users:        0,      // Active pilot users / customers
  insights:     0,      // Accumulated insight points

  // ── Act tracking ──────────────────────────────────────
  // Acts are DERIVED from day — not stored — to avoid drift.
  // See getCurrentAct(). These fields are the gate states.
  actGates: {
    act1Complete:    false,   // True once minActions met and gate passed
    act2Complete:    false,
    pivotGateShown:  false,   // True once day-50 gate has fired
    pivotGatePassed: false,   // True once student has clicked through
  },

  // Snapshot of state at each act boundary (for debrief trajectory)
  actSnapshots: {
    1: null,   // { day, budget, pmfScore, segmentEvidence }
    2: null,
    3: null,
  },

  // ── Segment evidence ──────────────────────────────────
  // Accumulated revealed signals per segment.
  // Structure: { segmentId: { pain: value|null, wtp: value|null, urgency: value|null } }
  // null = not yet revealed. Numbers = revealed partial truth.
  segmentEvidence: {},

  // Which segment is the current beachhead focus.
  // Set at Act I gate. Can change on pivot.
  activeSegmentId: null,

  // ── Action history ────────────────────────────────────
  actionsUsed:   [],    // Array of action IDs (string)
  actionHistory: [],    // Array of rich history entries (see below)
  /*
    Each entry in actionHistory:
    {
      actionId:      string,
      actionName:    string,
      category:      string,       // 'research' | 'product' | 'channel' | 'strategic'
      segmentTarget: string|null,  // which segment this action targeted
      outcome:       object,       // the rolled outcome object
      rawDelta:      number,
      modifier:      number,       // x100 (e.g. 135 = 1.35×)
      modifiedDelta: number,
      dayTaken:      number,
      actTaken:      number,
      pmfBefore:     number,
      pmfAfter:      number,
      budgetBefore:  number,
      budgetAfter:   number,
      signalRevealed: object|null, // { pain, wtp, urgency } revealed by this action
    }
  */

  // ── Derived metrics ───────────────────────────────────
  // Computed on demand by helper functions below.
  // Stored here as cache for UI rendering.
  metrics: {
    d30Retention:       null,  // 0–100 | null if not yet computable
    channelSpendEuros:  0,
    channelSpendPct:    0,
    pivotCount:         0,
    mrr:                0,
    nps:                null,
  },

  // ── Pending action ────────────────────────────────────
  // Action selected but not yet confirmed through card prompt.
  pendingAction:        null,
  pendingSegmentId:     null,  // segment chosen in segmentChoice UI

  // ── Activity log ─────────────────────────────────────
  activityLog:          [],

  // ── Scenario reference ────────────────────────────────
  scenario:             null,

};


// ── RESET ──────────────────────────────────────────────────
// Call this at game start and on replay.

function resetState(scenario) {
  G.scenario      = scenario;
  G.day           = 0;
  G.totalDays     = scenario.totalDays;
  G.isOver        = false;
  G.failureMode   = null;

  G.budget        = scenario.startBudget;
  G.startBudget   = scenario.startBudget;

  G.pmfScore      = scenario.startingPmf;
  G.users         = scenario.startingUsers;
  G.insights      = scenario.startingInsights;

  G.actGates = {
    act1Complete:    false,
    act2Complete:    false,
    pivotGateShown:  false,
    pivotGatePassed: false,
  };

  G.actSnapshots = { 1: null, 2: null, 3: null };

  // Initialise segment evidence as all-null for each segment
  G.segmentEvidence = {};
  const segmentIds = Object.keys(scenario.segments);
  segmentIds.forEach(id => {
    G.segmentEvidence[id] = { pain: null, wtp: null, urgency: null };
  });

  G.activeSegmentId = null;
  G.actionsUsed     = [];
  G.actionHistory   = [];

  G.metrics = {
    d30Retention:      null,
    channelSpendEuros: 0,
    channelSpendPct:   0,
    pivotCount:        0,
    mrr:               0,
    nps:               null,
  };

  G.pendingAction    = null;
  G.pendingSegmentId = null;
  G.activityLog      = [];
}


// ── ACT DERIVATION ─────────────────────────────────────────
// Act is derived from day, not stored.
// This prevents state drift if days are modified.

function getCurrentAct() {
  if (G.day <= 30) return 1;
  if (G.day <= 75) return 2;
  return 3;
}

function getCurrentActDef() {
  const actNum = getCurrentAct();
  return G.scenario.acts[actNum];
}

// Returns the daily burn rate for the current day's act.
function getActBurnRate() {
  return getCurrentActDef().dailyBurn;
}

// Returns the action categories available in the current act.
function getUnlockedCategories() {
  return getCurrentActDef().unlockedTypes;
}

function isCategoryLocked(category) {
  const act = getCurrentActDef();
  return act.lockedTypes.includes(category);
}


// ── DAILY BURN ─────────────────────────────────────────────
// Called by logic.js after advancing days.
// Applies the correct per-act burn rate for each day elapsed.

function applyDailyBurn(daysElapsed) {
  // Each day in the elapsed range may cross an act boundary.
  // We calculate burn day by day to handle boundary crossings correctly.
  let remainingDays = daysElapsed;
  let simulatedDay  = G.day - daysElapsed; // start of the period

  let totalBurn = 0;
  while (remainingDays > 0) {
    simulatedDay++;
    const actForDay = simulatedDay <= 30 ? 1 : simulatedDay <= 75 ? 2 : 3;
    const burnForDay = G.scenario.acts[actForDay].dailyBurn;
    totalBurn += burnForDay;
    remainingDays--;
  }

  G.budget = Math.max(0, G.budget - totalBurn);
  return totalBurn;
}


// ── SEGMENT EVIDENCE ───────────────────────────────────────
// Updates the revealed signal for a segment after an action.
// Merges new signal values — never overwrites with null.

function updateSegmentSignal(segmentId, revealedSignal) {
  if (!segmentId || !revealedSignal) return;
  if (!G.segmentEvidence[segmentId]) {
    G.segmentEvidence[segmentId] = { pain: null, wtp: null, urgency: null };
  }

  const target = G.segmentEvidence[segmentId];
  if (revealedSignal.pain    !== null && revealedSignal.pain    !== undefined) {
    target.pain    = revealedSignal.pain;
  }
  if (revealedSignal.wtp     !== null && revealedSignal.wtp     !== undefined) {
    target.wtp     = revealedSignal.wtp;
  }
  if (revealedSignal.urgency !== null && revealedSignal.urgency !== undefined) {
    target.urgency = revealedSignal.urgency;
  }
}

// Returns the evidence object for a segment, or all-null if uninvestigated.
function getSegmentEvidence(segmentId) {
  return G.segmentEvidence[segmentId] || { pain: null, wtp: null, urgency: null };
}

// Computes an evidence strength score 0–100 for a segment.
// Based on how many signals are revealed and their values.
function computeEvidenceStrength(segmentId) {
  const ev = getSegmentEvidence(segmentId);
  const fields = [ev.pain, ev.wtp, ev.urgency];
  const revealed = fields.filter(v => v !== null);
  if (revealed.length === 0) return 0;
  const avg = revealed.reduce((s, v) => s + v, 0) / revealed.length;
  // Weight by completeness: partial evidence is worth less
  const completenessFactor = revealed.length / 3;
  return Math.round(avg * completenessFactor);
}

// Returns the segment with the highest evidence strength.
// Used by the consequence engine to determine the "informed" beachhead.
function getMostEvidencedSegment() {
  const segmentIds = Object.keys(G.segmentEvidence);
  let best = null, bestScore = -1;
  segmentIds.forEach(id => {
    const score = computeEvidenceStrength(id);
    if (score > bestScore) { bestScore = score; best = id; }
  });
  return best;
}

// How many of the three signal fields have been revealed for a segment?
function getRevealedSignalCount(segmentId) {
  const ev = getSegmentEvidence(segmentId);
  return [ev.pain, ev.wtp, ev.urgency].filter(v => v !== null).length;
}


// ── ACT GATE LOGIC ─────────────────────────────────────────

// Can the student advance from Act I to Act II?
function canAdvanceActI() {
  const act1Def = G.scenario.acts[1];
  const researchDone = G.actionHistory.filter(
    e => e.category === 'research' && e.actTaken === 1
  ).length;
  return researchDone >= act1Def.minActionsRequired;
}

// Can the student advance from Act II to Act III?
function canAdvanceActII() {
  const act2Def = G.scenario.acts[2];
  const act2Actions = G.actionHistory.filter(e => e.actTaken === 2).length;
  return act2Actions >= act2Def.minActionsRequired;
}

// Should the pivot gate fire now?
// Fires once, at or after day 50, in Act II.
function shouldTriggerPivotGate() {
  return (
    getCurrentAct() === 2 &&
    G.day >= 50 &&
    !G.actGates.pivotGateShown
  );
}

// Snapshot the current state at an act boundary.
function snapshotAct(actNum) {
  G.actSnapshots[actNum] = {
    act:           actNum,
    day:           G.day,
    budget:        G.budget,
    pmfScore:      G.pmfScore,
    users:         G.users,
    segmentEvidence: JSON.parse(JSON.stringify(G.segmentEvidence)),
    activeSegment: G.activeSegmentId,
  };
}

// Marks Act I complete and takes a snapshot.
function completeActI() {
  G.actGates.act1Complete = true;
  snapshotAct(1);
}

// Marks Act II complete and takes a snapshot.
function completeActII() {
  G.actGates.act2Complete = true;
  snapshotAct(2);
}


// ── PIVOT ──────────────────────────────────────────────────

function getPivotCount() {
  return G.actionHistory.filter(e => e.actionId === 'segment_pivot').length;
}

function applyPivotCost() {
  const pivotCost = G.scenario.acts[2].pivotGate.pivotCost;
  G.day    = Math.min(G.totalDays, G.day + pivotCost.days);
  G.budget = Math.max(0, G.budget - pivotCost.budget);
  // Reset evidence for the old segment but keep the revealed data
  // (pivot doesn't erase what you learned — it just changes your focus)
  G.metrics.pivotCount = getPivotCount();
}

function setActiveSegment(segmentId) {
  G.activeSegmentId = segmentId;
}


// ── DERIVED METRICS ────────────────────────────────────────
// These are computed fresh each time they're needed.
// The results are cached in G.metrics for the UI to read.

function recomputeMetrics() {
  G.metrics.pivotCount       = getPivotCount();
  G.metrics.channelSpendEuros = computeChannelSpend();
  G.metrics.channelSpendPct  = G.startBudget > 0
    ? G.metrics.channelSpendEuros / G.startBudget
    : 0;
  G.metrics.d30Retention     = computeD30Retention();
  G.metrics.mrr              = computeMRR();
  G.metrics.nps              = computeNPS();
}

function computeChannelSpend() {
  return G.actionHistory
    .filter(e => e.category === 'channel')
    .reduce((sum, e) => {
      const action = (typeof ACTIONS !== 'undefined' ? ACTIONS : [])
        .find(a => a.id === e.actionId);
      return sum + (action ? action.cost.budget : 0);
    }, 0);
}

// D30 retention is derived from:
//   - Whether cohort_retention_analysis or sean_ellis_survey was run
//   - The pmf score at that point
//   - The evidence strength of the active segment
// If no retention actions have been taken, returns null.
function computeD30Retention() {
  const retentionActions = ['retention_analysis', 'sean_ellis_survey'];
  const retentionHistory = G.actionHistory.filter(
    e => retentionActions.includes(e.actionId)
  );
  if (retentionHistory.length === 0) return null;

  // Use the most recent retention action's outcome data
  const latest = retentionHistory[retentionHistory.length - 1];
  // Outcomes in actions.js that have a `retention` field use it directly
  if (latest.outcome && latest.outcome.retention !== undefined && latest.outcome.retention !== null) {
    return latest.outcome.retention;
  }

  // Fallback: estimate from PMF score and segment evidence
  const evidenceStrength = G.activeSegmentId
    ? computeEvidenceStrength(G.activeSegmentId)
    : 0;
  const base = G.pmfScore * 0.4 + evidenceStrength * 0.2;
  return Math.min(80, Math.max(0, Math.round(base)));
}

function computeMRR() {
  if (G.users === 0) return 0;
  const activeEvidence = G.activeSegmentId
    ? getSegmentEvidence(G.activeSegmentId)
    : null;
  // Rough WTP-derived MRR: if WTP signal revealed, use it; else estimate
  const wtpSignal = activeEvidence ? (activeEvidence.wtp || 50) : 50;
  const monthlyRate = Math.round(wtpSignal * 120); // €120 per WTP point per user per month
  return G.users * monthlyRate;
}

function computeNPS() {
  if (G.pmfScore < 10) return null;
  return Math.min(72, Math.round(G.pmfScore * 0.75 - 8));
}


// ── FAILURE STATE CHECKS ───────────────────────────────────
// Returns failure mode string or null. Called after each action.

function checkFailureStates() {
  if (G.isOver) return null;

  // Runway exhaustion
  if (G.budget <= 0) {
    G.isOver      = true;
    G.failureMode = 'runway';
    snapshotAct(getCurrentAct());
    return 'runway';
  }

  // Out of time
  if (G.day >= G.totalDays) {
    G.isOver      = true;
    G.failureMode = 'time';
    snapshotAct(getCurrentAct());
    return 'time';
  }

  // Premature scaling:
  // Channel spend > 25% of start budget with D30 retention below 25%
  recomputeMetrics();
  if (
    G.metrics.channelSpendPct > 0.25 &&
    G.metrics.d30Retention !== null &&
    G.metrics.d30Retention < 25 &&
    G.users > 3
  ) {
    G.isOver      = true;
    G.failureMode = 'premature_scaling';
    snapshotAct(getCurrentAct());
    return 'premature_scaling';
  }

  // Pivot trap: two or more pivots
  if (getPivotCount() >= 2) {
    G.isOver      = true;
    G.failureMode = 'pivot_trap';
    snapshotAct(getCurrentAct());
    return 'pivot_trap';
  }

  return null;
}

// Determines the win condition at end of game.
function getWinCondition() {
  const wc = G.scenario.winConditions;
  const retention = G.metrics.d30Retention || 0;

  if (G.pmfScore >= wc.strong.pmfThreshold && retention >= wc.strong.retentionThreshold) {
    return { tier: 'strong', ...wc.strong };
  }
  if (G.pmfScore >= wc.moderate.pmfThreshold && retention >= wc.moderate.retentionThreshold) {
    return { tier: 'moderate', ...wc.moderate };
  }
  return { tier: 'weak', ...wc.weak };
}


// ── UTILITY ────────────────────────────────────────────────

function daysLeft() {
  return Math.max(0, G.totalDays - G.day);
}

function budgetPct() {
  return G.startBudget > 0 ? G.budget / G.startBudget : 0;
}

function runwayPct() {
  return G.totalDays > 0 ? G.day / G.totalDays : 0;
}

function fmtBudget(n) {
  const sym = G.scenario ? G.scenario.currencySymbol : '€';
  if (n >= 1000000) return sym + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return sym + Math.round(n / 1000) + 'K';
  return sym + Math.round(n);
}

function fmtDelta(n) {
  return n > 0 ? '+' + n : String(n);
}

function logActivity(type, message) {
  G.activityLog.push({
    type,      // 'do' | 'learn' | 'warn' | 'good'
    message,
    day: G.day,
    act: getCurrentAct(),
    ts:  Date.now(),
  });
}

function isActionUsed(actionId) {
  return G.actionsUsed.includes(actionId);
}

function canAfford(action) {
  return G.budget >= action.cost.budget;
}

function hasTimeFor(action) {
  return daysLeft() >= action.cost.days;
}


// ── EXPORT ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    G,
    resetState,
    getCurrentAct,
    getCurrentActDef,
    getActBurnRate,
    getUnlockedCategories,
    isCategoryLocked,
    applyDailyBurn,
    updateSegmentSignal,
    getSegmentEvidence,
    computeEvidenceStrength,
    getMostEvidencedSegment,
    getRevealedSignalCount,
    canAdvanceActI,
    canAdvanceActII,
    shouldTriggerPivotGate,
    snapshotAct,
    completeActI,
    completeActII,
    getPivotCount,
    applyPivotCost,
    setActiveSegment,
    recomputeMetrics,
    computeD30Retention,
    computeChannelSpend,
    checkFailureStates,
    getWinCondition,
    daysLeft,
    budgetPct,
    runwayPct,
    fmtBudget,
    fmtDelta,
    logActivity,
    isActionUsed,
    canAfford,
    hasTimeFor,
  };
} else {
  // Browser globals — all functions available directly
  window.G                       = G;
  window.resetState              = resetState;
  window.getCurrentAct           = getCurrentAct;
  window.getCurrentActDef        = getCurrentActDef;
  window.getActBurnRate          = getActBurnRate;
  window.getUnlockedCategories   = getUnlockedCategories;
  window.isCategoryLocked        = isCategoryLocked;
  window.applyDailyBurn          = applyDailyBurn;
  window.updateSegmentSignal     = updateSegmentSignal;
  window.getSegmentEvidence      = getSegmentEvidence;
  window.computeEvidenceStrength = computeEvidenceStrength;
  window.getMostEvidencedSegment = getMostEvidencedSegment;
  window.getRevealedSignalCount  = getRevealedSignalCount;
  window.canAdvanceActI          = canAdvanceActI;
  window.canAdvanceActII         = canAdvanceActII;
  window.shouldTriggerPivotGate  = shouldTriggerPivotGate;
  window.snapshotAct             = snapshotAct;
  window.completeActI            = completeActI;
  window.completeActII           = completeActII;
  window.getPivotCount           = getPivotCount;
  window.applyPivotCost          = applyPivotCost;
  window.setActiveSegment        = setActiveSegment;
  window.recomputeMetrics        = recomputeMetrics;
  window.computeD30Retention     = computeD30Retention;
  window.computeChannelSpend     = computeChannelSpend;
  window.checkFailureStates      = checkFailureStates;
  window.getWinCondition         = getWinCondition;
  window.daysLeft                = daysLeft;
  window.budgetPct               = budgetPct;
  window.runwayPct               = runwayPct;
  window.fmtBudget               = fmtBudget;
  window.fmtDelta                = fmtDelta;
  window.logActivity             = logActivity;
  window.isActionUsed            = isActionUsed;
  window.canAfford               = canAfford;
  window.hasTimeFor              = hasTimeFor;
}
```
