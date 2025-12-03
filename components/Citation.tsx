"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CitationProps {
  ids: string[];
  references?: Record<string, string>;
}

export function Citation({ ids, references = {} }: CitationProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span 
      className="relative inline-block align-super text-xs mx-0.5 z-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="cursor-help text-primary font-bold hover:underline decoration-dashed">
        [{ids.join(", ")}]
      </span>

      <AnimatePresence>
        {hovered && (
          <motion.span
            key="tooltip"
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-background border border-primary p-3 shadow-[4px_4px_0px_0px_var(--primary)] z-50 block"
          >
            <span className="flex flex-col gap-2">
              {ids.map((id) => {
                const ref = references[id];
                return (
                  <span key={id} className="border-b border-border last:border-0 pb-2 last:pb-0 block">
                    {ref ? (
                      <span className="font-bold text-primary text-xs mb-0.5 block">[{id}] {ref}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs block">Reference [{id}] not found</span>
                    )}
                  </span>
                );
              })}
            </span>
            {/* Arrow */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-primary block" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
