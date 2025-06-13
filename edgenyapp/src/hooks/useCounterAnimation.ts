'use client'

import { useEffect, useState, useRef } from 'react'

interface UseCounterAnimationOptions {
  start?: number
  end: number
  duration?: number
  delay?: number
  easing?: (t: number) => number
}

export function useCounterAnimation({
  start = 0,
  end,
  duration = 2000,
  delay = 0,
  easing = (t: number) => t * t * (3 - 2 * t) // smooth step
}: UseCounterAnimationOptions) {
  const [count, setCount] = useState(start)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      const startTime = Date.now()
      const startValue = start
      const endValue = end
      const totalDuration = duration

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalDuration, 1)
        const easedProgress = easing(progress)
        
        const currentValue = Math.floor(
          startValue + (endValue - startValue) * easedProgress
        )
        
        setCount(currentValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    }, delay)

    return () => clearTimeout(timer)
  }, [isVisible, start, end, duration, delay, easing])

  return { count, ref, isVisible }
}
