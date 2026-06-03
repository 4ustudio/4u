import type { ReactNode } from 'react'

// Layout mínimo — la auth la maneja cada página protegida y el middleware
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
