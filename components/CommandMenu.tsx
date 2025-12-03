"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import { Search, FileText, Home, Image, BarChart2, Link as LinkIcon, Laptop, Moon, Sun, Mail } from "lucide-react";

import { type Post } from "@/lib/posts";
import { type Project } from "@/lib/projects";
import { getGitHubRepos, type GitHubRepo } from "@/lib/github";

export function CommandMenu({ posts }: { posts: Post[] }) {
  const [open, setOpen] = React.useState(false);
  const [repos, setRepos] = React.useState<GitHubRepo[]>([]);
  const router = useRouter();
  const { setTheme } = useTheme();

  // Fetch GitHub repos
  React.useEffect(() => {
    async function fetchRepos() {
      const data = await getGitHubRepos();
      setRepos(data);
    }
    fetchRepos();
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const openMenu = () => setOpen(true);

    document.addEventListener("keydown", down);
    document.addEventListener("open-command-menu", openMenu);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-command-menu", openMenu);
    };
  }, []);

  // Prevent scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <Command className="w-full max-w-lg border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden font-mono">
            <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                autoFocus
                placeholder="Type a command or search..."
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
              
              <Command.Group heading="Pages" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/"))}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/blog"))}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <FileText className="h-4 w-4" />
                  <span>Blog</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/projects"))}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Laptop className="h-4 w-4" />
                  <span>Projects</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push("/contact"))}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Mail className="h-4 w-4" />
                  <span>Contact</span>
                </Command.Item>
              </Command.Group>

              <Command.Separator className="my-1 h-px bg-border" />

              <Command.Group heading="Blog Posts" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {posts.map((post) => (
                  <Command.Item
                    key={post.slug}
                    onSelect={() => runCommand(() => router.push(`/blog/${post.slug}`))}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{post.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="my-1 h-px bg-border" />

              <Command.Group heading="Projects" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                {repos.map((repo) => (
                  <Command.Item
                    key={repo.name}
                    onSelect={() => {
                      window.open(repo.html_url, "_blank");
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    keywords={[repo.description || "", repo.language || "", ...repo.topics]}
                  >
                    <Laptop className="h-4 w-4" />
                    <span>{repo.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Separator className="my-1 h-px bg-border" />

              <Command.Group heading="Theme" className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("system"))}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Laptop className="h-4 w-4" />
                  <span>System</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("alternative"))}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Moon className="h-4 w-4" />
                  <span>Alternative Theme</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      )}
    </>
  );
}
