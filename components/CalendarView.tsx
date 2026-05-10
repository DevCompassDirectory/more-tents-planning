import { getProjects } from '@/lib/projects/queries';
import { CalendarClient } from '@/components/CalendarClient';
import { CalendarToolbar } from '@/components/CalendarToolbar';
import { CalendarQuarterView } from '@/components/CalendarQuarterView';
import { CalendarYearView } from '@/components/CalendarYearView';
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
	const email = user?.email ?? '';

	return (
		<>
			<CalendarToolbar
				view={view}
				date={date}
			/>
			{view === 'kwartaal' && (
				<CalendarQuarterView
					date={date}
					projects={projects}
				/>
			)}
			{view === 'jaar' && (
				<CalendarYearView
					date={date}
					projects={projects}
				/>
			)}
			{(view === 'maand' || view === 'week') && (
				<CalendarClient
					projects={projects}
					currentUserEmail={email}
					view={view}
					date={date}
				/>
			)}
		</>
	);
}
