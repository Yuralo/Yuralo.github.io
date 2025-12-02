import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Citation } from "@/components/Citation";
import rehypePrettyCode from "rehype-pretty-code";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="py-10 max-w-3xl mx-auto w-full">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Blog
      </Link>

      <article className="prose prose-invert prose-lg max-w-none">
        <div className="mb-8 border-b border-border pb-8">
          <h1 className="mb-2">{post.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <time>{post.date}</time>
            <div className="flex gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="text-primary">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
        
        <MDXRemote 
          source={post.content} 
          components={{ Citation }}
          options={{
            mdxOptions: {
              rehypePlugins: [
                [
                  rehypePrettyCode,
                  {
                    theme: "github-dark",
                    keepBackground: true,
                    onVisitLine(node: any) {
                      // Prevent lines from collapsing in `display: grid` mode, and allow empty
                      // lines to be copy/pasted
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
      </article>
    </div>
  );
}
