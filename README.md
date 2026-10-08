# XenoCalc — Modern Precision Scientific Calculator

**XenoCalc** is a precision scientific calculator crafted with an Italian luxury typographic aesthetic (*Italiana* & *Bodoni Moda*), a dark glassmorphic UI, responsive tactile keypads, and an advanced mathematical parser.

---

## ✨ Features

- **Dual Mode**:
  - **Standard Mode**: Basic arithmetic (`+`, `−`, `×`, `÷`), smart percentages (`%`), negation (`±`), and parentheses.
  - **Scientific Mode (SCI)**: Trigonometric functions (`sin`, `cos`, `tan`), inverse trigonometric functions (`sin⁻¹`, `cos⁻¹`, `tan⁻¹`), angle mode switch (**DEG / RAD**), logarithms (`log`, `ln`), powers (`xʸ`, `x²`), square root (`√`), factorials (`n!`), and mathematical constants (`π`, `e`).
- **Real-Time Live Preview**: As you type expressions, the result updates in real-time beneath your equation.
- **Answer Retention (`ANS`)**: Quick-access chip to inject your last calculated value into subsequent equations.
- **Calculation History Tape**: Slide-out drawer tracking previous calculations with timestamps; click any historical equation to restore it.
- **Memory Registers**: Full support for `M+`, `M−`, `MR`, and `MC` with active status indicators.
- **Synthesized Web Audio Feedback**: Tactile click ticks, operator chimes, and evaluation chords synthesized in real-time via the Web Audio API (with instant mute toggle).
- **Theme Switcher**: Dark cyber glassmorphism and light luxury porcelain theme.
- **One-Click Clipboard**: Copy answers to clipboard with instant toast notifications.
- **Full Physical Keyboard Support**: Type naturally on your keyboard.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` - `9` | Enter numbers |
| `.` | Decimal point |
| `+`, `-`, `*`, `/` | Basic operators (`+`, `−`, `×`, `÷`) |
| `%` | Percentage / Modulo |
| `^` | Power / Exponentiation |
| `(`, `)` | Parentheses |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last character / token |
| `Escape` | Clear All (`AC`) |

---

## 🚀 How to Run

1. Open `index.html` directly in any modern browser:
   - Double click `index.html` in your file explorer, OR
   - Run a local static server:
     ```bash
     python -m http.server 8080
     ```
   - Then open `http://localhost:8080` in your web browser.

---

## 📁 Project Structure

- `index.html` — Accessible markup and semantic layout.
- `style.css` — Design system, tokens, glassmorphism, micro-animations, and themes.
- `script.js` — Expression parser, calculation engine, Web Audio synthesis, and state handling.
