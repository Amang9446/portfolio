import { notFound } from "next/navigation";
import PostForm from "@/components/admin/post-form";
import { getPostById } from "@/lib/posts";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditPostPage({ params, searchParams }: PageProps) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit post</h1>
      <div className="mt-8">
        <PostForm post={post} error={error} />
      </div>
    </div>
  );
}
