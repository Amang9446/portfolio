import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/project-form";
import { getDbProjectById } from "@/lib/projects";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditProjectPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const project = await getDbProjectById(id);
  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Edit project</h1>
      <div className="mt-8">
        <ProjectForm project={project} error={error} />
      </div>
    </div>
  );
}
