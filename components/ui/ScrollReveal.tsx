'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Anima las secciones públicas en dos modos:
 * 1. Visibles al cargar (above the fold): fade-in-up inmediato con stagger.
 * 2. Debajo del fold: fade + slide-up al hacer scroll (IntersectionObserver).
 * Respeta prefers-reduced-motion. No toca secciones con .reveal interno.
 */
export default function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root: HTMLElement = document.querySelector('main') ?? document.body
    const all = Array.from(root.querySelectorAll('section')) as HTMLElement[]
    const sections = all.filter(
      (s) =>
        !s.parentElement?.closest('section') &&
        !s.closest('header') &&
        !s.closest('footer')
    )

    const vh = window.innerHeight
    const observed: HTMLElement[] = []
    let aboveFoldIndex = 0

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            el.classList.add('is-visible')
            // Limpiar clases post-transición para no romper position:fixed anidado
            const onEnd = (e: TransitionEvent) => {
              if (e.propertyName !== 'transform') return
              el.classList.remove('reveal', 'is-visible')
              el.removeEventListener('transitionend', onEnd)
            }
            el.addEventListener('transitionend', onEnd)
            observer.unobserve(el)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    sections.forEach((el) => {
      if (el.querySelector('.reveal')) return
      const rect = el.getBoundingClientRect()

      if (rect.top < vh * 0.92) {
        // ── Visible al cargar: animación de entrada inmediata con stagger ──
        const delay = aboveFoldIndex * 0.09
        el.style.opacity = '0'
        el.style.transform = 'translateY(18px)'
        el.style.transition = `opacity 0.55s ${delay}s cubic-bezier(0.22,1,0.36,1), transform 0.55s ${delay}s cubic-bezier(0.22,1,0.36,1)`
        // Forzar reflow para que la transición arranque desde el estado inicial
        void el.offsetHeight
        requestAnimationFrame(() => {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        })
        const cleanup = () => {
          el.style.opacity = ''
          el.style.transform = ''
          el.style.transition = ''
          el.removeEventListener('transitionend', cleanup as any)
        }
        el.addEventListener('transitionend', cleanup as EventListener, { once: true })
        aboveFoldIndex++
      } else {
        // ── Debajo del fold: scroll reveal ──
        el.classList.add('reveal')
        observer.observe(el)
        observed.push(el)
      }
    })

    return () => {
      observer.disconnect()
      observed.forEach((el) => el.classList.remove('reveal', 'is-visible'))
    }
  }, [pathname])

  return null
}
