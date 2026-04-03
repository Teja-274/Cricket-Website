import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  duration?: number
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  duration = 0.8,
}: AnimatedCounterProps) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`)
  const [displayValue, setDisplayValue] = useState(`${prefix}${value.toFixed(decimals)}${suffix}`)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    spring.set(value)
    const unsub = display.on('change', (v) => setDisplayValue(v))
    return unsub
  }, [value, spring, display])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 0.3 }}
      key={value}
    >
      {displayValue}
    </motion.span>
  )
}
