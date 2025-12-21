"use client";

import { useEffect, useState } from "react";
import { Snowflake } from "lucide-react";
import { motion } from "framer-motion";

export function SnowToggle() {
  const [isActive, setIsActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load snow state from localStorage
    const savedState = localStorage.getItem("snow-effect");
    if (savedState === "true") {
      setIsActive(true);
    }
  }, []);

  const toggleSnow = () => {
    const newState = !isActive;
    setIsActive(newState);
    localStorage.setItem("snow-effect", String(newState));
    
    // Dispatch custom event to notify SnowEffect component
    window.dispatchEvent(
      new CustomEvent("snow-toggle", { detail: { active: newState } })
    );
  };

  if (!mounted) return null;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={toggleSnow}
      className={`
        fixed bottom-8 left-8 z-40 
        p-3 
        border border-border 
        bg-background 
        hover:bg-primary 
        hover:text-primary-foreground 
        hover:border-primary
        transition-all 
        duration-200
        group
        shadow-lg
        ${isActive ? "bg-primary text-primary-foreground border-primary" : ""}
      `}
      aria-label={isActive ? "Disable snow effect" : "Enable snow effect"}
      title={isActive ? "Disable snow effect" : "Enable snow effect"}
    >
      <motion.div
        animate={{ 
          rotate: isActive ? 360 : 0,
          scale: isActive ? 1.1 : 1
        }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 200
        }}
      >
        <Snowflake 
          size={20} 
          className={`
            transition-colors
            ${isActive ? "text-primary-foreground" : "text-foreground/70 group-hover:text-primary-foreground"}
          `}
        />
      </motion.div>
    </motion.button>
  );
}

