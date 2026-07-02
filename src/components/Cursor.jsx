import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const pos = useRef({ x: -100, y: -100 })
  const ring = useRef({ x: -100, y: -100 })
  const isHovering = useRef(false)

  useEffect(() => {
    const dot = dotRef.current
    const ringEl = ringRef.current

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY }
    }

    const onEnter = () => { isHovering.current = true }
    const onLeave = () => { isHovering.current = false }

    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    let raf
    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.1
      ring.current.y += (pos.current.y - ring.current.y) * 0.1

      dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`
      ringEl.style.transform = `translate(${ring.current.x - 20}px, ${ring.current.y - 20}px) scale(${isHovering.current ? 1.8 : 1})`
      ringEl.style.opacity = isHovering.current ? '0.2' : '0.5'

      raf = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed', width: 8, height: 8,
        background: '#C4A057', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 99999,
        willChange: 'transform'
      }} />
      <div ref={ringRef} style={{
        position: 'fixed', width: 40, height: 40,
        border: '1.5px solid #C4A057', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 99998,
        transition: 'opacity 0.3s, transform 0.1s',
        willChange: 'transform'
      }} />
    </>
  )
}
