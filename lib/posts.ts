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
};

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

    // 1. Convert Obsidian-style image links ![[image.png]] to standard Markdown
    let processedContent = content.replace(
      /!\[\[(.*?)\]\]/g,
      (match, fileName) => {
        let cleanFileName = fileName.trim();
        if (!cleanFileName.match(/\.[a-zA-Z0-9]+$/)) {
          cleanFileName += ".png";
        }
        const encodedFileName = encodeURIComponent(cleanFileName);
        return `![${fileName}](/images/posts/${slug}/${encodedFileName})`;
      }
    );

    // 2. Convert citations [1, 2, 3] to <Citation ids={["1", "2", "3"]} />
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
    };
  } catch (e) {
    return null;
  }
}
