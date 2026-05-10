import Link from 'next/link';
import {
	type CalendarView,
	formatPeriodLabel,
	nextPeriod,
	prevPeriod,
	todayDate,
} from '@/lib/planning/calendar';

type Props = {
	view: CalendarView;
	date: string;
};

const VIEWS: { id: CalendarView; full: string; short: string }[] = [
	{ id: 'week', full: 'Week', short: 'Wk' },
	{ id: 'maand', full: 'Maand', short: 'Maand' },
	{ id: 'kwartaal', full: 'Kwartaal', short: 'Kw' },
	{ id: 'jaar', full: 'Jaar', short: 'Jr' },
];

function buildHref(view: CalendarView, date: string): string {
	const params = new URLSearchParams({
		tab: 'kalender',
		view,
		date,
	});
	return `/?${params.toString()}`;
}

export function CalendarToolbar({ view, date }: Props) {
	const periodLabel = formatPeriodLabel(view, date);
	const prev = prevPeriod(view, date);
	const next = nextPeriod(view, date);
	const today = todayDate();
	const isToday = date === today;

	return (
		<div className='bg-white rounded-2xl border border-cream-300 px-3 sm:px-4 py-3 mb-3 shadow-sm'>
			<div className='flex flex-wrap items-center gap-2 sm:gap-3'>
				<div className='flex gap-1.5 flex-wrap'>
					{VIEWS.map((v) => {
						const isActive = view === v.id;
						return (
							<Link
								key={v.id}
								href={buildHref(v.id, date)}
								className={`text-xs sm:text-sm px-3 sm:px-3.5 py-1.5 rounded-full font-medium transition-colors ${
									isActive
										? 'bg-forest-500 text-white'
										: 'bg-white text-charcoal-900 border border-cream-300 hover:border-sand-400'
								}`}
							>
								<span className='sm:hidden'>{v.short}</span>
								<span className='hidden sm:inline'>
									{v.full}
								</span>
							</Link>
						);
					})}
				</div>

				<div className='flex items-center gap-1.5 ml-auto flex-wrap'>
					<Link
						href={buildHref(view, prev)}
						aria-label='Vorige periode'
						className='inline-flex items-center justify-center w-8 h-8 rounded-lg border border-cream-300 hover:border-sand-400 text-charcoal-900 transition-colors'
					>
						‹
					</Link>
					<span className='text-sm font-medium text-charcoal-900 px-1 sm:px-2 whitespace-nowrap'>
						{periodLabel}
					</span>
					<Link
						href={buildHref(view, next)}
						aria-label='Volgende periode'
						className='inline-flex items-center justify-center w-8 h-8 rounded-lg border border-cream-300 hover:border-sand-400 text-charcoal-900 transition-colors'
					>
						›
					</Link>
					{!isToday && (
						<Link
							href={buildHref(view, today)}
							className='text-xs px-3 py-1.5 rounded-full bg-white border border-cream-300 hover:border-sand-400 text-charcoal-900 transition-colors'
						>
							Vandaag
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
