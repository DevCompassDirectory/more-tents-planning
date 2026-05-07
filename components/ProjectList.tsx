import { getProjects } from '@/lib/projects/queries';
import { ProjectListClient } from '@/components/ProjectListClient';

export async function ProjectList() {
	const projects = await getProjects();
	return <ProjectListClient projects={projects} />;
}
