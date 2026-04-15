// Highlight = spotlight cutout + tooltip that points to a specific element.
// Used by the tour to draw attention to a UI feature and explain it.

let activeSpotlight = null
let activeTooltip = null
let activeTimer = null

// Viewport-safe zones — banner + tabs reserve ~140px at top, modest bottom margin.
const TOP_SAFE = 140
const BOTTOM_SAFE = 80

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
    const vpH = window.innerHeight
    const vpW = window.innerWidth

    // If the target is taller than the viewport (minus safe zones + room for a
    // tooltip), clamp the spotlight to a viewport-centered slice. Without this,
    // the box-shadow dim extends off-screen and the tooltip ends up in limbo.
    const maxH = Math.max(120, vpH - TOP_SAFE - BOTTOM_SAFE - 120 /* tooltip */)
    const eff = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    if (rect.height > maxH) {
      eff.top = TOP_SAFE + (vpH - TOP_SAFE - BOTTOM_SAFE - maxH) / 2
      eff.height = maxH
    }
    // Also clamp width in case of super-wide elements (unlikely but safe).
    const maxW = vpW - 24
    if (rect.width > maxW) {
      eff.left = 12
      eff.width = maxW
    }
    const effBottom = eff.top + eff.height
    const effRight  = eff.left + eff.width

    // Spotlight — absolute block with an oversized box-shadow to dim the
    // rest of the page and leave a "hole" on the target.
    const spot = document.createElement('div')
    spot.className = 'demo-highlight-spot'
    const pad = 8
    spot.style.top    = `${eff.top    + window.scrollY - pad}px`
    spot.style.left   = `${eff.left   + window.scrollX - pad}px`
    spot.style.width  = `${eff.width  + pad * 2}px`
    spot.style.height = `${eff.height + pad * 2}px`
    document.body.appendChild(spot)

    // Tooltip
    const tip = document.createElement('div')
    tip.className = 'demo-highlight-tip'
    tip.innerHTML = `
      ${label ? `<span class="demo-highlight-tip__label">${label}</span>` : ''}
      <div class="demo-highlight-tip__body">${text}</div>
    `
    document.body.appendChild(tip)
    const tipRect = tip.getBoundingClientRect()
    const margin = 16

    // Pick a position that actually fits. Flip to the opposite side if the
    // requested side would push the tooltip off-screen.
    let pos = position
    const fitsTop    = eff.top - margin - tipRect.height >= TOP_SAFE
    const fitsBottom = effBottom + margin + tipRect.height <= vpH - BOTTOM_SAFE
    const fitsLeft   = eff.left - margin - tipRect.width >= 12
    const fitsRight  = effRight  + margin + tipRect.width <= vpW - 12
    if (pos === 'top'    && !fitsTop    && fitsBottom) pos = 'bottom'
    else if (pos === 'bottom' && !fitsBottom && fitsTop)   pos = 'top'
    else if (pos === 'left'   && !fitsLeft   && fitsRight) pos = 'right'
    else if (pos === 'right'  && !fitsRight  && fitsLeft)  pos = 'left'
    tip.classList.add(`demo-highlight-tip--${pos}`)

    let tipTop, tipLeft
    if (pos === 'bottom') {
      tipTop  = effBottom + window.scrollY + margin
      tipLeft = eff.left + window.scrollX + eff.width / 2 - tipRect.width / 2
    } else if (pos === 'top') {
      tipTop  = eff.top - margin - tipRect.height + window.scrollY
      tipLeft = eff.left + window.scrollX + eff.width / 2 - tipRect.width / 2
    } else if (pos === 'right') {
      tipTop  = eff.top + window.scrollY + eff.height / 2 - tipRect.height / 2
      tipLeft = effRight + window.scrollX + margin
    } else {
      tipTop  = eff.top + window.scrollY + eff.height / 2 - tipRect.height / 2
      tipLeft = eff.left + window.scrollX - margin - tipRect.width
    }
    // Final clamp to keep the tooltip inside the safe window.
    tipLeft = Math.max(12, Math.min(vpW - tipRect.width - 12, tipLeft))
    const minTipTop = TOP_SAFE + window.scrollY
    const maxTipTop = vpH - BOTTOM_SAFE - tipRect.height + window.scrollY
    tipTop = Math.max(minTipTop, Math.min(maxTipTop, tipTop))
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
