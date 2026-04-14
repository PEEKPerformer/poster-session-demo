/**
 * Gold spark burst — visit logging celebration.
 * Fires 30 gold particles in a wide fan from a source point.
 * Self-cleaning canvas, ~1.2s duration.
 */

const SPARK_COLORS = [
  '#FFAE00', // gold
  '#FFAE00', // gold (weighted — most particles should be gold)
  '#FFD54F', // light gold
  '#FFFFFF', // white accent
]

/**
 * Launch a spark burst from a specific screen position.
 * @param {number} x - Center X in viewport pixels
 * @param {number} y - Center Y in viewport pixels
 */
export function launchSparks(x, y) {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;z-index:10001;pointer-events:none;'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const particles = []
  const count = 30

  for (let i = 0; i < count; i++) {
    // Full 360° spread, biased upward
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6
    const speed = Math.random() * 8 + 5
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 4 + 2.5,
      color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
      alpha: 1,
      decay: Math.random() * 0.008 + 0.012,
    })
  }

  let frame = 0
  const maxFrames = 70 // ~1.2s at 60fps

  function animate() {
    frame++
    if (frame > maxFrames) {
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, W, H)

    for (const p of particles) {
      p.vy += 0.15 // gravity
      p.vx *= 0.98
      p.x += p.vx
      p.y += p.vy
      p.alpha = Math.max(0, p.alpha - p.decay)

      if (p.alpha <= 0) continue

      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}

/**
 * Launch sparks from the center of a DOM element.
 * @param {HTMLElement} el - The source element
 */
export function launchSparksFrom(el) {
  if (!el) return
  const rect = el.getBoundingClientRect()
  launchSparks(rect.left + rect.width / 2, rect.top + rect.height / 2)
}
