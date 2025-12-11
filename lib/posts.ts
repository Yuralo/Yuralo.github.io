import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/posts");

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  citations?: Record<string, string>;
  content: string;
  public?: boolean; // Defaults to true if not specified
  readingTime?: number; // Estimated reading time in minutes
};

// Calculate reading time based on average reading speed (200 words per minute)
export function calculateReadingTime(content: string): number {
  // Remove markdown syntax, code blocks, and HTML tags
  const plainText = content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]+`/g, "") // Remove inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Convert links to text
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "") // Remove images
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/[#*_~`]/g, "") // Remove markdown formatting
    .trim();
  
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
  return Math.max(1, readingTime); // At least 1 minute
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title,
        date: data.date,
        description: data.description,
        tags: data.tags || [],
        citations: data.citations || {},
        content,
        public: data.public !== undefined ? data.public : true, // Default to true
        readingTime: calculateReadingTime(content),
      };
    })
    .filter((post) => post.public); // Only return public posts

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // 1. Convert Obsidian-style image links ![[image.png]] to JSX component
    let processedContent = content.replace(
      /!\[\[(.*?)\]\]/g,
      (match, fileName) => {
        let cleanFileName = fileName.trim();
        if (!cleanFileName.match(/\.[a-zA-Z0-9]+$/)) {
          cleanFileName += ".png";
        }
        const encodedFileName = encodeURIComponent(cleanFileName);
        const escapedAlt = fileName.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `\n\n<BlogImage src="/images/posts/${slug}/${encodedFileName}" alt="${escapedAlt}" />\n\n`;
      }
    );

    // 2. Auto-map relative image paths to blog-specific directory
    // Matches ![alt](image.png) or ![alt](spm.png) but not ![alt](/absolute/path.png)
    processedContent = processedContent.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      (match, altText, imagePath) => {
        let finalPath = imagePath;
        
        // If path doesn't start with /, map it to blog directory
        if (!imagePath.startsWith("/")) {
          if (imagePath.trim()) {
            const encodedPath = encodeURIComponent(imagePath);
            finalPath = `/images/posts/${slug}/${encodedPath}`;
          }
        }
        
        // Convert to JSX component to prevent MDX from wrapping in <p> tags
        // This prevents hydration errors (figure cannot be inside p)
        const escapedAlt = altText.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return `\n\n<BlogImage src="${finalPath}" alt="${escapedAlt}" />\n\n`;
      }
    );

    // 3. Convert citations [1, 2, 3] to <Citation ids={["1", "2", "3"]} />
    // Matches [1], [1, 2], [1, 2, 3] etc.
    processedContent = processedContent.replace(
      /\[(\d+(?:,\s*\d+)*)\]/g,
      (match, idsString) => {
        // Split by comma, trim whitespace, and create array string
        const ids = idsString.split(",").map((id: string) => `"${id.trim()}"`).join(", ");
        return `<Citation ids={[${ids}]} />`;
      }
    );

    return {
      slug,
      title: data.title,
      date: data.date,
      description: data.description,
      tags: data.tags || [],
      citations: data.citations || {},
      content: processedContent,
      public: data.public !== undefined ? data.public : true, // Default to true
      readingTime: calculateReadingTime(content),
    };
  } catch (e) {
    return null;
  }
}
