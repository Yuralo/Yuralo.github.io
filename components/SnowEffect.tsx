"use client";

import { useEffect, useState, useRef } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
  character: string;
  driftDirection: "left" | "right" | "none";
  driftAmount: number; // percentage of horizontal movement
  swayAmount: number; // amount of side-to-side sway
}

interface MousePosition {
  x: number;
  y: number;
}

const SNOWFLAKE_CHARACTERS = ["❄", "❅", "❆", "✻", "✼", "✽", "✾", "✿"];
const CURSOR_INFLUENCE_RADIUS = 150; // pixels
const MAX_PUSH_DISTANCE = 80; // pixels

export function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: -1000, y: -1000 });
  const [snowflakePositions, setSnowflakePositions] = useState<Map<number, { pushX: number; pushY: number }>>(new Map<number, { pushX: number; pushY: number }>());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load snow state from localStorage
    const savedState = localStorage.getItem("snow-effect");
    if (savedState === "true") {
      setIsActive(true);
    }

    // Create snowflakes - more of them with varied movement patterns
    const flakes: Snowflake[] = Array.from({ length: 100 }, (_, i) => {
      const driftType = Math.random();
      let driftDirection: "left" | "right" | "none" = "none";
      if (driftType < 0.4) driftDirection = "right"; // 40% drift right
      else if (driftType < 0.8) driftDirection = "left"; // 40% drift left
      // 20% fall straight down
      
      return {
        id: i,
        left: Math.random() * 100,
        animationDuration: 3 + Math.random() * 5, // 3-8 seconds
        animationDelay: Math.random() * 3,
        size: 4 + Math.random() * 8, // 4-12px
        opacity: 0.3 + Math.random() * 0.7, // 0.3-1.0
        character: SNOWFLAKE_CHARACTERS[Math.floor(Math.random() * SNOWFLAKE_CHARACTERS.length)],
        driftDirection,
        driftAmount: driftDirection !== "none" ? 10 + Math.random() * 30 : 0, // 10-40% horizontal drift
        swayAmount: Math.random() * 20 + 5, // 5-25px of side-to-side sway
      };
    });

    setSnowflakes(flakes);
  }, []);

  useEffect(() => {
    // Listen for snow toggle events
    const handleSnowToggle = (event: CustomEvent) => {
      setIsActive(event.detail.active);
    };

    window.addEventListener("snow-toggle" as any, handleSnowToggle as EventListener);
    return () => {
      window.removeEventListener("snow-toggle" as any, handleSnowToggle as EventListener);
    };
  }, []);

  // Track mouse position
  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isActive]);

  // Calculate cursor interaction with snowflakes using requestAnimationFrame
  useEffect(() => {
    if (!isActive) return;

    const updateCursorInteraction = () => {
      const newPositions = new Map<number, { pushX: number; pushY: number }>();
      
      snowflakes.forEach((flake) => {
        const flakeElement = document.querySelector(`[data-snowflake-id="${flake.id}"]`) as HTMLElement;
        if (!flakeElement) return;

        const rect = flakeElement.getBoundingClientRect();
        const flakeX = rect.left + rect.width / 2;
        const flakeY = rect.top + rect.height / 2;

        // Calculate distance from cursor to snowflake
        const dx = flakeX - mousePos.x;
        const dy = flakeY - mousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate push force (stronger when closer, with smooth falloff)
        let pushX = 0;
        let pushY = 0;

        if (distance < CURSOR_INFLUENCE_RADIUS && distance > 0) {
          // Smooth falloff using ease-out curve
          const normalizedDistance = distance / CURSOR_INFLUENCE_RADIUS;
          const force = (1 - normalizedDistance) * (1 - normalizedDistance) * MAX_PUSH_DISTANCE;
          const angle = Math.atan2(dy, dx);
          pushX = Math.cos(angle) * force;
          pushY = Math.sin(angle) * force;
        }

        newPositions.set(flake.id, { pushX, pushY });
      });

      setSnowflakePositions(newPositions);
      animationFrameRef.current = requestAnimationFrame(updateCursorInteraction);
    };

    animationFrameRef.current = requestAnimationFrame(updateCursorInteraction);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, mousePos, snowflakes]);

  if (!isActive) return null;

  return (
    <>
      <style>
        {snowflakes.map((flake) => {
          const driftValue = flake.driftDirection === "right" 
            ? flake.driftAmount 
            : flake.driftDirection === "left" 
            ? -flake.driftAmount 
            : 0;
          
          const hasSway = flake.swayAmount > 15;
          const hasDrift = driftValue !== 0;
          
          if (!hasDrift && !hasSway) {
            return `@keyframes snowfall-${flake.id} {
              0% { transform: translateY(-100vh) rotate(0deg); }
              100% { transform: translateY(100vh) rotate(360deg); }
            }`;
          }
          
          if (hasDrift && !hasSway) {
            return `@keyframes snowfall-${flake.id} {
              0% { transform: translateY(-100vh) translateX(0) rotate(0deg); }
              100% { transform: translateY(100vh) translateX(${driftValue}vw) rotate(360deg); }
            }`;
          }
          
          if (!hasDrift && hasSway) {
            return `@keyframes snowfall-${flake.id} {
              0% { transform: translateY(-100vh) translateX(0) rotate(0deg); }
              25% { transform: translateY(-50vh) translateX(${flake.swayAmount}px) rotate(90deg); }
              50% { transform: translateY(0vh) translateX(0) rotate(180deg); }
              75% { transform: translateY(50vh) translateX(${-flake.swayAmount}px) rotate(270deg); }
              100% { transform: translateY(100vh) translateX(0) rotate(360deg); }
            }`;
          }
          
          // Has both drift and sway
          const drift20 = driftValue * 0.2;
          const drift40 = driftValue * 0.4;
          const drift60 = driftValue * 0.6;
          const drift80 = driftValue * 0.8;
          const swayHalf = flake.swayAmount * 0.5;
          const driftDirection = flake.driftDirection;
          
          return `@keyframes snowfall-${flake.id} {
            0% { transform: translateY(-100vh) translateX(0) rotate(0deg); }
            20% { transform: translateY(-60vh) translateX(${drift20}vw) translateX(${driftDirection === "right" ? swayHalf : -swayHalf}px) rotate(72deg); }
            40% { transform: translateY(-20vh) translateX(${drift40}vw) rotate(144deg); }
            60% { transform: translateY(20vh) translateX(${drift60}vw) translateX(${driftDirection === "right" ? -swayHalf : swayHalf}px) rotate(216deg); }
            80% { transform: translateY(60vh) translateX(${drift80}vw) rotate(288deg); }
            100% { transform: translateY(100vh) translateX(${driftValue}vw) rotate(360deg); }
          }`;
        }).join('\n')}
      </style>
      <div 
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
      >
        {snowflakes.map((flake) => {
          const position = snowflakePositions.get(flake.id);
          const pushX = position?.pushX || 0;
          const pushY = position?.pushY || 0;

          return (
            <div
              key={flake.id}
              data-snowflake-id={flake.id}
              className="absolute top-0"
              style={{
                left: `${flake.left}%`,
                transform: `translate(${pushX}px, ${pushY}px)`,
                transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "transform",
              }}
            >
              <div
                className="text-foreground/60 select-none"
                style={{
                  fontSize: `${flake.size}px`,
                  opacity: flake.opacity,
                  animation: `snowfall-${flake.id} ${flake.animationDuration}s linear infinite`,
                  animationDelay: `${flake.animationDelay}s`,
                  filter: "drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))",
                }}
              >
                {flake.character}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

