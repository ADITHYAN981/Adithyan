/**
 * XenoCalc - Precision Scientific Calculator
 * Robust token parser, math engine, Web Audio feedback, history management, and keyboard handling.
 */

class XenoCalculator {
  constructor() {
    this.expression = '';
    this.lastResult = null;
    this.memory = 0;
    this.angleMode = 'DEG'; // 'DEG' | 'RAD'
    this.soundEnabled = true;
    this.history = [];
    this.maxHistory = 50;

    // Audio Context (initialized on first user interaction)
    this.audioCtx = null;

    // DOM Elements
    this.expressionDisplay = document.getElementById('expression-display');
    this.resultDisplay = document.getElementById('result-display');
    this.ansPreview = document.getElementById('ans-preview');
    this.lastAnswerChip = document.getElementById('last-answer-chip');
    this.memoryFlag = document.getElementById('memory-flag');
    this.degRadBadge = document.getElementById('deg-rad-badge');
    this.btnDegRad = document.getElementById('btn-deg-rad');
    this.scientificSection = document.getElementById('scientific-section');
    this.calculatorApp = document.querySelector('.calculator-app');
    this.toggleModeBtn = document.getElementById('toggle-mode-btn');
    this.toggleSoundBtn = document.getElementById('toggle-sound-btn');
    this.toggleThemeBtn = document.getElementById('toggle-theme-btn');
    this.toggleHistoryBtn = document.getElementById('toggle-history-btn');
    this.historyDrawer = document.getElementById('history-drawer');
    this.closeHistoryBtn = document.getElementById('close-history-btn');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');
    this.historyList = document.getElementById('history-list');
    this.toast = document.getElementById('toast');
    this.toastText = document.getElementById('toast-text');
    this.copyBtn = document.getElementById('copy-btn');
    this.backspaceBtn = document.getElementById('backspace-btn');

    this.loadState();
    this.initEventListeners();
    this.updateDisplay();
  }

  // ==========================================
  // Audio Synthesis (Web Audio API)
  // ==========================================
  initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSound(type = 'click') {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'operator') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'success') {
        // Multi-tone chord for calculate
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const chordOsc = this.audioCtx.createOscillator();
          const chordGain = this.audioCtx.createGain();
          chordOsc.connect(chordGain);
          chordGain.connect(this.audioCtx.destination);
          chordOsc.type = 'sine';
          chordOsc.frequency.setValueAtTime(freq, now + idx * 0.02);
          chordGain.gain.setValueAtTime(0.05, now + idx * 0.02);
          chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + idx * 0.02);
          chordOsc.start(now + idx * 0.02);
          chordOsc.stop(now + 0.18 + idx * 0.02);
        });
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch {
      // Audio errors fail silently
    }
  }

  // ==========================================
  // Persistence & State Loading
  // ==========================================
  loadState() {
    try {
      const savedTheme = localStorage.getItem('apex_theme');
      if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        this.updateThemeIcons(true);
      }

      const savedSound = localStorage.getItem('apex_sound');
      if (savedSound !== null) {
        this.soundEnabled = savedSound === 'true';
        this.updateSoundIcons();
      }

      const savedSci = localStorage.getItem('apex_sci');
      if (savedSci === 'true') {
        this.toggleScientific(true);
      }

      const savedHistory = localStorage.getItem('apex_history');
      if (savedHistory) {
        this.history = JSON.parse(savedHistory);
        this.renderHistory();
      }

      const savedAngle = localStorage.getItem('apex_angle');
      if (savedAngle === 'RAD' || savedAngle === 'DEG') {
        this.angleMode = savedAngle;
        this.degRadBadge.textContent = this.angleMode;
        this.btnDegRad.textContent = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
      }
    } catch {
      // Storage errors fail gracefully
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('apex_history', JSON.stringify(this.history));
    } catch {}
  }

  // ==========================================
  // Display & UI Updating
  // ==========================================
  updateDisplay() {
    this.expressionDisplay.textContent = this.expression;
    // Auto-scroll expression to right
    this.expressionDisplay.parentElement.scrollLeft = this.expressionDisplay.parentElement.scrollWidth;

    if (this.expression.trim() === '') {
      this.resultDisplay.textContent = this.lastResult !== null ? this.formatNumber(this.lastResult) : '0';
      this.resultDisplay.classList.remove('error');
      return;
    }

    // Try real-time evaluation preview
    const live = this.evaluateSafely(this.expression);
    if (live.success) {
      this.resultDisplay.textContent = this.formatNumber(live.value);
      this.resultDisplay.classList.remove('error');
    }
  }

  formatNumber(val) {
    if (typeof val !== 'number' || isNaN(val)) return 'Error';
    if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';

    // Avoid JS floating point inaccuracies (e.g., 0.1 + 0.2 = 0.30000000000000004)
    const formatted = parseFloat(val.toPrecision(12));
    if (Math.abs(formatted) > 1e12 || (Math.abs(formatted) < 1e-7 && formatted !== 0)) {
      return formatted.toExponential(6).replace(/\.?0+e/, 'e');
    }
    return formatted.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  showToast(message) {
    this.toastText.textContent = message;
    this.toast.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('visible');
    }, 2200);
  }

  // ==========================================
  // Input Handling
  // ==========================================
  appendToken(token) {
    this.playSound('click');
    const lastChar = this.expression.slice(-1);

    // Operator handling
    const isOp = ['+', '-', '×', '÷', '%', '^'].includes(token);
    const lastIsOp = ['+', '-', '×', '÷', '%', '^'].includes(lastChar);

    if (isOp && lastIsOp) {
      // Replace previous operator
      this.expression = this.expression.slice(0, -1) + token;
      this.updateDisplay();
      return;
    }

    // Implicit multiplication cases
    if (token === '(' && /[0-9πe)]$|ans$/i.test(this.expression)) {
      this.expression += '×(';
      this.updateDisplay();
      return;
    }

    if (['π', 'e'].includes(token) && /[0-9)]$/.test(this.expression)) {
      this.expression += '×' + token;
      this.updateDisplay();
      return;
    }

    if (typeof token === 'string' && token.endsWith('(') && /[0-9πe)]$|ans$/i.test(this.expression)) {
      this.expression += '×' + token;
      this.updateDisplay();
      return;
    }

    this.expression += token;
    this.updateDisplay();
  }

  appendOperator(op) {
    this.playSound('operator');
    if (this.expression === '' && this.lastResult !== null) {
      this.expression = 'ANS' + op;
    } else {
      this.appendToken(op);
    }
  }

  backspace() {
    this.playSound('click');
    if (this.expression.length === 0) return;

    // Check for multi-char tokens at end like 'sin(', 'cos(', 'asin(', etc.
    const multiTokens = ['asin(', 'acos(', 'atan(', 'sin(', 'cos(', 'tan(', 'log(', 'ln(', '√(', 'ANS', '^2'];
    for (const t of multiTokens) {
      if (this.expression.endsWith(t)) {
        this.expression = this.expression.slice(0, -t.length);
        this.updateDisplay();
        return;
      }
    }

    this.expression = this.expression.slice(0, -1);
    this.updateDisplay();
  }

  clearAll() {
    this.playSound('operator');
    this.expression = '';
    this.updateDisplay();
    this.resultDisplay.textContent = '0';
    this.resultDisplay.classList.remove('error');
  }

  toggleNegate() {
    this.playSound('click');
    if (this.expression === '') {
      this.expression = '-';
      this.updateDisplay();
      return;
    }

    // Try finding the last number segment
    const match = this.expression.match(/(-?\d+\.?\d*)$/);
    if (match) {
      const numStr = match[0];
      const startIdx = this.expression.length - numStr.length;
      if (numStr.startsWith('-')) {
        this.expression = this.expression.slice(0, startIdx) + numStr.slice(1);
      } else {
        this.expression = this.expression.slice(0, startIdx) + '-' + numStr;
      }
    } else {
      this.expression += '-';
    }
    this.updateDisplay();
  }

  // ==========================================
  // Core Calculation Engine
  // ==========================================
  evaluateSafely(rawExp) {
    if (!rawExp || rawExp.trim() === '') return { success: false };

    try {
      // 1. Balance unclosed parentheses automatically for evaluation preview
      let exp = rawExp;
      const openParens = (exp.match(/\(/g) || []).length;
      const closeParens = (exp.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        exp += ')'.repeat(openParens - closeParens);
      }

      // 2. Preprocess Constants & Custom Tokens
      exp = exp.replace(/ANS/gi, `(${this.lastResult !== null ? this.lastResult : 0})`);
      exp = exp.replace(/π/g, `(${Math.PI})`);
      exp = exp.replace(/\be\b/g, `(${Math.E})`);
      exp = exp.replace(/×/g, '*');
      exp = exp.replace(/÷/g, '/');

      // 3. Percentage handling: if number followed by %, convert to (/100)
      exp = exp.replace(/(\d+(?:\.\d+)?|\([^\(\)]+\))%/g, '($1/100)');

      // 4. Power operator
      exp = exp.replace(/\^/g, '**');

      // 5. Factorials: handles numbers or paren groupings followed by ! (e.g. 5! or (3+2)!)
      exp = exp.replace(/(\d+(?:\.\d+)?|\([^\(\)]+\))!/g, (match, p1) => {
        return `this.factorial(${p1})`;
      });

      // 6. Functions & Angle conversions
      const isDeg = this.angleMode === 'DEG';

      // Replace inverse trig
      exp = exp.replace(/\basin\(/g, isDeg ? `this.degAsin(` : `Math.asin(`);
      exp = exp.replace(/\bacos\(/g, isDeg ? `this.degAcos(` : `Math.acos(`);
      exp = exp.replace(/\batan\(/g, isDeg ? `this.degAtan(` : `Math.atan(`);

      // Replace trig
      exp = exp.replace(/\bsin\(/g, isDeg ? `this.degSin(` : `Math.sin(`);
      exp = exp.replace(/\bcos\(/g, isDeg ? `this.degCos(` : `Math.cos(`);
      exp = exp.replace(/\btan\(/g, isDeg ? `this.degTan(` : `Math.tan(`);

      // Log & Roots
      exp = exp.replace(/log\(/g, `Math.log10(`);
      exp = exp.replace(/ln\(/g, `Math.log(`);
      exp = exp.replace(/√\(/g, `Math.sqrt(`);

      // Sanitization Check - only allow safe mathematical characters
      if (/[^0-9\.\+\-\*\/\%\(\)\,\s\w]/.test(exp.replace(/Math\.\w+|this\.\w+/g, ''))) {
        return { success: false };
      }

      // Safe evaluation using Function with bound context
      const compute = new Function('return ' + exp).bind(this);
      const res = compute();

      if (typeof res === 'number' && !isNaN(res)) {
        return { success: true, value: res };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  // Trig helper methods for DEG/RAD accuracy
  degSin(x) {
    const rad = (x * Math.PI) / 180;
    // Handle exact 180 / 360 values
    return Math.abs(x % 180) === 0 ? 0 : Math.sin(rad);
  }
  degCos(x) {
    const rad = (x * Math.PI) / 180;
    return (x - 90) % 180 === 0 ? 0 : Math.cos(rad);
  }
  degTan(x) {
    if ((x - 90) % 180 === 0) return Infinity;
    return this.degSin(x) / this.degCos(x);
  }
  degAsin(x) {
    return (Math.asin(x) * 180) / Math.PI;
  }
  degAcos(x) {
    return (Math.acos(x) * 180) / Math.PI;
  }
  degAtan(x) {
    return (Math.atan(x) * 180) / Math.PI;
  }

  factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity; // JS Number limit
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  calculate() {
    if (!this.expression || this.expression.trim() === '') return;

    const evaluation = this.evaluateSafely(this.expression);

    if (evaluation.success) {
      this.playSound('success');
      const val = evaluation.value;
      const originalExpr = this.expression;

      // Add to history
      this.history.unshift({
        expression: originalExpr,
        result: val,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (this.history.length > this.maxHistory) this.history.pop();
      this.saveHistory();
      this.renderHistory();

      this.lastResult = val;
      this.ansPreview.textContent = this.formatNumber(val);
      this.resultDisplay.textContent = this.formatNumber(val);
      this.resultDisplay.classList.remove('error');

      // Reset expression to result for chain operations, but visually highlight
      this.expression = '';
      this.expressionDisplay.textContent = originalExpr;
    } else {
      this.playSound('error');
      this.resultDisplay.textContent = 'Invalid Format';
      this.resultDisplay.classList.add('error');
    }
  }

  // ==========================================
  // Memory Register Handling
  // ==========================================
  handleMemory(action) {
    const currentVal = this.lastResult !== null ? this.lastResult : parseFloat(this.resultDisplay.textContent) || 0;
    this.playSound('operator');

    switch (action) {
      case 'mem-add':
        this.memory += currentVal;
        this.showToast(`M = ${this.formatNumber(this.memory)}`);
        break;
      case 'mem-sub':
        this.memory -= currentVal;
        this.showToast(`M = ${this.formatNumber(this.memory)}`);
        break;
      case 'mem-recall':
        this.appendToken(this.memory.toString());
        this.showToast(`Recalled: ${this.formatNumber(this.memory)}`);
        break;
      case 'mem-clear':
        this.memory = 0;
        this.showToast('Memory Cleared');
        break;
    }

    if (this.memory !== 0) {
      this.memoryFlag.textContent = `M: ${this.formatNumber(this.memory)}`;
      this.memoryFlag.classList.add('active');
    } else {
      this.memoryFlag.textContent = '';
      this.memoryFlag.classList.remove('active');
    }
  }

  // ==========================================
  // History UI Rendering
  // ==========================================
  renderHistory() {
    if (!this.history || this.history.length === 0) {
      this.historyList.innerHTML = `
        <div class="history-empty">
          <div class="empty-icon">⏳</div>
          <p>No calculations yet</p>
          <span>Calculations appear here as you solve them.</span>
        </div>
      `;
      return;
    }

    this.historyList.innerHTML = this.history
      .map((item, idx) => `
        <div class="history-item" data-index="${idx}" title="Click to insert into calculation">
          <span class="history-item-time">${item.timestamp}</span>
          <div class="history-item-exp">${item.expression} =</div>
          <div class="history-item-res">${this.formatNumber(item.result)}</div>
        </div>
      `)
      .join('');

    // Attach click listeners to history items
    this.historyList.querySelectorAll('.history-item').forEach((elem) => {
      elem.addEventListener('click', () => {
        const idx = parseInt(elem.getAttribute('data-index'), 10);
        const item = this.history[idx];
        if (item) {
          this.playSound('click');
          this.expression = item.expression;
          this.updateDisplay();
          this.toggleHistory(false);
          this.showToast('Expression restored');
        }
      });
    });
  }

  clearHistory() {
    this.playSound('operator');
    this.history = [];
    this.saveHistory();
    this.renderHistory();
    this.showToast('History cleared');
  }

  // ==========================================
  // Toggle UI Components
  // ==========================================
  toggleScientific(forceState) {
    const isExpanded = forceState !== undefined
      ? forceState
      : !this.scientificSection.classList.contains('expanded');

    if (isExpanded) {
      this.scientificSection.classList.add('expanded');
      this.calculatorApp.classList.add('sci-expanded');
      this.toggleModeBtn.classList.add('active');
    } else {
      this.scientificSection.classList.remove('expanded');
      this.calculatorApp.classList.remove('sci-expanded');
      this.toggleModeBtn.classList.remove('active');
    }
    localStorage.setItem('apex_sci', isExpanded ? 'true' : 'false');
  }

  toggleAngleMode() {
    this.playSound('operator');
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    this.degRadBadge.textContent = this.angleMode;
    this.btnDegRad.textContent = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    localStorage.setItem('apex_angle', this.angleMode);
    this.updateDisplay();
    this.showToast(`Mode: ${this.angleMode}`);
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('apex_sound', this.soundEnabled ? 'true' : 'false');
    this.updateSoundIcons();
    this.showToast(this.soundEnabled ? 'Sound On' : 'Sound Muted');
    if (this.soundEnabled) this.playSound('click');
  }

  updateSoundIcons() {
    const onIcon = this.toggleSoundBtn.querySelector('.icon-sound-on');
    const offIcon = this.toggleSoundBtn.querySelector('.icon-sound-off');
    if (this.soundEnabled) {
      onIcon.classList.remove('hidden');
      offIcon.classList.add('hidden');
    } else {
      onIcon.classList.add('hidden');
      offIcon.classList.remove('hidden');
    }
  }

  toggleTheme() {
    this.playSound('click');
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('apex_theme', isLight ? 'light' : 'dark');
    this.updateThemeIcons(isLight);
    this.showToast(isLight ? 'Light Theme' : 'Dark Theme');
  }

  updateThemeIcons(isLight) {
    const sunIcon = this.toggleThemeBtn.querySelector('.icon-sun');
    const moonIcon = this.toggleThemeBtn.querySelector('.icon-moon');
    if (isLight) {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  toggleHistory(open) {
    const shouldOpen = open !== undefined ? open : !this.historyDrawer.classList.contains('open');
    if (shouldOpen) {
      this.historyDrawer.classList.add('open');
      this.historyDrawer.setAttribute('aria-hidden', 'false');
    } else {
      this.historyDrawer.classList.remove('open');
      this.historyDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  // ==========================================
  // Event Listeners & Keyboard Wiring
  // ==========================================
  initEventListeners() {
    // Keypad Click Delegation
    document.querySelectorAll('.key').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const val = btn.getAttribute('data-val');
        const action = btn.getAttribute('data-action');

        // Tactile press visual feedback
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 120);

        if (action === 'clear-all') {
          this.clearAll();
        } else if (action === 'calculate') {
          this.calculate();
        } else if (action === 'negate') {
          this.toggleNegate();
        } else if (action === 'operator') {
          this.appendOperator(val);
        } else if (action === 'paren' || action === 'func') {
          this.appendToken(val);
        } else if (action && action.startsWith('mem-')) {
          this.handleMemory(action);
        } else if (action === 'deg-rad') {
          this.toggleAngleMode();
        } else if (val) {
          this.appendToken(val);
        }
      });
    });

    // Top control toggles
    this.toggleModeBtn.addEventListener('click', () => {
      this.playSound('click');
      this.toggleScientific();
    });

    this.toggleSoundBtn.addEventListener('click', () => this.toggleSound());
    this.toggleThemeBtn.addEventListener('click', () => this.toggleTheme());
    this.toggleHistoryBtn.addEventListener('click', () => {
      this.playSound('click');
      this.toggleHistory();
    });
    this.closeHistoryBtn.addEventListener('click', () => {
      this.playSound('click');
      this.toggleHistory(false);
    });
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

    // Display quick actions
    this.backspaceBtn.addEventListener('click', () => this.backspace());
    this.lastAnswerChip.addEventListener('click', () => {
      this.playSound('click');
      this.appendToken('ANS');
    });

    this.copyBtn.addEventListener('click', async () => {
      this.playSound('click');
      const text = this.resultDisplay.textContent;
      try {
        await navigator.clipboard.writeText(text);
        this.showToast('Copied: ' + text);
      } catch {
        this.showToast('Failed to copy');
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't capture if user is in an input outside (though there is none here)
      if (['input', 'textarea'].includes(e.target.tagName.toLowerCase())) return;

      const key = e.key;

      if (/^[0-9]$/.test(key)) {
        this.appendToken(key);
        this.animateKeyMatch(`[data-val="${key}"]`);
      } else if (key === '.') {
        this.appendToken('.');
        this.animateKeyMatch('#btn-decimal');
      } else if (key === '+') {
        this.appendOperator('+');
        this.animateKeyMatch('#btn-add');
      } else if (key === '-') {
        this.appendOperator('-');
        this.animateKeyMatch('#btn-sub');
      } else if (key === '*') {
        this.appendOperator('×');
        this.animateKeyMatch('#btn-mul');
      } else if (key === '/') {
        e.preventDefault();
        this.appendOperator('÷');
        this.animateKeyMatch('#btn-div');
      } else if (key === '%') {
        this.appendOperator('%');
        this.animateKeyMatch('#btn-mod');
      } else if (key === '^') {
        this.appendToken('^');
      } else if (key === '(' || key === ')') {
        this.appendToken(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        this.calculate();
        this.animateKeyMatch('#btn-equals');
      } else if (key === 'Backspace') {
        e.preventDefault();
        this.backspace();
      } else if (key === 'Escape') {
        this.clearAll();
        this.animateKeyMatch('#btn-ac');
      }
    });
  }

  animateKeyMatch(selector) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        el.classList.add('pressed');
        setTimeout(() => el.classList.remove('pressed'), 120);
      }
    } catch {}
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.calculator = new XenoCalculator();
});
