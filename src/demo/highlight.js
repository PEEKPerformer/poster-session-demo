// Highlight = spotlight cutout + tooltip that points to a specific element.
// Used by the tour to draw attention to a UI feature and explain it.

let activeSpotlight = null
let activeTooltip = null
let activeTimer = null

export function clearHighlight() {
  if (activeSpotlight) activeSpotlight.remove()
  if (activeTooltip) activeTooltip.remove()
  if (activeTimer) clearTimeout(activeTimer)
  activeSpotlight = activeTooltip = null
  activeTimer = null
}

/**
 * Spotlight an element with a tooltip explanation.
 * @param {string} selector CSS selector of element to highlight.
 * @param {string} text Caption text shown next to the element.
 * @param {object} opts { duration: ms, position: 'top'|'bottom'|'right'|'left', label?: string }
 */
export function highlight(selector, text, opts = {}) {
  const { duration = 4500, position = 'bottom', label = null, scroll = true } = opts
  clearHighlight()

  const target = document.querySelector(selector)
  if (!target) return

  if (scroll) target.scrollIntoView({ block: 'center', behavior: 'smooth' })

  // Wait a frame for any scroll-triggered layout to settle.
  requestAnimationFrame(() => {
    const rect = target.getBoundingClientRect()

    // Spotlight — an absolutely-positioned block that uses an oversized
    // box-shadow to dim the rest of the page, leaving a "hole" on the target.
    const spot = document.createElement('div')
    spot.className = 'demo-highlight-spot'
    const pad = 8
    spot.style.top    = `${rect.top    + window.scrollY - pad}px`
    spot.style.left   = `${rect.left   + window.scrollX - pad}px`
    spot.style.width  = `${rect.width  + pad * 2}px`
    spot.style.height = `${rect.height + pad * 2}px`
    document.body.appendChild(spot)

    // Tooltip
    const tip = document.createElement('div')
    tip.className = `demo-highlight-tip demo-highlight-tip--${position}`
    tip.innerHTML = `
      ${label ? `<span class="demo-highlight-tip__label">${label}</span>` : ''}
      <div class="demo-highlight-tip__body">${text}</div>
    `
    document.body.appendChild(tip)

    // Position tooltip relative to spotlight
    const tipRect = tip.getBoundingClientRect()
    const margin = 16
    let tipTop, tipLeft
    if (position === 'bottom') {
      tipTop  = rect.bottom + window.scrollY + margin
      tipLeft = rect.left   + window.scrollX + rect.width / 2 - tipRect.width / 2
    } else if (position === 'top') {
      tipTop  = rect.top    + window.scrollY - margin - tipRect.height
      tipLeft = rect.left   + window.scrollX + rect.width / 2 - tipRect.width / 2
    } else if (position === 'right') {
      tipTop  = rect.top    + window.scrollY + rect.height / 2 - tipRect.height / 2
      tipLeft = rect.right  + window.scrollX + margin
    } else {
      tipTop  = rect.top    + window.scrollY + rect.height / 2 - tipRect.height / 2
      tipLeft = rect.left   + window.scrollX - margin - tipRect.width
    }
    // Clamp to viewport
    tipLeft = Math.max(12, Math.min(window.innerWidth - tipRect.width - 12, tipLeft))
    tip.style.top  = `${tipTop}px`
    tip.style.left = `${tipLeft}px`

    requestAnimationFrame(() => {
      spot.classList.add('demo-highlight-spot--visible')
      tip.classList.add('demo-highlight-tip--visible')
    })

    activeSpotlight = spot
    activeTooltip = tip

    activeTimer = setTimeout(() => clearHighlight(), duration)
  })
}
