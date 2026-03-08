// ═══════════════════════════════════════════════════════════
// PMF LAB — MAIN GAME UI
// components/ui-main.js
//
// Renders the persistent in-game interface:
//   1. Top bar      — act indicator, day, budget, PMF
//   2. Segment panel — evidence accumulation per segment
//   3. Action grid  — available actions with state
//   4. Activity feed — log of events and signals
//   5. Splash screen — company brief + launch
//
// renderAll() is the single re-render entry point.
// Called by logic.js after every state change.
// ═══════════════════════════════════════════════════════════


// ── TOP BAR ────────────────────────────────────────────────
// Act strip + live metrics. Stays visible throughout.

function renderTopBar() {
  const bar = document.getElementById('top-bar');
  if (!bar || !G.scenario) return;

  const act    = getCurrentAct();
  const actDef = getCurrentActDef();
  const pct    = Math.round(G.pmfScore);
  const pmfColor = pct >= 65 ? '#2ECC71' : pct >= 40 ? '#F39C12' : pct >= 20 ? '#0D9B9B' : '#8B9BAA';

  bar.innerHTML = `
    <div class="tb-act-strip">

      <!-- Act progression pills -->
      <div class="tb-acts">
        ${[1,2,3].map(n => {
          const def   = G.scenario.acts[n];
          const done  = n === 1 ? G.actGates.act1Complete
                      : n === 2 ? G.actGates.act2Complete : false;
          const active = n === act;
          const locked = n > act && !(n === 2 && G.actGates.act1Complete)
                                 && !(n === 3 && G.actGates.act2Complete);
          return `
            <div class="tb-act-pill ${active ? 'tb-act-active' : ''} ${done ? 'tb-act-done' : ''} ${locked ? 'tb-act-locked' : ''}">
              <span class="tb-act-num">${done ? '✓' : `${n}`}</span>
              <span class="tb-act-name">${def.name.replace('Act I — ','').replace('Act II — ','').replace('Act III — ','')}</span>
              ${active ? '<span class="tb-act-live">LIVE</span>' : ''}
            </div>
          `;
        }).join('<div class="tb-act-arrow">›</div>')}
      </div>

      <!-- Live metrics -->
      <div class="tb-metrics">
        <div class="tb-metric">
          <span class="tb-metric-label">DAY</span>
          <span class="tb-metric-val">${G.day}<span class="tb-metric-total">/${G.totalDays}</span></span>
        </div>
        <div class="tb-metric-divider"></div>
        <div class="tb-metric">
          <span class="tb-metric-label">BUDGET</span>
          <span class="tb-metric-val" style="color:${budgetPct() < 0.2 ? '#E74C3C' : '#E8EEF5'}">${fmtBudget(G.budget)}</span>
        </div>
        <div class="tb-metric-divider"></div>
        <div class="tb-metric">
          <span class="tb-metric-label">PMF</span>
          <span class="tb-metric-val" style="color:${pmfColor}">${pct}%</span>
        </div>
        <div class="tb-metric-divider"></div>
        <div class="tb-metric">
          <span class="tb-metric-label">BURN</span>
          <span class="tb-metric-val">${fmtBudget(actDef.dailyBurn)}/day</span>
        </div>
      </div>
      <button class="tb-end-btn" onclick="forceEndGame()">End →</button>

    </div>

    <!-- Runway bar -->
    <div class="tb-runway-track">
      <div class="tb-runway-fill" style="width:${Math.min(100, (G.day / G.totalDays) * 100)}%"></div>
      <!-- Act boundary markers -->
      <div class="tb-act-marker" style="left:${(30/90)*100}%"></div>
      <div class="tb-act-marker" style="left:${(75/90)*100}%"></div>
    </div>
  `;
}


// ── SEGMENT EVIDENCE PANEL ─────────────────────────────────
// Shows accumulated signal for each segment.
// This is the primary feedback mechanism in Act I.

function renderSegmentPanel() {
  const panel = document.getElementById('segment-panel');
  if (!panel || !G.scenario) return;

  const segments   = Object.values(G.scenario.segments);
  const act        = getCurrentAct();
  const isActI     = act === 1;
  const activeId   = G.activeSegmentId;

  panel.innerHTML = `
    <div class="sp-header">
      <span class="sp-title">Segment Evidence</span>
      <span class="sp-subtitle">${isActI
        ? 'Investigate segments to reveal signal'
        : activeId ? `Beachhead: ${G.scenario.segments[activeId].shortName}` : 'No beachhead set'
      }</span>
    </div>

    <div class="sp-segment-list">
      ${segments.map(seg => renderSegmentRow(seg, activeId)).join('')}
    </div>

    ${!isActI && activeId ? `
      <div class="sp-beachhead-note">
        <span class="sp-bh-icon">${G.scenario.segments[activeId].icon}</span>
        <span class="sp-bh-text">
          Building for <strong>${G.scenario.segments[activeId].name}</strong>.
          ${G.metrics.pivotCount > 0 ? `Pivoted ${G.metrics.pivotCount}× so far.` : ''}
        </span>
      </div>
    ` : ''}
  `;
}

function renderSegmentRow(seg, activeId) {
  const ev       = getSegmentEvidence(seg.id);
  const strength = computeEvidenceStrength(seg.id);
  const count    = getRevealedSignalCount(seg.id);
  const isActive = seg.id === activeId;
  const isBlank  = count === 0;

  const painVal    = ev.pain    !== null ? ev.pain    : null;
  const wtpVal     = ev.wtp     !== null ? ev.wtp     : null;
  const urgencyVal = ev.urgency !== null ? ev.urgency : null;

  // Signal quality label
  const qualityLabel = strength >= 60 ? 'Strong'
                     : strength >= 35 ? 'Partial'
                     : count > 0      ? 'Weak'
                     : 'Unknown';
  const qualityColor = strength >= 60 ? '#2ECC71'
                     : strength >= 35 ? '#F39C12'
                     : count > 0      ? '#0D9B9B'
                     : '#3A4A5A';

  return `
    <div class="seg-row ${isActive ? 'seg-row-active' : ''} ${isBlank ? 'seg-row-blank' : ''}">

      <div class="seg-identity">
        <span class="seg-icon">${seg.icon}</span>
        <div class="seg-name-block">
          <span class="seg-name">${seg.shortName}</span>
          ${isActive ? '<span class="seg-active-tag">beachhead</span>' : ''}
        </div>
      </div>

      <div class="seg-signals">
        ${renderSignalDot('P', painVal, 'Pain')}
        ${renderSignalDot('W', wtpVal, 'WTP')}
        ${renderSignalDot('U', urgencyVal, 'Urgency')}
      </div>

      <div class="seg-strength-col">
        <div class="seg-strength-track">
          <div class="seg-strength-fill" style="width:${strength}%;background:${qualityColor}"></div>
        </div>
        <span class="seg-quality-label" style="color:${qualityColor}">${qualityLabel}</span>
      </div>

    </div>
  `;
}

function renderSignalDot(label, value, title) {
  const revealed = value !== null;
  const high     = value >= 65;
  const med      = value >= 40;
  const dotColor = !revealed ? '#1E2E3E'
                 : high      ? '#2ECC71'
                 : med       ? '#F39C12'
                 :             '#E74C3C';
  const display  = revealed ? value : '?';

  return `
    <div class="sig-dot-wrap" title="${title}: ${revealed ? value : 'not revealed'}">
      <div class="sig-dot" style="background:${dotColor};border-color:${revealed ? dotColor : '#2A3A4A'}">
        ${display}
      </div>
      <span class="sig-dot-label">${label}</span>
    </div>
  `;
}


// ── ACTION GRID ─────────────────────────────────────────────
// Renders all available/locked actions.
// Active filter controlled by G state (set via filterActions).

function renderActionGrid() {
  const grid = document.getElementById('action-grid');
  if (!grid || !G.scenario) return;

  // Category tabs
  const categories = ['all', 'research', 'product', 'channel', 'strategic'];
  const activeFilter = G.activeFilter || 'all';

  grid.innerHTML = `
    <div class="ag-tabs">
      ${categories.map(cat => `
        <button
          class="ag-tab ${activeFilter === cat ? 'ag-tab-active' : ''} ${cat !== 'all' && isCategoryLocked(cat) ? 'ag-tab-locked' : ''}"
          onclick="setActionFilter('${cat}')"
          data-cat="${cat}"
        >
          ${cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          ${cat !== 'all' && isCategoryLocked(cat) ? ' 🔒' : ''}
        </button>
      `).join('')}
    </div>

    <div class="ag-cards" id="ag-cards">
      ${renderActionCards(activeFilter)}
    </div>
  `;
}

function renderActionCards(filter) {
  if (!G.scenario) return '';
  const actions = (typeof ACTIONS !== 'undefined' ? ACTIONS : [])
    .filter(a => filter === 'all' || a.category === filter);

  if (actions.length === 0) return '<div class="ag-empty">No actions in this category.</div>';

  return actions.map(action => {
    const cardState = getActionCardState(action);
    const isAvail   = cardState.state === 'available';
    const isUsed    = cardState.state === 'used';
    const isLocked  = cardState.state === 'locked';

    const catColors = {
      research:  '#1A5276',
      product:   '#0E6655',
      channel:   '#4A235A',
      strategic: '#7A4500',
    };
    const accentColor = catColors[action.category] || '#1A3F5A';

    return `
      <div
        class="ac-card ${isAvail ? 'ac-available' : ''} ${isUsed ? 'ac-used' : ''} ${isLocked ? 'ac-locked' : ''}"
        data-action-id="${action.id}"
        data-type="${action.category}"
        onclick="${isAvail ? `selectAction('${action.id}')` : ''}"
        style="--accent:${accentColor}"
      >
        <div class="ac-accent-bar"></div>

        <div class="ac-header">
          <span class="ac-cat-tag ac-cat-${action.category}">${action.category}</span>
          <span class="ac-cost">
            ${action.cost.days}d · ${fmtBudget(action.cost.budget)}
          </span>
        </div>

        <div class="ac-name">${action.name}</div>
        <div class="ac-desc">${action.desc || action.description || ''}</div>

        ${action.segmentChoice ? '<div class="ac-segment-badge">🎯 Choose segment</div>' : ''}
        ${action.isPivot ? '<div class="ac-pivot-badge">⚡ Pivot: 14 days + €8K cost</div>' : ''}

        <div class="ac-footer">
          ${isUsed   ? '<span class="ac-status ac-status-used">✓ Complete</span>' : ''}
          ${isLocked ? `<span class="ac-status ac-status-locked">🔒 ${cardState.reason}</span>` : ''}
          ${cardState.state === 'unaffordable' ? `<span class="ac-status ac-status-unaffordable">⚠ ${cardState.reason}</span>` : ''}
          ${cardState.state === 'no-time'      ? `<span class="ac-status ac-status-notime">⏱ ${cardState.reason}</span>` : ''}
          ${isAvail  ? '<span class="ac-status ac-status-avail">→ Select</span>' : ''}
        </div>

        ${isUsed ? '<div class="ac-used-overlay"></div>' : ''}
      </div>
    `;
  }).join('');
}

function setActionFilter(cat) {
  G.activeFilter = cat;
  renderActionGrid();
}


// ── ACTIVITY FEED ───────────────────────────────────────────
// Rolling log of events. Most recent at top.

function renderActivityFeed() {
  const feed = document.getElementById('activity-feed');
  if (!feed) return;

  const items = G.activityLog.slice().reverse().slice(0, 12);
  if (items.length === 0) {
    feed.innerHTML = `<div class="af-empty">Actions and signals will appear here.</div>`;
    return;
  }

  feed.innerHTML = items.map(item => {
    const icons = { do: '▶', learn: '◆', warn: '⚠', good: '✓' };
    const colors = {
      do:   '#7A9AB8',
      learn: '#0D9B9B',
      warn:  '#C49A4A',
      good:  '#2ECC71',
    };
    const icon  = icons[item.type]  || '·';
    const color = colors[item.type] || '#7A9AB8';
    return `
      <div class="af-item af-${item.type}">
        <span class="af-icon" style="color:${color}">${icon}</span>
        <div class="af-content">
          <span class="af-msg">${item.message}</span>
          <span class="af-meta">Day ${item.day} · Act ${item.act}</span>
        </div>
      </div>
    `;
  }).join('');
}


// ── SPLASH SCREEN ───────────────────────────────────────────
// Company brief + four segment preview + launch button.

function renderSplash() {
  const splash = document.getElementById('splash');
  if (!splash || !G.scenario) return;

  const sc = G.scenario;
  const segments = Object.values(sc.segments);

  splash.innerHTML = `
    <div class="sl-container">

      <div class="sl-header">
        <div class="sl-eyebrow">PMF Lab · ISU MSS 2026</div>
        <h1 class="sl-company">${sc.name}</h1>
        <p class="sl-tagline">${sc.tagline}</p>
      </div>

      <div class="sl-brief">
        <div class="sl-brief-row">
          <span class="sl-brief-label">Technology</span>
          <span class="sl-brief-val">${sc.brief.technology}</span>
        </div>
        <div class="sl-brief-row">
          <span class="sl-brief-label">Situation</span>
          <span class="sl-brief-val">${sc.brief.situation}</span>
        </div>
        <div class="sl-brief-row">
          <span class="sl-brief-label">Founders</span>
          <span class="sl-brief-val">${sc.brief.founders}</span>
        </div>
        <div class="sl-tension">${sc.brief.tension}</div>
      </div>

      <div class="sl-segments">
        <div class="sl-seg-label">Four candidate segments. No proven beachhead.</div>
        <div class="sl-seg-grid">
          ${segments.map(seg => `
            <div class="sl-seg-card">
              <span class="sl-seg-icon">${seg.icon}</span>
              <span class="sl-seg-name">${seg.shortName}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="sl-acts">
        ${[1,2,3].map(n => {
          const def = sc.acts[n];
          return `
            <div class="sl-act-card">
              <div class="sl-act-num">Act ${n}</div>
              <div class="sl-act-name">${def.name.split('—')[1]?.trim() || def.name}</div>
              <div class="sl-act-days">Days ${n===1?'1–30':n===2?'31–75':'76–90'}</div>
              <div class="sl-act-burn">${fmtBudget(def.dailyBurn)}/day</div>
            </div>
          `;
        }).join('')}
      </div>

      <button class="sl-launch-btn" onclick="startGame()">
        Begin Simulation →
      </button>

      <div class="sl-footer">
        Groups of 3 · Write every hypothesis on your card before confirming
      </div>

    </div>
  `;
}


// ── MAIN RENDER ─────────────────────────────────────────────
// Single entry point. Logic.js calls this after every action.

function renderAll() {
  // Check if player is stuck — all actions unaffordable or out of time
  if (!G.isOver && G.scenario) {
    const stuck = !ACTIONS.some(a => {
      const s = getActionCardState(a);
      return s.state === 'available';
    });
    if (stuck) {
      G.isOver = true;
      G.failureMode = G.budget <= 0 ? 'runway' : 'time';
      snapshotAct(getCurrentAct());
      setTimeout(showDebrief, 800);
      return;
    }
  }
  renderTopBar();
  renderSegmentPanel();
  renderActionGrid();
  renderActivityFeed();
}


// ── CSS ─────────────────────────────────────────────────────

function injectMainCSS() {
  const style = document.createElement('style');
  style.textContent = `

    /* ── RESET & BASE ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --navy:   #0B1F3A;
      --teal:   #0D6B6B;
      --teal2:  #0D9B9B;
      --blue:   #1A3F6F;
      --rust:   #8B2500;
      --amber:  #7A4500;
      --slate:  #2E3A4A;
      --cream:  #E8EEF5;
      --mid:    #7A9AB8;
      --dim:    #3A4A5A;
      --good:   #2ECC71;
      --bad:    #E74C3C;
      --warn:   #F39C12;
      --bg:     #070E1A;
    }

    body {
      background:  var(--bg);
      color:       var(--cream);
      font-family: 'Inter', system-ui, sans-serif;
      font-size:   14px;
      line-height: 1.5;
      min-height:  100vh;
    }

    #app {
      display:        grid;
      grid-template-rows: auto 1fr;
      grid-template-columns: 280px 1fr 260px;
      grid-template-areas:
        "topbar  topbar  topbar"
        "segment actions feed";
      height:     100vh;
      overflow:   hidden;
      opacity:    0;
      transition: opacity 0.4s ease;
    }
    #app.visible { opacity: 1; }


    /* ── TOP BAR ──────────────────────────────────────── */
    #top-bar {
      grid-area:   topbar;
      background:  #0A1828;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding:     0;
    }

    .tb-act-strip {
      display:         flex;
      align-items:     center;
      justify-content: space-between;
      padding:         0.6rem 1.2rem;
    }

    .tb-acts {
      display:     flex;
      align-items: center;
      gap:         0.25rem;
    }
    .tb-act-pill {
      display:        flex;
      align-items:    center;
      gap:            0.4rem;
      padding:        0.3rem 0.75rem;
      border-radius:  20px;
      border:         1px solid rgba(255,255,255,0.1);
      background:     rgba(255,255,255,0.03);
      font-size:      0.72rem;
      color:          #5A7A9A;
      transition:     all 0.2s;
    }
    .tb-act-pill.tb-act-active {
      background:   rgba(13,107,107,0.2);
      border-color: #0D6B6B;
      color:        #0D9B9B;
    }
    .tb-act-pill.tb-act-done {
      background:   rgba(46,204,113,0.08);
      border-color: rgba(46,204,113,0.3);
      color:        #2ECC71;
    }
    .tb-act-pill.tb-act-locked {
      opacity: 0.4;
    }
    .tb-act-num {
      font-family:  'IBM Plex Mono', monospace;
      font-size:    0.7rem;
      font-weight:  700;
    }
    .tb-act-name {
      font-size: 0.72rem;
    }
    .tb-act-live {
      font-size:      0.55rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      background:     #0D6B6B;
      color:          #E8EEF5;
      padding:        0.1rem 0.35rem;
      border-radius:  3px;
    }
    .tb-act-arrow {
      color:     #2A3A4A;
      font-size: 1rem;
      margin:    0 0.1rem;
    }

    .tb-metrics {
      display:     flex;
      align-items: center;
      gap:         0;
    }
    .tb-metric {
      display:       flex;
      flex-direction: column;
      align-items:   center;
      padding:       0 1rem;
    }
    .tb-metric-label {
      font-size:      0.55rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:          #3A5A7A;
      text-transform: uppercase;
    }
    .tb-metric-val {
      font-size:   0.9rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       var(--cream);
      font-weight: 600;
    }
    .tb-metric-total {
      font-size: 0.7rem;
      color:     #3A5A7A;
    }
    .tb-metric-divider {
      width:      1px;
      height:     28px;
      background: rgba(255,255,255,0.07);
    }

    .tb-runway-track {
      height:     3px;
      background: rgba(255,255,255,0.05);
      position:   relative;
    }
    .tb-runway-fill {
      height:     100%;
      background: linear-gradient(90deg, #0D6B6B, #8B2500);
      transition: width 0.4s ease;
    }
    .tb-act-marker {
      position:   absolute;
      top:        0;
      width:      1px;
      height:     100%;
      background: rgba(255,255,255,0.2);
    }
.tb-end-btn {
  background:    transparent;
  border:        1px solid rgba(139,37,0,0.4);
  color:         #C04A1A;
  font-size:     0.72rem;
  font-family:   'IBM Plex Mono', monospace;
  padding:       0.3rem 0.75rem;
  border-radius: 20px;
  cursor:        pointer;
  margin-left:   1rem;
  transition:    all 0.15s;
}
.tb-end-btn:hover {
  background:  rgba(139,37,0,0.15);
  border-color: #C04A1A;
}

    /* ── SEGMENT PANEL ────────────────────────────────── */
    #segment-panel {
      grid-area:    segment;
      background:   #080F1C;
      border-right: 1px solid rgba(255,255,255,0.06);
      overflow-y:   auto;
      padding:      1rem;
    }

    .sp-header {
      margin-bottom: 0.9rem;
      padding-bottom: 0.7rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .sp-title {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.14em;
      color:          #3A5A7A;
      text-transform: uppercase;
      display:        block;
      margin-bottom:  0.2rem;
    }
    .sp-subtitle {
      font-size:  0.8rem;
      color:      #7A9AB8;
    }

    .sp-segment-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .seg-row {
      background:    rgba(255,255,255,0.03);
      border:        1px solid rgba(255,255,255,0.07);
      border-radius: 7px;
      padding:       0.7rem 0.8rem;
      transition:    all 0.2s;
    }
    .seg-row-active {
      border-color:  rgba(13,107,107,0.4);
      background:    rgba(13,107,107,0.06);
    }
    .seg-row-blank {
      opacity: 0.6;
    }

    .seg-identity {
      display:        flex;
      align-items:    center;
      gap:            0.4rem;
      margin-bottom:  0.5rem;
    }
    .seg-icon  { font-size: 1rem; }
    .seg-name-block {
      display:     flex;
      align-items: center;
      gap:         0.4rem;
    }
    .seg-name {
      font-size:   0.82rem;
      font-weight: 600;
      color:       #C8D8E8;
    }
    .seg-active-tag {
      font-size:      0.58rem;
      font-family:    'IBM Plex Mono', monospace;
      background:     rgba(13,107,107,0.2);
      color:          #0D9B9B;
      padding:        0.1rem 0.35rem;
      border-radius:  3px;
      letter-spacing: 0.08em;
    }

    .seg-signals {
      display:       flex;
      gap:           0.5rem;
      margin-bottom: 0.5rem;
    }
    .sig-dot-wrap {
      display:        flex;
      flex-direction: column;
      align-items:    center;
      gap:            0.15rem;
    }
    .sig-dot {
      width:         32px;
      height:        32px;
      border-radius: 50%;
      border:        1.5px solid;
      display:       flex;
      align-items:   center;
      justify-content: center;
      font-size:     0.65rem;
      font-family:   'IBM Plex Mono', monospace;
      font-weight:   700;
      color:         #0A1020;
    }
    .sig-dot-label {
      font-size:      0.55rem;
      font-family:    'IBM Plex Mono', monospace;
      color:          #3A5A7A;
      letter-spacing: 0.05em;
    }

    .seg-strength-col {
      display:     flex;
      align-items: center;
      gap:         0.5rem;
    }
    .seg-strength-track {
      flex:          1;
      height:        4px;
      background:    rgba(255,255,255,0.06);
      border-radius: 2px;
      overflow:      hidden;
    }
    .seg-strength-fill {
      height:        100%;
      border-radius: 2px;
      transition:    width 0.4s ease;
      min-width:     0;
    }
    .seg-quality-label {
      font-size:   0.62rem;
      font-family: 'IBM Plex Mono', monospace;
      white-space: nowrap;
      min-width:   44px;
      text-align:  right;
    }

    .sp-beachhead-note {
      display:        flex;
      align-items:    flex-start;
      gap:            0.4rem;
      margin-top:     0.75rem;
      padding:        0.6rem 0.8rem;
      background:     rgba(13,107,107,0.07);
      border:         1px solid rgba(13,107,107,0.2);
      border-radius:  6px;
    }
    .sp-bh-icon { font-size: 0.9rem; }
    .sp-bh-text {
      font-size:   0.75rem;
      color:       #7A9AB8;
      line-height: 1.45;
    }
    .sp-bh-text strong { color: #0D9B9B; }


    /* ── ACTION GRID ──────────────────────────────────── */
    #action-grid {
      grid-area:  actions;
      overflow-y: auto;
      padding:    1rem 1.2rem;
    }

    .ag-tabs {
      display:       flex;
      gap:           0.35rem;
      margin-bottom: 1rem;
      flex-wrap:     wrap;
    }
    .ag-tab {
      padding:       0.35rem 0.85rem;
      border-radius: 20px;
      border:        1px solid rgba(255,255,255,0.1);
      background:    transparent;
      color:         #7A9AB8;
      font-size:     0.75rem;
      cursor:        pointer;
      transition:    all 0.15s;
    }
    .ag-tab:hover      { background: rgba(255,255,255,0.05); color: #E8EEF5; }
    .ag-tab-active     { background: rgba(13,107,107,0.2); border-color: #0D6B6B; color: #0D9B9B; }
    .ag-tab-locked     { opacity: 0.45; cursor: default; }

    .ag-cards {
      display:               grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap:                   0.7rem;
    }

    .ac-card {
      background:    rgba(255,255,255,0.03);
      border:        1px solid rgba(255,255,255,0.09);
      border-radius: 9px;
      padding:       0.9rem 0.9rem 0.9rem 1.1rem;
      position:      relative;
      overflow:      hidden;
      transition:    all 0.15s ease;
    }
    .ac-available {
      cursor: pointer;
    }
    .ac-available:hover {
      background:  rgba(13,107,107,0.1);
      border-color: rgba(13,107,107,0.4);
      transform:   translateY(-1px);
      box-shadow:  0 4px 16px rgba(0,0,0,0.3);
    }
    .ac-used {
      opacity: 0.45;
      cursor:  default;
    }
    .ac-locked {
      opacity: 0.55;
      cursor:  default;
    }

    .ac-accent-bar {
      position:      absolute;
      left:          0; top: 0; bottom: 0;
      width:         3px;
      background:    var(--accent, #0D6B6B);
      border-radius: 9px 0 0 9px;
    }

    .ac-header {
      display:         flex;
      justify-content: space-between;
      align-items:     center;
      margin-bottom:   0.4rem;
    }
    .ac-cat-tag {
      font-size:      0.6rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding:        0.15rem 0.45rem;
      border-radius:  4px;
    }
    .ac-cat-research  { background: rgba(26,82,118,0.3);  color: #5BA4CF; }
    .ac-cat-product   { background: rgba(14,102,85,0.3);  color: #48C9A9; }
    .ac-cat-channel   { background: rgba(74,35,90,0.3);   color: #A888C2; }
    .ac-cat-strategic { background: rgba(122,69,0,0.3);   color: #E59866; }

    .ac-cost {
      font-size:   0.68rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
    }

    .ac-name {
      font-size:     0.88rem;
      font-weight:   700;
      color:         #D8E8F5;
      margin-bottom: 0.3rem;
    }
    .ac-desc {
      font-size:     0.76rem;
      color:         #6A8AA8;
      line-height:   1.45;
      margin-bottom: 0.5rem;
    }

    .ac-segment-badge, .ac-pivot-badge {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      background:     rgba(13,107,107,0.12);
      border:         1px solid rgba(13,107,107,0.25);
      color:          #0D9B9B;
      padding:        0.15rem 0.45rem;
      border-radius:  4px;
      display:        inline-block;
      margin-bottom:  0.4rem;
    }
    .ac-pivot-badge {
      background:  rgba(139,37,0,0.12);
      border-color: rgba(139,37,0,0.25);
      color:        #C04A1A;
    }

    .ac-footer { }
    .ac-status {
      font-size:   0.68rem;
      font-family: 'IBM Plex Mono', monospace;
    }
    .ac-status-avail        { color: #0D9B9B; }
    .ac-status-used         { color: #2ECC71; }
    .ac-status-locked       { color: #5A7A9A; }
    .ac-status-unaffordable { color: #C49A4A; }
    .ac-status-notime       { color: #C04A1A; }

    .ac-used-overlay {
      position:   absolute;
      inset:      0;
      background: rgba(0,0,0,0.15);
      pointer-events: none;
    }


    /* ── ACTIVITY FEED ────────────────────────────────── */
    #activity-feed {
      grid-area:   feed;
      background:  #060C18;
      border-left: 1px solid rgba(255,255,255,0.06);
      overflow-y:  auto;
      padding:     1rem 0.9rem;
    }

    .af-empty {
      font-size:   0.75rem;
      color:       #2A3A4A;
      text-align:  center;
      margin-top:  2rem;
      font-style:  italic;
    }

    .af-item {
      display:       flex;
      gap:           0.5rem;
      padding:       0.55rem 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .af-item:last-child { border-bottom: none; }

    .af-icon {
      font-size:   0.65rem;
      margin-top:  0.18rem;
      flex-shrink: 0;
      width:       12px;
    }
    .af-content {
      display:        flex;
      flex-direction: column;
      gap:            0.15rem;
      min-width:      0;
    }
    .af-msg {
      font-size:   0.75rem;
      color:       #9BB0C8;
      line-height: 1.4;
      word-break:  break-word;
    }
    .af-meta {
      font-size:   0.6rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #2A3A4A;
    }
    .af-good .af-msg { color: #2ECC71; }
    .af-warn .af-msg { color: #C49A4A; }
    .af-learn .af-msg { color: #0D9B9B; }


    /* ── SPLASH ───────────────────────────────────────── */
    #splash {
      position:        fixed;
      inset:           0;
      background:      var(--bg);
      z-index:         800;
      display:         flex;
      align-items:     center;
      justify-content: center;
      padding:         2rem;
      transition:      opacity 0.5s ease;
    }
    #splash.out {
      opacity:        0;
      pointer-events: none;
    }

    .sl-container {
      max-width:  680px;
      width:      100%;
    }
    .sl-eyebrow {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.16em;
      color:          #0D6B6B;
      text-transform: uppercase;
      margin-bottom:  0.6rem;
    }
    .sl-company {
      font-size:   2.8rem;
      font-family: 'Georgia', serif;
      color:       #E8EEF5;
      margin-bottom: 0.4rem;
      line-height:   1.1;
    }
    .sl-tagline {
      font-size:     1rem;
      color:         #7A9AB8;
      margin-bottom: 1.6rem;
    }

    .sl-brief {
      background:    rgba(255,255,255,0.03);
      border:        1px solid rgba(255,255,255,0.08);
      border-radius: 9px;
      padding:       1.2rem 1.4rem;
      margin-bottom: 1.2rem;
    }
    .sl-brief-row {
      display:       grid;
      grid-template-columns: 90px 1fr;
      gap:           0.5rem;
      margin-bottom: 0.75rem;
    }
    .sl-brief-row:last-child { margin-bottom: 0; }
    .sl-brief-label {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:          #3A5A7A;
      text-transform: uppercase;
      padding-top:    0.1rem;
    }
    .sl-brief-val {
      font-size:   0.82rem;
      color:       #9BB0C8;
      line-height: 1.5;
    }
    .sl-tension {
      margin-top:    1rem;
      padding-top:   0.9rem;
      border-top:    1px solid rgba(255,255,255,0.07);
      font-size:     0.88rem;
      font-family:   'Georgia', serif;
      color:         #C8D8E8;
      line-height:   1.55;
      border-left:   3px solid #0D6B6B;
      padding-left:  0.9rem;
    }

    .sl-segments {
      margin-bottom: 1.2rem;
    }
    .sl-seg-label {
      font-size:     0.7rem;
      font-family:   'IBM Plex Mono', monospace;
      color:         #3A5A7A;
      margin-bottom: 0.6rem;
      letter-spacing: 0.08em;
    }
    .sl-seg-grid {
      display:               grid;
      grid-template-columns: repeat(4, 1fr);
      gap:                   0.5rem;
    }
    .sl-seg-card {
      background:    rgba(255,255,255,0.04);
      border:        1px solid rgba(255,255,255,0.08);
      border-radius: 7px;
      padding:       0.7rem;
      text-align:    center;
    }
    .sl-seg-icon { font-size: 1.4rem; display: block; margin-bottom: 0.3rem; }
    .sl-seg-name { font-size: 0.72rem; color: #7A9AB8; }

    .sl-acts {
      display:       grid;
      grid-template-columns: repeat(3, 1fr);
      gap:           0.5rem;
      margin-bottom: 1.4rem;
    }
    .sl-act-card {
      background:    rgba(13,107,107,0.06);
      border:        1px solid rgba(13,107,107,0.18);
      border-radius: 7px;
      padding:       0.75rem 0.9rem;
    }
    .sl-act-num {
      font-size:      0.6rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.12em;
      color:          #0D6B6B;
      text-transform: uppercase;
      margin-bottom:  0.2rem;
    }
    .sl-act-name {
      font-size:     0.82rem;
      font-weight:   600;
      color:         #C8D8E8;
      margin-bottom: 0.3rem;
    }
    .sl-act-days {
      font-size:   0.7rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
    }
    .sl-act-burn {
      font-size:   0.7rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #C04A1A;
      margin-top:  0.15rem;
    }

    .sl-launch-btn {
      width:         100%;
      padding:       0.9rem;
      background:    #0D6B6B;
      color:         #E8EEF5;
      border:        none;
      border-radius: 8px;
      font-size:     1rem;
      font-weight:   700;
      cursor:        pointer;
      transition:    background 0.15s;
      margin-bottom: 0.75rem;
    }
    .sl-launch-btn:hover { background: #0E8080; }

    .sl-footer {
      text-align:  center;
      font-size:   0.72rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #2A3A4A;
      letter-spacing: 0.08em;
    }


    /* ── OUTCOME MODAL (main-side styles) ─────────────── */
    #outcome-modal {
      display:         none;
      position:        fixed;
      inset:           0;
      background:      rgba(7,14,26,0.85);
      backdrop-filter: blur(4px);
      z-index:         850;
      align-items:     center;
      justify-content: center;
      padding:         1.5rem;
    }
    #outcome-modal.open { display: flex; }

    .om-panel {
      background:    #0B1F3A;
      border:        1px solid rgba(13,107,107,0.3);
      border-radius: 12px;
      padding:       1.8rem 2rem;
      max-width:     500px;
      width:         100%;
      max-height:    90vh;
      overflow-y:    auto;
    }

    .om-header {
      display:       flex;
      align-items:   center;
      gap:           0.6rem;
      margin-bottom: 1rem;
    }
    .outcome-action-tag {
      font-size:      0.62rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding:        0.15rem 0.5rem;
      border-radius:  4px;
    }
    .tag-research  { background: rgba(26,82,118,0.3);  color: #5BA4CF; }
    .tag-product   { background: rgba(14,102,85,0.3);  color: #48C9A9; }
    .tag-channel   { background: rgba(74,35,90,0.3);   color: #A888C2; }
    .tag-strategic { background: rgba(122,69,0,0.3);   color: #E59866; }

    #om-action-name {
      font-size:   0.95rem;
      font-weight: 700;
      color:       #E8EEF5;
    }
    #om-segment-label {
      font-size:   0.75rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #0D9B9B;
      margin-left: auto;
    }

    .om-outcome-block {
      text-align:    center;
      margin-bottom: 1.2rem;
    }
    #om-icon  { font-size: 2rem; display: block; margin-bottom: 0.4rem; }
    #om-title {
      font-size:     1.1rem;
      font-family:   'Georgia', serif;
      color:         #E8EEF5;
      margin-bottom: 0.5rem;
    }
    #om-body {
      font-size:   0.82rem;
      color:       #8AA0B8;
      line-height: 1.55;
    }
    #om-modifier-note {
      font-size:   0.75rem;
      font-family: 'IBM Plex Mono', monospace;
      margin-top:  0.5rem;
    }
    #om-signal-revealed {
      font-size:    0.72rem;
      font-family:  'IBM Plex Mono', monospace;
      color:        #0D9B9B;
      background:   rgba(13,107,107,0.08);
      border:       1px solid rgba(13,107,107,0.2);
      border-radius: 5px;
      padding:      0.4rem 0.7rem;
      margin-top:   0.6rem;
      display:      none;
    }
    .signal-label { color: #5A8A8A; margin-right: 0.3rem; }

    .outcome-metrics {
      display:       grid;
      grid-template-columns: repeat(4, 1fr);
      gap:           1px;
      background:    rgba(255,255,255,0.06);
      border-radius: 7px;
      overflow:      hidden;
      margin:        1rem 0;
    }
    .outcome-stat {
      background: #0A1828;
      padding:    0.6rem 0.5rem;
      text-align: center;
    }
    .ostat-val {
      font-size:   1rem;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 700;
    }
    .ostat-label {
      font-size:      0.55rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:          #3A5A7A;
      text-transform: uppercase;
      margin-top:     0.2rem;
    }

    #om-learning {
      font-size:     0.78rem;
      color:         #7A9AB8;
      line-height:   1.5;
      font-style:    italic;
      padding:       0.8rem;
      background:    rgba(255,255,255,0.03);
      border-radius: 6px;
      border-left:   2px solid #0D6B6B;
      margin-bottom: 0.8rem;
    }
    #om-progress {
      font-size:     0.68rem;
      font-family:   'IBM Plex Mono', monospace;
      color:         #3A5A7A;
      text-align:    center;
      margin-bottom: 1rem;
    }
    .om-close-btn {
      width:         100%;
    }

  `;
  document.head.appendChild(style);
}


// ── INIT ───────────────────────────────────────────────────

function initMainUI() {
  injectMainCSS();

  // Inject the app shell if not already in HTML
  if (!document.getElementById('app')) {
    document.body.innerHTML = `
      <div id="splash"></div>
      <div id="app">
        <div id="top-bar"></div>
        <div id="segment-panel"></div>
        <div id="action-grid"></div>
        <div id="activity-feed"></div>
      </div>
      <div id="outcome-modal">
        <div class="om-panel">
          <div class="om-header">
            <span id="om-type-tag" class="outcome-action-tag"></span>
            <span id="om-action-name"></span>
            <span id="om-segment-label" style="display:none"></span>
          </div>
          <div class="om-outcome-block">
            <span id="om-icon"></span>
            <div id="om-title"></div>
            <div id="om-body"></div>
            <div id="om-modifier-note" style="display:none"></div>
            <div id="om-signal-revealed" style="display:none"></div>
          </div>
          <div class="outcome-metrics" id="om-stats"></div>
          <div id="om-learning"></div>
          <div id="om-progress"></div>
          <button class="btn-primary om-close-btn" onclick="closeOutcome()">
            Continue →
          </button>
        </div>
      </div>
    `;
  }

  // Initialise overlays from ui-overlays.js
  initOverlays();

  // Render splash with scenario data
  if (G.scenario) {
    renderSplash();
  } else if (typeof SCENARIOS !== 'undefined' && SCENARIOS.length > 0) {
    G.scenario = SCENARIOS[0];
    resetState(G.scenario);
    renderSplash();
  }
}


// ── EXPORT ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMainUI,
    renderAll,
    renderTopBar,
    renderSegmentPanel,
    renderActionGrid,
    renderActivityFeed,
    renderSplash,
    setActionFilter,
  };
} else {
  window.initMainUI          = initMainUI;
  window.renderAll           = renderAll;
  window.renderTopBar        = renderTopBar;
  window.renderSegmentPanel  = renderSegmentPanel;
  window.renderActionGrid    = renderActionGrid;
  window.renderActivityFeed  = renderActivityFeed;
  window.renderSplash        = renderSplash;
  window.setActionFilter     = setActionFilter;
}
