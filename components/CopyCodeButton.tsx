"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyCodeButtonProps {
  code?: string;
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    let codeText = code;
    
    // If no code prop provided, find it from the DOM
    if (!codeText) {
      const button = e.currentTarget;
      const preElement = button.closest(".group")?.querySelector("pre");
      if (preElement) {
        const codeElement = preElement.querySelector("code");
        codeText = codeElement?.textContent || preElement.textContent || "";
      }
    }
    
    if (!codeText) return;
    
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = codeText;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-2 rounded bg-muted/50 hover:bg-muted border border-border/50 hover:border-primary/50 transition-all opacity-0 group-hover:opacity-100 z-10"
      title="Copy code"
      aria-label="Copy code to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} className="text-muted-foreground" />
      )}
    </button>
  );
}
