// "Design DNA" reel — the bespoke-brand-system proof moment.
//
// Plays as a full-bleed overlay: headline on top, a staggered mosaic of real
// NERPG Spring 2026 brand pieces (logo, poster, cards, ballot, nametag, cert,
// poster-ID, recap cover), closing on a personal tagline.
//
// The point isn't any one asset — it's that every piece shares one design
// language. That coherence is the thing the buyer is being sold.

const PIECES = [
  { src: 'brand/logo.png',         label: 'Brand mark',        span: 'wide' },
  { src: 'brand/polymer-art.png',  label: 'Event recap cover', span: 'tall' },
  { src: 'brand/poster.png',       label: 'Event poster',      span: 'tall' },
  { src: 'brand/checkin-card.png', label: 'Check-in cards',    span: 'normal' },
  { src: 'brand/nametag.png',      label: 'Name tags',         span: 'normal' },
  { src: 'brand/ballot.png',       label: 'Paper ballot',      span: 'normal' },
  { src: 'brand/poster-id.png',    label: 'Poster IDs',        span: 'normal' },
  { src: 'brand/certificate.png',  label: 'Winner certificate', span: 'wide' },
]

export function showDesignDna(durationMs = 11000) {
  if (document.querySelector('.design-dna')) return

  const overlay = document.createElement('div')
  overlay.className = 'design-dna'
  overlay.innerHTML = `
    <div class="design-dna__backdrop"></div>
    <div class="design-dna__inner">
      <div class="design-dna__eyebrow">One brand system</div>
      <h2 class="design-dna__headline">Every piece, on purpose.</h2>
      <div class="design-dna__grid">
        ${PIECES.map((p, i) => `
          <figure class="design-dna__tile design-dna__tile--${p.span}" style="--i: ${i}">
            <img src="${p.src}" alt="${p.label}" loading="eager">
            <figcaption>${p.label}</figcaption>
          </figure>
        `).join('')}
      </div>
      <p class="design-dna__footer">
        I designed every pixel for NERPG. <strong>I'll design yours too.</strong>
      </p>
    </div>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('design-dna--visible'))

  const t = setTimeout(() => {
    overlay.classList.remove('design-dna--visible')
    setTimeout(() => overlay.remove(), 600)
  }, durationMs)

  return () => {
    clearTimeout(t)
    overlay.remove()
  }
}

export function hideDesignDna() {
  document.querySelectorAll('.design-dna').forEach(n => n.remove())
}
