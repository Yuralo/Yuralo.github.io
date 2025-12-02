"use client";

import { Github, ExternalLink, Search, Tag } from "lucide-react";
import Link from "next/link";
import { getGitHubRepos, type GitHubRepo } from "@/lib/github";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  useEffect(() => {
    async function fetchRepos() {
      const data = await getGitHubRepos();
      setRepos(data);
      setLoading(false);
    }
    fetchRepos();
  }, []);

  // Extract all unique languages
  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach(repo => {
      if (repo.language) langs.add(repo.language);
      repo.topics.forEach(topic => langs.add(topic));
    });
    return Array.from(langs).sort();
  }, [repos]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  // Filter repos
  const filteredRepos = useMemo(() => {
    return repos.filter(repo => {
      const matchesSearch =
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        (repo.description?.toLowerCase() || "").includes(search.toLowerCase());

      const matchesLanguage =
        selectedLanguages.length === 0 ||
        selectedLanguages.some(lang =>
          repo.language === lang || repo.topics.includes(lang)
        );

      return matchesSearch && matchesLanguage;
    });
  }, [repos, search, selectedLanguages]);

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-5xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-4 uppercase tracking-tight">Projects</h1>
        <p className="text-muted-foreground">My open-source work and experiments on GitHub.</p>
      </div>

      {/* Search and Filter */}
      <div className="border border-border p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
          />
        </div>

        {/* Language Filter */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag size={14} />
              <span>Filter by language/topic:</span>
            </div>
            {selectedLanguages.length > 0 && (
              <button
                onClick={() => setSelectedLanguages([])}
                className="text-xs text-primary hover:underline font-mono"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {allLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={cn(
                  "text-xs border px-3 py-1.5 transition-all font-mono",
                  selectedLanguages.includes(lang)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredRepos.length > 0 ? (
            filteredRepos.map((repo) => (
              <motion.div
                key={repo.name}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border border-border bg-card p-6 hover:border-primary transition-colors group relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Github className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors uppercase pr-8">
                    {repo.name}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6 flex-1">
                    {repo.description || "No description available."}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {repo.language && (
                      <span className="text-xs border border-border px-2 py-1 text-muted-foreground font-mono">
                        {repo.language}
                      </span>
                    )}
                    {repo.topics.slice(0, 3).map(topic => (
                      <span key={topic} className="text-xs border border-primary/30 text-primary px-2 py-1 uppercase tracking-wider">
                        {topic}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-auto">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Github size={16} /> Code
                    </a>
                    {repo.homepage && (
                      <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <ExternalLink size={16} /> Demo
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-10 font-mono col-span-2"
            >
              No projects found matching your criteria.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
