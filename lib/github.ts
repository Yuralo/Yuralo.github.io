export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionYear {
  year: number;
  total: number;
  range: {
    start: string;
    end: string;
  };
}

export interface GitHubContributions {
  total: {
    [year: number]: number;
  };
  contributions: Array<{
    date: string;
    count: number;
    level: 0 | 1 | 2 | 3 | 4;
  }>;
}

export interface GitHubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  topics: string[];
  homepage?: string;
}

const USERNAME = "yuralo"; // Replace with actual username if different

export async function getGitHubContributions(): Promise<GitHubContributions | null> {
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`);
    if (!res.ok) throw new Error("Failed to fetch contributions");
    return res.json();
  } catch (error) {
    console.error("Error fetching GitHub contributions:", error);
    return null;
  }
}

export interface GitHubUser {
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

export async function getUserStats(): Promise<GitHubUser | null> {
  try {
    const res = await fetch(`https://api.github.com/users/${USERNAME}`);
    if (!res.ok) throw new Error("Failed to fetch user stats");
    return res.json();
  } catch (error) {
    console.error("Error fetching GitHub user stats:", error);
    return null;
  }
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
  try {
    const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error("Failed to fetch repos");
    return res.json();
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return [];
  }
}
