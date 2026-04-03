import { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { toggleMute, isMuted } from '@/lib/sounds'

export function SoundToggle() {
  const [muted, setMuted] = useState(isMuted())

  const handleToggle = () => {
    const newState = toggleMute()
    setMuted(newState)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={handleToggle}
      className="p-2 rounded-xl bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </motion.button>
  )
}
