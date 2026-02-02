import { getAllPosts } from "@/lib/posts";
import { BlogList } from "@/components/BlogList";

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-8 py-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter">Blog</h1>
        <p className="text-xl text-muted-foreground">
          Thoughts, and notes on machine learning, deep learning, and other things.
        </p>
      </div>

      <BlogList posts={posts} />
    </div>
  );
}
