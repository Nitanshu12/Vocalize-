import { useEffect, useRef } from 'react'

const COLORS = ['#0b636b', '#0e7c86', '#094e55', '#2ba3ab', '#0f2a2e']

export default function CursorTrail() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!isFine || reduced) return

    document.documentElement.classList.add('vocalize-cursor-active')

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const onResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    const mouse = { x: width / 2, y: height / 2 }
    const cursor = { x: mouse.x, y: mouse.y }
    let particles = []
    let lastEmit = 0
    let visible = false

    const onMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      visible = true
    }
    const onLeave = () => { visible = false }
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)

    const onDown = () => {
      const count = 12
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2
        particles.push({
          x: cursor.x, y: cursor.y,
          vx: Math.cos(angle) * (2.2 + Math.random() * 1.6),
          vy: Math.sin(angle) * (2.2 + Math.random() * 1.6),
          life: 1,
          size: 3 + Math.random() * 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          angle,
          bar: true,
        })
      }
    }
    window.addEventListener('mousedown', onDown)

    let raf
    const loop = (t) => {
      ctx.clearRect(0, 0, width, height)

      cursor.x += (mouse.x - cursor.x) * 0.22
      cursor.y += (mouse.y - cursor.y) * 0.22

      const dx = mouse.x - cursor.x
      const dy = mouse.y - cursor.y
      const speed = Math.hypot(dx, dy)

      // Continuous emission: a slow ambient drip at rest, a fuller trail while moving.
      const moving = speed > 1.2
      const interval = moving ? 30 : 90
      if (visible && t - lastEmit > interval) {
        lastEmit = t
        const travelAngle = Math.atan2(dy, dx)
        const emitAngle = moving
          ? travelAngle + Math.PI + (Math.random() - 0.5) * 1.4
          : Math.random() * Math.PI * 2
        const push = moving ? 0.5 + Math.random() * 0.9 : 0.25 + Math.random() * 0.4
        particles.push({
          x: cursor.x, y: cursor.y,
          vx: Math.cos(emitAngle) * push,
          vy: Math.sin(emitAngle) * push,
          life: 1,
          size: 1.5 + Math.random() * 2.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          angle: emitAngle,
          bar: Math.random() > 0.4,
        })
      }

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.95
        p.vy *= 0.95
        p.life -= 0.028
      })
      particles = particles.filter(p => p.life > 0)

      particles.forEach(p => {
        ctx.globalAlpha = Math.max(p.life, 0)
        ctx.fillStyle = p.color
        if (p.bar) {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.angle)
          const h = p.size * 2.4 * p.life
          ctx.fillRect(-1, -h / 2, 2, h)
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      if (visible) {
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(cursor.x, cursor.y, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = '#0f2a2e'
        ctx.fill()

        ctx.globalAlpha = 0.55
        ctx.beginPath()
        ctx.arc(cursor.x, cursor.y, 9, 0, Math.PI * 2)
        ctx.strokeStyle = '#0b636b'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('mousedown', onDown)
      document.documentElement.classList.remove('vocalize-cursor-active')
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none hidden md:block"
    />
  )
}
