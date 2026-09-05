import PostForm from "@/components/admin/post-form";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewPostPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-semibold">New post</h1>
      <div className="mt-8">
        <PostForm error={error} />
      </div>
    </div>
  );
}
