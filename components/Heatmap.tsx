"use client";

import { motion } from "framer-motion";

import { getGitHubContributions, type ContributionDay } from "@/lib/github";
import { useEffect, useState, useRef } from "react";

export function Heatmap() {
  const [contributions, setContributions] = useState<ContributionDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ data: ContributionDay; x: number; y: number } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getGitHubContributions();
        if (data?.contributions) {
          // Get last 365 days
          const last365 = data.contributions.slice(-365);
          setContributions(last365);
        } else {
          setError("No contribution data available");
        }
      } catch (err) {
        setError("Failed to load contribution data");
        console.error("Heatmap error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getColor = (level: number) => {
    switch (level) {
      case 0: return "bg-muted";
      case 1: return "bg-primary/30";
      case 2: return "bg-primary/50";
      case 3: return "bg-primary/70";
      case 4: return "bg-primary";
      default: return "bg-muted";
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      // Small timeout to ensure layout is computed
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
      }, 0);
    }
  }, [loading]);

  // Helper to get month label for a week
  const getMonthLabel = (weekIndex: number) => {
    const firstDayOfWeek = contributions[weekIndex * 7];
    if (!firstDayOfWeek) return null;
    
    const date = new Date(firstDayOfWeek.date);
    const prevWeekFirstDay = contributions[(weekIndex - 1) * 7];
    
    // Show label if it's the first week or if month changed from previous week
    if (weekIndex === 0 || (prevWeekFirstDay && new Date(prevWeekFirstDay.date).getMonth() !== date.getMonth())) {
      return date.toLocaleString('default', { month: 'short' });
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-[100px] flex items-center justify-center text-muted-foreground text-sm animate-pulse">
        Loading contributions...
      </div>
    );
  }

  if (error || contributions.length === 0) {
    return (
      <div className="w-full h-[100px] flex items-center justify-center text-muted-foreground text-sm">
        {error || "No contribution data available"}
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="w-full overflow-x-auto pb-4 scrollbar-hide relative">
      <div className="min-w-[600px]">
        <div className="flex gap-[3px]">
          {Array.from({ length: 53 }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px] flex-1">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const dayData = contributions[weekIndex * 7 + dayIndex];
                if (!dayData) return <div key={dayIndex} className="w-full aspect-square" />;
                
                return (
                  <motion.div
                    key={dayData.date}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: weekIndex * 0.01 }}
                    className={`w-full aspect-square rounded-sm ${getColor(dayData.level)} hover:opacity-80 transition-opacity cursor-help relative`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredDay({
                        data: dayData,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                      });
                    }}
                    onMouseLeave={() => setHoveredDay(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Custom Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-popover border border-primary px-3 py-2 shadow-lg text-xs font-mono whitespace-nowrap">
            <div className="font-bold text-primary">{new Date(hoveredDay.data.date).toDateString()}</div>
            <div className="text-foreground mt-1">{hoveredDay.data.count} contributions</div>
            <div className="text-muted-foreground text-[10px] mt-0.5">
              {["No activity", "Low", "Medium", "High", "Very High"][hoveredDay.data.level]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
