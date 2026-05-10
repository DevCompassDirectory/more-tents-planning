import { getProjects } from '@/lib/projects/queries';
import { CalendarClient } from '@/components/CalendarClient';
import { CalendarToolbar } from '@/components/CalendarToolbar';
import { createClient } from '@/lib/supabase/server';
import type { CalendarView as CalendarViewId } from '@/lib/planning/calendar';

export async function CalendarView({
	view,
	date,
}: {
	view: CalendarViewId;
	date: string;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const projects = await getProjects();
	return (
		<>
			<CalendarToolbar
				view={view}
				date={date}
			/>
			<CalendarClient
				projects={projects}
				currentUserEmail={user?.email ?? ''}
				view={view}
				date={date}
			/>
		</>
	);
}
