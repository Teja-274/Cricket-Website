/**
 * Global test setup — runs once before all Vitest tests.
 * Extends jest-dom matchers and provides browser-API mocks JSDOM/happy-dom lack.
 */
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Auto-unmount React trees after each test to prevent state bleed
afterEach(() => {
  cleanup()
})

// Stub matchMedia for components that read it (theme detection, etc.)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Stub IntersectionObserver for components using it (animations, viewport detection)
class IntersectionObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}
;(globalThis as any).IntersectionObserver = IntersectionObserverStub

// Stub ResizeObserver (used by Recharts and Radix UI)
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
;(globalThis as any).ResizeObserver = ResizeObserverStub
