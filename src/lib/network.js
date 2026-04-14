/**
 * Polymer Network Canvas Animation
 *
 * Ported from Python generate_poster.py polymer_network() function.
 * "Crosslinked Cartography" — nodes as lattice points, bonds as
 * structural connections, gold accents for warmth.
 *
 * Differences from the static poster version:
 * - Nodes drift slowly for ambient motion
 * - Responsive to viewport resize
 * - Reduced node count on mobile for battery
 * - Respects prefers-reduced-motion
 */

// Seeded PRNG (mulberry32) for deterministic layouts
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Colors (matching poster: RD_NAVY, RD_GOLD, WHITE)
const NAVY = [0, 40, 85]
const GOLD = [255, 174, 0]
const WHITE = [255, 255, 255]

export function initNetwork(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let nodes = []
  let W = 0
  let H = 0
  let animId = null
  let isStatic = false

  // Check prefers-reduced-motion
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  isStatic = motionQuery.matches

  // Mobile detection — reduce complexity for battery
  const isMobile = window.innerWidth < 768

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    nodes = generateNodes(W, H)
    draw()
  }

  function generateNodes(W, H) {
    const rng = mulberry32(42)
    const n = isMobile ? 25 : 45
    const rMin = isMobile ? 5 : 10
    const rMax = isMobile ? 18 : 35
    const pad = 6
    const result = []

    for (let i = 0; i < n; i++) {
      for (let attempt = 0; attempt < 200; attempt++) {
        const x = rng() * (W + 2 * rMax) - rMax
        const y = rng() * (H + 2 * rMax) - rMax
        const r = rMin + rng() * (rMax - rMin)
        const gold = rng() < 0.12

        // Rejection sampling: no overlaps
        let ok = true
        for (const nd of result) {
          if (Math.hypot(x - nd.x, y - nd.y) < r + nd.r + pad) {
            ok = false
            break
          }
        }

        if (ok) {
          result.push({
            x, y, r, gold,
            // Drift velocity (very slow)
            dx: (rng() - 0.5) * 0.45,
            dy: (rng() - 0.5) * 0.45,
          })
          break
        }
      }
    }

    return result
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)

    const maxDist = Math.min(W, H) * 0.35
    const bondAlpha = 0.07
    const nodeAlpha = 0.14

    // Draw bonds (edge-to-edge, matching Python algorithm)
    ctx.lineWidth = isMobile ? 1 : 1.5
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const dist = Math.hypot(b.x - a.x, b.y - a.y)
        const gap = a.r + b.r + 6

        if (dist < maxDist && dist > gap) {
          const ux = (b.x - a.x) / dist
          const uy = (b.y - a.y) / dist

          ctx.beginPath()
          ctx.moveTo(a.x + a.r * ux, a.y + a.r * uy)
          ctx.lineTo(b.x - b.r * ux, b.y - b.r * uy)
          ctx.strokeStyle = `rgba(${WHITE[0]}, ${WHITE[1]}, ${WHITE[2]}, ${bondAlpha})`
          ctx.stroke()
        }
      }
    }

    // Draw nodes on top of bonds
    for (const nd of nodes) {
      const col = nd.gold ? GOLD : WHITE
      const sw = Math.max(nd.r / 7, 1)

      ctx.beginPath()
      ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${NAVY[0]}, ${NAVY[1]}, ${NAVY[2]}, ${nodeAlpha})`
      ctx.fill()
      ctx.lineWidth = sw
      ctx.strokeStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${nodeAlpha + 0.05})`
      ctx.stroke()
    }
  }

  function animate() {
    // Soft repulsion — nudge overlapping nodes apart
    const repelStrength = 0.04
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy)
        const minDist = a.r + b.r + 8
        if (dist < minDist && dist > 0.1) {
          const push = (minDist - dist) * repelStrength
          const ux = dx / dist
          const uy = dy / dist
          a.dx -= ux * push
          a.dy -= uy * push
          b.dx += ux * push
          b.dy += uy * push
        }
      }
    }

    // Drift nodes + light dampen so repulsion doesn't accumulate
    for (const nd of nodes) {
      nd.dx *= 0.999
      nd.dy *= 0.999
      nd.x += nd.dx
      nd.y += nd.dy

      // Soft bounce at edges
      if (nd.x < -nd.r * 2 || nd.x > W + nd.r * 2) nd.dx *= -1
      if (nd.y < -nd.r * 2 || nd.y > H + nd.r * 2) nd.dy *= -1
    }

    draw()
    animId = requestAnimationFrame(animate)
  }

  // Handle resize
  let resizeTimer
  function onResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resize, 200)
  }
  window.addEventListener('resize', onResize)

  // Handle reduced motion changes
  motionQuery.addEventListener('change', (e) => {
    isStatic = e.matches
    if (isStatic && animId) {
      cancelAnimationFrame(animId)
      animId = null
    } else if (!isStatic && !animId) {
      animate()
    }
  })

  // Init
  resize()

  if (!isStatic && !isMobile) {
    animate()
  }
  // On mobile or reduced motion: static render only (draw once, no animation loop)

  return {
    destroy() {
      window.removeEventListener('resize', onResize)
      if (animId) cancelAnimationFrame(animId)
    },
  }
}
