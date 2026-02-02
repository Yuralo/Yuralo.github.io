"use client";

import { Mail, Twitter, Github, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const contacts = [
    { icon: Mail, label: "Email", value: "bahaa.tabbakha@gmail.com", href: "mailto:bahaa.tabbakha@gmail.com" },
    { icon: Twitter, label: "Twitter", value: "@luminaclar", href: "https://twitter.com/luminaclar" },
    { icon: Github, label: "GitHub", value: "yuralo", href: "https://github.com/yuralo" }
  ];

  return (
    <div className="py-10 max-w-4xl mx-auto w-full space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tighter uppercase">Contact</h1>
        <p className="text-xl text-muted-foreground">
          Let's connect and collaborate.
        </p>
      </motion.div>

      {/* Contact Information */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4"
      >
        {contacts.map((contact, i) => {
          const Icon = contact.icon;
          return (
            <motion.a
              key={contact.label}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-4 p-6 border border-border hover:border-primary transition-colors group"
            >
              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-mono uppercase mb-1">
                  {contact.label}
                </p>
                <p className="font-mono">{contact.value}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          );
        })}
      </motion.section>

      {/* Collaboration */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="border border-primary p-8 bg-primary/5"
      >
        <h2 className="text-xl font-bold uppercase tracking-tight mb-4">
          Research & Collaboration
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Feel free to reach out for collaboration, research discussions, or just to chat 
          about machine learning and technology. I'm always interested in connecting with 
          fellow researchers and developers.
        </p>
      </motion.section>
    </div>
  );
}
