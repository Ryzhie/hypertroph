import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

/**
 * Splash screen shown while the app loads. Displays the logo with a
 * gradient background and smoothly transitions out when loading completes.
 */
export default function SplashScreen({ onReady }: { onReady: () => void }) {
  const [visible, setVisible] = useState(true)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const hold = reduceMotion ? 600 : 1500
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onReady, reduceMotion ? 100 : 450) // wait for exit animation
    }, hold)
    return () => clearTimeout(timer)
  }, [onReady, reduceMotion])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.45, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="splash-bg" />
          <motion.div
            className="splash-content"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
              alt="Hyphe"
              className="splash-logo"
            />
            <motion.h1
              className="splash-title"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              Hyphe
            </motion.h1>
            <motion.p
              className="splash-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.55, ease: [0.23, 1, 0.32, 1] }}
            >
              Progressive overload, simplified
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
