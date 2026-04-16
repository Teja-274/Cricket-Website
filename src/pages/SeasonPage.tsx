import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Loader2, Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { BorderBeam } from '@/components/magicui/border-beam'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { getAllSeasons, getSeasonLeaderboard, getSeasonChampion } from '@/lib/queries'

export function SeasonPage() {
  const { year } = useParams()
  const navigate = useNavigate()
  const [seasons, setSeasons] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(year ? parseInt(year) : 2024)
  const [data, setData] = useState<any>(null)
  const [champion, setChampion] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSeasons().then(s => { setSeasons(s); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!selectedYear) return
    setLoading(true)
    setChampion(null)
    Promise.all([
      getSeasonLeaderboard(selectedYear),
      getSeasonChampion(selectedYear),
    ]).then(([d, c]) => {
      setData(d)
      setChampion(c)
      setLoading(false)
    })
  }, [selectedYear])

  const orangeCap = data?.batsmen?.[0]
  const purpleCap = data?.bowlers?.[0]

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              <Calendar className="inline-block w-8 h-8 text-primary mr-3 -mt-1" />IPL {selectedYear}
            </h1>
            <p className="text-muted-foreground mt-1">Season leaderboard and stats.</p>
          </div>
          <select value={selectedYear} onChange={(e) => { setSelectedYear(parseInt(e.target.value)); navigate(`/season/${e.target.value}`) }}
            className="bg-card/80 border border-border/50 rounded-xl px-4 py-2 text-sm font-medium">
            {seasons.map(s => <option key={s.year} value={s.year}>IPL {s.year}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-3" /><span className="text-muted-foreground">Loading season data...</span>
          </div>
        ) : data ? (
          <>
            {/* Champion */}
            {champion && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gradient-to-r from-yellow-500/15 via-card/80 to-yellow-500/15 backdrop-blur-sm rounded-2xl border border-yellow-500/30 p-6 mb-8 overflow-hidden text-center">
                <BorderBeam size={300} duration={6} colorFrom="#eab308" colorTo="#c0c8d4" />
                <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">IPL {selectedYear} CHAMPIONS</div>
                <SparklesText className="text-4xl font-bold" sparklesCount={6} colors={{ first: '#eab308', second: '#c0c8d4' }}>
                  {champion.champion}
                </SparklesText>
                <div className="text-sm text-muted-foreground mt-3">
                  Defeated <span className="font-semibold text-foreground">{champion.runnerUp}</span> in the Final
                  {champion.winByRuns ? ` by ${champion.winByRuns} runs` : ''}
                  {champion.winByWickets ? ` by ${champion.winByWickets} wickets` : ''}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{champion.finalDate}</div>
              </motion.div>
            )}

            {/* Orange & Purple Cap */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {orangeCap && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-gradient-to-br from-amber-500/10 to-card/80 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-6 overflow-hidden">
                  <BorderBeam size={150} duration={6} colorFrom="#c0c8d4" colorTo="#eab308" />
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">🧡 ORANGE CAP</Badge>
                  </div>
                  <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{orangeCap.name}</div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center"><div className="text-2xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={orangeCap.runs} /></div><div className="text-[10px] text-muted-foreground">Runs</div></div>
                    <div className="text-center"><div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{orangeCap.avg}</div><div className="text-[10px] text-muted-foreground">Average</div></div>
                    <div className="text-center"><div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{orangeCap.sr}</div><div className="text-[10px] text-muted-foreground">Strike Rate</div></div>
                  </div>
                </motion.div>
              )}

              {purpleCap && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                  className="relative bg-gradient-to-br from-purple-500/10 to-card/80 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 overflow-hidden">
                  <BorderBeam size={150} duration={6} colorFrom="#a855f7" colorTo="#7c3aed" />
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">💜 PURPLE CAP</Badge>
                  </div>
                  <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{purpleCap.name}</div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="text-center"><div className="text-2xl font-bold text-chart-4" style={{ fontFamily: 'var(--font-heading)' }}><NumberTicker value={purpleCap.wickets} /></div><div className="text-[10px] text-muted-foreground">Wickets</div></div>
                    <div className="text-center"><div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{purpleCap.economy}</div><div className="text-[10px] text-muted-foreground">Economy</div></div>
                    <div className="text-center"><div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{purpleCap.avg}</div><div className="text-[10px] text-muted-foreground">Average</div></div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="outline">{data.matches} matches</Badge>
              <Badge variant="outline">{data.batsmen.length} batsmen</Badge>
              <Badge variant="outline">{data.bowlers.length} bowlers</Badge>
              {data.batsmen.length > 0 && <Badge variant="outline">Most 6s: {Math.max(...data.batsmen.map((b: any) => b.sixes))} by {data.batsmen.reduce((a: any, b: any) => a.sixes > b.sixes ? a : b).name.split(' ').pop()}</Badge>}
            </div>

            {/* Leaderboards */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>🧡 BATTING — IPL {selectedYear}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-right p-3">Runs</th>
                        <th className="text-right p-3">Avg</th><th className="text-right p-3">SR</th><th className="text-right p-3">6s</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.batsmen.slice(0, 20).map((b: any, i: number) => (
                        <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-border/10 hover:bg-background/30">
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{b.name}</td>
                          <td className="p-3 text-right font-bold text-primary">{b.runs}</td>
                          <td className="p-3 text-right">{b.avg}</td>
                          <td className="p-3 text-right">{b.sr}</td>
                          <td className="p-3 text-right">{b.sixes}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/30">
                  <h3 className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>💜 BOWLING — IPL {selectedYear}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/20 text-[10px] uppercase text-muted-foreground">
                        <th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-right p-3">Wkts</th>
                        <th className="text-right p-3">Econ</th><th className="text-right p-3">Avg</th><th className="text-right p-3">Dots</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bowlers.slice(0, 20).map((b: any, i: number) => (
                        <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-border/10 hover:bg-background/30">
                          <td className="p-3 text-muted-foreground">{i + 1}</td>
                          <td className="p-3 font-medium">{b.name}</td>
                          <td className="p-3 text-right font-bold text-chart-4">{b.wickets}</td>
                          <td className="p-3 text-right">{b.economy}</td>
                          <td className="p-3 text-right">{b.avg}</td>
                          <td className="p-3 text-right">{b.dots}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </motion.div>
    </div>
  )
}
