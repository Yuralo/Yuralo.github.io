"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

interface BlogImageProps {
  src: string;
  alt: string;
  title?: string;
  width?: string;
  className?: string;
}

// Check if SVG is mostly black or white
async function analyzeSVGColors(svgUrl: string): Promise<'black' | 'white' | 'mixed' | null> {
  try {
    let svgText: string;
    
    // Handle data URLs
    if (svgUrl.startsWith('data:image/svg+xml')) {
      if (svgUrl.includes('base64,')) {
        // Base64 encoded
        const base64Data = svgUrl.split('base64,')[1];
        svgText = decodeURIComponent(atob(base64Data));
      } else {
        // URL encoded
        const encodedData = svgUrl.split('data:image/svg+xml,')[1] || svgUrl.split('data:image/svg+xml;charset=utf-8,')[1] || svgUrl.split('data:image/svg+xml;utf8,')[1];
        svgText = decodeURIComponent(encodedData || '');
      }
    } else {
      // Regular URL
      const response = await fetch(svgUrl);
      svgText = await response.text();
    }
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Get all elements with fill or stroke attributes
    const allElements = svgDoc.querySelectorAll('*');
    let blackCount = 0;
    let whiteCount = 0;
    let totalCount = 0;
    
    const isBlack = (color: string): boolean => {
      if (!color || color === 'none' || color === 'transparent') return false;
      const normalized = color.toLowerCase().trim();
      return normalized === '#000' || 
             normalized === '#000000' || 
             normalized === 'black' ||
             normalized === 'rgb(0, 0, 0)' ||
             normalized === 'rgba(0, 0, 0, 1)';
    };
    
    const isWhite = (color: string): boolean => {
      if (!color || color === 'none' || color === 'transparent') return false;
      const normalized = color.toLowerCase().trim();
      return normalized === '#fff' || 
             normalized === '#ffffff' || 
             normalized === 'white' ||
             normalized === 'rgb(255, 255, 255)' ||
             normalized === 'rgba(255, 255, 255, 1)';
    };
    
    // Check root SVG element for default fill/stroke
    const rootSvg = svgDoc.querySelector('svg');
    if (rootSvg) {
      const rootFill = rootSvg.getAttribute('fill');
      const rootStroke = rootSvg.getAttribute('stroke');
      const rootStyle = rootSvg.getAttribute('style');
      
      // Parse style attribute
      if (rootStyle) {
        const fillMatch = rootStyle.match(/fill:\s*([^;]+)/i);
        const strokeMatch = rootStyle.match(/stroke:\s*([^;]+)/i);
        if (fillMatch && !rootFill) {
          const fillColor = fillMatch[1].trim();
          if (fillColor && fillColor !== 'none') {
            totalCount++;
            if (isBlack(fillColor)) blackCount++;
            else if (isWhite(fillColor)) whiteCount++;
          }
        }
        if (strokeMatch && !rootStroke) {
          const strokeColor = strokeMatch[1].trim();
          if (strokeColor && strokeColor !== 'none') {
            totalCount++;
            if (isBlack(strokeColor)) blackCount++;
            else if (isWhite(strokeColor)) whiteCount++;
          }
        }
      }
      
      if (rootFill && rootFill !== 'none') {
        totalCount++;
        if (isBlack(rootFill)) blackCount++;
        else if (isWhite(rootFill)) whiteCount++;
      }
      
      if (rootStroke && rootStroke !== 'none') {
        totalCount++;
        if (isBlack(rootStroke)) blackCount++;
        else if (isWhite(rootStroke)) whiteCount++;
      }
    }
    
    allElements.forEach((el) => {
      // Skip root SVG as we already checked it
      if (el.tagName === 'svg') return;
      
      const fill = el.getAttribute('fill');
      const stroke = el.getAttribute('stroke');
      const style = el.getAttribute('style');
      
      // Parse style attribute
      if (style) {
        const fillMatch = style.match(/fill:\s*([^;]+)/i);
        const strokeMatch = style.match(/stroke:\s*([^;]+)/i);
        if (fillMatch && !fill) {
          const fillColor = fillMatch[1].trim();
          if (fillColor && fillColor !== 'none') {
            totalCount++;
            if (isBlack(fillColor)) blackCount++;
            else if (isWhite(fillColor)) whiteCount++;
          }
        }
        if (strokeMatch && !stroke) {
          const strokeColor = strokeMatch[1].trim();
          if (strokeColor && strokeColor !== 'none') {
            totalCount++;
            if (isBlack(strokeColor)) blackCount++;
            else if (isWhite(strokeColor)) whiteCount++;
          }
        }
      }
      
      if (fill && fill !== 'none') {
        totalCount++;
        if (isBlack(fill)) blackCount++;
        else if (isWhite(fill)) whiteCount++;
      }
      
      if (stroke && stroke !== 'none') {
        totalCount++;
        if (isBlack(stroke)) blackCount++;
        else if (isWhite(stroke)) whiteCount++;
      }
    });
    
    // Check default fill/stroke (if not specified, SVG defaults to black)
    if (totalCount === 0) {
      // No explicit colors found, check if there's any content
      const hasContent = svgDoc.querySelector('path, circle, rect, line, polygon, polyline, ellipse');
      if (hasContent) {
        // Default SVG color is black
        return 'black';
      }
      return null;
    }
    
    // Determine dominant color
    const blackRatio = blackCount / totalCount;
    const whiteRatio = whiteCount / totalCount;
    
    if (blackRatio > 0.7) return 'black';
    if (whiteRatio > 0.7) return 'white';
    return 'mixed';
  } catch (error) {
    console.error('Error analyzing SVG:', error);
    return null;
  }
}

export function BlogImage({ src, alt, title, width, className }: BlogImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [svgColorType, setSvgColorType] = useState<'black' | 'white' | 'mixed' | null>(null);
  const [needsInversion, setNeedsInversion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Determine current theme (accounting for system theme)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const getIsDark = (): boolean => {
    if (!mounted) return false; // Default to light during SSR
    const currentTheme = theme === 'system' ? systemTheme : theme;
    if (currentTheme) return currentTheme === 'dark';
    // Fallback to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  
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

  // Analyze SVG colors and determine if inversion is needed
  useEffect(() => {
    if (!mounted) return;
    
    const isSVG = src.toLowerCase().endsWith('.svg') || src.includes('data:image/svg+xml');
    
    if (isSVG) {
      analyzeSVGColors(src).then((colorType) => {
        setSvgColorType(colorType);
        const isDark = getIsDark();
        
        // Invert if:
        // - SVG is black and theme is dark (black on black = invisible)
        // - SVG is white and theme is light (white on white = invisible)
        if (colorType === 'black' && isDark) {
          setNeedsInversion(true);
        } else if (colorType === 'white' && !isDark) {
          setNeedsInversion(true);
        } else {
          setNeedsInversion(false);
        }
      });
    } else {
      setSvgColorType(null);
      setNeedsInversion(false);
    }
  }, [src, theme, systemTheme, mounted]);
  
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
            ref={imgRef}
            src={src}
            alt={displayAlt}
            className="w-full h-auto block"
            loading="lazy"
            style={needsInversion ? {
              filter: 'invert(1)',
              transition: 'filter 0.3s ease',
            } : {
              transition: 'filter 0.3s ease',
            }}
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
                className="max-w-full max-h-[95vh] bg-background object-contain rounded-sm" 
                draggable={false}
                style={needsInversion ? {
                  filter: 'invert(1)',
                  transition: 'filter 0.3s ease',
                } : {
                  transition: 'filter 0.3s ease',
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

