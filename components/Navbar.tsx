"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Search, Sun, Moon } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load custom color from localStorage
    const savedColor = localStorage.getItem("custom-primary-color");
    if (savedColor) {
      setCustomColor(savedColor);
      applyCustomColor(savedColor);
    }
  }, []);

  const applyCustomColor = (color: string) => {
    document.documentElement.style.setProperty("--primary", color);
    localStorage.setItem("custom-primary-color", color);
    // Dispatch event to notify components of color change
    window.dispatchEvent(new Event("color-changed"));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    applyCustomColor(color);
  };

  return (
    <nav className="relative flex flex-col items-center py-12 mb-20 border-b border-border">
      {/* Large centered branding */}
      <Link 
        href="/" 
        className="group relative mb-10 text-center"
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mb-3 uppercase">
          Yuralo
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium tracking-widest uppercase flex items-center justify-center gap-2">
          <span className="text-primary">~/</span> Researcher & Developer
        </p>
      </Link>
      
      {/* Creative navigation - horizontal with distinctive styling */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-border bg-background">
          <Link
            href="/blog"
            className={cn(
              "px-6 py-3 text-sm font-bold transition-all uppercase tracking-wider border-r border-border hover:bg-primary hover:text-primary-foreground",
              pathname.startsWith("/blog") 
                ? "bg-primary text-primary-foreground" 
                : "text-foreground/70"
            )}
          >
            Blog
          </Link>

          <Link
            href="/projects"
            className={cn(
              "px-6 py-3 text-sm font-bold transition-all uppercase tracking-wider border-r border-border hover:bg-primary hover:text-primary-foreground",
              pathname === "/projects"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70"
            )}
          >
            Projects
          </Link>

          <Link
            href="/contact"
            className={cn(
              "px-6 py-3 text-sm font-bold transition-all uppercase tracking-wider hover:bg-primary hover:text-primary-foreground",
              pathname === "/contact"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70"
            )}
          >
            Contact
          </Link>
        </div>

        {/* Theme & Color Picker */}
        {mounted && (
          <div className="flex items-center border border-border bg-background ml-4">
            <button
              onClick={() => document.dispatchEvent(new Event("open-command-menu"))}
              className="p-3 hover:bg-primary hover:text-primary-foreground transition-all border-r border-border group relative"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-3 hover:bg-primary hover:text-primary-foreground transition-all border-r border-border group"
              aria-label="Toggle theme"
            >
              <div className="relative w-4 h-4">
                <Sun className="w-4 h-4 absolute inset-0 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="w-4 h-4 absolute inset-0 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </div>
            </button>
            
            {/* Color Picker */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-3 hover:bg-primary hover:text-primary-foreground transition-all flex items-center gap-2 group"
                aria-label="Choose color"
              >
                <div 
                  className="w-4 h-4 border border-border group-hover:scale-110 transition-transform" 
                  style={{ backgroundColor: customColor }}
                />
              </button>
              
              {showColorPicker && (
                <>
                  {/* Backdrop to close on outside click */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowColorPicker(false)}
                  />
                  
                  <div className="absolute top-full right-0 mt-2 p-4 bg-background border border-primary shadow-lg z-50 w-64">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-mono uppercase text-muted-foreground">
                        Primary Color
                      </label>
                      <button
                        onClick={() => {
                          const defaultColor = "#3b82f6";
                          setCustomColor(defaultColor);
                          applyCustomColor(defaultColor);
                        }}
                        className="text-[10px] font-mono text-primary hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                    
                    <input
                      type="color"
                      value={customColor}
                      onChange={handleColorChange}
                      className="w-full h-12 cursor-pointer border border-border bg-background mb-3"
                    />
                    
                    <p className="text-xs font-mono mb-3 text-muted-foreground text-center">{customColor}</p>
                    
                    {/* Preset Colors */}
                    <div>
                      <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">Quick Presets</p>
                      <div className="grid grid-cols-6 gap-2">
                        {["#3b82f6", "#f43f5e", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#6366f1", "#14b8a6", "#ef4444", "#a855f7", "#22c55e"].map(color => (
                          <button
                            key={color}
                            onClick={() => {
                              setCustomColor(color);
                              applyCustomColor(color);
                            }}
                            className="w-8 h-8 border border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
