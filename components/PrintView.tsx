import { getProjects } from '@/lib/projects/queries';
import { PrintViewClient } from '@/components/PrintViewClient';

export async function PrintView() {
	const projects = await getProjects();
	return <PrintViewClient projects={projects} />;
}
