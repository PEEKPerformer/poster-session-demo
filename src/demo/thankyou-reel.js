// "Thank-you" reel — post-event proof of active management.
//
// The story: I pulled every attendee's stats from the event data (visits,
// votes, dwell time), wrote a personalized callout per presenter, printed
// the cards, handwrote a note on top of every one, and hand-delivered them
// to each presenter.
//
// Shown as a slide sequence so the viewer can actually read a couple of the
// custom stat callouts (they're the proof — not the generic "thank you").

const CARDS = [
  { src: 'brand/thankyou-a.png', caption: 'Florence — "12 ballots, the most of anyone." Yasmin — "highest vote conversion at the event."' },
  { src: 'brand/thankyou-b.png', caption: 'Calvin — "longest engagement time of any presenter." Mahdad — "great conversations + led building tours."' },
  { src: 'brand/thankyou-c.png', caption: 'Zhiming — "every single person who stopped by your poster voted for it."' },
]

export function showThankYouReel(durationMs = 9500) {
  if (document.querySelector('.thankyou-reel')) return

  const overlay = document.createElement('div')
  overlay.className = 'thankyou-reel design-dna'
  overlay.innerHTML = `
    <div class="design-dna__backdrop"></div>
    <div class="design-dna__stage">
      <div class="design-dna__header">
        <div class="design-dna__eyebrow">Within the week after</div>
        <h2 class="design-dna__headline">Personal thank-yous. Handwritten.</h2>
      </div>
      <div class="design-dna__slides">
        ${CARDS.map((c, i) => `
          <figure class="design-dna__slide" data-idx="${i}">
            <div class="design-dna__frame"><img src="${c.src}" alt="Thank-you card sample ${i + 1}" loading="eager"></div>
            <figcaption>${c.caption}</figcaption>
          </figure>
        `).join('')}
      </div>
      <p class="design-dna__footer">
        Every card: stats pulled from the event data + <strong>a handwritten note</strong>, then <strong>hand-delivered</strong> to each presenter.
      </p>
    </div>
  `
  document.body.appendChild(overlay)
  requestAnimationFrame(() => overlay.classList.add('design-dna--visible'))

  const slides = Array.from(overlay.querySelectorAll('.design-dna__slide'))
  const footer = overlay.querySelector('.design-dna__footer')

  const headIn = 600
  const tailHold = 1700
  const slideWindow = Math.max(1400, Math.floor((durationMs - headIn - tailHold) / slides.length))

  const timers = []
  slides.forEach((slide, i) => {
    const onAt = headIn + i * slideWindow
    timers.push(setTimeout(() => slide.classList.add('design-dna__slide--active'), onAt))
    if (i > 0) {
      timers.push(setTimeout(() => slides[i - 1].classList.remove('design-dna__slide--active'), onAt - 80))
    }
  })
  timers.push(setTimeout(() => footer.classList.add('design-dna__footer--visible'), headIn + slides.length * slideWindow - 400))

  timers.push(setTimeout(() => {
    overlay.classList.remove('design-dna--visible')
    setTimeout(() => overlay.remove(), 500)
  }, durationMs))

  return () => {
    timers.forEach(clearTimeout)
    overlay.remove()
  }
}
