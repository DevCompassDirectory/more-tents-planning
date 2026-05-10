import { Tabs } from '@/components/Tabs';
import { ProjectList } from '@/components/ProjectList';
import { CalendarView } from '@/components/CalendarView';
import { PrintView } from '@/components/PrintView';
import { createClient } from '@/lib/supabase/server';
import { getProjects } from '@/lib/projects/queries';
import { unseenProjects } from '@/lib/projects/seen';
import type { Project } from '@/lib/types/database';
import { parseCalendarView, parseCalendarDate } from '@/lib/planning/calendar';

type Tab = 'kalender' | 'lijst' | 'print';

function parseTab(value: string | undefined): Tab {
	if (value === 'lijst') return 'lijst';
	if (value === 'print') return 'print';
	return 'kalender';
}

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string; view?: string; date?: string }>;
}) {
	const params = await searchParams;
	const activeTab = parseTab(params.tab);
	const calendarView = parseCalendarView(params.view);
	const calendarDate = parseCalendarDate(params.date);
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	const projects = await getProjects();
	const unread = unseenProjects(projects, user?.email ?? '');

	return (
		<>
			<Tabs active={activeTab} />
			<main className='max-w-6xl mx-auto px-6 py-8'>
				{activeTab !== 'print' && unread.length > 0 && (
					<UnseenBanner projects={unread} />
				)}
				{activeTab === 'kalender' && (
					<CalendarView
						view={calendarView}
						date={calendarDate}
					/>
				)}
				{activeTab === 'lijst' && <ProjectList />}
				{activeTab === 'print' && <PrintView />}
			</main>
		</>
	);
}

function UnseenBanner({ projects }: { projects: Project[] }) {
	return (
		<div className='bg-orange-50 border border-orange-300 rounded-xl p-4 mb-5 flex gap-3 items-start'>
			<div className='text-xl leading-none'>⚠</div>
			<div className='flex-1'>
				<div className='font-semibold text-orange-800 mb-1'>
					{projects.length} project
					{projects.length > 1 ? 'en zijn' : ' is'} gewijzigd sinds je
					laatste bezoek
				</div>
				{projects.map((p) => (
					<div
						key={p.id}
						className='text-sm text-orange-700'
					>
						• {p.klant_naam || 'Naamloos'}
						{p.offerte_nr ? ` (${p.offerte_nr})` : ''}
					</div>
				))}
			</div>
		</div>
	);
}
