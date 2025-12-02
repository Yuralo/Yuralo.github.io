"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CitationProps {
  ids: string[];
}

// Dummy data for citations - in a real app this would come from the post metadata
const references: Record<string, { title: string; author: string; year: string }> = {
  "1": { title: "Language Models are Few-Shot Learners", author: "Brown et al.", year: "2020" },
  "2": { title: "Training Language Models to Follow Instructions", author: "Ouyang et al.", year: "2022" },
  "3": { title: "Constitutional AI: Harmlessness from AI Feedback", author: "Bai et al.", year: "2022" },
  "4": { title: "Chain-of-Thought Prompting Elicits Reasoning", author: "Wei et al.", year: "2022" },
  "5": { title: "Self-Consistency Improves Chain of Thought", author: "Wang et al.", year: "2022" },
  "6": { title: "Show Your Work: Scratchpads for Intermediate Computation", author: "Nye et al.", year: "2021" },
  "7": { title: "Large Language Models are Zero-Shot Reasoners", author: "Kojima et al.", year: "2022" },
  "8": { title: "Scaling Laws for Neural Language Models", author: "Kaplan et al.", year: "2020" },
  "9": { title: "Emergent Abilities of Large Language Models", author: "Wei et al.", year: "2022" },
  "10": { title: "Sparks of Artificial General Intelligence", author: "Bubeck et al.", year: "2023" },
  "11": { title: "The Bitter Lesson", author: "Rich Sutton", year: "2019" },
  "21": { title: "Grokking: Generalization Beyond Overfitting", author: "Power et al.", year: "2022" },
  "30": { title: "A Mathematical Framework for Transformer Circuits", author: "Elhage et al.", year: "2021" },
  "31": { title: "In-context Learning and Induction Heads", author: "Olsson et al.", year: "2022" },
};

export function Citation({ ids }: CitationProps) {
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
                      <>
                        <span className="font-bold text-primary text-xs mb-0.5 block">[{id}] {ref.title}</span>
                        <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">
                          {ref.author} • {ref.year}
                        </span>
                      </>
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
