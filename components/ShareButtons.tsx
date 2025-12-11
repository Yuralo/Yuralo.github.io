"use client";

import { Share2, Twitter, Linkedin, Link2, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
}

export function ShareButtons({ title, url, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const fullUrl = typeof window !== "undefined" ? window.location.href : url;

  const shareData = {
    title,
    text: description || title,
    url: fullUrl,
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="flex items-center gap-3 pt-8 border-t border-border">
      <span className="text-sm text-muted-foreground font-mono">Share:</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="p-2 border border-border hover:bg-muted transition-colors"
          aria-label="Share"
          title="Share"
        >
          <Share2 size={16} />
        </button>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 border border-border hover:bg-muted transition-colors"
          aria-label="Share on Twitter"
          title="Share on Twitter"
        >
          <Twitter size={16} />
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 border border-border hover:bg-muted transition-colors"
          aria-label="Share on LinkedIn"
          title="Share on LinkedIn"
        >
          <Linkedin size={16} />
        </a>
        <button
          onClick={handleCopy}
          className="p-2 border border-border hover:bg-muted transition-colors relative"
          aria-label="Copy link"
          title="Copy link"
        >
          {copied ? (
            <Check size={16} className="text-primary" />
          ) : (
            <Link2 size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

