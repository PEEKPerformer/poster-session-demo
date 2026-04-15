// "Design DNA" reel — the bespoke-brand-system proof moment.
//
// Each piece of the brand system shown full-frame, cross-fading on the same
// dark backdrop so the shared design language (navy + gold + one logo) reads
// across every artifact. The point isn't any single piece — it's that they
// all share one voice.

const PIECES = [
  { src: 'brand/poster.png',       label: 'Event poster' },
  { src: 'brand/polymer-art.png',  label: 'Recap cover' },
  { src: 'brand/checkin-card.png', label: 'Check-in cards' },
  { src: 'brand/ballot.png',       label: 'Award ballot' },
  { src: 'brand/nametag.png',      label: 'Organizer name tags' },
  { src: 'brand/poster-id.png',    label: 'Presenter poster IDs' },
  { src: 'brand/certificate.png',  label: 'Winner certificate' },
  { src: 'brand/logo.png',         label: 'Brand mark' },
]

export function showDesignDna(durationMs = 11000) {
  if (document.querySelector('.design-dna')) return

  const overlay = document.createElement('div')
  overlay.className = 'design-dna'
  overlay.innerHTML = `
    <div class="design-dna__backdrop"></div>
    <div class="design-dna__stage">
      <div class="design-dna__header">
        <div class="design-dna__eyebrow">One brand system</div>
        <h2 class="design-dna__headline">Every piece, on purpose.</h2>
      </div>
      <div class="design-dna__slides">
        ${PIECES.map((p, i) => `
          <figure class="design-dna__slide" data-idx="${i}">
            <div class="design-dna__frame"><img src="${p.src}" alt="${p.label}" loading="eager"></div>
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

  const slides = Array.from(overlay.querySelectorAll('.design-dna__slide'))
  const footer = overlay.querySelector('.design-dna__footer')

  // Reserve ~600ms header-in at the start and ~1400ms footer-hold at the end.
  const headIn = 700
  const tailHold = 1500
  const slideWindow = Math.max(700, Math.floor((durationMs - headIn - tailHold) / slides.length))

  const timers = []
  slides.forEach((slide, i) => {
    const onAt = headIn + i * slideWindow
    timers.push(setTimeout(() => slide.classList.add('design-dna__slide--active'), onAt))
    // Fade out the previous slide ~80ms before the next lands for a clean cross-fade.
    if (i > 0) {
      timers.push(setTimeout(() => slides[i - 1].classList.remove('design-dna__slide--active'), onAt - 80))
    }
  })
  // Fade the footer in near the end, keep the last slide visible under it.
  timers.push(setTimeout(() => footer.classList.add('design-dna__footer--visible'), headIn + slides.length * slideWindow - 600))

  // Cleanup
  timers.push(setTimeout(() => {
    overlay.classList.remove('design-dna--visible')
    setTimeout(() => overlay.remove(), 500)
  }, durationMs))

  return () => {
    timers.forEach(clearTimeout)
    overlay.remove()
  }
}

export function hideDesignDna() {
  document.querySelectorAll('.design-dna').forEach(n => n.remove())
}
