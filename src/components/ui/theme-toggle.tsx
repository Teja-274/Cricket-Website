import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.style.setProperty('--color-background', '#0f172a')
      root.style.setProperty('--color-foreground', '#f8fafc')
      root.style.setProperty('--color-card', '#1e293b')
      root.style.setProperty('--color-card-foreground', '#f8fafc')
      root.style.setProperty('--color-muted', '#1e293b')
      root.style.setProperty('--color-muted-foreground', '#94a3b8')
      root.style.setProperty('--color-accent', '#334155')
      root.style.setProperty('--color-border', '#334155')
      root.style.setProperty('--color-input', '#334155')
    } else {
      root.classList.remove('dark')
      root.style.setProperty('--color-background', '#f8fafc')
      root.style.setProperty('--color-foreground', '#0f172a')
      root.style.setProperty('--color-card', '#ffffff')
      root.style.setProperty('--color-card-foreground', '#0f172a')
      root.style.setProperty('--color-muted', '#f1f5f9')
      root.style.setProperty('--color-muted-foreground', '#64748b')
      root.style.setProperty('--color-accent', '#e2e8f0')
      root.style.setProperty('--color-border', '#e2e8f0')
      root.style.setProperty('--color-input', '#e2e8f0')
    }
  }, [isDark])

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </motion.div>
    </motion.button>
  )
}
