"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Tag, ArrowUpDown, X } from "lucide-react";
import { type Post } from "@/lib/posts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function BlogList({ posts }: { posts: Post[] }) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  
  // Extract all unique tags and count them
  const allTags = useMemo(() => {
    const tags: Record<string, number> = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });
    return Object.entries(tags).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const filteredPosts = posts
    .filter((post) => {
      const matchesSearch = 
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.description.toLowerCase().includes(search.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => post.tags.includes(tag));

      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-8">
      <div className="border border-border p-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
          />
        </div>

        {/* Filters & Sort */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag size={14} />
              <span>Filter by tags:</span>
            </div>
            {selectedTags.length > 0 && (
              <button 
                onClick={() => setSelectedTags([])}
                className="text-xs text-primary hover:underline font-mono"
              >
                Show All Tags
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {allTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs border px-3 py-1.5 transition-all font-mono flex items-center gap-2",
                  selectedTags.includes(tag)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <Tag size={10} className={selectedTags.includes(tag) ? "fill-current" : ""} />
                {tag}
                <span className="opacity-50">({count})</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
              className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-2 w-fit"
            >
              <ArrowUpDown size={12} />
              Sort by Date ({sortOrder === "newest" ? "Newest First" : "Oldest First"})
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <motion.div
                key={post.slug}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link href={`/blog/${post.slug}`} className="block group">
                  <article className="p-6 border border-border bg-card hover:bg-muted/30 transition-colors space-y-3 relative overflow-hidden">
                    {/* Hover accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300" />
                    
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold group-hover:text-primary transition-colors uppercase tracking-tight">
                        {post.title}
                      </h2>
                      <span className="text-xs text-muted-foreground font-mono">{post.date}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{post.description}</p>
                    <div className="flex gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs border border-primary/30 text-primary px-2 py-1 uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-muted-foreground py-10 font-mono"
            >
              No posts found matching your criteria.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
