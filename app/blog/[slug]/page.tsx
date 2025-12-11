import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { Citation } from "@/components/Citation";
import { References } from "@/components/References";
import { TableOfContents } from "@/components/TableOfContents";
import { CopyCodeButton } from "@/components/CopyCodeButton";
import { BlogImage } from "@/components/BlogImage";
import { ShareButtons } from "@/components/ShareButtons";
import { FocusMode } from "@/components/FocusMode";
import { GitHubRepo } from "@/components/GitHubRepo";
import rehypePrettyCode from "rehype-pretty-code";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Extract headings from markdown content
function extractHeadings(content: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { id: string; text: string; level: number }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    headings.push({ id, text, level });
  }

  return headings;
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || post.public === false) {
    notFound();
  }

  const headings = extractHeadings(post.content);
  const allPosts = getAllPosts();
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug && p.public)
    .filter((p) => 
      (p.tags || []).some((tag) => (post.tags || []).includes(tag))
    )
    .slice(0, 3);

  return (
    <>
      <FocusMode />
      
      <div className="py-10 w-full">
        <div className="max-w-4xl mx-auto px-4 relative">
          {/* TOC - Positioned absolutely to the left on desktop, rendered for mobile toggle */}
          <aside className="xl:absolute xl:left-[-280px] xl:top-0 xl:w-64 xl:h-full">
            <div className="xl:pt-1">
              <TableOfContents headings={headings} />
            </div>
          </aside>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={16} /> Back to Blog
          </Link>

          <article className="prose prose-invert prose-lg max-w-none">
            <div className="mb-8 border-b border-border pb-8">
              <h1 className="mb-2 break-words">{post.title}</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-muted-foreground text-sm">
                <time>{post.date}</time>
                {post.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{post.readingTime} min read</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(post.tags || []).map((tag) => (
                    <span key={tag} className="text-primary">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <MDXRemote 
              source={post.content} 
              components={{ 
                Citation: (props: any) => <Citation {...props} references={post.citations} />,
                BlogImage: (props: any) => <BlogImage {...props} />,
                GitHubRepo: (props: any) => <GitHubRepo {...props} />,
                img: ({ src, alt, title, width, className, ...props }: any) => (
                  <BlogImage 
                    src={src || ""} 
                    alt={alt || ""} 
                    title={title} 
                    width={width}
                    className={className}
                  />
                ),
                h2: ({ children, ...props }: any) => {
                  const getText = (node: any): string => {
                    if (typeof node === "string" || typeof node === "number") return String(node);
                    if (Array.isArray(node)) return node.map(getText).join("");
                    if (node && typeof node === "object") {
                      if (node.props?.children) return getText(node.props.children);
                      if (node.children) return getText(node.children);
                    }
                    return "";
                  };
                  const text = getText(children).trim();
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  return id ? <h2 id={id} {...props}>{children}</h2> : <h2 {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }: any) => {
                  const getText = (node: any): string => {
                    if (typeof node === "string" || typeof node === "number") return String(node);
                    if (Array.isArray(node)) return node.map(getText).join("");
                    if (node && typeof node === "object") {
                      if (node.props?.children) return getText(node.props.children);
                      if (node.children) return getText(node.children);
                    }
                    return "";
                  };
                  const text = getText(children).trim();
                  const id = text
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  return id ? <h3 id={id} {...props}>{children}</h3> : <h3 {...props}>{children}</h3>;
                },
                pre: ({ children, ...props }: any) => {
                  return (
                    <div className="relative group">
                      <pre {...props}>{children}</pre>
                      <CopyCodeButton />
                    </div>
                  );
                },
              }}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkMath],
                  rehypePlugins: [
                    rehypeKatex,
                    [
                      rehypePrettyCode,
                      {
                        theme: "github-dark",
                        keepBackground: true,
                        onVisitLine(node: any) {
                          if (node.children.length === 0) {
                            node.children = [{ type: "text", value: " " }];
                          }
                        },
                      },
                    ],
                  ],
                },
              }}
            />
            
            <References citations={post.citations || {}} />
            
            <ShareButtons 
              title={post.title}
              url={`/blog/${slug}`}
              description={post.description}
            />
          </article>

          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-border">
              <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/blog/${relatedPost.slug}`}
                    className="group border border-border p-4 hover:border-primary transition-colors"
                  >
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {relatedPost.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <time>{relatedPost.date}</time>
                      {relatedPost.readingTime && (
                        <>
                          <span>•</span>
                          <span>{relatedPost.readingTime} min</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
