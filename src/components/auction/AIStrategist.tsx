import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, TrendingDown, Minus, MessageSquare, Send } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Player } from '@/data/players'
import type { Franchise } from '@/data/franchises'

interface AIAdvice {
  fairValue: number
  bidCeiling: number
  recommendation: 'BID AGGRESSIVELY' | 'BID CAUTIOUSLY' | 'SKIP'
  rtmAdvice: string
  reasoning: string
}

function generateMockAdvice(player: Player, franchise: Franchise): AIAdvice {
  const baseValue = player.basePriceCr
  const tierMultiplier = {
    'International Ready': 4,
    'IPL Proven': 2.5,
    'Domestic Star': 1.5,
    'Emerging Talent': 1.2,
  }[player.tier]

  const fairValue = Math.round(baseValue * tierMultiplier * 10) / 10
  const bidCeiling = Math.round(fairValue * 1.3 * 10) / 10

  let recommendation: AIAdvice['recommendation'] = 'BID CAUTIOUSLY'
  if (fairValue > 5 && franchise.purseRemaining > 50) recommendation = 'BID AGGRESSIVELY'
  if (fairValue < 1 || franchise.purseRemaining < 20) recommendation = 'SKIP'
  if (franchise.playersBought > 15) recommendation = 'SKIP'

  const reasons = [
    `${player.name} is a ${player.tier.toLowerCase()} with strong ${player.role === 'Bowler' ? 'bowling' : 'batting'} credentials.`,
    `With ${franchise.purseRemaining} Cr remaining and ${franchise.playersBought} players bought, ${recommendation === 'SKIP' ? 'conserving budget is wise' : 'there is room to invest'}.`,
    player.stats.ipl ? `IPL track record of ${player.stats.ipl.matches} matches adds reliability.` : 'Limited IPL experience — domestic stats are promising but carry risk.',
  ]

  return {
    fairValue,
    bidCeiling: Math.min(bidCeiling, franchise.purseRemaining),
    recommendation,
    rtmAdvice: franchise.rtmCards > 0 ? 'Save RTM for marquee players' : 'No RTM cards remaining',
    reasoning: reasons.join(' '),
  }
}

export function AIStrategist({ player, franchise }: { player: Player | null; franchise: Franchise | null }) {
  const [advice, setAdvice] = useState<AIAdvice | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])

  useEffect(() => {
    if (!player || !franchise) return
    setIsLoading(true)
    setAdvice(null)
    const timeout = setTimeout(() => {
      setAdvice(generateMockAdvice(player, franchise))
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timeout)
  }, [player?.id, franchise?.id])

  const handleChat = () => {
    if (!chatInput.trim()) return
    const question = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: question }])

    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `Based on ${player?.name}'s profile, ${question.toLowerCase().includes('worth') ? `fair value is around ${advice?.fairValue} Cr.` : question.toLowerCase().includes('rtm') ? 'I recommend saving RTM cards for proven match-winners.' : 'this is a solid pick if the price stays reasonable. Monitor other franchises\' interest levels.'}`
      }])
    }, 500)
  }

  const recColor = {
    'BID AGGRESSIVELY': 'bg-green-500/20 text-green-400 border-green-500/30',
    'BID CAUTIOUSLY': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'SKIP': 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const recIcon = {
    'BID AGGRESSIVELY': TrendingUp,
    'BID CAUTIOUSLY': Minus,
    'SKIP': TrendingDown,
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          AI Strategist
        </h3>
        <Badge variant="outline" className="text-[9px] ml-auto border-primary/30 text-primary">
          Private
        </Badge>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-3 py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">Analyzing player...</span>
          </motion.div>
        ) : advice ? (
          <motion.div
            key="advice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 space-y-3"
          >
            {/* Recommendation badge */}
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = recIcon[advice.recommendation]
                return <Icon className="w-4 h-4" />
              })()}
              <Badge className={`text-xs font-bold ${recColor[advice.recommendation]}`}>
                {advice.recommendation}
              </Badge>
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-background">
                <div className="text-[10px] text-muted-foreground uppercase">Fair Value</div>
                <div className="text-lg font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {advice.fairValue} Cr
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-background">
                <div className="text-[10px] text-muted-foreground uppercase">Bid Ceiling</div>
                <div className="text-lg font-bold text-destructive" style={{ fontFamily: 'var(--font-heading)' }}>
                  {advice.bidCeiling} Cr
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="p-3 rounded-lg bg-background text-xs text-muted-foreground leading-relaxed">
              {advice.reasoning}
            </div>

            {/* RTM Advice */}
            <div className="p-2 rounded-lg bg-chart-3/10 border border-chart-3/20 text-xs text-chart-3">
              <span className="font-semibold">RTM:</span> {advice.rtmAdvice}
            </div>

            {/* Chat */}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ask AI</span>
              </div>
              <ScrollArea className="max-h-24 mb-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-xs mb-1.5 ${msg.role === 'ai' ? 'text-primary' : 'text-foreground'}`}>
                    <span className="font-semibold">{msg.role === 'ai' ? 'AI: ' : 'You: '}</span>
                    {msg.text}
                  </div>
                ))}
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Ask about this player..."
                  className="h-8 text-xs bg-background"
                />
                <Button size="sm" onClick={handleChat} className="h-8 w-8 p-0 bg-primary">
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Waiting for player...
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
