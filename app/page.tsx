"use client";

import { motion } from "framer-motion";
import { CellularAutomata } from "@/components/CellularAutomata";
import { Heatmap } from "@/components/Heatmap";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-16 py-10">
      {/* About Me Section */}
      <section className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">About Me</h2>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed mb-4">
          I'm a Machine Learning Engineer, deep learning enthusiast, Interpretability & RL fan.
          Most days I'm working Mechanistic Interpretability, and lately training models to do useful things.
          Currently deep in mechanistic interpretability, and many other things. 
          I think a lot about alignment, Reinforcement Learning, and what intelligence actually means.
          </p>
        </motion.div>
      </section>

      {/* Research Domains */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold uppercase tracking-tight">
          Research Domains
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Core Research */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2 mb-4">
              <span className="text-primary">◈</span> Core Research
            </h3>
            <div className="space-y-2">
              {[
                "Mechanistic Interpretability",
                "Inference Optimization", 
                "RLVR",
                "AI Alignment",
              ].map((area) => (
                <div
                  key={area}
                  className="border border-border p-3 hover:border-primary transition-colors text-sm"
                >
                  <span className="text-primary mr-2">◇</span>
                  {area}
                </div>
              ))}
            </div>
          </div>

          {/* Current Goals */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2 mb-4">
              <span className="text-primary">◉</span> Current Goals
            </h3>
            <div className="space-y-2">
              {[
                "Large Language Models",
                "Reinforcement Learning",
                "CUDA Programming",
                "Vision Models (eg. Diffusion, YOLO, SAM)",
              ].map((goal) => (
                <div
                  key={goal}
                  className="border border-border p-3 hover:border-primary transition-colors text-sm"
                >
                  <span className="text-primary mr-2">◉</span>
                  {goal}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* GitHub Contributions */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">GitHub Activity</h2>
        <div className="p-6 border border-border bg-card">
          <Heatmap />
        </div>
      </motion.section>

      {/* Cellular Automata Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-2">Interactive Playground</h2>
        <p className="text-muted-foreground mb-6">
          A little cellular automata simulation to play with. Adjust the parameters to see how the system evolves.
        </p>
        <CellularAutomata />
      </motion.section>
    </div>
  );
}
