import { Tabs } from '@/components/Tabs';
import { ProjectList } from '@/components/ProjectList';
import { createClient } from '@/lib/supabase/server';
import { getProjects } from '@/lib/projects/queries';
import { unseenProjects } from '@/lib/projects/seen';
import type { Project } from '@/lib/types/database';

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string }>;
}) {
	const params = await searchParams;
	const activeTab = params.tab === 'lijst' ? 'lijst' : 'kalender';

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
				{unread.length > 0 && <UnseenBanner projects={unread} />}
				{activeTab === 'kalender' ? (
					<CalendarPlaceholder />
				) : (
					<ProjectList />
				)}
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

function CalendarPlaceholder() {
	return (
		<div className='bg-white rounded-2xl border border-cream-300 p-16 text-center'>
			<div className='font-display text-2xl text-forest-500 mb-2'>
				Kalender
			</div>
			<p className='text-sm text-charcoal-900/60'>
				Hier komt de maandkalender met op- en afbouw events.
			</p>
		</div>
	);
}
