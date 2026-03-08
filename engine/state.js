// ═══════════════════════════════════════════════════════════
// PMF LAB — GAME STATE
// engine/state.js
// ═══════════════════════════════════════════════════════════

let G = {
  day:          0,
  totalDays:    90,
  isOver:       false,
  failureMode:  null,
  budget:       0,
  startBudget:  0,
  pmfScore:     0,
  users:        0,
  insights:     0,
  actGates: {
    act1Complete:    false,
    act2Complete:    false,
    pivotGateShown:  false,
    pivotGatePassed: false,
  },
  actSnapshots: { 1: null, 2: null, 3: null },
  segmentEvidence:  {},
  activeSegmentId:  null,
  actionsUsed:      [],
  actionHistory:    [],
  metrics: {
    d30Retention:      null,
    channelSpendEuros: 0,
    channelSpendPct:   0,
    pivotCount:        0,
    mrr:               0,
    nps:               null,
  },
  pendingAction:    null,
  pendingSegmentId: null,
  activityLog:      [],
  hypotheses:       [],
  scenario:         null,
  activeFilter:     'all',
};

// ── RESET ──────────────────────────────────────────────────

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
  G.actSnapshots    = { 1: null, 2: null, 3: null };
  G.segmentEvidence = {};
  Object.keys(scenario.segments).forEach(id => {
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
  G.hypotheses       = [];
  G.activeFilter     = 'all';
}

// ── ACT DERIVATION ─────────────────────────────────────────

function getCurrentAct() {
  if (G.day <= 30) return 1;
  if (G.day <= 75) return 2;
  return 3;
}

// FIXED: guard against null scenario
function getCurrentActDef() {
  if (!G.scenario) return {
    dailyBurn:     600,
    unlockedTypes: ['research'],
    lockedTypes:   ['product', 'channel', 'pivot'],
    name:          'Act I — Discovery',
    minActionsRequired: 3,
  };
  return G.scenario.acts[getCurrentAct()];
}

function getActBurnRate() {
  return getCurrentActDef().dailyBurn;
}

function getUnlockedCategories() {
  return getCurrentActDef().unlockedTypes;
}

// FIXED: guard against null scenario
function isCategoryLocked(category) {
  if (!G.scenario) return category !== 'research';
  return getCurrentActDef().lockedTypes.includes(category);
}

// ── DAILY BURN ─────────────────────────────────────────────

function applyDailyBurn(daysElapsed) {
  let remainingDays = daysElapsed;
  let simulatedDay  = G.day - daysElapsed;
  let totalBurn     = 0;
  while (remainingDays > 0) {
    simulatedDay++;
    const actForDay  = simulatedDay <= 30 ? 1 : simulatedDay <= 75 ? 2 : 3;
    const burnForDay = G.scenario.acts[actForDay].dailyBurn;
    totalBurn       += burnForDay;
    remainingDays--;
  }
  G.budget = Math.max(0, G.budget - totalBurn);
  return totalBurn;
}

// ── SEGMENT EVIDENCE ───────────────────────────────────────

function updateSegmentSignal(segmentId, revealedSignal) {
  if (!segmentId || !revealedSignal) return;
  if (!G.segmentEvidence[segmentId]) {
    G.segmentEvidence[segmentId] = { pain: null, wtp: null, urgency: null };
  }
  const target = G.segmentEvidence[segmentId];
  if (revealedSignal.pain    != null) target.pain    = revealedSignal.pain;
  if (revealedSignal.wtp     != null) target.wtp     = revealedSignal.wtp;
  if (revealedSignal.urgency != null) target.urgency = revealedSignal.urgency;
}

function getSegmentEvidence(segmentId) {
  return G.segmentEvidence[segmentId] || { pain: null, wtp: null, urgency: null };
}

function computeEvidenceStrength(segmentId) {
  const ev       = getSegmentEvidence(segmentId);
  const revealed = [ev.pain, ev.wtp, ev.urgency].filter(v => v !== null);
  if (revealed.length === 0) return 0;
  const avg = revealed.reduce((s, v) => s + v, 0) / revealed.length;
  return Math.round(avg * (revealed.length / 3));
}

function getMostEvidencedSegment() {
  let best = null, bestScore = -1;
  Object.keys(G.segmentEvidence).forEach(id => {
    const score = computeEvidenceStrength(id);
    if (score > bestScore) { bestScore = score; best = id; }
  });
  return best;
}

function getRevealedSignalCount(segmentId) {
  const ev = getSegmentEvidence(segmentId);
  return [ev.pain, ev.wtp, ev.urgency].filter(v => v !== null).length;
}

// ── ACT GATE LOGIC ─────────────────────────────────────────

function canAdvanceActI() {
  const required = G.scenario.acts[1].minActionsRequired;
  const done     = G.actionHistory.filter(e => e.category === 'research' && e.actTaken === 1).length;
  return done >= required;
}

function canAdvanceActII() {
  const required = G.scenario.acts[2].minActionsRequired;
  const done     = G.actionHistory.filter(e => e.actTaken === 2).length;
  return done >= required;
}

function shouldTriggerPivotGate() {
  return getCurrentAct() === 2 && G.day >= 50 && !G.actGates.pivotGateShown;
}

function snapshotAct(actNum) {
  G.actSnapshots[actNum] = {
    act:             actNum,
    day:             G.day,
    budget:          G.budget,
    pmfScore:        G.pmfScore,
    users:           G.users,
    segmentEvidence: JSON.parse(JSON.stringify(G.segmentEvidence)),
    activeSegment:   G.activeSegmentId,
  };
}

function completeActI() {
  G.actGates.act1Complete = true;
  snapshotAct(1);
}

function completeActII() {
  G.actGates.act2Complete = true;
  snapshotAct(2);
}

// ── PIVOT ──────────────────────────────────────────────────

function getPivotCount() {
  return G.actionHistory.filter(e => e.actionId === 'segment_pivot').length;
}

function applyPivotCost() {
  const cost   = G.scenario.acts[2].pivotGate.pivotCost;
  G.day        = Math.min(G.totalDays, G.day + cost.days);
  G.budget     = Math.max(0, G.budget - cost.budget);
  G.metrics.pivotCount = getPivotCount();
}

function setActiveSegment(segmentId) {
  G.activeSegmentId = segmentId;
}

// ── DERIVED METRICS ────────────────────────────────────────

function recomputeMetrics() {
  G.metrics.pivotCount        = getPivotCount();
  G.metrics.channelSpendEuros = computeChannelSpend();
  G.metrics.channelSpendPct   = G.startBudget > 0 ? G.metrics.channelSpendEuros / G.startBudget : 0;
  G.metrics.d30Retention      = computeD30Retention();
  G.metrics.mrr               = computeMRR();
  G.metrics.nps               = computeNPS();
}

function computeChannelSpend() {
  return G.actionHistory
    .filter(e => e.category === 'channel')
    .reduce((sum, e) => {
      const action = (typeof ACTIONS !== 'undefined' ? ACTIONS : []).find(a => a.id === e.actionId);
      return sum + (action ? action.cost.budget : 0);
    }, 0);
}

function computeD30Retention() {
  const retentionActions = ['retention_analysis', 'sean_ellis_survey'];
  const history = G.actionHistory.filter(e => retentionActions.includes(e.actionId));
  if (history.length === 0) return null;
  const latest = history[history.length - 1];
  if (latest.outcome && latest.outcome.retention != null) return latest.outcome.retention;
  const evidenceStrength = G.activeSegmentId ? computeEvidenceStrength(G.activeSegmentId) : 0;
  return Math.min(80, Math.max(0, Math.round(G.pmfScore * 0.4 + evidenceStrength * 0.2)));
}

function computeMRR() {
  if (G.users === 0) return 0;
  const ev        = G.activeSegmentId ? getSegmentEvidence(G.activeSegmentId) : null;
  const wtpSignal = ev ? (ev.wtp || 50) : 50;
  return G.users * Math.round(wtpSignal * 120);
}

function computeNPS() {
  if (G.pmfScore < 10) return null;
  return Math.min(72, Math.round(G.pmfScore * 0.75 - 8));
}

// ── FAILURE STATES ─────────────────────────────────────────

function checkFailureStates() {
  if (G.isOver) return null;
  if (G.budget <= 0) {
    G.isOver = true; G.failureMode = 'runway';
    snapshotAct(getCurrentAct()); return 'runway';
  }
  if (G.day >= G.totalDays) {
    G.isOver = true; G.failureMode = 'time';
    snapshotAct(getCurrentAct()); return 'time';
  }
  recomputeMetrics();
  if (G.metrics.channelSpendPct > 0.25 && G.metrics.d30Retention !== null && G.metrics.d30Retention < 25 && G.users > 3) {
    G.isOver = true; G.failureMode = 'premature_scaling';
    snapshotAct(getCurrentAct()); return 'premature_scaling';
  }
  if (getPivotCount() >= 2) {
    G.isOver = true; G.failureMode = 'pivot_trap';
    snapshotAct(getCurrentAct()); return 'pivot_trap';
  }
  return null;
}

function getWinCondition() {
  const wc        = G.scenario.winConditions;
  const retention = G.metrics.d30Retention || 0;
  if (G.pmfScore >= wc.strong.pmfThreshold   && retention >= wc.strong.retentionThreshold)   return { tier: 'strong',   ...wc.strong };
  if (G.pmfScore >= wc.moderate.pmfThreshold && retention >= wc.moderate.retentionThreshold) return { tier: 'moderate', ...wc.moderate };
  return { tier: 'weak', ...wc.weak };
}

// ── UTILITY ────────────────────────────────────────────────

function daysLeft()   { return Math.max(0, G.totalDays - G.day); }
function budgetPct()  { return G.startBudget > 0 ? G.budget / G.startBudget : 0; }
function runwayPct()  { return G.totalDays > 0 ? G.day / G.totalDays : 0; }

function fmtBudget(n) {
  const sym = G.scenario ? G.scenario.currencySymbol : '€';
  if (n >= 1000000) return sym + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return sym + Math.round(n / 1000) + 'K';
  return sym + Math.round(n);
}

function fmtDelta(n) { return n > 0 ? '+' + n : String(n); }

// FIXED: guard against null scenario
function logActivity(type, message) {
  G.activityLog.push({
    type, message,
    day: G.day,
    act: G.scenario ? getCurrentAct() : 1,
    ts:  Date.now(),
  });
}

function isActionUsed(actionId) { return G.actionsUsed.includes(actionId); }
function canAfford(action)      { return G.budget >= action.cost.budget; }
function hasTimeFor(action)     { return daysLeft() >= action.cost.days; }

// ── EXPORT ─────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { G, resetState, getCurrentAct, getCurrentActDef, getActBurnRate, getUnlockedCategories, isCategoryLocked, applyDailyBurn, updateSegmentSignal, getSegmentEvidence, computeEvidenceStrength, getMostEvidencedSegment, getRevealedSignalCount, canAdvanceActI, canAdvanceActII, shouldTriggerPivotGate, snapshotAct, completeActI, completeActII, getPivotCount, applyPivotCost, setActiveSegment, recomputeMetrics, computeD30Retention, computeChannelSpend, checkFailureStates, getWinCondition, daysLeft, budgetPct, runwayPct, fmtBudget, fmtDelta, logActivity, isActionUsed, canAfford, hasTimeFor };
} else {
  window.G = G;
  window.resetState = resetState; window.getCurrentAct = getCurrentAct; window.getCurrentActDef = getCurrentActDef;
  window.getActBurnRate = getActBurnRate; window.getUnlockedCategories = getUnlockedCategories; window.isCategoryLocked = isCategoryLocked;
  window.applyDailyBurn = applyDailyBurn; window.updateSegmentSignal = updateSegmentSignal; window.getSegmentEvidence = getSegmentEvidence;
  window.computeEvidenceStrength = computeEvidenceStrength; window.getMostEvidencedSegment = getMostEvidencedSegment; window.getRevealedSignalCount = getRevealedSignalCount;
  window.canAdvanceActI = canAdvanceActI; window.canAdvanceActII = canAdvanceActII; window.shouldTriggerPivotGate = shouldTriggerPivotGate;
  window.snapshotAct = snapshotAct; window.completeActI = completeActI; window.completeActII = completeActII;
  window.getPivotCount = getPivotCount; window.applyPivotCost = applyPivotCost; window.setActiveSegment = setActiveSegment;
  window.recomputeMetrics = recomputeMetrics; window.computeD30Retention = computeD30Retention; window.computeChannelSpend = computeChannelSpend;
  window.checkFailureStates = checkFailureStates; window.getWinCondition = getWinCondition;
  window.daysLeft = daysLeft; window.budgetPct = budgetPct; window.runwayPct = runwayPct;
  window.fmtBudget = fmtBudget; window.fmtDelta = fmtDelta; window.logActivity = logActivity;
  window.isActionUsed = isActionUsed; window.canAfford = canAfford; window.hasTimeFor = hasTimeFor;
}
