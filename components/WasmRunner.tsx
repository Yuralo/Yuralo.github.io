"use client";

import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface WasmRunnerProps {
  scriptPath: string;
  args?: string[];
}

declare global {
  interface Window {
    Module: any;
  }
}

export function WasmRunner({ scriptPath, args = [] }: WasmRunnerProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of output
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const loadWasm = () => {
    if (isLoaded) return;

    // Reset output and show terminal
    setOutput(["⚡ Loading WebAssembly environment..."]);
    setShowOutput(true);

    // Define Module globally as expected by Emscripten
    // Security note: WASM runs in a sandboxed environment with limited access.
    // Only load WASM files from trusted sources that you've compiled yourself.
    window.Module = {
      print: (text: string) => {
        setOutput((prev) => [...prev, text]);
      },
      printErr: (text: string) => {
        setOutput((prev) => [...prev, `⚠️ ${text}`]);
      },
      onRuntimeInitialized: () => {
        setOutput((prev) => [...prev, "✓ Runtime initialized. Ready to execute."]);
        setIsLoaded(true);
      },
    };

    // Load the script
    const script = document.createElement("script");
    script.src = scriptPath;
    script.async = true;
    document.body.appendChild(script);
  };

  const runProgram = () => {
    if (!isLoaded) {
      loadWasm();
      return;
    }

    setIsRunning(true);
    setShowOutput(true);
    setOutput((prev) => [...prev, "▶ Running program..."]);
    
    try {
      // Emscripten's callMain executes the main function
      if (window.Module && window.Module.callMain) {
        window.Module.callMain(args);
      } else {
        setOutput((prev) => [...prev, "❌ Error: Module not ready or callMain not found."]);
      }
    } catch (e: any) {
      setOutput((prev) => [...prev, `❌ Error: ${e.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setOutput([]);
    setShowOutput(false);
  };

  return (
    <div className="my-8 rounded-lg border-2 border-primary/20 bg-background overflow-hidden shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-card">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-primary" />
          <span className="text-sm font-mono text-foreground">
            {scriptPath.split('/').pop()?.replace('.js', '.wasm')}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
            title="Clear Output"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={runProgram}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-mono rounded hover:bg-primary/90 transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
          >
            <Play size={14} />
            {isLoaded ? "RUN" : "LOAD & RUN"}
          </button>
        </div>
      </div>

      {/* Terminal Output - Collapsible */}
      <div className="bg-muted/30">
        <button
          onClick={() => setShowOutput(!showOutput)}
          className="w-full px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between hover:bg-muted/70 transition-colors"
        >
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Terminal Output</span>
          {showOutput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showOutput && (
          <div 
            ref={outputRef}
            className="p-4 h-64 overflow-y-auto font-mono text-sm"
          >
            {output.length === 0 ? (
              <span className="text-muted-foreground italic">Ready to execute. Click RUN to start...</span>
            ) : (
              output.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap break-all py-0.5 text-foreground">
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
