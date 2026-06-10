import ProjectForm from "@/components/admin/project-form";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewProjectPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-semibold">New project</h1>
      <div className="mt-8">
        <ProjectForm error={error} />
      </div>
    </div>
  );
}
