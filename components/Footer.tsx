import { Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="py-8 mt-16 border-t border-foreground/10">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Bahaa</p>
        
        <div className="flex flex-col gap-3">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
          <a 
            href="https://twitter.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-3 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <Twitter size={16} />
            <span>Twitter</span>
          </a>
          <a 
            href="mailto:hello@example.com" 
            className="flex items-center gap-3 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            <Mail size={16} />
            <span>Email</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
