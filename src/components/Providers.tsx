'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './AuthProvider'
import { TooltipProvider } from './ui/tooltip'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        {/* CRITICAL FIX: Single global TooltipProvider to prevent multiple instances and React Error #185 */}
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
