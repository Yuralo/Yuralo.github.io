"use client";

import { Github, Star, GitFork, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

interface GitHubRepoProps {
  owner: string;
  repo: string;
  description?: string;
  className?: string;
}

interface RepoData {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  homepage?: string | null;
}

export function GitHubRepo({ owner, repo, description, className = "" }: GitHubRepoProps) {
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRepo() {
      try {
        setLoading(true);
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch repo: ${response.statusText}`);
        }
        const data = await response.json();
        setRepoData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch repository");
        // Set fallback data
        setRepoData({
          name: repo,
          full_name: `${owner}/${repo}`,
          description: description || null,
          html_url: `https://github.com/${owner}/${repo}`,
          stargazers_count: 0,
          forks_count: 0,
          language: null,
          topics: [],
          homepage: null,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRepo();
  }, [owner, repo, description]);

  if (loading) {
    return (
      <div className={`border border-border bg-card p-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-[18px] h-[18px] border border-border bg-background animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 bg-background animate-pulse" />
            <div className="h-3 w-48 bg-background animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!repoData) {
    return null;
  }

  return (
    <div 
      className={`border border-border bg-card transition-all duration-300 group hover:border-primary/30 not-prose ${className}`}
      style={{ 
        borderBottomWidth: '2px',
        borderBottomStyle: 'dashed',
        borderBottomColor: 'var(--primary)',
        backgroundColor: 'var(--card)',
      }}
    >
      <a
        href={repoData.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-2 transition-all duration-300 hover:bg-muted/50 relative no-underline"
        style={{ 
          textDecoration: 'none',
          borderBottom: 'none',
          color: 'inherit',
          backgroundColor: 'transparent',
        }}
      >
        {/* GitHub logo in top-right corner */}
        <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-80 transition-opacity duration-300">
          <Github 
            size={14} 
            className="text-primary"
          />
        </div>

        {/* Repo name */}
        <div className="mb-1 pr-8">
          <h3 className="text-base font-bold text-foreground truncate m-0 leading-tight">
            {repoData.full_name}
          </h3>
        </div>

        {/* Description */}
        {repoData.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
            {repoData.description}
          </p>
        )}

        {/* Tags and stats row */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {repoData.language && (
              <span 
                className="text-[10px] border border-primary/40 px-1.5 py-0.5 font-mono text-primary bg-primary/10"
              >
                {repoData.language}
              </span>
            )}
            {repoData.topics && repoData.topics.length > 0 && repoData.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="text-[10px] border border-primary/40 px-1.5 py-0.5 uppercase tracking-wider text-primary bg-primary/10"
              >
                {topic}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-shrink-0">
            {repoData.stargazers_count > 0 && (
              <div className="flex items-center gap-1">
                <Star size={10} className="fill-current" />
                <span>{repoData.stargazers_count.toLocaleString()}</span>
              </div>
            )}
            {repoData.forks_count > 0 && (
              <div className="flex items-center gap-1">
                <GitFork size={10} />
                <span>{repoData.forks_count.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* View on GitHub link at bottom */}
        <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground  opacity-100 ">
          <span>View on GitHub</span>
          <ExternalLink size={9} className="shrink-0" />
        </div>
      </a>
    </div>
  );
}

// Get color for tags/topics
function getTagColor(tag: string): string {
  const tagLower = tag.toLowerCase();
  
  // Common tag colors
  const tagColors: Record<string, string> = {
    // ML/AI tags
    'machine-learning': '#ff6b6b',
    'deep-learning': '#4ecdc4',
    'neural-network': '#45b7d1',
    'pytorch': '#ee4c2c',
    'tensorflow': '#ff6f00',
    'transformers': '#ffd93d',
    'nlp': '#6c5ce7',
    'computer-vision': '#a29bfe',
    
    // Web tags
    'react': '#61dafb',
    'nextjs': '#000000',
    'typescript': '#3178c6',
    'javascript': '#f1e05a',
    'nodejs': '#339933',
    'web': '#4a90e2',
    
    // Python tags
    'python': '#3572A5',
    'jupyter': '#DA5B0B',
    'data-science': '#00a8ff',
    
    // Other
    'rust': '#dea584',
    'go': '#00ADD8',
    'cpp': '#f34b7d',
    'c': '#555555',
  };
  
  // Check exact match first
  if (tagColors[tagLower]) {
    return tagColors[tagLower];
  }
  
  // Check partial matches
  for (const [key, color] of Object.entries(tagColors)) {
    if (tagLower.includes(key) || key.includes(tagLower)) {
      return color;
    }
  }
  
  // Default: generate a color based on tag hash
  return generateColorFromString(tag);
}

// Generate a consistent color from a string
function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a color in the blue-green-purple range
  const hue = Math.abs(hash % 240) + 180; // 180-420, wrapping to 0-60 and 180-240
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 50 + (Math.abs(hash) % 15); // 50-65%
  
  return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
}

// Common language colors (simplified - you can expand this)
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#FA7343",
    Kotlin: "#A97BFF",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    "Jupyter Notebook": "#DA5B0B",
  };
  return colors[language] || "var(--primary)";
}

