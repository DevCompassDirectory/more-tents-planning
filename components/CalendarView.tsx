import { getProjects } from '@/lib/projects/queries';
import { CalendarClient } from '@/components/CalendarClient';
import { createClient } from '@/lib/supabase/server';

export async function CalendarView() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const projects = await getProjects();
	return (
		<CalendarClient
			projects={projects}
			currentUserEmail={user?.email ?? ''}
		/>
	);
}
