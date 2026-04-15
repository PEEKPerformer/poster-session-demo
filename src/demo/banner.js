// Persistent demo banner at the top of the viewport. Shows the 'LIVE DEMO'
// label, a progress bar, play/pause/restart, speed picker, and a CTA.

import { pauseDemo, resumeDemo, restartDemo, setDemoSpeed, getDemoSpeed, onSimState, seekDemo, getTotalDuration } from './simulator.js'
import { showCtaOverlay } from './cta.js'

export function mountDemoBanner() {
  const banner = document.createElement('div')
  banner.className = 'demo-banner'
  banner.innerHTML = `
    <div class="demo-banner__inner">
      <div class="demo-banner__badge">
        <span class="demo-banner__pulse"></span>
        <span class="demo-banner__label">REPLAY</span>
      </div>
      <div class="demo-banner__title">
        NERPG Spring 2026 · designed + run by Brenden Ferland
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
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </select>
      </div>
      <button type="button" class="demo-banner__cta" data-action="cta">
        Let's design your event &rarr;
      </button>
    </div>
    <div class="demo-banner__progress" role="slider" tabindex="0" aria-label="Demo progress (click or drag to seek)">
      <div class="demo-banner__progress-fill"></div>
      <div class="demo-banner__progress-thumb"></div>
    </div>
  `
  document.body.prepend(banner)
  document.body.classList.add('has-demo-banner')

  // ── Scrubbable progress bar ──
  const progressBar = banner.querySelector('.demo-banner__progress')
  let scrubbing = false
  function progressFromEvent(e) {
    const rect = progressBar.getBoundingClientRect()
    const x = (e.clientX ?? e.touches?.[0]?.clientX ?? 0) - rect.left
    return Math.max(0, Math.min(1, x / rect.width))
  }
  function applySeek(e) {
    const total = getTotalDuration()
    seekDemo(progressFromEvent(e) * total)
  }
  progressBar.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    scrubbing = true
    progressBar.setPointerCapture(e.pointerId)
    applySeek(e)
  })
  progressBar.addEventListener('pointermove', (e) => {
    if (scrubbing) applySeek(e)
  })
  progressBar.addEventListener('pointerup', (e) => {
    scrubbing = false
    try { progressBar.releasePointerCapture(e.pointerId) } catch {}
  })
  progressBar.addEventListener('keydown', (e) => {
    const total = getTotalDuration()
    const elapsed = parseFloat(progressBar.dataset.elapsed || '0')
    const step = total * 0.05 // 5% per arrow key
    if (e.key === 'ArrowLeft') seekDemo(Math.max(0, elapsed - step))
    if (e.key === 'ArrowRight') seekDemo(Math.min(total, elapsed + step))
  })

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

  banner.querySelector('[data-action="cta"]').addEventListener('click', () => {
    pauseDemo()
    showCtaOverlay()
  })

  const progressThumb = banner.querySelector('.demo-banner__progress-thumb')
  onSimState((s) => {
    toggleBtn.dataset.state = s.paused ? 'paused' : 'playing'
    toggleBtn.innerHTML = s.paused
      ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 2v10l8-5z"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="3" y="2" width="3" height="10"/><rect x="8" y="2" width="3" height="10"/></svg>`
    toggleBtn.setAttribute('aria-label', s.paused ? 'Play' : 'Pause')
    const pct = Math.max(0, Math.min(100, s.progress * 100))
    progressFill.style.width = `${pct}%`
    if (progressThumb) progressThumb.style.left = `${pct}%`
    progressBar.dataset.elapsed = String(s.elapsed)
  })
}
