import { getAllPosts } from "@/lib/posts";
import { BlogList } from "@/components/BlogList";

// Disable static generation in development to allow hot reloading
export const dynamic = process.env.NODE_ENV === 'production' ? 'auto' : 'force-dynamic';

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-8 py-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter">Blog</h1>
        <p className="text-xl text-muted-foreground">
          Thoughts, tutorials, and notes on software development.
        </p>
      </div>

      <BlogList posts={posts} />
    </div>
  );
}
