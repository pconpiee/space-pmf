// ═══════════════════════════════════════════════════════════
// PMF LAB — CONSEQUENCE ENGINE
// engine/logic.js
//
// Single file that owns:
//   - Action validation (can this action run right now?)
//   - Outcome rolling (weighted random)
//   - Modifier computation (segment-aware, act-aware)
//   - Action execution (state writes, signal updates)
//   - Gate enforcement (act transitions, pivot gate)
//   - Failure detection (delegates to state.js)
// ═══════════════════════════════════════════════════════════


// ── ACTION VALIDATION ──────────────────────────────────────
// Hard gate — called before any action executes.
// Returns { allowed: bool, reason: string|null }

function validateAction(action) {
  // Already over
  if (G.isOver) {
    return { allowed: false, reason: 'The simulation has ended.' };
  }

  // Category locked in current act
  if (isCategoryLocked(action.category)) {
    const actDef = getCurrentActDef();
    return {
      allowed: false,
      reason: actDef.lockedMessage ||
        `${action.category} actions are locked in ${actDef.name}.`
    };
  }

  // Act I gate not yet passed — can't do Act II+ actions
  if (action.act && !action.act.includes(getCurrentAct())) {
    return {
      allowed: false,
      reason: `This action is not available in ${getCurrentActDef().name}.`
    };
  }

  // Budget check
  if (!canAfford(action)) {
    return {
      allowed: false,
      reason: `Insufficient budget. This action costs €${action.cost.budget.toLocaleString()}.`
    };
  }

  // Time check
  if (!hasTimeFor(action)) {
    return {
      allowed: false,
      reason: `Not enough runway. This action costs ${action.cost.days} days and you have ${daysLeft()} left.`
    };
  }

  // Pivot trap prevention — block a third pivot
  if (action.isPivot && getPivotCount() >= 2) {
    return {
      allowed: false,
      reason: 'You have already pivoted twice. A third pivot would destroy your remaining runway.'
    };
  }

  // Segment choice required but not yet made
  if (action.segmentChoice && !G.pendingSegmentId) {
    return {
      allowed: false,
      reason: 'Select a target segment before confirming this action.'
    };
  }

  return { allowed: true, reason: null };
}


// ── ACTION SELECTION ───────────────────────────────────────
// Called by UI when student clicks an action card.

function selectAction(actionId) {
  const action = ACTIONS.find(a => a.id === actionId);
  if (!action) return;

  const validation = validateAction(action);
  if (!validation.allowed) {
    flashLockedCard(actionId, validation.reason);
    return;
  }

  G.pendingAction    = action;
  G.pendingSegmentId = null;

  // If action requires segment choice, open the segment picker first
  if (action.segmentChoice) {
    openSegmentPicker(action);
  } else {
    openCardPrompt(action);
  }
}

function confirmSegmentChoice(segmentId) {
  if (!G.pendingAction) return;
  G.pendingSegmentId = segmentId;
  closeSegmentPicker();
  openCardPrompt(G.pendingAction);
}


// ── CARD PROMPT ────────────────────────────────────────────
// Shows the "write on your physical card" screen.
// This is a pause-and-write prompt — no text capture in the simulator.

function openCardPrompt(action) {
  const prompt = action.cardPrompt;
  const segmentName = G.pendingSegmentId
    ? G.scenario.segments[G.pendingSegmentId].name
    : null;

  // Interpolate {segment} placeholder if present
  const question = segmentName
    ? prompt.question.replace(/\{segment\}/gi, segmentName)
    : prompt.question;
  const hint = segmentName
    ? (prompt.hint || '').replace(/\{segment\}/gi, segmentName)
    : (prompt.hint || '');

  document.getElementById('cp-question').textContent   = question;
  document.getElementById('cp-hint').textContent       = hint;
  document.getElementById('cp-action-name').textContent = action.name;
  document.getElementById('cp-cost').textContent =
    `${action.cost.days} days · €${action.cost.budget.toLocaleString()}`;

  document.getElementById('card-prompt').classList.add('open');
}

function closeCardPrompt() {
  document.getElementById('card-prompt').classList.remove('open');
}

function confirmCardWritten() {
  // Student has written on their physical card. Execute the action.
  closeCardPrompt();
  if (G.pendingAction) {
    executeAction(G.pendingAction, G.pendingSegmentId);
  }
}

function cancelAction() {
  closeCardPrompt();
  closeSegmentPicker();
  G.pendingAction    = null;
  G.pendingSegmentId = null;
}


// ── OUTCOME ROLLER ─────────────────────────────────────────

function rollOutcome(outcomes) {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const o of outcomes) {
    cumulative += o.weight;
    if (roll < cumulative) return o;
  }
  return outcomes[outcomes.length - 1];
}


// ── MODIFIER ENGINE ────────────────────────────────────────
// Returns a multiplier 0.1–2.0 applied to pmfDelta.
// Reads from G (via state.js functions) — no direct state mutation.

function computeModifier(action, segmentId) {
  let modifier  = 1.0;
  const act     = getCurrentAct();
  const cat     = action.category;

  // ── 1. ACT-STAGE MODIFIERS ─────────────────────────────
  // Research is most valuable in Act I.
  // Product is most valuable in Act II.
  // Channel is only available in Act III and rewards retention.
  if (act === 1) {
    if (cat === 'research')  modifier *= 1.4;
    if (cat === 'product')   modifier *= 0.5;  // shouldn't happen (locked) but safety
    if (cat === 'channel')   modifier *= 0.3;
  }
  if (act === 2) {
    if (cat === 'research')  modifier *= 0.85;
    if (cat === 'product')   modifier *= 1.15;
    if (cat === 'channel')   modifier *= 0.5;  // shouldn't happen (locked) but safety
  }
  if (act === 3) {
    if (cat === 'research')  modifier *= 0.5;
    if (cat === 'product')   modifier *= 0.7;
    if (cat === 'channel')   modifier *= 1.4;
  }

  // ── 2. SEGMENT EVIDENCE MODIFIER ───────────────────────
  // The core innovation: how much do you know about this segment?
  // If you're acting on a segment you've investigated, bonus.
  // If you're acting on a segment you've ignored, penalty.
  if (segmentId) {
    const evidenceStrength = computeEvidenceStrength(segmentId);
    const revealedCount    = getRevealedSignalCount(segmentId);

    if (cat === 'product' || cat === 'channel') {
      // Building or scaling for a segment you know well
      if (evidenceStrength >= 50 && revealedCount >= 2) {
        modifier *= 1.35;
        logActivity('learn',
          `Evidence-led build: strong signal for ${G.scenario.segments[segmentId].shortName}. +35% modifier.`
        );
      } else if (evidenceStrength >= 25 && revealedCount >= 1) {
        modifier *= 1.1;
      } else {
        // Building blind — no evidence for this segment
        modifier *= 0.6;
        logActivity('warn',
          `Flying blind: little evidence for ${G.scenario.segments[segmentId].shortName}. -40% modifier.`
        );
      }
    }

    if (cat === 'research') {
      // Researching a segment you've already investigated deeply — diminishing returns
      if (revealedCount >= 3) {
        modifier *= 0.6;
        logActivity('warn',
          `Diminishing returns: all signals revealed for ${G.scenario.segments[segmentId].shortName}.`
        );
      } else if (revealedCount === 2) {
        modifier *= 0.8;
      }
      // Researching a fresh segment — slight bonus for breadth in Act I
      if (revealedCount === 0 && act === 1) {
        modifier *= 1.15;
      }
    }
  }

  // ── 3. ACTIVE SEGMENT ALIGNMENT ────────────────────────
  // If student has set an active segment (post-Act I gate),
  // reward actions aligned with it, penalise misaligned ones.
  if (G.activeSegmentId && segmentId && cat !== 'research') {
    if (segmentId === G.activeSegmentId) {
      modifier *= 1.1;  // Staying aligned
    } else {
      modifier *= 0.75; // Acting against stated beachhead
      logActivity('warn',
        `Segment mismatch: your thesis targets ${G.scenario.segments[G.activeSegmentId].shortName} ` +
        `but this action targets ${G.scenario.segments[segmentId].shortName}.`
      );
    }
  }

  // ── 4. DISCOVERY-FIRST BONUS ───────────────────────────
  // Research before any product action in Act I
  const act1ProductCount = G.actionHistory.filter(
    e => e.category === 'product' && e.actTaken === 1
  ).length;
  if (cat === 'research' && act1ProductCount === 0 && act === 1) {
    modifier *= 1.2;
    logActivity('learn', 'Discovery-first bonus: researching before building. +20%.');
  }

  // ── 5. POWER COMBOS ────────────────────────────────────
  // Sequences that mirror real best-practice PMF discovery
  const recentIds    = G.actionHistory.slice(-4).map(e => e.actionId);
  const allIds       = G.actionHistory.map(e => e.actionId);

  // Combo A: JTBD → Smoke Test → Pricing Experiment
  if (action.id === 'pricing_experiment' &&
      recentIds.includes('smoke_test') &&
      allIds.includes('jtbd_interview')) {
    modifier *= 1.3;
    logActivity('learn', 'Power combo: JTBD → Smoke Test → Pricing. +30%. Ideal discovery sequence.');
  }

  // Combo B: DMU Mapping → Concierge MVP (you know who to serve)
  if (action.id === 'concierge_mvp' && allIds.includes('dmu_mapping')) {
    modifier *= 1.25;
    logActivity('learn', 'Power combo: DMU mapped before concierge. +25%. You know who to serve.');
  }

  // Combo C: Retention analysis → Channel experiment (scale what sticks)
  if (action.id === 'channel_experiment' && allIds.includes('retention_analysis')) {
    modifier *= 1.3;
    logActivity('learn', 'Power combo: Retention proven before channel spend. +30%. Scale what sticks.');
  }

  // Combo D: Pilot programme → Sean Ellis (retention then pulse check)
  if (action.id === 'sean_ellis_survey' && allIds.includes('pilot_programme')) {
    modifier *= 1.2;
    logActivity('learn', 'Power combo: Pilot → Sean Ellis. +20%. Signal from real users.');
  }

  // Combo E: Beachhead narrowing → Paid pilot (smallest winnable first)
  if (action.id === 'pilot_programme' && allIds.includes('beachhead_narrowing')) {
    modifier *= 1.2;
    logActivity('learn', 'Power combo: Beachhead narrowed before pilot. +20%.');
  }

  // ── 6. ANTI-PATTERNS ───────────────────────────────────

  // Anti A: Channel spend before any retention data
  if (cat === 'channel' && G.metrics.d30Retention === null) {
    modifier *= 0.5;
    logActivity('warn', 'Anti-pattern: spending on channels before any retention data. CAC will exceed LTV.');
  }

  // Anti B: Building product before minimum discovery
  const researchCount = G.actionHistory.filter(e => e.category === 'research').length;
  if (cat === 'product' && researchCount < 2) {
    modifier *= 0.55;
    logActivity('warn', 'Anti-pattern: building before talking to customers. Less than 2 research actions completed.');
  }

  // Anti C: Same category three actions in a row
  const lastThreeCats = G.actionHistory.slice(-3).map(e => e.category);
  if (lastThreeCats.length === 3 && lastThreeCats.every(c => c === cat)) {
    modifier *= 0.65;
    logActivity('warn', `Anti-pattern: three ${cat} actions in a row. Diversify your approach.`);
  }

  // Anti D: Pivot without evidence — pivoting on fewer than 2 research actions
  if (action.isPivot && researchCount < 3) {
    modifier *= 0.5;
    logActivity('warn', 'Anti-pattern: pivoting without sufficient discovery evidence. High risk.');
  }

  // Anti E: Scaling in Act III with PMF below 35
  if (act === 3 && cat === 'channel' && G.pmfScore < 35) {
    modifier *= 0.55;
    logActivity('warn', 'Anti-pattern: scaling with PMF below 35%. You\'re amplifying a weak signal.');
  }

  // ── 7. RUNWAY PRESSURE ─────────────────────────────────
  const rPct = runwayPct();
  if (rPct > 0.85) {
    // Late game — all actions slightly less effective under time pressure
    modifier *= 0.9;
  }
  if (budgetPct() < 0.15) {
    // Near-broke — budget stress reduces product gains
    if (cat === 'product') modifier *= 0.75;
  }

  // ── 8. CAP ─────────────────────────────────────────────
  return Math.max(0.1, Math.min(2.0, modifier));
}


// ── ACTION EXECUTION ───────────────────────────────────────
// The only place that writes to game state after validation.

function executeAction(action, segmentId) {
  // Final validation (belt-and-suspenders — UI should have checked already)
  const validation = validateAction(action);
  if (!validation.allowed) {
    logActivity('warn', `Action blocked: ${validation.reason}`);
    return;
  }

  // Snapshot budget before
  const budgetBefore = G.budget;
  const pmfBefore    = G.pmfScore;
  const actTaken     = getCurrentAct();

  // Advance time
  G.day = Math.min(G.totalDays, G.day + action.cost.days);

  // Apply per-day burn for the days elapsed (act-aware)
  applyDailyBurn(action.cost.days);

  // Apply action's direct budget cost
  G.budget = Math.max(0, G.budget - action.cost.budget);

  // Roll outcome
  const outcome  = rollOutcome(action.outcomes);

  // Compute modifier
  const modifier = computeModifier(action, segmentId);

  // Apply modified PMF delta
  const rawDelta      = outcome.pmfDelta || 0;
  const modifiedDelta = Math.round(rawDelta * modifier);
  G.pmfScore  = Math.min(100, Math.max(0, G.pmfScore + modifiedDelta));
  G.insights += (action.insightGain || 0) + (outcome.insights || 0);
  G.users    += (outcome.users || 0);

  // Reveal segment signal if this action has one
  let signalRevealed = null;
  if (segmentId && action.signalKey) {
    const segDef = G.scenario.segments[segmentId];
    if (segDef && segDef.signalProfile && segDef.signalProfile[action.id]) {
      signalRevealed = segDef.signalProfile[action.id];
      updateSegmentSignal(segmentId, signalRevealed);
    }
  }

  // For non-targeted general actions, apply a small signal to active segment
  if (!segmentId && G.activeSegmentId && outcome.segmentSignal) {
    updateSegmentSignal(G.activeSegmentId, normaliseSignal(outcome.segmentSignal));
  }

  // Record to history
  G.actionsUsed.push(action.id);
  G.actionHistory.push({
    actionId:       action.id,
    actionName:     action.name,
    category:       action.category,
    segmentTarget:  segmentId || null,
    outcome,
    rawDelta,
    modifier:       Math.round(modifier * 100),
    modifiedDelta,
    dayTaken:       G.day,
    actTaken,
    pmfBefore,
    pmfAfter:       G.pmfScore,
    budgetBefore,
    budgetAfter:    G.budget,
    signalRevealed,
  });

  // Update derived metrics
  recomputeMetrics();

  // Activity log
  logActivity('do', `${action.name}: ${outcome.title}`);
  if (modifier >= 1.2) {
    logActivity('learn', `Sequencing bonus ×${Math.round(modifier * 100)}% — context rewarded this action.`);
  } else if (modifier <= 0.7) {
    logActivity('warn', `Sequencing penalty ×${Math.round(modifier * 100)}% — context hurt this action.`);
  }
  if (modifiedDelta > 0) logActivity('good', `PMF ${fmtDelta(modifiedDelta)}pts → ${Math.round(G.pmfScore)}%`);
  if (modifiedDelta < 0) logActivity('warn', `PMF ${fmtDelta(modifiedDelta)}pts → ${Math.round(G.pmfScore)}%`);

  // Check failure states
  const failure = checkFailureStates();

  // Show outcome modal (always — even on failure, show what happened)
  showOutcomeModal(action, outcome, modifiedDelta, modifier, segmentId);

  // Check gates after the outcome modal is dismissed (via closeOutcome)
  // Gate checks are deferred to closeOutcome() so student sees outcome first

  // Reset pending
  G.pendingAction    = null;
  G.pendingSegmentId = null;
}

// Convert qualitative signal labels from actions.js outcome.segmentSignal
// into numeric values for updateSegmentSignal
function normaliseSignal(segmentSignal) {
  const map = { high: 75, medium: 50, low: 25, none: 0 };
  const result = {};
  for (const [key, val] of Object.entries(segmentSignal)) {
    result[key] = typeof val === 'number' ? val : (map[val] ?? null);
  }
  return result;
}


// ── POST-OUTCOME GATE CHECKS ───────────────────────────────
// Called by closeOutcome() in the UI layer after modal dismissed.

function checkGatesAfterOutcome() {
  if (G.isOver) {
    setTimeout(showDebrief, 500);
    return;
  }

  // Check pivot gate (day 50, Act II, not yet shown)
  if (shouldTriggerPivotGate()) {
    G.actGates.pivotGateShown = true;
    setTimeout(showPivotGate, 400);
    return;
  }

  // Check Act I → Act II transition
  if (getCurrentAct() === 1 && canAdvanceActI() && !G.actGates.act1Complete) {
    setTimeout(showActGate, 400);
    return;
  }

  // Check Act II → Act III transition
  if (getCurrentAct() === 2 && canAdvanceActII() && !G.actGates.act2Complete &&
      G.actGates.act1Complete) {
    setTimeout(showActGate, 400);
    return;
  }

  // Normal flow — re-render
  renderAll();
}


// ── ACT GATE SCREENS ───────────────────────────────────────
// These show the card-write prompt between acts.
// UI rendering is in components/ but the logic trigger is here.

function showActGate() {
  const act = getCurrentAct();
  const actDef = G.scenario.acts[act];
  const gate   = actDef.gatePrompt;

  document.getElementById('ag-title').textContent       = gate.title;
  document.getElementById('ag-instruction').textContent = gate.instruction;
  document.getElementById('ag-question').textContent    = gate.question;
  document.getElementById('ag-warning').textContent     = gate.warning || '';
  document.getElementById('ag-act-name').textContent    = actDef.name;

  // Show current state so they know where they stand
  document.getElementById('ag-pmf').textContent =
    `PMF Score: ${Math.round(G.pmfScore)}%`;
  document.getElementById('ag-budget').textContent =
    `Budget: ${fmtBudget(G.budget)}`;
  document.getElementById('ag-day').textContent =
    `Day ${G.day} of ${G.totalDays}`;

  document.getElementById('act-gate').classList.add('open');
}

function confirmActGate() {
  document.getElementById('act-gate').classList.remove('open');
  const act = getCurrentAct();
  if (act === 1) {
    completeActI();
    logActivity('learn', 'Act I complete. PMF thesis written on card. Act II — Build & Validate — now unlocked.');
  } else if (act === 2) {
    completeActII();
    logActivity('learn', 'Act II complete. Scaling thesis written. Act III — Scale or Die — now unlocked.');
  }
  renderAll();
}

function showPivotGate() {
  const pivotGate = G.scenario.acts[2].pivotGate;
  const mostEvidenced = getMostEvidencedSegment();
  const activeSegName = G.activeSegmentId
    ? G.scenario.segments[G.activeSegmentId].name
    : 'no segment set';

  document.getElementById('pg-title').textContent       = pivotGate.title;
  document.getElementById('pg-instruction').textContent = pivotGate.instruction;
  document.getElementById('pg-question').textContent    = pivotGate.question;
  document.getElementById('pg-warning').textContent     = pivotGate.warning;

  // Show evidence summary to inform decision
  document.getElementById('pg-active-segment').textContent  = activeSegName;
  document.getElementById('pg-pmf').textContent             = `PMF: ${Math.round(G.pmfScore)}%`;
  document.getElementById('pg-budget').textContent          = `Remaining: ${fmtBudget(G.budget)}`;
  document.getElementById('pg-pivot-cost').textContent      =
    `Pivot cost: ${pivotGate.pivotCost.days} days + €${pivotGate.pivotCost.budget.toLocaleString()}`;

  document.getElementById('pivot-gate').classList.add('open');
}

function confirmPivotGate(doPivot) {
  document.getElementById('pivot-gate').classList.remove('open');
  G.actGates.pivotGatePassed = true;

  if (doPivot) {
    // Open segment picker to choose new segment
    openSegmentPickerForPivot();
  } else {
    logActivity('learn', 'Midpoint decision: staying the course. Card written.');
    renderAll();
  }
}

function confirmPivotSegment(newSegmentId) {
  closeSegmentPicker();
  applyPivotCost();
  setActiveSegment(newSegmentId);
  logActivity('warn',
    `Pivot executed: new beachhead → ${G.scenario.segments[newSegmentId].name}. ` +
    `Cost: 14 days + €8,000.`
  );
  recomputeMetrics();
  renderAll();
}


// ── OUTCOME MODAL ──────────────────────────────────────────
// Populates and opens the outcome modal.

function showOutcomeModal(action, outcome, modifiedDelta, modifier, segmentId) {
  const catLabel = { research: 'Research', product: 'Product', channel: 'Channel', strategic: 'Strategic' };
  const catClass = { research: 'tag-research', product: 'tag-product', channel: 'tag-channel', strategic: 'tag-strategic' };

  // Header
  const tag = document.getElementById('om-type-tag');
  tag.textContent = catLabel[action.category] || action.category;
  tag.className   = `outcome-action-tag ${catClass[action.category] || ''}`;
  document.getElementById('om-action-name').textContent = action.name;

  // Segment target label
  const segLabel = document.getElementById('om-segment-label');
  if (segLabel) {
    if (segmentId && G.scenario.segments[segmentId]) {
      const seg = G.scenario.segments[segmentId];
      segLabel.textContent = `${seg.icon} ${seg.shortName}`;
      segLabel.style.display = 'inline';
    } else {
      segLabel.style.display = 'none';
    }
  }

  // Outcome body
  const segName = segmentId ? G.scenario.segments[segmentId].name : 'the market';
  document.getElementById('om-icon').textContent  = outcome.icon;
  document.getElementById('om-title').textContent = outcome.title;
  document.getElementById('om-body').textContent  =
    outcome.body.replace(/\{segment\}/gi, segName)
                .replace(/\{Segment\}/g, segName.charAt(0).toUpperCase() + segName.slice(1));

  // Modifier callout
  const modNote = document.getElementById('om-modifier-note');
  if (modNote) {
    if (Math.abs(modifier - 1.0) >= 0.12) {
      const pct   = Math.round(modifier * 100);
      const dir   = modifier > 1 ? '▲' : '▼';
      const color = modifier > 1 ? 'var(--good)' : 'var(--bad)';
      modNote.style.display = 'block';
      modNote.style.color   = color;
      modNote.textContent   = `${dir} Sequencing modifier ×${pct}% applied`;
    } else {
      modNote.style.display = 'none';
    }
  }

  // Signal revealed panel
  const sigPanel = document.getElementById('om-signal-revealed');
  if (sigPanel) {
    if (segmentId && G.actionHistory.length > 0) {
      const latest = G.actionHistory[G.actionHistory.length - 1];
      if (latest.signalRevealed) {
        const sr = latest.signalRevealed;
        const parts = [];
        if (sr.pain    !== null) parts.push(`Pain signal: ${sr.pain}`);
        if (sr.wtp     !== null) parts.push(`WTP signal: ${sr.wtp}`);
        if (sr.urgency !== null) parts.push(`Urgency signal: ${sr.urgency}`);
        if (parts.length > 0) {
          sigPanel.innerHTML = `<span class="signal-label">Signal revealed for ${G.scenario.segments[segmentId].shortName}:</span> ${parts.join(' · ')}`;
          sigPanel.style.display = 'block';
        } else {
          sigPanel.style.display = 'none';
        }
      } else {
        sigPanel.style.display = 'none';
      }
    } else {
      sigPanel.style.display = 'none';
    }
  }

  // Stats bar
  const deltaColor = modifiedDelta > 0 ? 'var(--good)' : modifiedDelta < 0 ? 'var(--bad)' : 'var(--mid)';
  document.getElementById('om-stats').innerHTML = `
    <div class="outcome-stat">
      <div class="ostat-val" style="color:${deltaColor}">${fmtDelta(modifiedDelta)}</div>
      <div class="ostat-label">PMF SCORE</div>
    </div>
    <div class="outcome-stat">
      <div class="ostat-val" style="color:var(--bad)">−${fmtBudget(action.cost.budget)}</div>
      <div class="ostat-label">DIRECT COST</div>
    </div>
    <div class="outcome-stat">
      <div class="ostat-val" style="color:var(--teal)">+${action.insightGain + (outcome.insights || 0)}</div>
      <div class="ostat-label">INSIGHTS</div>
    </div>
    <div class="outcome-stat">
      <div class="ostat-val">Day ${G.day}</div>
      <div class="ostat-label">OF ${G.totalDays}</div>
    </div>
  `;

  // Learning
  document.getElementById('om-learning').textContent = outcome.learning;

  // Progress line
  document.getElementById('om-progress').textContent =
    `${fmtBudget(G.budget)} remaining · PMF ${Math.round(G.pmfScore)}% · ${daysLeft()} days left`;

  document.getElementById('outcome-modal').classList.add('open');
}

function closeOutcome() {
  document.getElementById('outcome-modal').classList.remove('open');
  // Gate checks happen here — student sees the outcome first, then any gate
  checkGatesAfterOutcome();
}


// ── ACTION PANEL RENDERING ─────────────────────────────────
// Determines the visual state of each action card.

function getActionCardState(action) {
  if (G.isOver) return { state: 'disabled', reason: 'Simulation ended' };

  // Category locked
  if (isCategoryLocked(action.category)) {
    const actDef = getCurrentActDef();
    const unlockAct = action.act ? Math.min(...action.act) : '?';
    return {
      state: 'locked',
      reason: `Unlocks in Act ${unlockAct}`
    };
  }

  // Already used (non-repeatable actions)
  if (isActionUsed(action.id) && !action.repeatable) {
    return { state: 'used', reason: 'Completed' };
  }

  // Can't afford
  if (!canAfford(action)) {
    return { state: 'unaffordable', reason: `Needs ${fmtBudget(action.cost.budget)}` };
  }

  // Not enough time
  if (!hasTimeFor(action)) {
    return { state: 'no-time', reason: `Needs ${action.cost.days} days` };
  }

  // Available
  return { state: 'available', reason: null };
}


// ── UI HELPERS ─────────────────────────────────────────────

function flashLockedCard(actionId, reason) {
  const card = document.querySelector(`[data-action-id="${actionId}"]`);
  if (!card) return;
  card.classList.add('flash-locked');
  // Show tooltip with reason
  const tip = card.querySelector('.lock-reason') || (() => {
    const t = document.createElement('div');
    t.className = 'lock-reason';
    card.appendChild(t);
    return t;
  })();
  tip.textContent = reason;
  tip.style.display = 'block';
  setTimeout(() => {
    card.classList.remove('flash-locked');
    tip.style.display = 'none';
  }, 2000);
}

function openSegmentPicker(action) {
  const grid = document.getElementById('sp-segment-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const segments = G.scenario.segments;
  Object.values(segments).forEach(seg => {
    const evidenceStrength = computeEvidenceStrength(seg.id);
    const revealedCount    = getRevealedSignalCount(seg.id);
    const card = document.createElement('div');
    card.className = 'sp-segment-card';
    card.dataset.segmentId = seg.id;
    card.innerHTML = `
      <div class="sp-seg-icon">${seg.icon}</div>
      <div class="sp-seg-name">${seg.shortName}</div>
      <div class="sp-seg-evidence">
        <div class="sp-evidence-bar" style="width:${evidenceStrength}%"></div>
        <span class="sp-evidence-label">${revealedCount}/3 signals revealed</span>
      </div>
    `;
    card.onclick = () => {
      document.querySelectorAll('.sp-segment-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    };
    grid.appendChild(card);
  });

  document.getElementById('sp-action-name').textContent = action.name;
  document.getElementById('segment-picker').classList.add('open');
}

function openSegmentPickerForPivot() {
  const grid = document.getElementById('sp-segment-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const segments = G.scenario.segments;
  Object.values(segments).forEach(seg => {
    if (seg.id === G.activeSegmentId) return; // Can't pivot to current segment
    const evidenceStrength = computeEvidenceStrength(seg.id);
    const card = document.createElement('div');
    card.className = 'sp-segment-card';
    card.dataset.segmentId = seg.id;
    card.innerHTML = `
      <div class="sp-seg-icon">${seg.icon}</div>
      <div class="sp-seg-name">${seg.shortName}</div>
      <div class="sp-evidence-bar" style="width:${evidenceStrength}%"></div>
    `;
    card.onclick = () => {
      document.querySelectorAll('.sp-segment-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    };
    grid.appendChild(card);
  });

  document.getElementById('sp-action-name').textContent = 'Choose new beachhead segment';
  document.getElementById('sp-confirm-btn').onclick = () => {
    const selected = document.querySelector('.sp-segment-card.selected');
    if (!selected) return;
    confirmPivotSegment(selected.dataset.segmentId);
  };
  document.getElementById('segment-picker').classList.add('open');
}

function closeSegmentPicker() {
  document.getElementById('segment-picker').classList.remove('open');
}

function confirmSegmentAndProceed() {
  const selected = document.querySelector('.sp-segment-card.selected');
  if (!selected) {
    // Flash the picker — must select something
    document.getElementById('sp-segment-grid').classList.add('flash-locked');
    setTimeout(() => document.getElementById('sp-segment-grid').classList.remove('flash-locked'), 600);
    return;
  }
  confirmSegmentChoice(selected.dataset.segmentId);
}


// ── ENDGAME ────────────────────────────────────────────────

function checkEndgame() {
  if (G.isOver) return true;
  if (daysLeft() <= 0 || G.budget <= 0) {
    G.isOver = true;
    return true;
  }
  return false;
}

function replayScenario() {
  resetState(G.scenario);
  document.getElementById('debrief-screen').classList.remove('open');
  renderAll();
  logActivity('do', `Replay started. Apply what you learned in Act I.`);
}

function startGame() {
  if (!G.scenario) return;
  resetState(G.scenario);
  document.getElementById('splash').classList.add('out');
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('app').classList.add('visible');
  }, 500);
  renderAll();
  logActivity('do',
    `Parallax Earth. €${(G.scenario.startBudget / 1000).toFixed(0)}K seed. ` +
    `${G.totalDays} days. €${G.scenario.acts[1].dailyBurn}/day burn. ` +
    `Four segments. Find your beachhead.`
  );
}

function selectScenarioOnSplash(scenarioId, cardEl) {
  document.querySelectorAll('.sc-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  G.scenario = SCENARIOS.find(s => s.id === scenarioId);
  const btn = document.getElementById('launch-btn');
  if (btn) {
    btn.disabled    = false;
    btn.textContent = `Begin ${G.scenario.name} →`;
  }
}

function initSplash() {
  const grid = document.getElementById('scenario-grid');
  if (!grid) return;
  grid.innerHTML = '';
  SCENARIOS.forEach(scenario => {
    const card = document.createElement('div');
    card.className = 'sc-card';
    card.onclick   = () => selectScenarioOnSplash(scenario.id, card);
    card.innerHTML = `
      <div class="sc-sector">${scenario.sector}</div>
      <div class="sc-name">${scenario.name}</div>
      <div class="sc-tagline">${scenario.tagline}</div>
      <div class="sc-brief-founders">${scenario.brief.founders}</div>
    `;
    grid.appendChild(card);
  });
  // Auto-select Parallax Earth (only scenario)
  const first = grid.querySelector('.sc-card');
  if (first) first.click();
}


// ── EXPORT ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateAction,
    selectAction,
    confirmSegmentChoice,
    openCardPrompt,
    closeCardPrompt,
    confirmCardWritten,
    cancelAction,
    rollOutcome,
    computeModifier,
    executeAction,
    checkGatesAfterOutcome,
    showActGate,
    confirmActGate,
    showPivotGate,
    confirmPivotGate,
    confirmPivotSegment,
    showOutcomeModal,
    closeOutcome,
    getActionCardState,
    replayScenario,
    startGame,
    initSplash,
  };
} else {
  window.validateAction          = validateAction;
  window.selectAction            = selectAction;
  window.confirmSegmentChoice    = confirmSegmentChoice;
  window.openCardPrompt          = openCardPrompt;
  window.closeCardPrompt         = closeCardPrompt;
  window.confirmCardWritten      = confirmCardWritten;
  window.cancelAction            = cancelAction;
  window.rollOutcome             = rollOutcome;
  window.computeModifier         = computeModifier;
  window.executeAction           = executeAction;
  window.checkGatesAfterOutcome  = checkGatesAfterOutcome;
  window.showActGate             = showActGate;
  window.confirmActGate          = confirmActGate;
  window.showPivotGate           = showPivotGate;
  window.confirmPivotGate        = confirmPivotGate;
  window.confirmPivotSegment     = confirmPivotSegment;
  window.showOutcomeModal        = showOutcomeModal;
  window.closeOutcome            = closeOutcome;
  window.getActionCardState      = getActionCardState;
  window.replayScenario          = replayScenario;
  window.startGame               = startGame;
  window.initSplash              = initSplash;
}
