import { getProjects } from '@/lib/projects/queries';
import { createClient } from '@/lib/supabase/server';
import {
	type GanttView as GanttViewId,
	ganttPeriodRange,
	projectInPeriod,
	sortProjectsByStart,
} from '@/lib/planning/gantt';
import { GanttToolbar } from '@/components/GanttToolbar';
import { GanttClient } from '@/components/GanttClient';

export async function GanttView({
	view,
	date,
	statussen,
}: {
	view: GanttViewId;
	date: string;
	statussen: string[];
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const projects = await getProjects();
	const period = ganttPeriodRange(view, date);

	const filtered = projects
		.filter((p) => projectInPeriod(p, period.from, period.to))
		.filter(
			(p) => statussen.length === 0 || statussen.includes(p.status ?? ''),
		);
	const sorted = sortProjectsByStart(filtered);

	return (
		<>
			<GanttToolbar
				view={view}
				date={date}
				statussen={statussen}
			/>
			<GanttClient
				projects={sorted}
				days={period.days}
				view={view}
				currentUserEmail={user?.email ?? ''}
			/>
		</>
	);
}
