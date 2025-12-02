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
            I'm a developer who loves building things for the web. 
            I enjoy exploring complex systems, creating interactive experiences, 
            and making the internet a little bit more fun.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            I specialize in full-stack development with a focus on React, Next.js, and modern web technologies.
            When I'm not coding, you can find me exploring new tech, reading papers, or experimenting with generative art.
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
                "Inference and Training Optimization",
                "Small Models Training",
                "Deep Reasoning Models"
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
                "Reinforcement Learning",
                "Small Models Fine-Tuning",
                "Self Driving",
                "Gaussian Splats and NeRFs"
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
