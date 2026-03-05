// ═══════════════════════════════════════════════════════════
// PMF LAB — DEBRIEF SCREEN
// components/debrief.js
//
// Full-screen overlay shown at simulation end.
// Surfaces: win/fail condition, act trajectory, segment
// evidence map (revealed vs. actual), action history,
// and the five facilitator debrief questions.
//
// All data read from G (state.js). No state mutations here.
// ═══════════════════════════════════════════════════════════


// ── ENTRY POINT ────────────────────────────────────────────
// Called by logic.js after failure or endgame.

function showDebrief() {
  injectDebriefCSS();
  injectDebriefHTML();

  populateOutcome();
  populateTrajectory();
  populateSegmentReveal();
  populateActionHistory();
  populateDebriefQuestions();

  const screen = document.getElementById('debrief-screen');
  screen.classList.add('open');
  screen.scrollTop = 0;
}


// ── OUTCOME PANEL ───────────────────────────────────────────
// Top section: win/fail, final PMF, key numbers.

function populateOutcome() {
  const isFailure = !!G.failureMode;
  const wc        = isFailure ? null : getWinCondition();
  const fc        = isFailure ? G.scenario.failureConditions[mapFailureMode(G.failureMode)] : null;

  // Headline
  const title   = isFailure ? fc.title   : wc.title;
  const message = isFailure ? fc.message : wc.message;
  const debrief = isFailure ? fc.debrief : null;

  const titleEl = document.getElementById('db-outcome-title');
  const msgEl   = document.getElementById('db-outcome-message');
  const debEl   = document.getElementById('db-outcome-debrief');

  titleEl.textContent = title;
  titleEl.className   = `db-outcome-title ${isFailure ? 'db-failure' : getTierClass(wc?.tier)}`;
  msgEl.textContent   = message;

  if (debrief && debEl) {
    debEl.textContent    = debrief;
    debEl.style.display  = 'block';
  } else if (debEl) {
    debEl.style.display  = 'none';
  }

  // Final stats strip
  const retention  = G.metrics.d30Retention;
  const pivotCount = G.metrics.pivotCount;
  const actionsRun = G.actionsUsed.length;
  const budgetUsed = G.startBudget - G.budget;
  const beachhead  = G.activeSegmentId
    ? G.scenario.segments[G.activeSegmentId].name
    : 'Not set';

  document.getElementById('db-stat-pmf').textContent      = `${Math.round(G.pmfScore)}%`;
  document.getElementById('db-stat-day').textContent      = `${G.day}/${G.totalDays}`;
  document.getElementById('db-stat-budget').textContent   = fmtBudget(G.budget);
  document.getElementById('db-stat-retention').textContent = retention !== null ? `${retention}%` : '—';
  document.getElementById('db-stat-pivots').textContent   = pivotCount;
  document.getElementById('db-stat-actions').textContent  = actionsRun;
  document.getElementById('db-stat-beachhead').textContent = beachhead;
  document.getElementById('db-stat-spent').textContent    = fmtBudget(budgetUsed);
}

function mapFailureMode(mode) {
  const map = {
    runway:            'runwayExhaustion',
    time:              'timeExpired',
    premature_scaling: 'prematureScaling',
    pivot_trap:        'pivotTrap',
  };
  return map[mode] || 'timeExpired';
}

function getTierClass(tier) {
  return tier === 'strong' ? 'db-strong' : tier === 'moderate' ? 'db-moderate' : 'db-weak';
}


// ── ACT TRAJECTORY ─────────────────────────────────────────
// Shows PMF score, budget, and day at end of each act.
// The key debrief moment: where did you gain? where did you stall?

function populateTrajectory() {
  const container = document.getElementById('db-trajectory');
  if (!container) return;

  const snap1 = G.actSnapshots[1];
  const snap2 = G.actSnapshots[2];
  const snap3 = G.actSnapshots[3] || {
    act: 3, day: G.day, budget: G.budget,
    pmfScore: G.pmfScore, segmentEvidence: G.segmentEvidence
  };

  const snapshots = [snap1, snap2, snap3].filter(Boolean);

  // PMF at start
  const startPmf = G.scenario.startingPmf;

  // Build the visual timeline
  const actNames = ['Discovery', 'Build & Validate', 'Scale or Die'];
  const actColors = ['#0D6B6B', '#1A3F6F', '#8B2500'];

  container.innerHTML = `
    <div class="traj-header">
      <span class="traj-title">Act-by-Act Trajectory</span>
      <span class="traj-subtitle">Where did PMF move? Where did it stall?</span>
    </div>

    <div class="traj-chart">
      ${buildTrajectoryChart(startPmf, snapshots)}
    </div>

    <div class="traj-snapshots">
      ${snapshots.map((snap, i) => `
        <div class="traj-snap">
          <div class="traj-snap-act" style="color:${actColors[i]}">Act ${snap.act} — ${actNames[i] || ''}</div>
          <div class="traj-snap-pmf">PMF ${Math.round(snap.pmfScore)}%</div>
          <div class="traj-snap-meta">
            Day ${snap.day} · ${fmtBudget(snap.budget)} left
          </div>
          ${snap.activeSegment ? `
            <div class="traj-snap-seg">
              ${G.scenario.segments[snap.activeSegment]?.icon || ''}
              ${G.scenario.segments[snap.activeSegment]?.shortName || snap.activeSegment}
            </div>
          ` : ''}
        </div>
      `).join('<div class="traj-arrow">→</div>')}
    </div>

    <div class="traj-insight">
      ${buildTrajectoryInsight(startPmf, snapshots)}
    </div>
  `;
}

function buildTrajectoryChart(startPmf, snapshots) {
  // Simple horizontal bar chart showing PMF at each act boundary
  const points = [
    { label: 'Start', pmf: startPmf },
    ...snapshots.map((s, i) => ({ label: `Act ${s.act}`, pmf: Math.round(s.pmfScore) }))
  ];

  return `
    <div class="traj-bars">
      ${points.map((pt, i) => {
        const prev   = i > 0 ? points[i-1].pmf : pt.pmf;
        const delta  = pt.pmf - prev;
        const color  = pt.pmf >= 65 ? '#2ECC71'
                     : pt.pmf >= 40 ? '#F39C12'
                     : pt.pmf >= 20 ? '#0D9B9B'
                     :                '#5A7A9A';
        return `
          <div class="traj-bar-row">
            <span class="traj-bar-label">${pt.label}</span>
            <div class="traj-bar-track">
              <div class="traj-bar-fill" style="width:${pt.pmf}%;background:${color}"></div>
            </div>
            <span class="traj-bar-val" style="color:${color}">${pt.pmf}%</span>
            ${i > 0 ? `<span class="traj-bar-delta" style="color:${delta >= 0 ? '#2ECC71' : '#E74C3C'}">${delta >= 0 ? '+' : ''}${delta}</span>` : '<span class="traj-bar-delta"></span>'}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildTrajectoryInsight(startPmf, snapshots) {
  if (snapshots.length === 0) return '';

  const final   = snapshots[snapshots.length - 1];
  const totalGain = final.pmfScore - startPmf;

  // Find the act with the biggest gain
  const gains = snapshots.map((s, i) => {
    const prev = i === 0 ? startPmf : snapshots[i-1].pmfScore;
    return { act: s.act, gain: s.pmfScore - prev };
  });
  const bestAct  = gains.reduce((a, b) => a.gain > b.gain ? a : b);
  const worstAct = gains.reduce((a, b) => a.gain < b.gain ? a : b);

  const actNames = { 1: 'Act I (Discovery)', 2: 'Act II (Build & Validate)', 3: 'Act III (Scale or Die)' };

  return `
    <div class="traj-insight-row">
      <span class="traj-insight-label">Total PMF gained</span>
      <span class="traj-insight-val" style="color:${totalGain >= 30 ? '#2ECC71' : totalGain >= 15 ? '#F39C12' : '#E74C3C'}">${totalGain >= 0 ? '+' : ''}${Math.round(totalGain)} pts</span>
    </div>
    <div class="traj-insight-row">
      <span class="traj-insight-label">Most productive act</span>
      <span class="traj-insight-val" style="color:#0D9B9B">${actNames[bestAct.act]} (+${Math.round(bestAct.gain)})</span>
    </div>
    ${gains.length > 1 ? `
    <div class="traj-insight-row">
      <span class="traj-insight-label">Slowest act</span>
      <span class="traj-insight-val" style="color:#C49A4A">${actNames[worstAct.act]} (${Math.round(worstAct.gain) >= 0 ? '+' : ''}${Math.round(worstAct.gain)})</span>
    </div>
    ` : ''}
  `;
}


// ── SEGMENT REVEAL ─────────────────────────────────────────
// The key pedagogical moment: what you discovered vs. what was true.
// Shows revealed evidence alongside the hidden true profile.

function populateSegmentReveal() {
  const container = document.getElementById('db-segment-reveal');
  if (!container) return;

  const segments = Object.values(G.scenario.segments);

  container.innerHTML = `
    <div class="sr-header">
      <span class="sr-title">Segment Truth Reveal</span>
      <span class="sr-subtitle">What the simulation knew. What you discovered.</span>
    </div>

    <div class="sr-legend">
      <span class="sr-leg-item sr-leg-true">■ True value (hidden)</span>
      <span class="sr-leg-item sr-leg-revealed">■ What you revealed</span>
      <span class="sr-leg-item sr-leg-unknown">□ Not investigated</span>
    </div>

    <div class="sr-segment-list">
      ${segments.map(seg => renderSegmentRevealRow(seg)).join('')}
    </div>
  `;
}

function renderSegmentRevealRow(seg) {
  const ev         = getSegmentEvidence(seg.id);
  const isBeachhead = seg.id === G.activeSegmentId;
  const strength   = computeEvidenceStrength(seg.id);
  const count      = getRevealedSignalCount(seg.id);

  const signals = [
    { key: 'pain',    label: 'Pain',    trueVal: seg.pain,    revealedVal: ev.pain    },
    { key: 'wtp',     label: 'WTP',     trueVal: seg.wtp,     revealedVal: ev.wtp     },
    { key: 'urgency', label: 'Urgency', trueVal: seg.urgency, revealedVal: ev.urgency },
  ];

  // Compute accuracy: how close was revealed to true?
  const accuracy = signals
    .filter(s => s.revealedVal !== null)
    .map(s => 100 - Math.abs(s.trueVal - s.revealedVal))
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  return `
    <div class="sr-seg-block ${isBeachhead ? 'sr-seg-beachhead' : ''}">

      <div class="sr-seg-header">
        <span class="sr-seg-icon">${seg.icon}</span>
        <div class="sr-seg-identity">
          <span class="sr-seg-name">${seg.name}</span>
          ${isBeachhead ? '<span class="sr-bh-tag">your beachhead</span>' : ''}
          <span class="sr-seg-coverage">${count}/3 signals investigated</span>
        </div>
        ${count > 0 ? `<span class="sr-accuracy">~${Math.round(accuracy)}% signal accuracy</span>` : ''}
      </div>

      <div class="sr-signals-grid">
        ${signals.map(s => renderSignalCompare(s)).join('')}
      </div>

      ${isBeachhead && seg.debrief ? `
        <div class="sr-debrief-block">
          <div class="sr-debrief-row">
            <span class="sr-debrief-label">Strength</span>
            <span class="sr-debrief-text">${seg.debrief.strength}</span>
          </div>
          <div class="sr-debrief-row">
            <span class="sr-debrief-label">Weakness</span>
            <span class="sr-debrief-text">${seg.debrief.weakness}</span>
          </div>
          <div class="sr-debrief-row">
            <span class="sr-debrief-label">Best sequence</span>
            <span class="sr-debrief-text">${seg.debrief.bestSequence}</span>
          </div>
          <div class="sr-debrief-row sr-transfer-row">
            <span class="sr-debrief-label">Transfer</span>
            <span class="sr-debrief-text sr-transfer-text">${seg.debrief.transferLesson}</span>
          </div>
        </div>
      ` : ''}

    </div>
  `;
}

function renderSignalCompare(signal) {
  const revealed   = signal.revealedVal !== null;
  const trueVal    = signal.trueVal;
  const revealedVal = signal.revealedVal;
  const diff       = revealed ? Math.abs(trueVal - revealedVal) : null;

  const trueColor  = trueVal >= 65 ? '#2ECC71' : trueVal >= 40 ? '#F39C12' : '#E74C3C';

  return `
    <div class="sr-signal-col">
      <div class="sr-sig-label">${signal.label}</div>

      <!-- True value bar (always shown post-game) -->
      <div class="sr-sig-row sr-sig-true">
        <div class="sr-sig-track">
          <div class="sr-sig-fill sr-fill-true" style="width:${trueVal}%;background:${trueColor}"></div>
        </div>
        <span class="sr-sig-num" style="color:${trueColor}">${trueVal}</span>
      </div>

      <!-- Revealed value bar (or unknown) -->
      <div class="sr-sig-row sr-sig-revealed">
        ${revealed ? `
          <div class="sr-sig-track">
            <div class="sr-sig-fill sr-fill-revealed" style="width:${revealedVal}%"></div>
          </div>
          <span class="sr-sig-num sr-sig-num-revealed">${revealedVal}</span>
          ${diff !== null && diff > 10 ? `<span class="sr-sig-diff">Δ${diff}</span>` : ''}
        ` : `
          <div class="sr-sig-track sr-sig-track-unknown">
            <span class="sr-sig-unknown-label">not investigated</span>
          </div>
        `}
      </div>

    </div>
  `;
}


// ── ACTION HISTORY ──────────────────────────────────────────
// Chronological list of all actions taken, with modifiers.
// Helps students see the sequencing story.

function populateActionHistory() {
  const container = document.getElementById('db-action-history');
  if (!container) return;

  if (G.actionHistory.length === 0) {
    container.innerHTML = '<div class="ah-empty">No actions taken.</div>';
    return;
  }

  container.innerHTML = `
    <div class="ah-header">
      <span class="ah-title">Decision Log</span>
      <span class="ah-subtitle">${G.actionHistory.length} actions · ${G.actionsUsed.length} unique</span>
    </div>

    <div class="ah-list">
      ${G.actionHistory.map((entry, i) => renderHistoryEntry(entry, i)).join('')}
    </div>
  `;
}

function renderHistoryEntry(entry, index) {
  const catColors = {
    research:  '#5BA4CF',
    product:   '#48C9A9',
    channel:   '#A888C2',
    strategic: '#E59866',
  };
  const catColor = catColors[entry.category] || '#7A9AB8';

  const modPct    = entry.modifier;   // already ×100 stored in state
  const modDir    = modPct > 110 ? '▲' : modPct < 90 ? '▼' : '·';
  const modColor  = modPct > 110 ? '#2ECC71' : modPct < 90 ? '#E74C3C' : '#5A7A9A';

  const deltaColor = entry.modifiedDelta > 0 ? '#2ECC71'
                   : entry.modifiedDelta < 0 ? '#E74C3C'
                   : '#5A7A9A';

  const segName = entry.segmentTarget && G.scenario.segments[entry.segmentTarget]
    ? G.scenario.segments[entry.segmentTarget].shortName
    : null;

  return `
    <div class="ah-entry">
      <div class="ah-entry-left">
        <span class="ah-entry-index">${index + 1}</span>
        <div class="ah-entry-body">
          <div class="ah-entry-header">
            <span class="ah-entry-name">${entry.actionName}</span>
            <span class="ah-entry-cat" style="color:${catColor}">${entry.category}</span>
            ${segName ? `<span class="ah-entry-seg">${G.scenario.segments[entry.segmentTarget].icon} ${segName}</span>` : ''}
          </div>
          <div class="ah-entry-outcome">${entry.outcome.title}</div>
          ${entry.signalRevealed ? renderRevealedSignalLine(entry.signalRevealed, entry.segmentTarget) : ''}
        </div>
      </div>
      <div class="ah-entry-right">
        <span class="ah-entry-day">Day ${entry.dayTaken} · Act ${entry.actTaken}</span>
        <div class="ah-entry-stats">
          <span class="ah-delta" style="color:${deltaColor}">${entry.modifiedDelta >= 0 ? '+' : ''}${entry.modifiedDelta} PMF</span>
          <span class="ah-modifier" style="color:${modColor}">${modDir}${modPct}%</span>
        </div>
      </div>
    </div>
  `;
}

function renderRevealedSignalLine(signal, segmentId) {
  const parts = [];
  if (signal.pain    !== null) parts.push(`Pain:${signal.pain}`);
  if (signal.wtp     !== null) parts.push(`WTP:${signal.wtp}`);
  if (signal.urgency !== null) parts.push(`Urgency:${signal.urgency}`);
  if (parts.length === 0) return '';
  const segName = segmentId && G.scenario.segments[segmentId]
    ? G.scenario.segments[segmentId].shortName : '';
  return `<div class="ah-signal-line">Signal revealed (${segName}): ${parts.join(' · ')}</div>`;
}


// ── DEBRIEF QUESTIONS ───────────────────────────────────────
// Five facilitator questions from scenarios.js, displayed prominently.
// These drive the group conversation.

function populateDebriefQuestions() {
  const container = document.getElementById('db-questions');
  if (!container) return;

  const questions = G.scenario.debriefQuestions || [];

  container.innerHTML = `
    <div class="dq-header">
      <span class="dq-title">Facilitator Debrief Questions</span>
      <span class="dq-subtitle">Ask these in order. Give each group 2–3 minutes.</span>
    </div>

    <div class="dq-list">
      ${questions.map((q, i) => `
        <div class="dq-item">
          <span class="dq-num">${i + 1}</span>
          <span class="dq-text">${q}</span>
        </div>
      `).join('')}
    </div>

    <div class="dq-transfer">
      <div class="dq-transfer-label">The transfer question (ask last)</div>
      <div class="dq-transfer-text">
        Pick up the card you wrote at 9:00. Read what you wrote.
        What is different now?
      </div>
    </div>
  `;
}


// ── INJECT HTML ─────────────────────────────────────────────

function injectDebriefHTML() {
  if (document.getElementById('debrief-screen')) return;

  const el = document.createElement('div');
  el.id = 'debrief-screen';
  el.className = 'debrief-screen';
  el.innerHTML = `

    <div class="db-container">

      <!-- Header -->
      <div class="db-masthead">
        <div class="db-masthead-left">
          <div class="db-eyebrow">PMF Lab · Parallax Earth · Simulation Complete</div>
          <div class="db-company">${(G.scenario && G.scenario.name) || 'Parallax Earth'}</div>
        </div>
        <div class="db-masthead-right">
          <button class="btn-secondary db-replay-btn" onclick="replayScenario()">
            Replay ↺
          </button>
        </div>
      </div>

      <!-- Outcome -->
      <div class="db-section db-outcome-section">
        <div id="db-outcome-title" class="db-outcome-title"></div>
        <div id="db-outcome-message" class="db-outcome-message"></div>
        <div id="db-outcome-debrief" class="db-outcome-debrief" style="display:none"></div>

        <div class="db-stats-strip">
          ${[
            ['PMF SCORE',    'db-stat-pmf'],
            ['DAY',          'db-stat-day'],
            ['BUDGET LEFT',  'db-stat-budget'],
            ['D30 RETENTION','db-stat-retention'],
            ['PIVOTS',       'db-stat-pivots'],
            ['ACTIONS',      'db-stat-actions'],
            ['BEACHHEAD',    'db-stat-beachhead'],
            ['SPENT',        'db-stat-spent'],
          ].map(([label, id]) => `
            <div class="db-stat-item">
              <div class="db-stat-label">${label}</div>
              <div id="${id}" class="db-stat-val">—</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Act Trajectory -->
      <div class="db-section">
        <div id="db-trajectory"></div>
      </div>

      <!-- Segment Truth Reveal -->
      <div class="db-section">
        <div id="db-segment-reveal"></div>
      </div>

      <!-- Decision Log -->
      <div class="db-section">
        <div id="db-action-history"></div>
      </div>

      <!-- Debrief Questions -->
      <div class="db-section">
        <div id="db-questions"></div>
      </div>

    </div>
  `;

  document.body.appendChild(el);
}


// ── INJECT CSS ──────────────────────────────────────────────

function injectDebriefCSS() {
  if (document.getElementById('debrief-styles')) return;
  const style = document.createElement('style');
  style.id = 'debrief-styles';
  style.textContent = `

    /* ── DEBRIEF SCREEN ──────────────────────────────── */
    .debrief-screen {
      display:    none;
      position:   fixed;
      inset:      0;
      background: #060C18;
      z-index:    950;
      overflow-y: auto;
    }
    .debrief-screen.open { display: block; }

    .db-container {
      max-width:  860px;
      margin:     0 auto;
      padding:    2rem 1.5rem 4rem;
    }


    /* ── MASTHEAD ─────────────────────────────────────── */
    .db-masthead {
      display:         flex;
      justify-content: space-between;
      align-items:     flex-start;
      margin-bottom:   2rem;
      padding-bottom:  1.2rem;
      border-bottom:   1px solid rgba(255,255,255,0.07);
    }
    .db-eyebrow {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.14em;
      color:          #0D6B6B;
      text-transform: uppercase;
      margin-bottom:  0.3rem;
    }
    .db-company {
      font-size:   1.8rem;
      font-family: 'Georgia', serif;
      color:       #E8EEF5;
    }
    .db-replay-btn { font-size: 0.82rem; }


    /* ── SECTIONS ─────────────────────────────────────── */
    .db-section {
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom:  1px solid rgba(255,255,255,0.06);
    }
    .db-section:last-child { border-bottom: none; }


    /* ── OUTCOME ──────────────────────────────────────── */
    .db-outcome-title {
      font-size:     1.6rem;
      font-family:   'Georgia', serif;
      margin-bottom: 0.6rem;
    }
    .db-strong   { color: #2ECC71; }
    .db-moderate { color: #F39C12; }
    .db-weak     { color: #7A9AB8; }
    .db-failure  { color: #E74C3C; }

    .db-outcome-message {
      font-size:     0.9rem;
      color:         #8AA0B8;
      line-height:   1.6;
      max-width:     620px;
      margin-bottom: 0.75rem;
    }
    .db-outcome-debrief {
      font-size:     0.82rem;
      color:         #C49A4A;
      font-style:    italic;
      line-height:   1.55;
      padding:       0.75rem 1rem;
      background:    rgba(122,69,0,0.08);
      border:        1px solid rgba(122,69,0,0.2);
      border-radius: 6px;
      max-width:     580px;
      margin-bottom: 1.2rem;
    }

    .db-stats-strip {
      display:               grid;
      grid-template-columns: repeat(4, 1fr);
      gap:                   1px;
      background:            rgba(255,255,255,0.06);
      border-radius:         9px;
      overflow:              hidden;
      margin-top:            1.2rem;
    }
    .db-stat-item {
      background: #090F1E;
      padding:    0.8rem 1rem;
      text-align: center;
    }
    .db-stat-label {
      font-size:      0.55rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:          #3A5A7A;
      text-transform: uppercase;
      margin-bottom:  0.3rem;
    }
    .db-stat-val {
      font-size:   1rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #E8EEF5;
      font-weight: 600;
    }


    /* ── TRAJECTORY ───────────────────────────────────── */
    .traj-header {
      display:        flex;
      justify-content: space-between;
      align-items:    baseline;
      margin-bottom:  1rem;
    }
    .traj-title {
      font-size:   0.95rem;
      font-weight: 700;
      color:       #C8D8E8;
    }
    .traj-subtitle {
      font-size:  0.75rem;
      color:      #5A7A9A;
      font-style: italic;
    }

    .traj-bars {
      background:    rgba(255,255,255,0.02);
      border:        1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      padding:       1rem 1.2rem;
      margin-bottom: 1rem;
    }
    .traj-bar-row {
      display:        grid;
      grid-template-columns: 52px 1fr 40px 44px;
      align-items:    center;
      gap:            0.6rem;
      margin-bottom:  0.6rem;
    }
    .traj-bar-row:last-child { margin-bottom: 0; }
    .traj-bar-label {
      font-size:   0.7rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
      text-align:  right;
    }
    .traj-bar-track {
      height:        8px;
      background:    rgba(255,255,255,0.05);
      border-radius: 4px;
      overflow:      hidden;
    }
    .traj-bar-fill {
      height:        100%;
      border-radius: 4px;
      transition:    width 0.5s ease;
      min-width:     2px;
    }
    .traj-bar-val {
      font-size:   0.75rem;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 700;
      text-align:  right;
    }
    .traj-bar-delta {
      font-size:   0.68rem;
      font-family: 'IBM Plex Mono', monospace;
      text-align:  right;
    }

    .traj-snapshots {
      display:     flex;
      align-items: flex-start;
      gap:         0.4rem;
      margin-bottom: 0.75rem;
    }
    .traj-snap {
      flex:          1;
      background:    rgba(255,255,255,0.03);
      border:        1px solid rgba(255,255,255,0.07);
      border-radius: 7px;
      padding:       0.7rem 0.8rem;
    }
    .traj-snap-act {
      font-size:      0.6rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom:  0.2rem;
    }
    .traj-snap-pmf {
      font-size:   0.95rem;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 700;
      color:       #E8EEF5;
    }
    .traj-snap-meta {
      font-size:  0.68rem;
      color:      #5A7A9A;
      margin-top: 0.2rem;
    }
    .traj-snap-seg {
      font-size:  0.7rem;
      color:      #0D9B9B;
      margin-top: 0.3rem;
    }
    .traj-arrow {
      font-size:   1.2rem;
      color:       #2A3A4A;
      align-self:  center;
      flex-shrink: 0;
      padding-top: 0.8rem;
    }

    .traj-insight {
      background:    rgba(13,107,107,0.06);
      border:        1px solid rgba(13,107,107,0.18);
      border-radius: 7px;
      padding:       0.8rem 1rem;
    }
    .traj-insight-row {
      display:         flex;
      justify-content: space-between;
      align-items:     center;
      padding:         0.25rem 0;
    }
    .traj-insight-label {
      font-size:   0.75rem;
      color:       #5A8A9A;
    }
    .traj-insight-val {
      font-size:   0.78rem;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
    }


    /* ── SEGMENT REVEAL ───────────────────────────────── */
    .sr-header {
      display:         flex;
      justify-content: space-between;
      align-items:     baseline;
      margin-bottom:   0.6rem;
    }
    .sr-title {
      font-size:   0.95rem;
      font-weight: 700;
      color:       #C8D8E8;
    }
    .sr-subtitle {
      font-size:  0.75rem;
      color:      #5A7A9A;
      font-style: italic;
    }

    .sr-legend {
      display:       flex;
      gap:           1.2rem;
      margin-bottom: 0.8rem;
    }
    .sr-leg-item {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
    }
    .sr-leg-true     { color: #2ECC71; }
    .sr-leg-revealed { color: #0D9B9B; }
    .sr-leg-unknown  { color: #3A4A5A; }

    .sr-segment-list {
      display:        flex;
      flex-direction: column;
      gap:            0.7rem;
    }

    .sr-seg-block {
      background:    rgba(255,255,255,0.02);
      border:        1px solid rgba(255,255,255,0.08);
      border-radius: 9px;
      padding:       1rem 1.1rem;
    }
    .sr-seg-beachhead {
      border-color:  rgba(13,107,107,0.4);
      background:    rgba(13,107,107,0.05);
    }

    .sr-seg-header {
      display:        flex;
      align-items:    flex-start;
      gap:            0.6rem;
      margin-bottom:  0.9rem;
    }
    .sr-seg-icon   { font-size: 1.1rem; }
    .sr-seg-identity {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .sr-seg-name {
      font-size:   0.9rem;
      font-weight: 700;
      color:       #C8D8E8;
    }
    .sr-bh-tag {
      font-size:      0.58rem;
      font-family:    'IBM Plex Mono', monospace;
      background:     rgba(13,107,107,0.2);
      color:          #0D9B9B;
      padding:        0.1rem 0.35rem;
      border-radius:  3px;
      width:          fit-content;
    }
    .sr-seg-coverage {
      font-size:  0.68rem;
      color:      #5A7A9A;
      font-family:'IBM Plex Mono', monospace;
    }
    .sr-accuracy {
      font-size:   0.7rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #0D9B9B;
      align-self:  flex-start;
    }

    .sr-signals-grid {
      display:               grid;
      grid-template-columns: repeat(3, 1fr);
      gap:                   0.7rem;
      margin-bottom:         0.8rem;
    }
    .sr-signal-col {
      display:        flex;
      flex-direction: column;
      gap:            0.3rem;
    }
    .sr-sig-label {
      font-size:      0.6rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:          #3A5A7A;
      text-transform: uppercase;
      margin-bottom:  0.1rem;
    }
    .sr-sig-row {
      display:     flex;
      align-items: center;
      gap:         0.4rem;
    }
    .sr-sig-track {
      flex:          1;
      height:        6px;
      background:    rgba(255,255,255,0.05);
      border-radius: 3px;
      overflow:      hidden;
      position:      relative;
    }
    .sr-sig-track-unknown {
      display:     flex;
      align-items: center;
      height:      auto;
      background:  transparent;
    }
    .sr-sig-unknown-label {
      font-size:  0.6rem;
      color:      #2A3A4A;
      font-style: italic;
    }
    .sr-sig-fill {
      height:        100%;
      border-radius: 3px;
      transition:    width 0.5s ease;
    }
    .sr-fill-true     { opacity: 0.9; }
    .sr-fill-revealed { background: #0D6B6B; opacity: 0.8; }
    .sr-sig-num {
      font-size:   0.68rem;
      font-family: 'IBM Plex Mono', monospace;
      min-width:   22px;
      text-align:  right;
    }
    .sr-sig-num-revealed { color: #0D9B9B; }
    .sr-sig-diff {
      font-size:   0.6rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #C49A4A;
    }

    .sr-debrief-block {
      border-top:  1px solid rgba(255,255,255,0.07);
      padding-top: 0.75rem;
    }
    .sr-debrief-row {
      display:       grid;
      grid-template-columns: 90px 1fr;
      gap:           0.5rem;
      margin-bottom: 0.5rem;
      align-items:   baseline;
    }
    .sr-debrief-row:last-child { margin-bottom: 0; }
    .sr-debrief-label {
      font-size:      0.62rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.08em;
      color:          #3A5A7A;
      text-transform: uppercase;
    }
    .sr-debrief-text {
      font-size:   0.78rem;
      color:       #8AA0B8;
      line-height: 1.5;
    }
    .sr-transfer-row  { margin-top: 0.4rem; }
    .sr-transfer-text {
      color:       #C8D8E8;
      font-style:  italic;
      font-size:   0.82rem;
    }


    /* ── DECISION LOG ─────────────────────────────────── */
    .ah-header {
      display:         flex;
      justify-content: space-between;
      align-items:     baseline;
      margin-bottom:   0.8rem;
    }
    .ah-title {
      font-size:   0.95rem;
      font-weight: 700;
      color:       #C8D8E8;
    }
    .ah-subtitle {
      font-size:  0.72rem;
      color:      #5A7A9A;
      font-family: 'IBM Plex Mono', monospace;
    }
    .ah-empty {
      font-size:  0.78rem;
      color:      #2A3A4A;
      font-style: italic;
    }

    .ah-list {
      display:        flex;
      flex-direction: column;
      gap:            0;
    }
    .ah-entry {
      display:         flex;
      justify-content: space-between;
      align-items:     flex-start;
      gap:             0.6rem;
      padding:         0.65rem 0;
      border-bottom:   1px solid rgba(255,255,255,0.04);
    }
    .ah-entry:last-child { border-bottom: none; }

    .ah-entry-left {
      display:     flex;
      gap:         0.6rem;
      align-items: flex-start;
      flex:        1;
      min-width:   0;
    }
    .ah-entry-index {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #2A3A4A;
      min-width:   18px;
      text-align:  right;
      padding-top: 0.1rem;
    }
    .ah-entry-body { flex: 1; min-width: 0; }
    .ah-entry-header {
      display:     flex;
      align-items: center;
      gap:         0.4rem;
      flex-wrap:   wrap;
      margin-bottom: 0.15rem;
    }
    .ah-entry-name {
      font-size:   0.82rem;
      font-weight: 600;
      color:       #C8D8E8;
    }
    .ah-entry-cat {
      font-size:   0.62rem;
      font-family: 'IBM Plex Mono', monospace;
    }
    .ah-entry-seg {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #0D9B9B;
    }
    .ah-entry-outcome {
      font-size:   0.74rem;
      color:       #5A7A9A;
      line-height: 1.4;
    }
    .ah-signal-line {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #0D6B6B;
      margin-top:  0.2rem;
    }

    .ah-entry-right {
      text-align:  right;
      flex-shrink: 0;
    }
    .ah-entry-day {
      font-size:   0.62rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #3A5A7A;
      display:     block;
      margin-bottom: 0.2rem;
    }
    .ah-entry-stats {
      display:     flex;
      gap:         0.5rem;
      justify-content: flex-end;
    }
    .ah-delta, .ah-modifier {
      font-size:   0.7rem;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
    }


    /* ── DEBRIEF QUESTIONS ────────────────────────────── */
    .dq-header {
      display:         flex;
      justify-content: space-between;
      align-items:     baseline;
      margin-bottom:   1rem;
    }
    .dq-title {
      font-size:   0.95rem;
      font-weight: 700;
      color:       #C8D8E8;
    }
    .dq-subtitle {
      font-size:  0.72rem;
      color:      #5A7A9A;
      font-style: italic;
    }

    .dq-list {
      display:        flex;
      flex-direction: column;
      gap:            0.5rem;
      margin-bottom:  1.2rem;
    }
    .dq-item {
      display:       flex;
      gap:           0.75rem;
      align-items:   flex-start;
      padding:       0.75rem 0.9rem;
      background:    rgba(255,255,255,0.03);
      border:        1px solid rgba(255,255,255,0.07);
      border-radius: 7px;
    }
    .dq-num {
      font-size:      0.7rem;
      font-family:    'IBM Plex Mono', monospace;
      color:          #0D6B6B;
      font-weight:    700;
      min-width:      16px;
      padding-top:    0.1rem;
    }
    .dq-text {
      font-size:   0.82rem;
      color:       #9BB0C8;
      line-height: 1.5;
    }

    .dq-transfer {
      background:    rgba(13,107,107,0.08);
      border:        1px solid rgba(13,107,107,0.25);
      border-radius: 8px;
      padding:       1rem 1.2rem;
    }
    .dq-transfer-label {
      font-size:      0.62rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:          #0D6B6B;
      text-transform: uppercase;
      margin-bottom:  0.4rem;
    }
    .dq-transfer-text {
      font-size:   0.9rem;
      font-family: 'Georgia', serif;
      color:       #C8D8E8;
      line-height: 1.6;
    }

  `;
  document.head.appendChild(style);
}


// ── EXPORT ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showDebrief };
} else {
  window.showDebrief = showDebrief;
}
