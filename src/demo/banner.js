// Persistent demo banner at the top of the viewport. Shows the 'LIVE DEMO'
// label, a progress bar, play/pause/restart, speed picker, and a CTA.

import { pauseDemo, resumeDemo, restartDemo, setDemoSpeed, getDemoSpeed, onSimState } from './simulator.js'

const CTA_URL = 'https://bfer.land/#contact'

export function mountDemoBanner() {
  const banner = document.createElement('div')
  banner.className = 'demo-banner'
  banner.innerHTML = `
    <div class="demo-banner__inner">
      <div class="demo-banner__badge">
        <span class="demo-banner__pulse"></span>
        <span class="demo-banner__label">LIVE DEMO</span>
      </div>
      <div class="demo-banner__title">
        NERPG Spring 2026 replay — watch a real poster session play out
      </div>
      <div class="demo-banner__controls">
        <button type="button" class="demo-banner__btn" data-action="toggle" aria-label="Pause">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>
        </button>
        <button type="button" class="demo-banner__btn" data-action="restart" aria-label="Restart">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4a5 5 0 1 0 1.5 3.5"/><path d="M11 1v3h-3"/></svg>
        </button>
        <select class="demo-banner__speed" aria-label="Playback speed">
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="4">4×</option>
        </select>
      </div>
      <a class="demo-banner__cta" href="${CTA_URL}" target="_blank" rel="noopener">
        Want this for your event? &rarr;
      </a>
    </div>
    <div class="demo-banner__progress"><div class="demo-banner__progress-fill"></div></div>
  `
  document.body.prepend(banner)
  document.body.classList.add('has-demo-banner')

  const toggleBtn = banner.querySelector('[data-action="toggle"]')
  const restartBtn = banner.querySelector('[data-action="restart"]')
  const speedSel = banner.querySelector('.demo-banner__speed')
  const progressFill = banner.querySelector('.demo-banner__progress-fill')

  toggleBtn.addEventListener('click', () => {
    const state = toggleBtn.dataset.state
    if (state === 'paused') {
      resumeDemo()
    } else {
      pauseDemo()
    }
  })

  restartBtn.addEventListener('click', () => restartDemo())

  speedSel.addEventListener('change', (e) => setDemoSpeed(parseFloat(e.target.value)))
  speedSel.value = String(getDemoSpeed())

  onSimState((s) => {
    toggleBtn.dataset.state = s.paused ? 'paused' : 'playing'
    toggleBtn.innerHTML = s.paused
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2v10l8-5z"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>`
    toggleBtn.setAttribute('aria-label', s.paused ? 'Play' : 'Pause')
    const pct = Math.max(0, Math.min(100, s.progress * 100))
    progressFill.style.width = `${pct}%`
  })
}
