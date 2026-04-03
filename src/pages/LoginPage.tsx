import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { BorderBeam } from '@/components/magicui/border-beam'
import { SparklesText } from '@/components/magicui/sparkles-text'

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    // Mock login - will be replaced with Supabase Auth
    setTimeout(() => {
      setLoading(false)
      navigate('/')
    }, 1000)
  }

  const handleSignup = () => {
    setLoading(true)
    // Mock signup - will be replaced with Supabase Auth
    setTimeout(() => {
      setLoading(false)
      navigate('/')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-chart-3/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-border/10 rounded-full" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </motion.div>
          <SparklesText className="text-3xl font-bold" sparklesCount={5} colors={{ first: '#f59e0b', second: '#22c55e' }}>
            SCOUT INDIA
          </SparklesText>
          <p className="text-sm text-muted-foreground mt-1">IPL Auction Strategy Platform</p>
        </div>

        {/* Auth card */}
        <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-6 overflow-hidden">
          <BorderBeam size={200} duration={8} colorFrom="#f59e0b" colorTo="#22c55e" />

          <Tabs defaultValue="login">
            <TabsList className="w-full bg-background/50 rounded-xl mb-6">
              <TabsTrigger value="login" className="flex-1 rounded-lg">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 rounded-lg">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="pl-10 bg-background/50 border-border/50 rounded-xl h-11" type="email" />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"
                    className="pl-10 pr-10 bg-background/50 border-border/50 rounded-xl h-11" type={showPassword ? 'text' : 'password'} />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  Remember me
                </label>
                <button className="text-primary hover:underline">Forgot password?</button>
              </div>
              <ShimmerButton onClick={handleLogin} className="w-full" shimmerColor="#f59e0b" background="rgba(245, 158, 11, 0.9)"
                disabled={loading}>
                <span className="font-semibold">{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </ShimmerButton>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                    className="pl-10 bg-background/50 border-border/50 rounded-xl h-11" />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="pl-10 bg-background/50 border-border/50 rounded-xl h-11" type="email" />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password"
                    className="pl-10 bg-background/50 border-border/50 rounded-xl h-11" type="password" />
                </div>
              </div>
              <ShimmerButton onClick={handleSignup} className="w-full" shimmerColor="#22c55e" background="rgba(34, 197, 94, 0.9)"
                disabled={loading}>
                <span className="font-semibold">{loading ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </ShimmerButton>
            </TabsContent>
          </Tabs>

          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Auth powered by Supabase — will be connected when API keys are ready.
          </p>
        </div>

        {/* Skip for now */}
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-xs text-muted-foreground">
            Skip for now — continue as guest
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
