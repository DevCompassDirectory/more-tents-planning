import { Tabs } from '@/components/Tabs';
import { ProjectList } from '@/components/ProjectList';

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string }>;
}) {
	const params = await searchParams;
	const activeTab = params.tab === 'lijst' ? 'lijst' : 'kalender';

	return (
		<>
			<Tabs active={activeTab} />
			<main className='max-w-6xl mx-auto px-6 py-8'>
				{activeTab === 'kalender' ? (
					<CalendarPlaceholder />
				) : (
					<ProjectList />
				)}
			</main>
		</>
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
