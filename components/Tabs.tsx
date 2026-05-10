import Link from 'next/link';

const TABS = [
	{ id: 'kalender', label: 'Kalender' },
	{ id: 'lijst', label: 'Lijst' },
	{ id: 'gantt', label: 'Gantt' },
	{ id: 'print', label: 'Print' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function Tabs({ active }: { active: TabId }) {
	return (
		<nav className='no-print bg-white border-b border-cream-300 sticky top-14 z-40'>
			<div className='max-w-6xl mx-auto px-6 flex'>
				{TABS.map((t) => {
					const isActive = active === t.id;
					return (
						<Link
							key={t.id}
							href={`/?tab=${t.id}`}
							className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
								isActive
									? 'text-forest-500 border-forest-500'
									: 'text-charcoal-900/60 border-transparent hover:text-charcoal-900'
							}`}
						>
							{t.label}
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
