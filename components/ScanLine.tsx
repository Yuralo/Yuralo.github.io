"use client";

import { motion } from "framer-motion";

export function ScanLine() {
  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none z-50"
      animate={{
        y: ["0vh", "100vh"],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}
