import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Citation } from "@/components/Citation";
import { References } from "@/components/References";
import { TableOfContents } from "@/components/TableOfContents";
import { CopyCodeButton } from "@/components/CopyCodeButton";
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

  return (
    <>
      {/* TOC - Completely outside container */}

      
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
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="text-primary">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <MDXRemote 
              source={post.content} 
              components={{ 
                Citation: (props: any) => <Citation {...props} references={post.citations} />,
                pre: ({ children, ...props }: any) => {
                  // Extract code from children
                  const code = children?.props?.children || "";
                  return (
                    <div className="relative group">
                      <pre {...props}>{children}</pre>
                      {typeof code === "string" && <CopyCodeButton code={code} />}
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
          </article>
        </div>
      </div>
    </>
  );
}
