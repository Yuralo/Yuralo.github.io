export interface Project {
  title: string;
  description: string;
  tags: string[];
  github?: string;
  demo?: string;
}

export const projects: Project[] = [
  {
    title: "Personal Website",
    description: "My personal portfolio and blog built with Next.js and Tailwind CSS.",
    tags: ["Next.js", "Tailwind", "TypeScript"],
    github: "https://github.com/bahaa/personal-website",
    demo: "https://bahaa.dev",
  },
  {
    title: "AI Chat Assistant",
    description: "A smart chat interface powered by LLMs with context awareness.",
    tags: ["React", "OpenAI API", "Node.js"],
    github: "https://github.com/bahaa/ai-chat",
    demo: "#",
  },
  {
    title: "Generative Art Grid",
    description: "An interactive canvas exploring cellular automata and noise functions.",
    tags: ["Canvas API", "JavaScript", "Math"],
    github: "https://github.com/bahaa/gen-art",
    demo: "#",
  },
  {
    title: "Task Manager CLI",
    description: "A rust-based command line tool for managing daily tasks efficiently.",
    tags: ["Rust", "CLI", "Productivity"],
    github: "https://github.com/bahaa/todo-cli",
    demo: "#",
  },
];
