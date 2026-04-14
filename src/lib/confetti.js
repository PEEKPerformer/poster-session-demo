/**
 * Lightweight canvas confetti burst.
 * Call launchConfetti() to fire a celebration animation.
 */

const COLORS = [
  '#FFAE00', // gold
  '#FFD54F', // light gold
  '#FFFFFF', // white
  '#BEC5E1', // muted
  '#FF6B6B', // coral
  '#4ECDC4', // teal
]

export function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.className = 'confetti-canvas'
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
  const count = 80

  for (let i = 0; i < count; i++) {
    particles.push({
      x: W * 0.5 + (Math.random() - 0.5) * W * 0.3,
      y: H * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      alpha: 1,
    })
  }

  let frame = 0
  const maxFrames = 150

  function animate() {
    frame++
    if (frame > maxFrames) {
      canvas.remove()
      return
    }

    ctx.clearRect(0, 0, W, H)

    for (const p of particles) {
      p.vy += 0.25 // gravity
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rotation += p.rotSpeed

      // Fade out in last 30 frames
      if (frame > maxFrames - 30) {
        p.alpha = Math.max(0, (maxFrames - frame) / 30)
      }

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}
