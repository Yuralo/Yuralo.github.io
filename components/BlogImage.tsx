"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BlogImageProps {
  src: string;
  alt: string;
  title?: string;
  width?: string;
  className?: string;
}

export function BlogImage({ src, alt, title, width, className }: BlogImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Parse size from alt text if format is "alt|width:50%" or "alt|50%"
  const parseSize = (altText: string): { alt: string; width?: string } => {
    const sizeMatch = altText.match(/\|(?:width:)?(\d+%?|small|medium|large)$/i);
    if (sizeMatch) {
      const size = sizeMatch[1];
      const cleanAlt = altText.replace(/\|(?:width:)?(\d+%?|small|medium|large)$/i, "").trim();
      
      let widthValue = width;
      if (size === "small") widthValue = "50%";
      else if (size === "medium") widthValue = "75%";
      else if (size === "large") widthValue = "100%";
      else if (size.endsWith("%")) widthValue = size;
      else if (!isNaN(Number(size))) widthValue = `${size}%`;
      
      return { alt: cleanAlt || altText, width: widthValue };
    }
    return { alt: altText };
  };
  
  const { alt: displayAlt, width: imageWidth } = parseSize(alt);
  const finalWidth = width || imageWidth;

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomed(false);
    };
    if (isZoomed) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isZoomed]);

  return (
    <>
      <figure 
        className={`my-8 ${className || ""}`} 
        style={finalWidth ? { width: finalWidth, marginLeft: "auto", marginRight: "auto" } : {}}
      >
        <div 
          className="relative overflow-hidden cursor-zoom-in transition-opacity hover:opacity-90"
          onClick={() => setIsZoomed(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsZoomed(true);
            }
          }}
          aria-label="Click to zoom image"
        >
          <img
            src={src}
            alt={displayAlt}
            className="w-full h-auto block"
            loading="lazy"
          />
        </div>
        {(title || displayAlt) && (
          <figcaption className="mt-3 text-sm text-muted-foreground text-center">
            {title || displayAlt}
          </figcaption>
        )}
      </figure>

      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-3 bg-background/90 backdrop-blur-sm border border-border hover:bg-background transition-colors z-10 rounded-sm"
              aria-label="Close zoom (or press Escape)"
            >
              <X size={20} className="text-foreground" />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-[95vw] max-h-[95vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={src}
                alt={displayAlt}
                className="max-w-full max-h-[95vh] object-contain rounded-sm"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

