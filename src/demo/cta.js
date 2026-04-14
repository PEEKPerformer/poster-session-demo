// Full-bleed CTA overlay shown at the end of the tour. Includes an inline
// Formspree form so prospects can reach out without leaving the page.

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xrerbyde'

export function showCtaOverlay() {
  if (document.querySelector('.demo-cta-overlay')) return
  const overlay = document.createElement('div')
  overlay.className = 'demo-cta-overlay'
  overlay.innerHTML = `
    <div class="demo-cta-overlay__card">
      <h2 class="demo-cta-overlay__headline">Your event could run like this.</h2>
      <p class="demo-cta-overlay__sub">
        QR-code check-in, offline visit logging, ranked peer voting, live
        results — no email signups, no per-attendee fees.
      </p>
      <ul class="demo-cta-overlay__list">
        <li>Pre-printed cards for registered attendees &middot; on-screen QR for walk-ups</li>
        <li>Offline-first — absorbed 106 Wi-Fi flips at Spring 2026 with zero data loss</li>
        <li>Two parallel award tracks (Distinguished + Peer Impact)</li>
        <li>Post-event spotlight that drove 43 return visitors over the following weeks</li>
        <li>Polymer-fact trivia / Q&amp;A game that reuses each attendee's codename</li>
      </ul>

      <form class="demo-cta-form" action="${FORMSPREE_ENDPOINT}" method="POST" novalidate>
        <p class="demo-cta-form__intro">Tell me about your event — I'll reply within a day.</p>
        <label class="demo-cta-form__field">
          <span>Your email</span>
          <input type="email" name="email" required placeholder="you@university.edu">
        </label>
        <label class="demo-cta-form__field">
          <span>A little about the event</span>
          <textarea name="message" rows="3" placeholder="Department day · Society section · ~50 attendees · Nov 2026…" required></textarea>
        </label>
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="display:none">
        <div class="demo-cta-overlay__actions">
          <button type="submit" class="demo-cta-overlay__primary">Send</button>
          <button type="button" class="demo-cta-overlay__secondary" data-action="dismiss">Keep watching</button>
        </div>
        <p class="demo-cta-form__status" role="status"></p>
      </form>

      <p class="demo-cta-overlay__footnote">Built by <a href="https://bfer.land" target="_blank" rel="noopener">Brenden Ferland</a>. NERPG Spring 2026 shown in accelerated time.</p>
    </div>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('demo-cta-overlay--visible'))

  overlay.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
    overlay.classList.remove('demo-cta-overlay--visible')
    setTimeout(() => overlay.remove(), 250)
  })

  const form = overlay.querySelector('.demo-cta-form')
  const status = overlay.querySelector('.demo-cta-form__status')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.textContent = 'Sending…'
    status.className = 'demo-cta-form__status'
    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      })
      if (resp.ok) {
        form.innerHTML = `<p class="demo-cta-form__success">Thanks — I'll be in touch shortly.</p>`
      } else {
        status.textContent = 'Send failed. Try again, or email via bfer.land.'
        status.className = 'demo-cta-form__status demo-cta-form__status--err'
      }
    } catch {
      status.textContent = 'Network error — please try again.'
      status.className = 'demo-cta-form__status demo-cta-form__status--err'
    }
  })
}
