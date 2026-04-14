// End-of-tour trivia mini-game. The demo ends with a 3-question quiz that
// reuses the polymer-fact pool — a callback to the codename assignment at
// check-in. Commercial angle: "Every attendee's keepsake fact becomes a
// trivia prompt at the ceremony. Engagement that travels past the session."

import { CODENAME_POOL, getCodeFact } from '../lib/codename-facts.js'

const NUM_QUESTIONS = 3
const OPTIONS_PER_QUESTION = 4
const REVEAL_DELAY_MS = 3500
const NEXT_DELAY_MS   = 2200

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function startTrivia(onDone) {
  const codesWithFacts = CODENAME_POOL.filter(c => getCodeFact(c))
  if (codesWithFacts.length < OPTIONS_PER_QUESTION) return onDone?.()

  const questions = shuffle(codesWithFacts).slice(0, NUM_QUESTIONS).map(correct => {
    const distractors = shuffle(codesWithFacts.filter(c => c !== correct)).slice(0, OPTIONS_PER_QUESTION - 1)
    return { correct, fact: getCodeFact(correct), options: shuffle([correct, ...distractors]) }
  })

  let idx = 0
  const overlay = document.createElement('div')
  overlay.className = 'demo-trivia'
  overlay.innerHTML = `
    <div class="demo-trivia__card">
      <div class="demo-trivia__header">
        <span class="demo-trivia__label">Trivia recap</span>
        <span class="demo-trivia__progress"></span>
      </div>
      <p class="demo-trivia__fact"></p>
      <div class="demo-trivia__options"></div>
      <p class="demo-trivia__feedback"></p>
      <p class="demo-trivia__hint">Every polymer codename came with a fact. Recap time.</p>
    </div>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('demo-trivia--visible'))

  const factEl     = overlay.querySelector('.demo-trivia__fact')
  const optionsEl  = overlay.querySelector('.demo-trivia__options')
  const progressEl = overlay.querySelector('.demo-trivia__progress')
  const feedbackEl = overlay.querySelector('.demo-trivia__feedback')

  function renderQuestion() {
    if (idx >= questions.length) return finish()
    const q = questions[idx]
    progressEl.textContent = `Question ${idx + 1} of ${questions.length}`
    factEl.textContent = q.fact
    feedbackEl.textContent = ''
    feedbackEl.className = 'demo-trivia__feedback'
    optionsEl.innerHTML = q.options.map(code => `
      <button type="button" class="demo-trivia__opt" data-code="${code}">${code}</button>
    `).join('')

    // Auto-reveal after a pause (simulating the viewer "thinking").
    setTimeout(() => revealAnswer(q), REVEAL_DELAY_MS)

    optionsEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => revealAnswer(q, btn.dataset.code))
    })
  }

  function revealAnswer(q, chosen) {
    const buttons = optionsEl.querySelectorAll('button')
    buttons.forEach(btn => {
      btn.disabled = true
      if (btn.dataset.code === q.correct) btn.classList.add('demo-trivia__opt--correct')
      else if (btn.dataset.code === chosen) btn.classList.add('demo-trivia__opt--wrong')
    })
    feedbackEl.textContent = chosen === q.correct
      ? '✓ Correct!'
      : chosen
        ? `✗ It was ${q.correct}`
        : `Answer: ${q.correct}`
    feedbackEl.classList.add(chosen === q.correct ? 'demo-trivia__feedback--ok' : 'demo-trivia__feedback--show')
    idx++
    setTimeout(renderQuestion, NEXT_DELAY_MS)
  }

  function finish() {
    overlay.classList.remove('demo-trivia--visible')
    setTimeout(() => { overlay.remove(); onDone?.() }, 350)
  }

  renderQuestion()

  // Return a teardown so the simulator can clear it on demo restart.
  return () => { overlay.remove() }
}
