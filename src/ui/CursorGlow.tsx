import { useEffect, useRef } from 'react'
export default function CursorGlow(){
  const elRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const onMove = (e: MouseEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        if (elRef.current){
          elRef.current.style.transform = `translate3d(${e.clientX - 12}px, ${e.clientY - 12}px, 0)`
        }
        raf = 0
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
  return <div ref={elRef} aria-hidden="true" className="fixed z-50 h-6 w-6 pointer-events-none mix-blend-difference will-change-transform" style={{background: 'radial-gradient(circle, #ffd700 0%, transparent 70%)'}}/>
}
