// Full-bleed CTA overlay shown at the end of the tour. Includes an inline
// Formspree form so prospects can reach out without leaving the page.

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xrerbyde'

export function showCtaOverlay() {
  if (document.querySelector('.demo-cta-overlay')) return
  const overlay = document.createElement('div')
  overlay.className = 'demo-cta-overlay'
  overlay.innerHTML = `
    <div class="demo-cta-overlay__card">
      <div class="demo-cta-overlay__eyebrow">Design + operate your next poster session</div>
      <h2 class="demo-cta-overlay__headline">Let's design your event.</h2>
      <p class="demo-cta-overlay__sub">
        Not a subscription. An engagement. I design the brand, build a custom-themed app,
        deliver your printed asset pack, and run the admin panel the day of.
      </p>

      <div class="demo-cta-overlay__section-label">What you get</div>
      <ul class="demo-cta-overlay__list">
        <li><strong>Custom brand system</strong> — logo art, poster, ballots, certificates, name tags, app theme — one visual language</li>
        <li><strong>Custom-themed app</strong> — codenames, voting rules, award tracks tailored to your event</li>
        <li><strong>Printed asset pack</strong> — check-in cards, ballots, name tags, poster IDs, winner certs — delivered ready to print</li>
        <li><strong>I run the admin panel day-of</strong> — you shake hands; I flip phases, fix typos, announce winners</li>
        <li><strong>Full data export</strong> — attendees, visits, ballots, tallies — yours to keep</li>
      </ul>

      <p class="demo-cta-overlay__scarcity">
        I take <strong>3–4 engagements per semester</strong>. Pricing scales with event size —
        a 30-person department day and a 2,000-person mid-conference are different conversations.
      </p>

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

      <p class="demo-cta-overlay__footnote">
        Designed, built, and run by <a href="https://bfer.land" target="_blank" rel="noopener">Brenden Ferland</a>
        — polymer PhD, UConn. NERPG Spring 2026 shown in accelerated time.
      </p>
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
