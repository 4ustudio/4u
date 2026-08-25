'use client'

import { MdLightMode, MdDarkMode } from 'react-icons/md'
import { useAdminTheme } from './AdminThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useAdminTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-xl border transition-colors"
      style={{
        borderColor: 'var(--adm-border)',
        background: 'var(--adm-surface)',
        color: 'var(--adm-text-muted)',
        boxShadow: 'var(--adm-card-shadow)',
      }}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? (
        <MdLightMode className="h-4 w-4" aria-hidden="true" />
      ) : (
        <MdDarkMode className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  )
}
