import { useEffect, useRef } from 'react'

export function useMouse() {
  const mouse = useRef({ x: 0, y: 0, nx: 0, ny: 0 })

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      mouse.current.nx = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.ny = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return mouse
}
