// Tabs below the demo banner. Click a tab to jump to that mode — the tour
// pauses (viewer is in the driver's seat). Click ▶ Play on the banner to
// resume the tour from wherever it left off.

import { setDemoMode } from './mode.js'
import { pauseDemo, isDemoLocked } from './simulator.js'

const TABS = [
  { mode: 'gallery', label: 'Gallery', sub: 'Browse posters' },
  { mode: 'vote',    label: 'Vote',    sub: 'Ranked ballot' },
  { mode: 'confirm', label: 'Confirm', sub: 'Thanks screen' },
  { mode: 'admin',   label: 'Admin',   sub: 'Live dashboard' },
  { mode: 'results', label: 'Results', sub: 'Winners podium' },
]

let lockNoticeAt = 0

export function mountDemoTabs() {
  const bar = document.createElement('div')
  bar.className = 'demo-tabs'
  bar.innerHTML = `
    <div class="demo-tabs__label">Jump to:</div>
    ${TABS.map(t => `
      <button type="button" class="demo-tab" data-mode="${t.mode}">
        <span class="demo-tab__label">${t.label}</span>
        <span class="demo-tab__sub">${t.sub}</span>
      </button>
    `).join('')}
  `
  document.body.appendChild(bar)
  document.body.classList.add('has-demo-tabs')

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]')
    if (!btn) return
    if (isDemoLocked()) {
      // Throttle the notice so repeated clicks don't spam the UI.
      const now = performance.now()
      if (now - lockNoticeAt > 3000) {
        lockNoticeAt = now
        showLockNotice()
      }
      return
    }
    pauseDemo()
    setDemoMode(btn.dataset.mode)
  })

  window.addEventListener('demo:mode', (e) => {
    const mode = e.detail?.mode
    bar.querySelectorAll('.demo-tab').forEach(b => {
      b.classList.toggle('demo-tab--active', b.dataset.mode === mode)
    })
  })
}

function showLockNotice() {
  document.querySelectorAll('.demo-lock-notice').forEach(n => n.remove())
  const note = document.createElement('div')
  note.className = 'demo-lock-notice'
  note.textContent = '🔒 Watch the tour — controls unlock at the end'
  document.body.appendChild(note)
  requestAnimationFrame(() => note.classList.add('demo-lock-notice--visible'))
  setTimeout(() => {
    note.classList.remove('demo-lock-notice--visible')
    setTimeout(() => note.remove(), 300)
  }, 2600)
}
