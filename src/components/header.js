import { getState, setState } from '../state.js'
import { navigate, getCurrentHash } from '../router.js'
import { showWelcome } from '../views/auth.js'
import { track, reset as resetAnalytics } from '../lib/track.js'
import { getIdentityDisplay } from '../lib/identity.js'
// Board-access removed for demo build.

const BASE = import.meta.env.BASE_URL || '/'


export function renderHeader(parent, { title, subtitle, showNav = true, showLogo = true }) {
  const state = getState()
  const role = state.attendee?.role
  const current = getCurrentHash()

  const el = document.createElement('header')
  el.className = 'section-header w-full'

  // Build nav links — always show all relevant routes, highlight current
  let navHtml = ''
  if (showNav && state.attendee) {
    const voteReady = state.visits.length >= 3 && !state.myVotes?.length && state.eventPhase !== 'results'
    const links = [
      { hash: '#/gallery', label: 'Gallery' },
      { hash: '#/vote', label: state.eventPhase === 'results' ? 'Results' : 'Vote', dot: voteReady },
    ]
    // Demo build only ships gallery + vote; no admin/board/checkin nav.

    const identity = getIdentityDisplay(state.attendee)
    const identityChipHtml = `
      <div class="identity-chip">
        <div class="identity-chip__avatar" style="background: hsl(${identity.hue}, 45%, 35%)">${identity.initial}</div>
        <span class="identity-chip__code">${identity.code}</span>
        ${identity.firstName ? `<span class="identity-chip__name">&middot; ${identity.firstName}</span>` : ''}
      </div>
    `

    navHtml = `
      <nav class="header__nav">
        ${links.map(l =>
          `<button class="btn--text header__link${current === l.hash ? ' header__link--active' : ''}" data-route="${l.hash}">${l.label}${l.dot ? '<span class="header__dot"></span>' : ''}</button>`
        ).join('')}
        ${identityChipHtml}
        <button class="btn--text header__link header__link--logout" id="logout-btn">Log Out</button>
      </nav>
    `
  }

  el.innerHTML = `
    ${showLogo ? `
      <div class="header__logos">
        <img src="${BASE}assets/logos/rd-logo-dark.png" alt="ACS Rubber Division" class="logo logo--small" decoding="async" width="40" height="40">
        <img src="${BASE}assets/logos/nerpg-logo-hires.png" alt="NERPG" class="logo" decoding="async" width="120" height="40">
      </div>
    ` : ''}
    ${title ? `<h1>${title}</h1>` : ''}
    ${subtitle ? `<h2>${subtitle}</h2>` : ''}
    ${navHtml}
    <hr class="gold-rule">
    ${showNav && state.attendee && role !== 'admin' ? `
      <button class="header__how-it-works" id="help-btn">How it works</button>
    ` : ''}
  `

  // Route click handlers
  el.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      track('navigation_clicked', { target: btn.dataset.route, from: current })
      navigate(btn.dataset.route)
    })
  })

  // Logout handler
  const logoutBtn = el.querySelector('#logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // Prevent stacking
      if (document.querySelector('.logout-overlay')) return

      const overlay = document.createElement('div')
      overlay.className = 'logout-overlay'
      overlay.innerHTML = `
        <div class="logout-overlay__backdrop"></div>
        <div class="logout-card card">
          <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.5rem;">Log out?</h3>
          <p class="text-muted" style="font-size:0.9rem;">You can sign back in with your code.</p>
          <div class="logout-card__actions">
            <button class="btn btn--outline" id="logout-cancel">Cancel</button>
            <button class="btn btn--gold" id="logout-confirm">Log Out</button>
          </div>
        </div>
      `
      overlay.querySelector('#logout-cancel').addEventListener('click', () => overlay.remove())
      overlay.querySelector('.logout-overlay__backdrop').addEventListener('click', () => overlay.remove())
      overlay.querySelector('#logout-confirm').addEventListener('click', () => {
        const s = getState()
        track('user_signed_out', {
          role: s.attendee?.role,
          visits_count: s.visits.length,
          has_voted: s.myVotes?.length > 0,
        })
        overlay.remove()
        setState({ attendee: null, visits: [], myVotes: [] })
        resetAnalytics()
        navigate('#/auth')
      })
      document.body.appendChild(overlay)
      requestAnimationFrame(() => overlay.classList.add('logout-overlay--open'))
    })
  }

  // Help button — replay tutorial
  const helpBtn = el.querySelector('#help-btn')
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      const { attendee } = getState()
      if (!attendee) return
      track('tutorial_replayed', { role: attendee.role, source: 'help_button' })
      showWelcome(attendee.name, attendee.role, attendee.code, () => {
        track('tutorial_dismissed', { role: attendee.role, source: 'help_button' })
      })
    })
  }

  parent.appendChild(el)
  return el
}
