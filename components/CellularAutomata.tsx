"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const CELL_SIZE = 10;

type AutomataType = "2d" | "1d";

export function CellularAutomata() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<AutomataType>("2d");
  const [colorKey, setColorKey] = useState(0);
  
  useEffect(() => {
    const handleColorChange = () => {
      setColorKey(prev => prev + 1);
    };
    
    window.addEventListener("color-changed", handleColorChange);
    return () => window.removeEventListener("color-changed", handleColorChange);
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="flex gap-2 border border-border bg-background w-fit">
        <button
          onClick={() => setActiveTab("2d")}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all uppercase tracking-wider border-r border-border",
            activeTab === "2d"
              ? "bg-primary text-primary-foreground"
              : "text-foreground/70 hover:bg-primary/10"
          )}
        >
          Game of Life
        </button>
        <button
          onClick={() => setActiveTab("1d")}
          className={cn(
            "px-6 py-3 text-sm font-bold transition-all uppercase tracking-wider",
            activeTab === "1d"
              ? "bg-primary text-primary-foreground"
              : "text-foreground/70 hover:bg-primary/10"
          )}
        >
          1D Automata
        </button>
      </div>

      {/* Content */}
      {activeTab === "2d" && <GameOfLife key={`${theme}-${colorKey}`} />}
      {activeTab === "1d" && <WolframAutomata key={`${theme}-${colorKey}`} />}
    </div>
  );
}

function GameOfLife() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [density, setDensity] = useState(0.3);
  const [gridSize, setGridSize] = useState(50);
  const [generation, setGeneration] = useState(0);

  const gridRef = useRef<number[]>([]);
  const animationRef = useRef<number>(0);

  const getColor = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue("--primary").trim();
    return primaryColor || "#3b82f6";
  }, []);

  const initializeGrid = useCallback(() => {
    const totalCells = gridSize * gridSize;
    const newGrid = new Array(totalCells).fill(0).map(() => (Math.random() < density ? 1 : 0));
    gridRef.current = newGrid;
    setGeneration(0);
    drawGrid();
  }, [gridSize, density]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getColor();

    const grid = gridRef.current;
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        const x = (i % gridSize) * CELL_SIZE;
        const y = Math.floor(i / gridSize) * CELL_SIZE;
        ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
      }
    }
  }, [gridSize, getColor]);

  const computeNextGen = useCallback(() => {
    const grid = gridRef.current;
    const nextGrid = new Array(grid.length).fill(0);

    for (let i = 0; i < grid.length; i++) {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = (x + dx + gridSize) % gridSize;
          const ny = (y + dy + gridSize) % gridSize;
          neighbors += grid[ny * gridSize + nx];
        }
      }

      const cell = grid[i];
      if (cell === 1 && (neighbors === 2 || neighbors === 3)) {
        nextGrid[i] = 1;
      } else if (cell === 0 && neighbors === 3) {
        nextGrid[i] = 1;
      }
    }

    gridRef.current = nextGrid;
    setGeneration((prev) => prev + 1);
    drawGrid();
  }, [gridSize, drawGrid]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cellX = Math.floor(x / CELL_SIZE);
    const cellY = Math.floor(y / CELL_SIZE);
    const index = cellY * gridSize + cellX;

    if (index >= 0 && index < gridRef.current.length) {
      gridRef.current[index] = gridRef.current[index] ? 0 : 1;
      drawGrid();
    }
  }, [gridSize, drawGrid]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        computeNextGen();
        animationRef.current = window.setTimeout(() => {
          requestAnimationFrame(loop);
        }, 1000 - speed * 9);
      };
      loop();
    } else {
      clearTimeout(animationRef.current);
    }
    return () => clearTimeout(animationRef.current);
  }, [isPlaying, speed, computeNextGen]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start p-6 border border-border bg-card">
      <div className="flex-1 w-full flex justify-center bg-background p-4 border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={gridSize * CELL_SIZE}
          height={gridSize * CELL_SIZE}
          className="max-w-full h-auto cursor-pointer"
          onClick={handleCanvasClick}
          title="Click to toggle cells"
        />
      </div>

      <div className="w-full md:w-64 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-primary uppercase">Game of Life</h3>
          <p className="text-sm text-muted-foreground">
            Click cells to toggle. Conway's classic.
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Gen: {generation}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground font-mono uppercase">Speed</label>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground font-mono uppercase">Grid Size</label>
            <input
              type="range"
              min="20"
              max="100"
              value={gridSize}
              onChange={(e) => {
                setGridSize(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-primary h-1.5 bg-muted appearance-none cursor-pointer"
            />
          </div>

           <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground font-mono uppercase">Density</label>
            <input
              type="range"
              min="1"
              max="99"
              value={density * 100}
              onChange={(e) => {
                setDensity(Number(e.target.value) / 100);
                setIsPlaying(false);
              }}
              className="w-full accent-primary h-1.5 bg-muted appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition-opacity font-mono uppercase"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Start"}
          </button>
          
          <button
            onClick={initializeGrid}
            className="p-2 bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reset / Randomize"
          >
            <RefreshCw size={16} />
          </button>

           <button
            onClick={() => {
                gridRef.current = new Array(gridSize * gridSize).fill(0);
                setGeneration(0);
                drawGrid();
                setIsPlaying(false);
            }}
            className="p-2 bg-muted text-muted-foreground hover:text-red-500 transition-colors"
            title="Clear"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function WolframAutomata() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [rule, setRule] = useState(30);
  const [generation, setGeneration] = useState(0);
  const [initPattern, setInitPattern] = useState<"center" | "random" | "all" | "alternating">("center");

  const gridRef = useRef<number[][]>([]);
  const animationRef = useRef<number>(0);
  const canvasWidth = 500;
  const canvasHeight = 300;
  const cellSize = 5;
  const cols = Math.floor(canvasWidth / cellSize);
  const rows = Math.floor(canvasHeight / cellSize);

  const getColor = useCallback(() => {
    const computedStyle = getComputedStyle(document.documentElement);
    const primaryColor = computedStyle.getPropertyValue("--primary").trim();
    return primaryColor || "#3b82f6";
  }, []);

  const getRuleset = useCallback((ruleNumber: number) => {
    const ruleset: { [key: string]: number } = {};
    const binary = ruleNumber.toString(2).padStart(8, "0");
    const patterns = ["111", "110", "101", "100", "011", "010", "001", "000"];
    patterns.forEach((pattern, i) => {
      ruleset[pattern] = parseInt(binary[i]);
    });
    return ruleset;
  }, []);

  const initializeGrid = useCallback(() => {
    let firstRow = new Array(cols).fill(0);
    
    switch (initPattern) {
      case "center":
        firstRow[Math.floor(cols / 2)] = 1;
        break;
      case "random":
        firstRow = firstRow.map(() => Math.random() > 0.5 ? 1 : 0);
        break;
      case "all":
        firstRow = new Array(cols).fill(1);
        break;
      case "alternating":
        firstRow = firstRow.map((_, i) => i % 2);
        break;
    }
    
    gridRef.current = [firstRow];
    setGeneration(0);
    drawGrid();
  }, [cols, initPattern]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getColor();

    const grid = gridRef.current;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === 1) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize - 1, cellSize - 1);
        }
      }
    }
  }, [getColor, cellSize]);

  const computeNextRow = useCallback(() => {
    const grid = gridRef.current;
    if (grid.length >= rows) {
      setIsPlaying(false);
      return;
    }

    const currentRow = grid[grid.length - 1];
    const nextRow = new Array(cols).fill(0);
    const ruleset = getRuleset(rule);

    for (let i = 0; i < cols; i++) {
      const left = currentRow[(i - 1 + cols) % cols];
      const center = currentRow[i];
      const right = currentRow[(i + 1) % cols];
      const pattern = `${left}${center}${right}`;
      nextRow[i] = ruleset[pattern] || 0;
    }

    gridRef.current = [...grid, nextRow];
    setGeneration((prev) => prev + 1);
    drawGrid();
  }, [cols, rows, rule, getRuleset, drawGrid]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        computeNextRow();
        animationRef.current = window.setTimeout(() => {
          requestAnimationFrame(loop);
        }, 1000 - speed * 9);
      };
      loop();
    } else {
      clearTimeout(animationRef.current);
    }
    return () => clearTimeout(animationRef.current);
  }, [isPlaying, speed, computeNextRow]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start p-6 border border-border bg-card">
      <div className="flex-1 w-full flex justify-center bg-background p-4 border border-border overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="max-w-full h-auto"
        />
      </div>

      <div className="w-full md:w-64 space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-primary uppercase">1D Automata</h3>
          <p className="text-sm text-muted-foreground">
            Elementary cellular automata by Wolfram.
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-mono">Row: {generation}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground font-mono uppercase">
              Wolfram Rule: {rule}
            </label>
            <input
              type="range"
              min="0"
              max="255"
              value={rule}
              onChange={(e) => {
                setRule(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-primary h-1.5 bg-muted appearance-none cursor-pointer"
            />
            <p className="text-xs text-muted-foreground font-mono">
              Binary: {rule.toString(2).padStart(8, "0")}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground font-mono uppercase">Initial Pattern</label>
            <select
              value={initPattern}
              onChange={(e) => {
                setInitPattern(e.target.value as any);
                setIsPlaying(false);
              }}
              className="w-full bg-background border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="center">Single Center</option>
              <option value="random">Random</option>
              <option value="all">All Filled</option>
              <option value="alternating">Alternating</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground font-mono uppercase">Speed</label>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition-opacity font-mono uppercase"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Start"}
          </button>
          
          <button
            onClick={initializeGrid}
            className="p-2 bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Reset"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
