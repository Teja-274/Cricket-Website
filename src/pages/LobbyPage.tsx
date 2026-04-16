import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, Plus, Users, Clock, IndianRupee, Trophy, Check, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BorderBeam } from '@/components/magicui/border-beam'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { IPL_FRANCHISES, createFranchise } from '@/data/franchises'
import { PLAYERS } from '@/data/players'
import { useAuctionStore } from '@/store/auctionStore'

export function LobbyPage() {
  const navigate = useNavigate()
  const { setRoom, setPlayers, setFranchises, setMyFranchise } = useAuctionStore()
  const [roomName, setRoomName] = useState('IPL Mega Auction 2026')
  const [format, setFormat] = useState<'ipl' | 'fantasy' | 'private'>('ipl')
  const [purse, setPurse] = useState(100)
  const [timer, setTimer] = useState(30)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [step, setStep] = useState<'create' | 'team'>('create')

  const formats = [
    { id: 'ipl' as const, label: 'IPL Mega', desc: '100 Cr | 2 RTM | 25 players', icon: '🏆' },
    { id: 'fantasy' as const, label: 'Fantasy', desc: 'Custom purse | No RTM', icon: '✨' },
    { id: 'private' as const, label: 'Private', desc: 'Full custom rules', icon: '🔒' },
  ]

  const handleCreateRoom = () => { if (roomName.trim()) setStep('team') }

  const handleStartAuction = () => {
    if (!selectedTeam) return
    const room = { id: `room-${Date.now()}`, name: roomName, status: 'lobby' as const, format, currentPlayerIdx: 0, bidTimerSeconds: timer, totalPurseCr: purse, maxPlayers: 25 }
    setRoom(room)
    setPlayers([...PLAYERS].sort(() => Math.random() - 0.5))
    setFranchises(IPL_FRANCHISES.map(f => createFranchise(f, purse)))
    setMyFranchise(selectedTeam)
    navigate(`/room/${room.id}`)
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Gavel className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />AUCTION LOBBY
          </h1>
          <p className="text-muted-foreground mt-2">Create your auction room and pick your franchise.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['Room Setup', 'Pick Franchise'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <motion.div animate={{ backgroundColor: (i === 0 && step === 'create') || (i === 1 && step === 'team') ? 'rgb(245, 158, 11)' : i === 0 && step === 'team' ? 'rgb(34, 197, 94)' : 'rgb(51, 65, 85)' }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors">
                {i === 0 && step === 'team' ? <Check className="w-4 h-4 text-white" /> : <span className="text-white">{i + 1}</span>}
              </motion.div>
              <span className={`text-sm font-medium ${(i === 0 && step === 'create') || (i === 1 && step === 'team') ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              {i === 0 && <div className="w-12 h-0.5 bg-border mx-2" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'create' ? (
            <motion.div key="create" initial={{ opacity: 0, x: -30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -30, scale: 0.98 }} transition={{ duration: 0.4 }} className="grid lg:grid-cols-2 gap-6">
              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6 overflow-hidden">
                <BorderBeam size={200} duration={8} colorFrom="#c0c8d4" colorTo="#22c55e" />
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Plus className="w-5 h-5 text-primary" /></div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>CREATE ROOM</h2>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Room Name</Label>
                    <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} className="mt-1.5 bg-background/50 border-border/50 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Format</Label>
                    <div className="grid grid-cols-3 gap-3 mt-1.5">
                      {formats.map(f => (
                        <motion.button key={f.id} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => setFormat(f.id)}
                          className={`p-3 rounded-xl border text-left transition-all duration-300 ${format === f.id ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-border/50 bg-background/30 hover:border-muted-foreground/30'}`}>
                          <div className="text-lg mb-1">{f.icon}</div>
                          <div className="text-sm font-semibold">{f.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><IndianRupee className="w-3 h-3" />Purse (Cr)</Label>
                      <Input type="number" value={purse} onChange={(e) => setPurse(Number(e.target.value))} className="mt-1.5 bg-background/50 border-border/50 h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Clock className="w-3 h-3" />Timer (s)</Label>
                      <Input type="number" value={timer} onChange={(e) => setTimer(Number(e.target.value))} className="mt-1.5 bg-background/50 border-border/50 h-11 rounded-xl" />
                    </div>
                  </div>
                  <ShimmerButton onClick={handleCreateRoom} className="w-full" shimmerColor="#c0c8d4" background="rgba(180, 190, 205, 0.85)">
                    <span className="text-base font-semibold">Next: Pick Franchise</span><ArrowRight className="w-5 h-5 ml-2" />
                  </ShimmerButton>
                </div>
              </div>

              <div className="relative bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-chart-2" /></div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>OVERVIEW</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[{ value: PLAYERS.length, label: 'Players', color: 'text-primary' }, { value: IPL_FRANCHISES.length, label: 'Franchises', color: 'text-chart-2' }, { value: purse, label: 'Crore Purse', color: 'text-chart-3' }, { value: timer, label: 'Sec Timer', color: 'text-chart-4' }].map(s => (
                    <motion.div key={s.label} whileHover={{ scale: 1.03, y: -2 }} className="p-4 rounded-xl bg-background/50 border border-border/30">
                      <div className={`text-3xl font-bold ${s.color}`} style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={s.value} /></div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </motion.div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-primary">Player Pool</span></div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    {[{ l: 'Batsmen', c: PLAYERS.filter(p => p.role === 'Batsman').length, bg: 'bg-blue-400' }, { l: 'Bowlers', c: PLAYERS.filter(p => p.role === 'Bowler').length, bg: 'bg-red-400' }, { l: 'All-Rounders', c: PLAYERS.filter(p => p.role === 'All-Rounder').length, bg: 'bg-green-400' }, { l: 'WK-Batsmen', c: PLAYERS.filter(p => p.role === 'WK-Batsman').length, bg: 'bg-purple-400' }].map(r => (
                      <div key={r.l} className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${r.bg}`} /><span className="text-muted-foreground">{r.l}:</span><span className="font-bold">{r.c}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="team" initial={{ opacity: 0, x: 30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 30, scale: 0.98 }} transition={{ duration: 0.4 }}>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>PICK YOUR FRANCHISE</h2>
                  <p className="text-sm text-muted-foreground mt-1">{roomName} | {format.toUpperCase()} | {purse} Cr</p>
                </div>
                <Button variant="outline" onClick={() => setStep('create')} className="rounded-xl">Back</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {IPL_FRANCHISES.map((team, i) => (
                  <motion.button key={team.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.06, y: -6 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedTeam(team.id)}
                    className={`relative p-6 rounded-2xl border-2 text-center overflow-hidden transition-all duration-300 ${selectedTeam === team.id ? '' : 'border-border/50'}`}
                    style={{ background: `linear-gradient(135deg, ${team.color}${selectedTeam === team.id ? '20' : '08'}, transparent)`, borderColor: selectedTeam === team.id ? team.color : undefined, boxShadow: selectedTeam === team.id ? `0 8px 32px ${team.color}25` : undefined }}>
                    {selectedTeam === team.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: team.color }}><Check className="w-3.5 h-3.5 text-white" /></motion.div>}
                    <div className="text-3xl font-bold mb-2" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>{team.shortName}</div>
                    <div className="text-xs text-muted-foreground leading-tight mb-3">{team.name}</div>
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{purse} Cr</Badge>
                      <Badge variant="outline" className="text-[10px]">2 RTM</Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
              <motion.div animate={{ opacity: selectedTeam ? 1 : 0.3 }} className="mt-8 flex justify-center">
                <ShimmerButton onClick={handleStartAuction} disabled={!selectedTeam} shimmerColor="#c0c8d4" background="rgba(180, 190, 205, 0.85)" className="px-12">
                  <Gavel className="w-6 h-6 mr-3" /><span className="text-lg font-bold">START AUCTION</span>
                </ShimmerButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
