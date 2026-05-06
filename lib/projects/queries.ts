import { createClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/types/database';

export async function getProjects(): Promise<Project[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from('projects')
		.select('*')
		.order('datum_opbouw', { ascending: true, nullsFirst: false });

	if (error) {
		console.error('Failed to fetch projects:', error);
		return [];
	}

	return (data ?? []) as Project[];
}
