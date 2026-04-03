// Sound effects manager using Web Audio API
// No external files needed - generates tones procedurally

const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime)
  gain.gain.setValueAtTime(volume, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

export const sounds = {
  bid: () => {
    playTone(880, 0.1, 'sine', 0.12)
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 80)
  },

  sold: () => {
    playTone(523, 0.15, 'sine', 0.15)
    setTimeout(() => playTone(659, 0.15, 'sine', 0.15), 120)
    setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 240)
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.12), 400)
  },

  unsold: () => {
    playTone(400, 0.2, 'sine', 0.1)
    setTimeout(() => playTone(300, 0.3, 'sine', 0.08), 200)
  },

  timerWarning: () => {
    playTone(600, 0.08, 'square', 0.08)
  },

  timerExpired: () => {
    playTone(200, 0.5, 'sine', 0.12)
    setTimeout(() => playTone(180, 0.5, 'sine', 0.1), 300)
  },

  click: () => {
    playTone(1200, 0.05, 'sine', 0.06)
  },

  success: () => {
    playTone(660, 0.1, 'sine', 0.1)
    setTimeout(() => playTone(880, 0.15, 'sine', 0.1), 100)
  },

  crowd: () => {
    // White noise burst for crowd cheer effect
    if (!audioCtx) return
    const bufferSize = audioCtx.sampleRate * 0.5
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
    }
    const source = audioCtx.createBufferSource()
    const gain = audioCtx.createGain()
    const filter = audioCtx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5
    source.buffer = buffer
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(audioCtx.destination)
    source.start()
  },
}

// Global mute control
let muted = false
export const isMuted = () => muted
export const toggleMute = () => { muted = !muted; return muted }
export const setMuted = (val: boolean) => { muted = val }

// Wrapper that respects mute
export const playSound = (name: keyof typeof sounds) => {
  if (!muted) sounds[name]()
}
