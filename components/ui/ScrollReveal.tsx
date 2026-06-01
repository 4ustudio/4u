'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Anima suavemente las secciones de primer nivel de cada página pública
 * al entrar en viewport. Cero edición por página: detecta los <section>.
 *
 * - El contenido visible al cargar (above the fold) aparece sin animar (evita flash).
 * - Las secciones más abajo hacen fade + slide-up al hacer scroll.
 * - Respeta prefers-reduced-motion.
 * - No toca secciones que ya tienen animaciones manuales (.reveal interno).
 */
export default function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // En páginas con PageLayout usamos <main>; en el home (sin main) usamos body
    const root: HTMLElement = document.querySelector('main') ?? document.body

    // Secciones de primer nivel (excluye anidadas, header y footer)
    const all = Array.from(root.querySelectorAll('section')) as HTMLElement[]
    const sections = all.filter(
      (s) =>
        !s.parentElement?.closest('section') &&
        !s.closest('header') &&
        !s.closest('footer')
    )

    const vh = window.innerHeight
    const observed: HTMLElement[] = []

    // Tras animar, quitamos las clases para que el estado de reposo NO tenga
    // transform (evita romper elementos position:fixed dentro de la sección).
    const cleanup = (el: HTMLElement) => {
      const onEnd = (e: TransitionEvent) => {
        if (e.propertyName !== 'transform') return
        el.classList.remove('reveal', 'is-visible')
        el.removeEventListener('transitionend', onEnd)
      }
      el.addEventListener('transitionend', onEnd)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            cleanup(el)
            el.classList.add('is-visible')
            observer.unobserve(el)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    sections.forEach((el) => {
      // Si la sección ya gestiona sus propias animaciones, no la tocamos
      if (el.querySelector('.reveal')) return

      const rect = el.getBoundingClientRect()
      // Las secciones ya visibles al cargar se dejan intactas (sin transform)
      if (rect.top >= vh * 0.9) {
        el.classList.add('reveal')
        observer.observe(el)
        observed.push(el)
      }
    })

    return () => {
      observer.disconnect()
      // Limpiar clases al cambiar de ruta para no dejar estado colgando
      observed.forEach((el) => el.classList.remove('reveal', 'is-visible'))
    }
  }, [pathname])

  return null
}
