"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { useEffect, useState } from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "top-right"}
      expand={true}
      richColors={true}
      closeButton={!isMobile}
      toastOptions={{
        duration: isMobile ? 3000 : 4000, // Shorter duration on mobile
        classNames: {
          toast:
            `group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-sm ${isMobile ? 'mobile-toast' : ''}`,
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            `group-[.toast]:bg-layeredge-orange group-[.toast]:text-black group-[.toast]:hover:bg-layeredge-orange-dark group-[.toast]:font-semibold ${isMobile ? 'mobile-toast-action' : ''}`,
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          closeButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 mobile-toast-close",
          success:
            "group-[.toaster]:bg-success/10 group-[.toaster]:border-success/20 group-[.toaster]:text-success",
          error:
            "group-[.toaster]:bg-destructive/10 group-[.toaster]:border-destructive/20 group-[.toaster]:text-destructive",
          warning:
            "group-[.toaster]:bg-warning/10 group-[.toaster]:border-warning/20 group-[.toaster]:text-warning",
          info:
            "group-[.toaster]:bg-layeredge-blue/10 group-[.toaster]:border-layeredge-blue/20 group-[.toaster]:text-layeredge-blue",
        },
        style: {
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          ...(isMobile && {
            width: '100%',
            maxWidth: 'none',
            margin: '0',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            lineHeight: '1.4'
          })
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
