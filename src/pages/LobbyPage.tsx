import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gavel, Plus, Users, Clock, IndianRupee, Trophy, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
    { id: 'ipl' as const, label: 'IPL Mega', desc: '100 Cr | 2 RTM | 25 players' },
    { id: 'fantasy' as const, label: 'Fantasy', desc: 'Custom purse | No RTM | Custom players' },
    { id: 'private' as const, label: 'Private', desc: 'Full custom rules' },
  ]

  const handleCreateRoom = () => {
    if (!roomName.trim()) return
    setStep('team')
  }

  const handleStartAuction = () => {
    if (!selectedTeam) return

    const room = {
      id: `room-${Date.now()}`,
      name: roomName,
      status: 'lobby' as const,
      format,
      currentPlayerIdx: 0,
      bidTimerSeconds: timer,
      totalPurseCr: purse,
      maxPlayers: 25,
    }

    const shuffled = [...PLAYERS].sort(() => Math.random() - 0.5)
    const franchises = IPL_FRANCHISES.map(f => createFranchise(f, purse))

    setRoom(room)
    setPlayers(shuffled)
    setFranchises(franchises)
    setMyFranchise(selectedTeam)

    navigate(`/room/${room.id}`)
  }

  return (
    <div className="min-h-screen p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            <Gavel className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />
            AUCTION LOBBY
          </h1>
          <p className="text-muted-foreground mt-2">Create your auction room and pick your franchise.</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'create' ? (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Room Config */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <Plus className="w-5 h-5 text-primary" />
                    CREATE ROOM
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="name">Room Name</Label>
                    <Input
                      id="name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Enter room name..."
                      className="mt-1.5 bg-background border-border"
                    />
                  </div>

                  <div>
                    <Label>Auction Format</Label>
                    <div className="grid grid-cols-3 gap-3 mt-1.5">
                      {formats.map(f => (
                        <motion.button
                          key={f.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormat(f.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            format === f.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="text-sm font-semibold">{f.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Purse (Cr)
                      </Label>
                      <Input
                        type="number"
                        value={purse}
                        onChange={(e) => setPurse(Number(e.target.value))}
                        className="mt-1.5 bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Bid Timer (s)
                      </Label>
                      <Input
                        type="number"
                        value={timer}
                        onChange={(e) => setTimer(Number(e.target.value))}
                        className="mt-1.5 bg-background border-border"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateRoom}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-base font-semibold rounded-xl"
                  >
                    Next: Pick Your Franchise
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Room Info */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <Trophy className="w-5 h-5 text-primary" />
                    AUCTION OVERVIEW
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="text-3xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                        {PLAYERS.length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Players in Pool</div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="text-3xl font-bold text-chart-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        {IPL_FRANCHISES.length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Franchises</div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="text-3xl font-bold text-chart-3" style={{ fontFamily: 'var(--font-heading)' }}>
                        {purse}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Crore Purse</div>
                    </div>
                    <div className="p-4 rounded-xl bg-background border border-border">
                      <div className="text-3xl font-bold text-chart-4" style={{ fontFamily: 'var(--font-heading)' }}>
                        {timer}s
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Bid Timer</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Player Pool Breakdown</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Batsmen: {PLAYERS.filter(p => p.role === 'Batsman').length}</div>
                      <div>Bowlers: {PLAYERS.filter(p => p.role === 'Bowler').length}</div>
                      <div>All-Rounders: {PLAYERS.filter(p => p.role === 'All-Rounder').length}</div>
                      <div>WK-Batsmen: {PLAYERS.filter(p => p.role === 'WK-Batsman').length}</div>
                      <div>Capped: {PLAYERS.filter(p => p.isCapped).length}</div>
                      <div>Uncapped: {PLAYERS.filter(p => !p.isCapped).length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                    PICK YOUR FRANCHISE
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Room: {roomName} | Format: {format.toUpperCase()} | Purse: {purse} Cr
                  </p>
                </div>
                <Button variant="outline" onClick={() => setStep('create')}>Back</Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {IPL_FRANCHISES.map((team, i) => (
                  <motion.button
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-center ${
                      selectedTeam === team.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                    style={selectedTeam === team.id ? {
                      borderColor: team.color,
                      boxShadow: `0 0 30px ${team.color}30`,
                    } : {}}
                  >
                    {selectedTeam === team.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                    <div
                      className="text-3xl font-bold mb-2"
                      style={{ color: team.color, fontFamily: 'var(--font-heading)' }}
                    >
                      {team.shortName}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight">{team.name}</div>
                    <Badge variant="outline" className="mt-3 text-[10px]">
                      {purse} Cr | 2 RTM
                    </Badge>
                  </motion.button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedTeam ? 1 : 0.3 }}
                className="mt-8 flex justify-center"
              >
                <Button
                  size="lg"
                  onClick={handleStartAuction}
                  disabled={!selectedTeam}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/25"
                >
                  <Gavel className="w-6 h-6 mr-3" />
                  START AUCTION
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
