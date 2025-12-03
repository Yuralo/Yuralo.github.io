"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [hideTimer, setHideTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
        
        // Clear existing timer
        if (hideTimer) {
          clearTimeout(hideTimer);
        }
        
        // Set new timer to hide after 3 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
        
        setHideTimer(timer);
      } else {
        setIsVisible(false);
        if (hideTimer) {
          clearTimeout(hideTimer);
        }
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
  }, [hideTimer]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
