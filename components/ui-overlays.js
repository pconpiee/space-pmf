// ═══════════════════════════════════════════════════════════
// PMF LAB — UI OVERLAYS
// components/ui-overlays.js
//
// Renders and manages the four overlay screens:
//   1. Card Prompt (pause-and-write before every action)
//   2. Act Gate   (thesis/scaling card between acts)
//   3. Pivot Gate (day-50 stay/pivot decision)
//   4. Segment Picker (target segment selection)
//
// All IDs here must match the getElementById calls in logic.js.
// ═══════════════════════════════════════════════════════════

// ── INJECT HTML ────────────────────────────────────────────
// Called once at init. Appends all overlay markup to <body>.

function injectOverlayHTML() {
  const container = document.createElement('div');
  container.id = 'overlay-container';
  container.innerHTML = `

    <!-- ═══════════════════════════════════════════════════
         CARD PROMPT
         Shows before every action. Student writes on
         physical card before clicking "Written — Proceed".
    ═══════════════════════════════════════════════════ -->
    <div id="card-prompt" class="overlay-backdrop">
  <div class="overlay-panel cp-panel">

    <div class="cp-eyebrow">✏️ Record your hypothesis</div>

    <div class="cp-action-header">
      <span id="cp-action-name" class="cp-action-name"></span>
      <span id="cp-cost" class="cp-cost-pill"></span>
    </div>

    <div class="cp-divider"></div>

    <div class="cp-question-block">
      <div class="cp-question-label">YOUR HYPOTHESIS</div>
      <div id="cp-question" class="cp-question-text"></div>
    </div>

    <div id="cp-hint" class="cp-hint"></div>

    <textarea
      id="cp-hypothesis-input"
      class="cp-textarea"
      placeholder="Type your hypothesis here before proceeding..."
      rows="3"
    ></textarea>

    <div class="cp-actions">
      <button class="btn-secondary" onclick="cancelAction()">← Cancel</button>
      <button class="btn-primary btn-confirm" onclick="confirmCardWritten()">
        Confirm & Proceed ✓
      </button>
    </div>

  </div>
</div>


    <!-- ═══════════════════════════════════════════════════
         ACT GATE
         Fires between acts. Shows current state + card
         prompt question. Student must click through.
    ═══════════════════════════════════════════════════ -->
    <div id="act-gate" class="overlay-backdrop act-gate-backdrop">
      <div class="overlay-panel ag-panel">

        <div class="ag-act-badge">
          <span id="ag-act-name" class="ag-act-name"></span>
          <span class="ag-badge-label">COMPLETE</span>
        </div>

        <h2 id="ag-title" class="ag-title"></h2>

        <div class="ag-state-strip">
          <div class="ag-state-item">
            <span id="ag-pmf" class="ag-state-val"></span>
          </div>
          <div class="ag-state-divider"></div>
          <div class="ag-state-item">
            <span id="ag-budget" class="ag-state-val"></span>
          </div>
          <div class="ag-state-divider"></div>
          <div class="ag-state-item">
            <span id="ag-day" class="ag-state-val"></span>
          </div>
        </div>

        <div class="ag-card-block">
          <div class="ag-card-eyebrow">✏️ Write this on your card now</div>
          <div id="ag-instruction" class="ag-instruction"></div>
          <div id="ag-question" class="ag-question"></div>
        </div>

        <div id="ag-warning" class="ag-warning"></div>

        <button class="btn-primary ag-confirm-btn" onclick="confirmActGate()">
          Card written — Continue →
        </button>

      </div>
    </div>


    <!-- ═══════════════════════════════════════════════════
         PIVOT GATE
         Day-50 pause in Act II. Stay or pivot decision.
         Shows evidence summary + cost of pivot.
    ═══════════════════════════════════════════════════ -->
    <div id="pivot-gate" class="overlay-backdrop pivot-gate-backdrop">
      <div class="overlay-panel pg-panel">

        <div class="pg-eyebrow">⚡ Day 50 — Midpoint Decision</div>
        <h2 id="pg-title" class="pg-title"></h2>

        <div class="pg-state-strip">
          <div class="pg-state-item">
            <div class="pg-state-label">CURRENT BEACHHEAD</div>
            <div id="pg-active-segment" class="pg-state-val pg-segment"></div>
          </div>
          <div class="pg-state-item">
            <div class="pg-state-label">PMF SCORE</div>
            <div id="pg-pmf" class="pg-state-val"></div>
          </div>
          <div class="pg-state-item">
            <div class="pg-state-label">REMAINING</div>
            <div id="pg-budget" class="pg-state-val"></div>
          </div>
        </div>

        <div class="pg-evidence-summary" id="pg-evidence-summary">
          <!-- Populated by renderPivotEvidenceSummary() -->
        </div>

        <div class="pg-card-block">
          <div class="pg-card-eyebrow">✏️ Write on your card</div>
          <div id="pg-instruction" class="pg-instruction"></div>
          <div id="pg-question" class="pg-question"></div>
        </div>

        <div id="pg-warning" class="pg-warning"></div>
        <div id="pg-pivot-cost" class="pg-pivot-cost-note"></div>

        <div class="pg-actions">
          <button class="btn-secondary pg-stay-btn"  onclick="confirmPivotGate(false)">
            Stay the Course
          </button>
          <button class="btn-danger   pg-pivot-btn"  onclick="confirmPivotGate(true)">
            Pivot →
          </button>
        </div>

      </div>
    </div>


    <!-- ═══════════════════════════════════════════════════
         SEGMENT PICKER
         Shown when an action has segmentChoice: true.
         Displays evidence bars so choice is informed.
    ═══════════════════════════════════════════════════ -->
    <div id="segment-picker" class="overlay-backdrop sp-backdrop">
      <div class="overlay-panel sp-panel">

        <div class="sp-header">
          <div class="sp-eyebrow">Select target segment</div>
          <div id="sp-action-name" class="sp-action-label"></div>
        </div>

        <div class="sp-evidence-key">
          <span class="sp-key-item">■ Evidence bar = revealed signal strength</span>
          <span class="sp-key-item">Grey = not yet investigated</span>
        </div>

        <div id="sp-segment-grid" class="sp-segment-grid">
          <!-- Populated by openSegmentPicker() in logic.js -->
        </div>

        <div class="sp-actions">
          <button class="btn-secondary" onclick="closeSegmentPicker(); cancelAction();">
            ← Cancel
          </button>
          <button id="sp-confirm-btn" class="btn-primary"
                  onclick="confirmSegmentAndProceed()">
            Confirm Segment →
          </button>
        </div>

      </div>
    </div>

  `;

  document.body.appendChild(container);
}


// ── PIVOT GATE EVIDENCE SUMMARY ───────────────────────────
// Renders the segment evidence bars inside the pivot gate.
// Called by showPivotGate() in logic.js after setting innerHTML.

function renderPivotEvidenceSummary() {
  const container = document.getElementById('pg-evidence-summary');
  if (!container || !G.scenario) return;

  container.innerHTML = Object.values(G.scenario.segments).map(seg => {
    const ev      = getSegmentEvidence(seg.id);
    const str     = computeEvidenceStrength(seg.id);
    const count   = getRevealedSignalCount(seg.id);
    const isActive = seg.id === G.activeSegmentId;

    const painBar    = ev.pain    !== null ? `<div class="pg-sig-bar" style="width:${ev.pain}%"></div>`    : '<div class="pg-sig-bar pg-sig-unknown"></div>';
    const wtpBar     = ev.wtp     !== null ? `<div class="pg-sig-bar" style="width:${ev.wtp}%"></div>`     : '<div class="pg-sig-bar pg-sig-unknown"></div>';
    const urgencyBar = ev.urgency !== null ? `<div class="pg-sig-bar" style="width:${ev.urgency}%"></div>` : '<div class="pg-sig-bar pg-sig-unknown"></div>';

    return `
      <div class="pg-seg-row ${isActive ? 'pg-seg-active' : ''}">
        <div class="pg-seg-identity">
          <span class="pg-seg-icon">${seg.icon}</span>
          <span class="pg-seg-name">${seg.shortName}</span>
          ${isActive ? '<span class="pg-active-badge">YOUR BEACHHEAD</span>' : ''}
        </div>
        <div class="pg-sig-grid">
          <div class="pg-sig-row">
            <span class="pg-sig-label">Pain</span>
            <div class="pg-sig-track">${painBar}</div>
            <span class="pg-sig-val">${ev.pain !== null ? ev.pain : '?'}</span>
          </div>
          <div class="pg-sig-row">
            <span class="pg-sig-label">WTP</span>
            <div class="pg-sig-track">${wtpBar}</div>
            <span class="pg-sig-val">${ev.wtp !== null ? ev.wtp : '?'}</span>
          </div>
          <div class="pg-sig-row">
            <span class="pg-sig-label">Urgency</span>
            <div class="pg-sig-track">${urgencyBar}</div>
            <span class="pg-sig-val">${ev.urgency !== null ? ev.urgency : '?'}</span>
          </div>
        </div>
        <div class="pg-strength">
          <div class="pg-strength-bar" style="width:${str}%"></div>
          <span class="pg-strength-label">${count}/3 signals · Strength ${str}</span>
        </div>
      </div>
    `;
  }).join('');
}


// ── CSS ────────────────────────────────────────────────────
// Injected once into <head>. Scoped to overlay IDs.

function injectOverlayCSS() {
  const style = document.createElement('style');
  style.textContent = `

    /* ── DIGITAL HYPOTHESIS CAPTURE ─────────────────────── */
.cp-textarea {
  width:         100%;
  background:    rgba(255,255,255,0.04);
  border:        1px solid rgba(13,107,107,0.35);
  border-radius: 6px;
  color:         #E8EEF5;
  font-size:     0.88rem;
  font-family:   'Inter', sans-serif;
  padding:       0.75rem 0.9rem;
  resize:        vertical;
  margin-bottom: 1.2rem;
  outline:       none;
  line-height:   1.5;
}
.cp-textarea:focus {
  border-color: #0D6B6B;
  background:   rgba(13,107,107,0.07);
}

    /* ── SHARED OVERLAY BACKDROP ─────────────────────── */
    .overlay-backdrop {
      display:         none;
      position:        fixed;
      inset:           0;
      background:      rgba(7, 14, 26, 0.82);
      backdrop-filter: blur(4px);
      z-index:         900;
      align-items:     center;
      justify-content: center;
      padding:         1.5rem;
    }
    .overlay-backdrop.open {
      display: flex;
    }

    .overlay-panel {
      background:    #0B1F3A;
      border:        1px solid rgba(13, 107, 107, 0.35);
      border-radius: 12px;
      padding:       2rem 2.2rem;
      width:         100%;
      max-width:     560px;
      max-height:    90vh;
      overflow-y:    auto;
      box-shadow:    0 24px 64px rgba(0,0,0,0.5);
    }


    /* ── CARD PROMPT ─────────────────────────────────── */
    .cp-eyebrow {
      font-size:      0.7rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.12em;
      color:          #0D6B6B;
      text-transform: uppercase;
      margin-bottom:  1rem;
    }

    .cp-action-header {
      display:        flex;
      align-items:    center;
      gap:            0.75rem;
      margin-bottom:  1rem;
    }
    .cp-action-name {
      font-size:   1.1rem;
      font-weight: 700;
      color:       #E8EEF5;
    }
    .cp-cost-pill {
      font-size:        0.7rem;
      font-family:      'IBM Plex Mono', monospace;
      background:       rgba(13,107,107,0.15);
      border:           1px solid rgba(13,107,107,0.3);
      color:            #0D9B9B;
      padding:          0.2rem 0.55rem;
      border-radius:    20px;
    }

    .cp-divider {
      height:           1px;
      background:       rgba(255,255,255,0.07);
      margin:           1rem 0;
    }

    .cp-question-label {
      font-size:        0.65rem;
      font-family:      'IBM Plex Mono', monospace;
      letter-spacing:   0.14em;
      color:            #7A8FA8;
      text-transform:   uppercase;
      margin-bottom:    0.6rem;
    }
    .cp-question-text {
      font-size:        1.05rem;
      font-family:      'Georgia', serif;
      color:            #E8EEF5;
      line-height:      1.55;
      border-left:      3px solid #0D6B6B;
      padding-left:     1rem;
      margin-bottom:    1rem;
    }
    .cp-hint {
      font-size:        0.82rem;
      color:            #7A8FA8;
      line-height:      1.5;
      margin-bottom:    1rem;
      font-style:       italic;
    }
    .cp-instruction {
      font-size:        0.78rem;
      font-family:      'IBM Plex Mono', monospace;
      background:       rgba(122, 69, 0, 0.12);
      border:           1px solid rgba(122, 69, 0, 0.25);
      color:            #C49A4A;
      padding:          0.65rem 0.9rem;
      border-radius:    6px;
      margin-bottom:    1.4rem;
    }
    .cp-actions {
      display:          flex;
      gap:              0.75rem;
      justify-content:  flex-end;
    }


    /* ── ACT GATE ─────────────────────────────────────── */
    .act-gate-backdrop .overlay-panel {
      max-width:  600px;
      border-color: rgba(13,107,107,0.5);
    }

    .ag-act-badge {
      display:        flex;
      align-items:    center;
      gap:            0.5rem;
      margin-bottom:  1.2rem;
    }
    .ag-act-name {
      font-size:      0.75rem;
      font-family:    'IBM Plex Mono', monospace;
      color:          #0D9B9B;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .ag-badge-label {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      background:     rgba(13,107,107,0.2);
      border:         1px solid rgba(13,107,107,0.4);
      color:          #0D9B9B;
      padding:        0.15rem 0.5rem;
      border-radius:  20px;
      letter-spacing: 0.1em;
    }

    .ag-title {
      font-size:      1.5rem;
      font-family:    'Georgia', serif;
      color:          #E8EEF5;
      margin:         0 0 1.2rem;
    }

    .ag-state-strip {
      display:          flex;
      gap:              0;
      background:       rgba(255,255,255,0.04);
      border:           1px solid rgba(255,255,255,0.08);
      border-radius:    8px;
      overflow:         hidden;
      margin-bottom:    1.4rem;
    }
    .ag-state-item {
      flex:         1;
      padding:      0.75rem 1rem;
      text-align:   center;
    }
    .ag-state-divider {
      width:        1px;
      background:   rgba(255,255,255,0.08);
    }
    .ag-state-val {
      font-size:    0.9rem;
      font-family:  'IBM Plex Mono', monospace;
      color:        #E8EEF5;
    }

    .ag-card-block {
      background:     rgba(13,107,107,0.08);
      border:         1px solid rgba(13,107,107,0.25);
      border-radius:  8px;
      padding:        1.2rem 1.4rem;
      margin-bottom:  1rem;
    }
    .ag-card-eyebrow {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.14em;
      color:          #0D9B9B;
      text-transform: uppercase;
      margin-bottom:  0.65rem;
    }
    .ag-instruction {
      font-size:      0.85rem;
      color:          #9BB0C8;
      margin-bottom:  0.75rem;
      line-height:    1.5;
    }
    .ag-question {
      font-size:      1rem;
      font-family:    'Georgia', serif;
      color:          #E8EEF5;
      line-height:    1.6;
      border-left:    3px solid #0D6B6B;
      padding-left:   0.9rem;
    }

    .ag-warning {
      font-size:      0.78rem;
      color:          #C49A4A;
      font-style:     italic;
      margin:         0.75rem 0 1.2rem;
      line-height:    1.45;
    }
    .ag-confirm-btn {
      width: 100%;
    }


    /* ── PIVOT GATE ───────────────────────────────────── */
    .pivot-gate-backdrop .overlay-panel {
      max-width:    620px;
      border-color: rgba(139, 37, 0, 0.4);
    }

    .pg-eyebrow {
      font-size:      0.7rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.12em;
      color:          #C04A1A;
      text-transform: uppercase;
      margin-bottom:  0.6rem;
    }
    .pg-title {
      font-size:      1.4rem;
      font-family:    'Georgia', serif;
      color:          #E8EEF5;
      margin:         0 0 1.2rem;
    }

    .pg-state-strip {
      display:          grid;
      grid-template-columns: repeat(3, 1fr);
      gap:              1px;
      background:       rgba(255,255,255,0.06);
      border-radius:    8px;
      overflow:         hidden;
      border:           1px solid rgba(255,255,255,0.08);
      margin-bottom:    1.2rem;
    }
    .pg-state-item {
      background:   #0B1F3A;
      padding:      0.7rem 0.9rem;
      text-align:   center;
    }
    .pg-state-label {
      font-size:    0.6rem;
      font-family:  'IBM Plex Mono', monospace;
      letter-spacing: 0.1em;
      color:        #5A7A9A;
      text-transform: uppercase;
      margin-bottom: 0.3rem;
    }
    .pg-state-val {
      font-size:    0.9rem;
      font-family:  'IBM Plex Mono', monospace;
      color:        #E8EEF5;
    }
    .pg-segment { color: #0D9B9B; }

    /* Evidence summary inside pivot gate */
    .pg-evidence-summary {
      margin-bottom: 1.2rem;
    }
    .pg-seg-row {
      background:    rgba(255,255,255,0.03);
      border:        1px solid rgba(255,255,255,0.07);
      border-radius: 7px;
      padding:       0.8rem 1rem;
      margin-bottom: 0.5rem;
    }
    .pg-seg-row.pg-seg-active {
      border-color:  rgba(13,107,107,0.4);
      background:    rgba(13,107,107,0.06);
    }
    .pg-seg-identity {
      display:        flex;
      align-items:    center;
      gap:            0.4rem;
      margin-bottom:  0.5rem;
    }
    .pg-seg-icon   { font-size: 1rem; }
    .pg-seg-name   { font-size: 0.85rem; font-weight: 600; color: #C8D8E8; }
    .pg-active-badge {
      font-size:      0.6rem;
      font-family:    'IBM Plex Mono', monospace;
      background:     rgba(13,107,107,0.2);
      color:          #0D9B9B;
      padding:        0.1rem 0.4rem;
      border-radius:  4px;
      letter-spacing: 0.08em;
    }
    .pg-sig-grid { margin-bottom: 0.4rem; }
    .pg-sig-row  {
      display:        grid;
      grid-template-columns: 52px 1fr 30px;
      align-items:    center;
      gap:            0.4rem;
      margin-bottom:  0.25rem;
    }
    .pg-sig-label {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
    }
    .pg-sig-track {
      height:        5px;
      background:    rgba(255,255,255,0.06);
      border-radius: 3px;
      overflow:      hidden;
    }
    .pg-sig-bar {
      height:        100%;
      background:    #0D6B6B;
      border-radius: 3px;
      transition:    width 0.4s ease;
    }
    .pg-sig-unknown { background: rgba(255,255,255,0.1); width: 100%; }
    .pg-sig-val {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #7A9AB8;
      text-align:  right;
    }
    .pg-strength {
      display:      flex;
      align-items:  center;
      gap:          0.5rem;
    }
    .pg-strength-bar {
      height:        3px;
      background:    #0D9B9B;
      border-radius: 2px;
      min-width:     4px;
      transition:    width 0.3s;
    }
    .pg-strength-label {
      font-size:   0.65rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
    }

    .pg-card-block {
      background:    rgba(139,37,0,0.07);
      border:        1px solid rgba(139,37,0,0.22);
      border-radius: 8px;
      padding:       1rem 1.2rem;
      margin-bottom: 0.9rem;
    }
    .pg-card-eyebrow {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      color:          #C04A1A;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom:  0.5rem;
    }
    .pg-instruction {
      font-size:   0.83rem;
      color:       #9BB0C8;
      line-height: 1.5;
      margin-bottom: 0.6rem;
    }
    .pg-question {
      font-size:   0.95rem;
      font-family: 'Georgia', serif;
      color:       #E8EEF5;
      line-height: 1.55;
      border-left: 3px solid #8B2500;
      padding-left: 0.85rem;
    }
    .pg-warning {
      font-size:   0.78rem;
      color:       #C49A4A;
      font-style:  italic;
      line-height: 1.45;
      margin-bottom: 0.5rem;
    }
    .pg-pivot-cost-note {
      font-size:   0.75rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #C04A1A;
      background:  rgba(139,37,0,0.1);
      border:      1px solid rgba(139,37,0,0.2);
      border-radius: 5px;
      padding:     0.4rem 0.7rem;
      margin-bottom: 1.1rem;
    }
    .pg-actions {
      display:          flex;
      gap:              0.75rem;
    }
    .pg-stay-btn  { flex: 1; }
    .pg-pivot-btn { flex: 1; }


    /* ── SEGMENT PICKER ───────────────────────────────── */
    .sp-backdrop .overlay-panel {
      max-width: 540px;
    }
    .sp-header {
      margin-bottom: 0.8rem;
    }
    .sp-eyebrow {
      font-size:      0.65rem;
      font-family:    'IBM Plex Mono', monospace;
      letter-spacing: 0.14em;
      color:          #0D6B6B;
      text-transform: uppercase;
      margin-bottom:  0.3rem;
    }
    .sp-action-label {
      font-size:   1rem;
      font-weight: 700;
      color:       #E8EEF5;
    }
    .sp-evidence-key {
      font-size:     0.68rem;
      font-family:   'IBM Plex Mono', monospace;
      color:         #5A7A9A;
      display:       flex;
      gap:           1rem;
      margin-bottom: 1rem;
    }

    .sp-segment-grid {
      display:         grid;
      grid-template-columns: repeat(2, 1fr);
      gap:             0.6rem;
      margin-bottom:   1.2rem;
    }
    .sp-segment-card {
      background:    rgba(255,255,255,0.04);
      border:        1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding:       0.9rem;
      cursor:        pointer;
      transition:    all 0.15s ease;
    }
    .sp-segment-card:hover {
      background:  rgba(13,107,107,0.1);
      border-color: rgba(13,107,107,0.35);
    }
    .sp-segment-card.selected {
      background:  rgba(13,107,107,0.15);
      border-color: #0D6B6B;
      box-shadow:  0 0 0 1px #0D6B6B;
    }
    .sp-seg-icon {
      font-size:     1.3rem;
      margin-bottom: 0.3rem;
    }
    .sp-seg-name {
      font-size:     0.85rem;
      font-weight:   600;
      color:         #C8D8E8;
      margin-bottom: 0.5rem;
    }
    .sp-seg-evidence {
      display:        flex;
      align-items:    center;
      gap:            0.4rem;
    }
    .sp-evidence-bar {
      height:        4px;
      background:    #0D6B6B;
      border-radius: 2px;
      min-width:     3px;
      transition:    width 0.3s;
    }
    .sp-evidence-label {
      font-size:   0.6rem;
      font-family: 'IBM Plex Mono', monospace;
      color:       #5A7A9A;
      white-space: nowrap;
    }

    .sp-actions {
      display:         flex;
      gap:             0.75rem;
      justify-content: flex-end;
    }


    /* ── SHARED BUTTONS ───────────────────────────────── */
    .btn-primary {
      background:    #0D6B6B;
      color:         #E8EEF5;
      border:        none;
      padding:       0.7rem 1.4rem;
      border-radius: 7px;
      font-size:     0.88rem;
      font-weight:   600;
      cursor:        pointer;
      transition:    background 0.15s;
    }
    .btn-primary:hover    { background: #0E8080; }
    .btn-primary:disabled { background: #1A3A4A; color: #5A7A9A; cursor: not-allowed; }

    .btn-secondary {
      background:    transparent;
      color:         #9BB0C8;
      border:        1px solid rgba(255,255,255,0.14);
      padding:       0.7rem 1.2rem;
      border-radius: 7px;
      font-size:     0.85rem;
      cursor:        pointer;
      transition:    all 0.15s;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.05); color: #E8EEF5; }

    .btn-danger {
      background:    rgba(139,37,0,0.75);
      color:         #FDEEE8;
      border:        1px solid rgba(139,37,0,0.5);
      padding:       0.7rem 1.4rem;
      border-radius: 7px;
      font-size:     0.88rem;
      font-weight:   600;
      cursor:        pointer;
      transition:    background 0.15s;
    }
    .btn-danger:hover { background: #8B2500; }

    .btn-confirm {
      min-width: 180px;
    }

    /* Flash animation for validation errors */
    .flash-locked {
      animation: flashRed 0.5s ease;
    }
    @keyframes flashRed {
      0%   { border-color: #8B2500; box-shadow: 0 0 0 2px rgba(139,37,0,0.4); }
      100% { border-color: rgba(255,255,255,0.1); box-shadow: none; }
    }

  `;
  document.head.appendChild(style);
}


// ── INIT ───────────────────────────────────────────────────
// Call this once in index.html's DOMContentLoaded.

function initOverlays() {
  injectOverlayCSS();
  injectOverlayHTML();
}


// ── EXPORT ─────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initOverlays, renderPivotEvidenceSummary };
} else {
  window.initOverlays              = initOverlays;
  window.renderPivotEvidenceSummary = renderPivotEvidenceSummary;
}
