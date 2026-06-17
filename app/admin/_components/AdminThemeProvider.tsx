'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface AdminThemeCtx {
  theme: Theme
  toggle: () => void
}

const AdminThemeContext = createContext<AdminThemeCtx>({ theme: 'dark', toggle: () => {} })

export function useAdminTheme() { return useContext(AdminThemeContext) }

interface Props {
  children: React.ReactNode
  className?: string
}

export default function AdminThemeProvider({ children, className }: Props) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('admin-theme') as Theme | null
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  function toggle() {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme', next)
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
