"use client";

import { useEffect, useState } from "react";
import { ChevronUp, List } from "lucide-react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    // Hide TOC button when scroll-to-top button would show
    const handleScroll = () => {
      setShowButton(window.scrollY < 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile Toggle - Hide when scrolled down */}
      {showButton && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="xl:hidden fixed bottom-20 right-4 z-50 p-3 bg-card/80 backdrop-blur-sm border border-primary/30 rounded-lg shadow-lg hover:bg-card transition-all hover:scale-105"
          aria-label="Toggle Table of Contents"
        >
          <List size={18} className="text-primary" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* TOC Content - Always fixed/absolute positioned */}
        <nav
          className={`
            ${isOpen 
              ? 'fixed left-0 top-0 z-50 h-full w-72 bg-background/95 backdrop-blur-sm border-r p-6 shadow-2xl overflow-y-auto' 
              : 'hidden xl:block w-full'
            }
          `}
        >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 xl:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary rounded-full" />
            <h2 className="text-xs font-mono text-foreground uppercase tracking-wider font-semibold">
              Contents
            </h2>
          </div>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="xl:hidden p-1.5 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronUp size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Links */}
        <ul className="space-y-1">
          {headings.map(({ id, text, level }) => (
            <li 
              key={id} 
              style={{ 
                paddingLeft: level === 1 ? '0' : '1rem'
              }}
            >
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
                className={`
                  group block py-1.5 px-3 rounded-md transition-all text-sm
                  ${activeId === id
                    ? 'text-primary bg-primary/10 font-medium border-l-2 border-primary ml-[-2px]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }
                  ${level === 1 ? 'font-medium' : 'text-xs'}
                `}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
