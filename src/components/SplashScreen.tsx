import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Splash screen shown while the app loads. Displays the logo with a
 * gradient background and smoothly transitions out when loading completes.
 */
export default function SplashScreen({ onReady }: { onReady: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onReady, 600) // wait for exit animation
    }, 1800) // show for 1.8s minimum
    return () => clearTimeout(timer)
  }, [onReady])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="splash-bg" />
          <motion.div
            className="splash-content"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
              alt="Hyphe"
              className="splash-logo"
            />
            <motion.h1
              className="splash-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              Hyphe
            </motion.h1>
            <motion.p
              className="splash-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              Progressive overload, simplified
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
