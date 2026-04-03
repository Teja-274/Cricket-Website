import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Gavel, Search, GitCompareArrows, Star, Zap, Shield, Users, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLAYERS } from '@/data/players'
import { IPL_FRANCHISES } from '@/data/franchises'
import { AnimatedCounter } from '@/components/ui/animated-counter'

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

const stats = [
  { value: PLAYERS.length, suffix: '+', label: 'Players' },
  { value: IPL_FRANCHISES.length, suffix: '', label: 'Franchises' },
  { value: 5, suffix: '', label: 'Tournaments' },
  { value: 4, suffix: '', label: 'Auction Formats' },
]

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-8">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-chart-3/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-border/10 rounded-full" />
          {/* Cricket ball stitch pattern */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary/5 rounded-full"
          />
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

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-6"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="text-foreground">SCOUT</span>{' '}
            <span className="text-primary">INDIA</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            The ultimate cricket player intelligence and real-time auction strategy platform
            for IPL franchise management, selectors, and coaches.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('/lobby')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-6 rounded-xl font-semibold shadow-lg shadow-primary/25"
            >
              <Gavel className="w-5 h-5 mr-2" />
              Enter Auction
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/scout')}
              className="text-base px-8 py-6 rounded-xl border-border hover:bg-accent"
            >
              <Search className="w-5 h-5 mr-2" />
              Scout Players
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-12 px-8"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1.2} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
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
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 cursor-default"
              >
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
          <div className="flex flex-wrap justify-center gap-4">
            {IPL_FRANCHISES.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, y: -4 }}
                className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border border-border bg-card hover:shadow-lg transition-all duration-300 cursor-default"
                style={{ borderColor: `${team.color}30`, boxShadow: `0 0 0 0 ${team.color}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${team.color}80`
                  e.currentTarget.style.boxShadow = `0 4px 20px ${team.color}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${team.color}30`
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <span className="text-lg font-bold" style={{ color: team.color, fontFamily: 'var(--font-heading)' }}>
                  {team.shortName}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary/10 via-card to-chart-3/10 rounded-3xl p-12 border border-primary/20"
        >
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            READY TO BUILD YOUR <span className="text-primary">DREAM XI</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the auction room, scout the best talent, and outsmart every franchise.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/lobby')}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 rounded-xl font-semibold"
            >
              <Users className="w-5 h-5 mr-2" />
              Create Auction Room
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/scout')}
              className="px-8 py-6 rounded-xl"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Players
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
