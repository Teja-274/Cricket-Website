import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export function CricketBallCursor() {
  const [visible, setVisible] = useState(false)
  const [clicking, setClicking] = useState(false)
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)

  const springX = useSpring(cursorX, { damping: 25, stiffness: 300, mass: 0.5 })
  const springY = useSpring(cursorY, { damping: 25, stiffness: 300, mass: 0.5 })

  const rotation = useRef(0)
  const velocity = useRef({ x: 0, y: 0 })
  const lastPos = useRef({ x: 0, y: 0 })
  const rotationValue = useMotionValue(0)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)

      // Calculate velocity for rotation
      velocity.current.x = e.clientX - lastPos.current.x
      velocity.current.y = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }

      // Rotate ball based on movement speed
      const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2)
      rotation.current += speed * 2
      rotationValue.set(rotation.current)

      setVisible(true)
    }

    const handleDown = () => setClicking(true)
    const handleUp = () => setClicking(false)
    const handleLeave = () => setVisible(false)
    const handleEnter = () => setVisible(true)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
    }
  }, [cursorX, cursorY, rotationValue])

  if (!visible) return null

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
      }}
    >
      <motion.div
        animate={{ scale: clicking ? 0.75 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        <motion.svg
          width="36"
          height="36"
          viewBox="0 0 100 100"
          style={{ rotate: rotationValue, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
        >
          <defs>
            {/* Darker 3D ball gradient */}
            <radialGradient id="ballGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#d44" />
              <stop offset="20%" stopColor="#b22" />
              <stop offset="50%" stopColor="#911" />
              <stop offset="80%" stopColor="#700e0e" />
              <stop offset="100%" stopColor="#4a0808" />
            </radialGradient>
            {/* Shine highlight */}
            <radialGradient id="shine" cx="30%" cy="25%" r="25%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            {/* Secondary shine */}
            <radialGradient id="shine2" cx="65%" cy="70%" r="20%">
              <stop offset="0%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ball body - darker red */}
          <circle cx="50" cy="50" r="46" fill="url(#ballGrad)" stroke="#600a0a" strokeWidth="1" />

          {/* Shine overlay */}
          <circle cx="50" cy="50" r="46" fill="url(#shine)" />
          <circle cx="50" cy="50" r="46" fill="url(#shine2)" />

          {/* Left seam - straight line, dotted like thread */}
          <line x1="33" y1="10" x2="33" y2="90" stroke="#f0dcc0" strokeWidth="2" strokeDasharray="3 3" />
          {/* Right seam - straight line, dotted like thread */}
          <line x1="67" y1="10" x2="67" y2="90" stroke="#f0dcc0" strokeWidth="2" strokeDasharray="3 3" />

          {/* Left stitch marks - straight horizontal dashes */}
          <line x1="33" y1="16" x2="27" y2="14" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="24" x2="27" y2="22" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="32" x2="27" y2="30" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="40" x2="27" y2="38" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="48" x2="27" y2="47" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="56" x2="27" y2="56" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="64" x2="27" y2="64" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="72" x2="27" y2="72" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="33" y1="80" x2="27" y2="80" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />

          {/* Right stitch marks - straight horizontal dashes */}
          <line x1="67" y1="16" x2="73" y2="14" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="24" x2="73" y2="22" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="32" x2="73" y2="30" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="40" x2="73" y2="38" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="48" x2="73" y2="47" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="56" x2="73" y2="56" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="64" x2="73" y2="64" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="72" x2="73" y2="72" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <line x1="67" y1="80" x2="73" y2="80" stroke="#f0dcc0" strokeWidth="1.2" strokeDasharray="2 1.5" />

          {/* Inner shadow for depth */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="#300505" strokeWidth="2" opacity="0.2" />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}
