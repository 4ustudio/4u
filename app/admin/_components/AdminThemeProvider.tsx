'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface AdminThemeCtx {
  theme: Theme
  toggle: () => void
}

const AdminThemeContext = createContext<AdminThemeCtx>({ theme: 'dark', toggle: () => {} })

export function useAdminTheme() { return useContext(AdminThemeContext) }

function readAdminTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem('admin-theme')
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function writeAdminTheme(theme: Theme) {
  try {
    window.localStorage.setItem('admin-theme', theme)
  } catch {
    // Some embedded browsers block storage access; keep the in-memory theme working.
  }
}

interface Props {
  children: React.ReactNode
  className?: string
}

export default function AdminThemeProvider({ children, className }: Props) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    return readAdminTheme() ?? 'dark'
  })

  useEffect(() => {
    const stored = readAdminTheme()
    if (stored) setTheme(stored)
  }, [])

  function toggle() {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      writeAdminTheme(next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div
        data-admin-theme={theme}
        suppressHydrationWarning
        className={className}
        style={{ background: 'var(--adm-bg)', color: 'var(--adm-text)', colorScheme: theme }}
      >
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
