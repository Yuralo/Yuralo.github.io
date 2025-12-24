"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleCodeBlockProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  maxHeight?: number; // Height in pixels before collapsing is enabled
}

export function CollapsibleCodeBlock({ 
  children, 
  defaultCollapsed = false,
  maxHeight = 300 
}: CollapsibleCodeBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [shouldShowToggle, setShouldShowToggle] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if content height exceeds maxHeight after render
    const checkHeight = () => {
      if (contentRef.current) {
        const preElement = contentRef.current.querySelector("pre");
        if (preElement) {
          const height = preElement.scrollHeight;
          setShouldShowToggle(height > maxHeight);
        }
      }
    };

    // Check immediately and after a short delay to ensure content is rendered
    checkHeight();
    const timeout = setTimeout(checkHeight, 100);
    
    return () => clearTimeout(timeout);
  }, [maxHeight, children]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      className="relative group/codeblock" 
      ref={contentRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isCollapsed && shouldShowToggle ? `${maxHeight}px` : "none",
        }}
      >
        {children}
      </div>
      {shouldShowToggle && (
        <>
          <button
            onClick={toggleCollapse}
            className={`absolute bottom-2 right-2 p-2 bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/50 transition-all z-20 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
              isHovered || isCollapsed ? "opacity-100" : "opacity-0"
            }`}
            title={isCollapsed ? "Expand code" : "Collapse code"}
            aria-label={isCollapsed ? "Expand code block" : "Collapse code block"}
          >
            {isCollapsed ? (
              <>
                <ChevronDown size={14} className="text-primary" />
                <span className="text-primary font-semibold">Expand</span>
              </>
            ) : (
              <>
                <ChevronUp size={14} className="text-muted-foreground group-hover/codeblock:text-primary transition-colors" />
                <span className="text-muted-foreground group-hover/codeblock:text-primary transition-colors font-semibold">Collapse</span>
              </>
            )}
          </button>
          {isCollapsed && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-10"
              style={{
                background: "linear-gradient(to top, #0d1117 0%, #0d1117 50%, rgba(13, 17, 23, 0.8) 70%, transparent 100%)",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

