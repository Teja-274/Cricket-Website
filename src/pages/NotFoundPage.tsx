import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SparklesText } from '@/components/magicui/sparkles-text'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <motion.div
          animate={{ rotate: [0, 15, -15, 0], y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl mb-6"
        >
          🏏
        </motion.div>
        <SparklesText className="text-6xl md:text-8xl font-bold mb-4" sparklesCount={8} colors={{ first: '#f5a623', second: '#ef4444' }}>
          BOWLED OUT!
        </SparklesText>
        <p className="text-xl text-muted-foreground mb-2 mt-4">404 — Page Not Found</p>
        <p className="text-sm text-muted-foreground mb-8">Looks like this page didn't make it past the stumps.</p>
        <Button onClick={() => navigate('/')} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
          <Home className="w-4 h-4 mr-2" />Return to Pavilion
        </Button>
      </motion.div>
    </div>
  )
}
