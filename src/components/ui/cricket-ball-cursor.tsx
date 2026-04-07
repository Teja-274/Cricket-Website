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
            {/* 3D ball gradient */}
            <radialGradient id="ballGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="25%" stopColor="#ee3333" />
              <stop offset="55%" stopColor="#cc2222" />
              <stop offset="85%" stopColor="#991111" />
              <stop offset="100%" stopColor="#661010" />
            </radialGradient>
            {/* Shine highlight */}
            <radialGradient id="shine" cx="30%" cy="25%" r="25%">
              <stop offset="0%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            {/* Secondary shine */}
            <radialGradient id="shine2" cx="65%" cy="70%" r="20%">
              <stop offset="0%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ball body */}
          <circle cx="50" cy="50" r="46" fill="url(#ballGrad)" stroke="#881111" strokeWidth="1" />

          {/* Shine overlay */}
          <circle cx="50" cy="50" r="46" fill="url(#shine)" />
          <circle cx="50" cy="50" r="46" fill="url(#shine2)" />

          {/* Left seam curve */}
          <path
            d="M 30 12 C 36 22, 38 40, 36 50 C 34 60, 36 78, 30 88"
            stroke="#f8e8d0"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Right seam curve */}
          <path
            d="M 70 12 C 64 22, 62 40, 64 50 C 66 60, 64 78, 70 88"
            stroke="#f8e8d0"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Left stitch marks */}
          <line x1="31" y1="18" x2="26" y2="14" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="34" y1="25" x2="28" y2="22" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="32" x2="30" y2="30" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="37" y1="39" x2="31" y2="38" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="46" x2="30" y2="46" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="35" y1="53" x2="29" y2="54" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="60" x2="30" y2="62" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="37" y1="67" x2="31" y2="70" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="35" y1="74" x2="29" y2="77" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="81" x2="27" y2="84" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />

          {/* Right stitch marks */}
          <line x1="69" y1="18" x2="74" y2="14" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="66" y1="25" x2="72" y2="22" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="64" y1="32" x2="70" y2="30" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="63" y1="39" x2="69" y2="38" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="64" y1="46" x2="70" y2="46" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="65" y1="53" x2="71" y2="54" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="64" y1="60" x2="70" y2="62" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="63" y1="67" x2="69" y2="70" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="65" y1="74" x2="71" y2="77" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="67" y1="81" x2="73" y2="84" stroke="#f8e8d0" strokeWidth="1.5" strokeLinecap="round" />

          {/* Subtle inner shadow for depth */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="#550000" strokeWidth="2" opacity="0.15" />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}
