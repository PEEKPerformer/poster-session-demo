import { validateCode } from '../supabase.js'
import { getState, setState } from '../state.js'
import { navigate } from '../router.js'
import { renderHeader } from '../components/header.js'
import { track, identify } from '../lib/track.js'
import { isPlaceholderName } from '../lib/identity.js'
import { getCodeFact } from '../lib/codename-facts.js'

export function renderAuth(root) {
  // If already authenticated, redirect
  const { attendee, eventPhase } = getState()
  if (attendee) {
    redirectForPhase(attendee, eventPhase)
    return
  }

  // Auto-auth from URL param: ?code=MO01
  const urlCode = new URLSearchParams(window.location.search).get('code')
  if (urlCode) {
    autoAuth(urlCode)
    // Show loading state while validating
    const loading = document.createElement('div')
    loading.className = 'view'
    loading.innerHTML = '<p class="text-muted text-center mt-4">Signing in...</p>'
    root.appendChild(loading)
    return
  }

  const view = document.createElement('div')
  view.className = 'view'

  renderHeader(view, {
    title: 'SPRING EVENT 2026',
    subtitle: 'Poster Session Companion',
    showNav: false,
  })

  const form = document.createElement('form')
  form.className = 'w-full'
  form.style.display = 'flex'
  form.style.flexDirection = 'column'
  form.style.alignItems = 'center'
  form.style.gap = '1rem'
  form.innerHTML = `
    <p class="label-tracked mt-2">Enter your access code</p>
    <input
      type="text"
      class="input"
      id="code-input"
      maxlength="6"
      autocapitalize="characters"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      placeholder="· · · · · ·"
    >
    <p id="auth-error" class="text-error text-sm hidden"></p>
    <button type="submit" class="btn btn--gold btn--full mt-1">Enter</button>
    <p class="text-muted text-xs text-center mt-2">
      Code is printed on your registration card
    </p>
  `

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const input = form.querySelector('#code-input')
    const error = form.querySelector('#auth-error')
    const btn = form.querySelector('button[type="submit"]')
    const code = input.value.trim()

    if (!code) {
      input.classList.add('input--error')
      return
    }

    btn.disabled = true
    btn.textContent = 'Checking...'
    error.classList.add('hidden')
    input.classList.remove('input--error')

    const { data, error: authErr } = await validateCode(code)

    if (data) {
      identify(data.code, { name: data.name, role: data.role })
      track('user_signed_in', { role: data.role, method: 'manual' })
      setState({ attendee: data })
      redirectForPhase(data, getState().eventPhase)
    } else {
      track('sign_in_failed', {
        reason: authErr?.code || 'not_found',
        error_message: authErr?.message || 'Invalid code',
        code_length: code.length,
        method: 'manual',
      })
      input.classList.add('input--error')
      error.textContent = 'Invalid code. Check your registration card.'
      error.classList.remove('hidden')
      btn.disabled = false
      btn.textContent = 'Enter'
    }
  })

  view.appendChild(form)

  const credit = document.createElement('a')
  credit.className = 'built-by'
  credit.href = 'https://bfer.land'
  credit.target = '_blank'
  credit.rel = 'noopener'
  credit.textContent = 'Built by Brenden Ferland'
  view.appendChild(credit)

  root.appendChild(view)

  // Auto-focus
  setTimeout(() => {
    const input = form.querySelector('#code-input')
    if (input) input.focus()
  }, 100)
}

async function autoAuth(code) {
  const { data, error: authErr } = await validateCode(code)
  // Strip ?code= from URL so refreshes don't re-auth
  window.history.replaceState(null, '', window.location.pathname + window.location.hash)
  if (data) {
    identify(data.code, { name: data.name, role: data.role })
    track('user_signed_in', { role: data.role, method: 'url_param' })
    setState({ attendee: data })
    redirectForPhase(data, getState().eventPhase)
  } else {
    track('sign_in_failed', {
      reason: authErr?.code || 'not_found',
      error_message: authErr?.message || 'Invalid code',
      code_length: code.length,
      method: 'url_param',
    })
    // Force re-render since we're already on #/auth
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}

function redirectForPhase(attendee, phase) {
  const dest = attendee.role === 'admin' ? '#/admin'
    : phase === 'session' ? '#/gallery'
    : '#/gallery' // results/public — browse-only

  // Show tutorial on first sign-in (skip for admins), per-user flag
  const tutorialKey = `nerpg_tutorial_seen_${attendee.code}`
  if (attendee.role !== 'admin' && !localStorage.getItem(tutorialKey)) {
    track('tutorial_shown', { role: attendee.role })
    showWelcome(attendee.name, attendee.role, attendee.code, () => {
      track('tutorial_dismissed', { role: attendee.role })
      localStorage.setItem(tutorialKey, '1')
      navigate(dest)
    })
    return
  }

  navigate(dest)
}

export function showWelcome(name, role, code, onDone) {
  // Backward compat: if code is a function, it's the old (name, role, onDone) signature
  if (typeof code === 'function') { onDone = code; code = null }

  // Prevent duplicates from re-renders
  if (document.querySelector('.welcome-overlay')) return
  const firstName = isPlaceholderName(name) ? 'there' : name.split(' ')[0]
  const fact = getCodeFact(code)
  const factHtml = fact
    ? `<div class="welcome-fact">
        <span class="welcome-fact__code">${code}</span>
        <span class="welcome-fact__text">${fact}</span>
      </div>`
    : ''

  const overlay = document.createElement('div')
  overlay.className = 'welcome-overlay'

  if (role === 'presenter') {
    overlay.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-greeting">
          <span class="welcome-wave">👋</span>
          <span>Welcome, <strong>${firstName}</strong>!</span>
        </div>
        <div class="welcome-divider"></div>
        ${factHtml}
        <p style="text-align:center; font-size:0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          Help NERPG attendees use the companion app
        </p>
        <div class="welcome-steps">
          <div class="welcome-step" style="animation-delay: 0.3s">
            <div class="welcome-step__num">1</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">Show Your Number</div>
              <div class="welcome-step__desc">Point visitors to the poster number on your board</div>
              <div class="welcome-anim welcome-anim--poster" style="animation-delay: 0.7s">
                <span class="welcome-anim__badge" style="animation-delay: 0.9s">#${Math.floor(Math.random() * 7) + 1}</span>
              </div>
            </div>
          </div>
          <div class="welcome-step" style="animation-delay: 0.55s">
            <div class="welcome-step__num">2</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">Help Them Log It</div>
              <div class="welcome-step__desc">Attendees tap <strong>#</strong> and enter your poster number</div>
              <div class="welcome-anim welcome-anim--numpad" style="animation-delay: 1.0s">
                <span class="welcome-anim__display">
                  <span class="welcome-anim__digit" style="animation-delay: 1.5s">5</span>
                </span>
                <span class="welcome-anim__check" style="animation-delay: 2.2s">&#10003;</span>
              </div>
            </div>
          </div>
          <div class="welcome-step" style="animation-delay: 0.8s">
            <div class="welcome-step__num">3</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">They Vote, You Win</div>
              <div class="welcome-step__desc">NERPG attendees pick their top 3 posters for the cash prize</div>
              <div class="welcome-anim welcome-anim--vote" style="animation-delay: 1.3s">
                <span class="welcome-anim__medal welcome-anim__medal--1" style="animation-delay: 2.5s">1st</span>
                <span class="welcome-anim__medal welcome-anim__medal--2" style="animation-delay: 2.7s">2nd</span>
                <span class="welcome-anim__medal welcome-anim__medal--3" style="animation-delay: 2.9s">3rd</span>
              </div>
            </div>
          </div>
          <div class="welcome-step" style="animation-delay: 1.05s">
            <div class="welcome-step__num">4</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">You Vote Too!</div>
              <div class="welcome-step__desc">Visit other posters and vote for the <strong>Peer Impact Award</strong> — a peer recognition honor</div>
            </div>
          </div>
        </div>
        <button class="welcome-btn" style="animation-delay: 1.3s">Got It!</button>
      </div>
    `
  } else {
    overlay.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-greeting">
          <span class="welcome-wave">👋</span>
          <span>Welcome, <strong>${firstName}</strong>!</span>
        </div>
        <div class="welcome-divider"></div>
        ${factHtml}
        <div class="welcome-steps">
          <div class="welcome-step" style="animation-delay: 0.3s">
            <div class="welcome-step__num">1</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">Visit Posters</div>
              <div class="welcome-step__desc">Walk up to a poster and note its number</div>
              <div class="welcome-anim welcome-anim--poster" style="animation-delay: 0.7s">
                <span class="welcome-anim__badge" style="animation-delay: 0.9s">#5</span>
                <span class="welcome-anim__badge" style="animation-delay: 1.1s">#12</span>
                <span class="welcome-anim__badge" style="animation-delay: 1.3s">#8</span>
              </div>
            </div>
          </div>
          <div class="welcome-step" style="animation-delay: 0.55s">
            <div class="welcome-step__num">2</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">Log It</div>
              <div class="welcome-step__desc">Tap the <strong>#</strong> button and type the poster number</div>
              <div class="welcome-anim welcome-anim--numpad" style="animation-delay: 1.0s">
                <span class="welcome-anim__display">
                  <span class="welcome-anim__digit" style="animation-delay: 1.5s">1</span><span class="welcome-anim__digit" style="animation-delay: 1.8s">2</span>
                </span>
                <span class="welcome-anim__check" style="animation-delay: 2.2s">&#10003;</span>
              </div>
            </div>
          </div>
          <div class="welcome-step" style="animation-delay: 0.8s">
            <div class="welcome-step__num">3</div>
            <div class="welcome-step__body">
              <div class="welcome-step__title">Vote</div>
              <div class="welcome-step__desc">${role === 'student'
                ? 'After 3+ visits, pick your top 3 for the <strong>Peer Impact Award</strong>'
                : 'After 3+ visits, pick your top 3 posters. Your vote decides the <strong>$500 / $250 / $100</strong> cash prizes, courtesy of NERPG'}</div>
              <div class="welcome-anim welcome-anim--vote" style="animation-delay: 1.3s">
                <span class="welcome-anim__medal welcome-anim__medal--1" style="animation-delay: 2.5s">1st</span>
                <span class="welcome-anim__medal welcome-anim__medal--2" style="animation-delay: 2.7s">2nd</span>
                <span class="welcome-anim__medal welcome-anim__medal--3" style="animation-delay: 2.9s">3rd</span>
              </div>
            </div>
          </div>
        </div>
        <button class="welcome-btn" style="animation-delay: 1.1s">Let's Go!</button>
      </div>
    `
  }

  overlay.querySelector('.welcome-btn').addEventListener('click', () => {
    overlay.classList.add('welcome-overlay--exit')
    setTimeout(() => {
      overlay.remove()
      onDone()
    }, 350)
  })

  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('welcome-overlay--open'))
}
