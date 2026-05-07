import { getProjects } from '@/lib/projects/queries';
import { ProjectListClient } from '@/components/ProjectListClient';
import { createClient } from '@/lib/supabase/server';

export async function ProjectList() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const projects = await getProjects();
	return (
		<ProjectListClient
			projects={projects}
			currentUserEmail={user?.email ?? ''}
		/>
	);
}
