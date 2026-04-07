import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Gavel, Search, GitCompareArrows, Star, Zap, Shield, Users, TrendingUp } from 'lucide-react'
import { PLAYERS } from '@/data/players'
import { IPL_FRANCHISES } from '@/data/franchises'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { NumberTicker } from '@/components/magicui/number-ticker'
import { SparklesText } from '@/components/magicui/sparkles-text'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { Marquee } from '@/components/magicui/marquee'
import { BorderBeam } from '@/components/magicui/border-beam'
import { TextAnimate } from '@/components/magicui/text-animate'
import CrystalCursor from '@/components/ui/crystal-cursor'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const features = [
  { icon: Gavel, title: 'Live Auction', desc: 'Real-time IPL-style bidding with countdown timers and instant updates across all teams.' },
  { icon: Search, title: 'AI Scout', desc: 'Search players using natural language. AI analyzes domestic and IPL stats for deep insights.' },
  { icon: GitCompareArrows, title: 'Head-to-Head', desc: 'Compare any two players across formats with AI-powered verdicts and stat breakdowns.' },
  { icon: Star, title: 'Smart Shortlist', desc: 'Build your dream squad. AI analyzes balance, gaps, and format fit across your picks.' },
]

const recentSales = [
  { player: 'Virat Kohli', team: 'RCB', price: '21 Cr', color: '#EC1C24' },
  { player: 'Jasprit Bumrah', team: 'MI', price: '18 Cr', color: '#004BA0' },
  { player: 'MS Dhoni', team: 'CSK', price: '16 Cr', color: '#FCCA06' },
  { player: 'Rishabh Pant', team: 'LSG', price: '14.5 Cr', color: '#A72056' },
  { player: 'Suryakumar Yadav', team: 'MI', price: '12.25 Cr', color: '#004BA0' },
  { player: 'Yashasvi Jaiswal', team: 'RR', price: '11 Cr', color: '#EA1A85' },
  { player: 'KL Rahul', team: 'DC', price: '10 Cr', color: '#004C93' },
  { player: 'Ravindra Jadeja', team: 'CSK', price: '9.75 Cr', color: '#FCCA06' },
]

function SaleCard({ player, team, price, color }: typeof recentSales[number]) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 mx-2 rounded-xl bg-card border border-border whitespace-nowrap">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm font-medium">{player}</span>
      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>{team}</span>
      <span className="text-sm font-bold text-primary">{price}</span>
    </div>
  )
}

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <CrystalCursor
      backgroundOnly
      className="min-h-screen"
    >
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-8">
        {/* Stadium night background with real image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Stadium image */}
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: "url('/images/stadium-wide.jpg')" }} />

          {/* Dark vignette overlay */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(7,13,18,0.8) 100%)' }} />

          {/* Floodlight beams from top corners */}
          <div className="absolute -top-10 -left-10 w-[600px] h-[800px]"
            style={{ background: 'conic-gradient(from 120deg at 0% 0%, rgba(255,240,200,0.15) 0deg, transparent 30deg)' }} />
          <div className="absolute -top-10 -right-10 w-[600px] h-[800px]"
            style={{ background: 'conic-gradient(from 210deg at 100% 0%, rgba(255,240,200,0.15) 0deg, transparent 30deg)' }} />

          {/* Center floodlight spill */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px]"
            style={{ background: 'radial-gradient(ellipse at top, rgba(255,240,200,0.1), transparent 70%)' }} />

          {/* Green outfield glow at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[400px]"
            style={{ background: 'linear-gradient(to top, rgba(10,60,30,0.3), transparent)' }} />

          {/* Ground boundary oval */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full border border-green-500/10" />
        </div>

        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="relative text-center max-w-4xl mx-auto"
        >
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-8"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide">IPL AUCTION STRATEGY PLATFORM</span>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
            <SparklesText
              className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-6"
              sparklesCount={8}
              colors={{ first: '#f59e0b', second: '#22c55e' }}
            >
              SCOUT INDIA
            </SparklesText>
          </motion.div>

          <motion.div variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
            <TextAnimate
              animation="blurInUp"
              by="word"
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              The ultimate cricket player intelligence and real-time auction strategy platform for IPL franchise management, selectors, and coaches.
            </TextAnimate>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <ShimmerButton
              onClick={() => navigate('/lobby')}
              className="shadow-lg shadow-primary/25"
              shimmerColor="#f59e0b"
              shimmerSize="0.1em"
              background="rgba(245, 158, 11, 0.9)"
            >
              <Gavel className="w-5 h-5 mr-2" />
              <span className="text-base font-semibold">Enter Auction</span>
            </ShimmerButton>
            <ShimmerButton
              onClick={() => navigate('/scout')}
              className="shadow-lg"
              shimmerColor="#3b82f6"
              shimmerSize="0.05em"
              background="rgba(30, 41, 59, 0.9)"
            >
              <Search className="w-5 h-5 mr-2" />
              <span className="text-base font-semibold">Scout Players</span>
            </ShimmerButton>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee - Recent Auction Sales Ticker */}
      <section className="py-6 border-y border-border overflow-hidden">
        <div className="mb-3 text-center">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Auction Highlights</span>
        </div>
        <Marquee pauseOnHover className="[--duration:30s]">
          {recentSales.map((sale) => (
            <SaleCard key={sale.player} {...sale} />
          ))}
        </Marquee>
      </section>

      {/* Stats Bar with Number Tickers */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-16 px-8"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: PLAYERS.length, suffix: '+', label: 'Players' },
            { value: IPL_FRANCHISES.length, suffix: '', label: 'Franchises' },
            { value: 5, suffix: '', label: 'Tournaments' },
            { value: 4, suffix: '', label: 'Auction Formats' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                <NumberTicker value={stat.value} />{stat.suffix}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Container Scroll - Auction Preview */}
      <ContainerScroll
        titleComponent={
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              EXPERIENCE THE <span className="text-primary">AUCTION</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A real-time bidding experience that puts you in the franchise owner's seat.
            </p>
          </div>
        }
      >
        <div className="h-full w-full bg-background p-6 flex flex-col">
          {/* Mock auction UI inside the scroll container */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>IPL MEGA AUCTION 2026 - LIVE</span>
            </div>
            <div className="flex gap-2">
              {['MI', 'CSK', 'RCB', 'KKR', 'DC'].map((t, i) => (
                <div key={t} className="px-2 py-1 rounded text-[10px] font-bold bg-card border border-border"
                  style={{ color: [IPL_FRANCHISES[0], IPL_FRANCHISES[1], IPL_FRANCHISES[2], IPL_FRANCHISES[3], IPL_FRANCHISES[4]][i].color }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">Player on Block</div>
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Yashasvi Jaiswal</div>
              <div className="text-xs text-primary mt-1">Batsman | Left-Hand | Mumbai</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background rounded p-2"><span className="text-muted-foreground">IPL Runs:</span> <span className="font-bold">2003</span></div>
                <div className="bg-background rounded p-2"><span className="text-muted-foreground">SR:</span> <span className="font-bold">163.2</span></div>
                <div className="bg-background rounded p-2"><span className="text-muted-foreground">Avg:</span> <span className="font-bold">38.5</span></div>
                <div className="bg-background rounded p-2"><span className="text-muted-foreground">T20I:</span> <span className="font-bold">28 Mat</span></div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col items-center justify-center">
              <div className="text-xs text-muted-foreground mb-2">Current Bid</div>
              <div className="text-5xl font-bold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>14.75 Cr</div>
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#EA1A8520', color: '#EA1A85' }}>
                RR - Highest Bidder
              </div>
              <div className="mt-4 w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>12</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">seconds</div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground mb-2">Bid Log</div>
              <div className="space-y-1.5 text-xs">
                {[
                  { team: 'RR', color: '#EA1A85', bid: '14.75 Cr' },
                  { team: 'MI', color: '#004BA0', bid: '14.25 Cr' },
                  { team: 'RR', color: '#EA1A85', bid: '13.75 Cr' },
                  { team: 'CSK', color: '#FCCA06', bid: '13.25 Cr' },
                  { team: 'MI', color: '#004BA0', bid: '12.75 Cr' },
                  { team: 'RR', color: '#EA1A85', bid: '12.25 Cr' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-background">
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="font-bold" style={{ color: b.color }}>{b.team}</span>
                    <span className="text-muted-foreground">raised to</span>
                    <span className="font-bold text-primary">{b.bid}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ContainerScroll>

      {/* Features with Border Beam */}
      <section className="py-20 px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              BUILT FOR <span className="text-primary">WINNING</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to dominate the IPL auction, from scouting to strategy.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 cursor-default overflow-hidden"
              >
                <BorderBeam
                  size={200}
                  duration={8 + i * 2}
                  colorFrom="#f59e0b"
                  colorTo="#22c55e"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Franchise Strip */}
      <section className="py-16 px-8 border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <h3 className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-8">
            All 10 IPL Franchises Supported
          </h3>
          <Marquee pauseOnHover className="[--duration:20s]">
            {IPL_FRANCHISES.map((team) => (
              <motion.div
                key={team.id}
                whileHover={{ scale: 1.1, y: -4 }}
                className="w-24 h-24 mx-2 rounded-2xl flex flex-col items-center justify-center gap-1 border border-border bg-card hover:shadow-lg transition-all duration-300 cursor-default"
                style={{ borderColor: `${team.color}30` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${team.color}80`
                  e.currentTarget.style.boxShadow = `0 4px 20px ${team.color}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${team.color}30`
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span className="text-xl font-bold" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>
                  {team.shortName}
                </span>
                <span className="text-[9px] text-muted-foreground">{team.name.split(' ').slice(-1)}</span>
              </motion.div>
            ))}
          </Marquee>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 via-card to-chart-3/10 rounded-3xl p-12 border border-primary/20 overflow-hidden"
        >
          <BorderBeam size={300} duration={10} colorFrom="#f59e0b" colorTo="#3b82f6" />
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            READY TO BUILD YOUR <span className="text-primary">DREAM XI</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the auction room, scout the best talent, and outsmart every franchise.
          </p>
          <div className="flex items-center justify-center gap-4">
            <ShimmerButton
              onClick={() => navigate('/lobby')}
              shimmerColor="#f59e0b"
              background="rgba(245, 158, 11, 0.9)"
            >
              <Users className="w-5 h-5 mr-2" />
              <span className="font-semibold">Create Auction Room</span>
            </ShimmerButton>
            <ShimmerButton
              onClick={() => navigate('/scout')}
              shimmerColor="#3b82f6"
              background="rgba(30, 41, 59, 0.9)"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-semibold">Explore Players</span>
            </ShimmerButton>
          </div>
        </motion.div>
      </section>
    </div>
    </CrystalCursor>
  )
}
