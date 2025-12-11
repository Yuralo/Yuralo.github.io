"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export function FocusMode() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Hide distracting elements
      const elementsToHide = document.querySelectorAll("nav, aside, footer, a[href='/blog']");
      elementsToHide.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // Add focus mode class to body for styling
      document.body.classList.add("focus-mode-active");
      
      // Add focus overlay and highlight article
      const article = document.querySelector("article");
      if (article) {
        article.classList.add("focus-mode-article");
      }
    } else {
      // Show hidden elements
      const elementsToShow = document.querySelectorAll("nav, aside, footer, a[href='/blog']");
      elementsToShow.forEach((el) => {
        (el as HTMLElement).style.display = "";
      });

      // Remove focus mode classes
      document.body.classList.remove("focus-mode-active");
      
      const article = document.querySelector("article");
      if (article) {
        article.classList.remove("focus-mode-article");
      }
    }

    return () => {
      document.body.classList.remove("focus-mode-active");
      const elementsToShow = document.querySelectorAll("nav, aside, footer, a[href='/blog']");
      elementsToShow.forEach((el) => {
        (el as HTMLElement).style.display = "";
      });
      const article = document.querySelector("article");
      if (article) {
        article.classList.remove("focus-mode-article");
      }
    };
  }, [isActive]);

  return (
    <>
      {isActive && (
        <div 
          className="fixed inset-0 z-30 pointer-events-none"
          style={{ 
            backgroundColor: 'var(--background)',
            opacity: 0.95,
            backdropFilter: 'blur(8px)'
          }}
        />
      )}
      <button
        onClick={() => setIsActive(!isActive)}
        className="fixed bottom-20 right-8 z-40 p-3 bg-card/90 backdrop-blur-sm border border-border hover:bg-card hover:border-primary transition-all"
        aria-label={isActive ? "Exit focus mode" : "Enter focus mode"}
        title={isActive ? "Exit focus mode" : "Enter focus mode"}
      >
        {isActive ? (
          <Minimize2 size={18} className="text-foreground" />
        ) : (
          <Maximize2 size={18} className="text-foreground" />
        )}
      </button>
    </>
  );
}

