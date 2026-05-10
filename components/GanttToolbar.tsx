import Link from 'next/link';
import {
	type GanttView,
	formatGanttPeriodLabel,
	ganttHref,
	nextGanttPeriod,
	prevGanttPeriod,
	todayDate,
} from '@/lib/planning/gantt';

const VIEWS: { id: GanttView; full: string; short: string }[] = [
	{ id: 'week', full: 'Week', short: 'Wk' },
	{ id: 'maand', full: 'Maand', short: 'Maand' },
	{ id: 'kwartaal', full: 'Kwartaal', short: 'Kw' },
];

// TODO Pascal: pas de statussen aan als jouw lijst anders is
const STATUSSEN = ['Aangevraagd', 'Bevestigd', 'Definitief'];

type Props = {
	view: GanttView;
	date: string;
	statussen: string[];
};

function toggleStatus(current: string[], status: string): string[] {
	if (current.includes(status)) {
		return current.filter((s) => s !== status);
	}
	return [...current, status];
}

export function GanttToolbar({ view, date, statussen }: Props) {
	const periodLabel = formatGanttPeriodLabel(view, date);
	const prev = prevGanttPeriod(view, date);
	const next = nextGanttPeriod(view, date);
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
								href={ganttHref(v.id, date, statussen)}
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
						href={ganttHref(view, prev, statussen)}
						aria-label='Vorige periode'
						className='inline-flex items-center justify-center w-8 h-8 rounded-lg border border-cream-300 hover:border-sand-400 text-charcoal-900 transition-colors'
					>
						‹
					</Link>
					<span className='text-sm font-medium text-charcoal-900 px-1 sm:px-2 whitespace-nowrap'>
						{periodLabel}
					</span>
					<Link
						href={ganttHref(view, next, statussen)}
						aria-label='Volgende periode'
						className='inline-flex items-center justify-center w-8 h-8 rounded-lg border border-cream-300 hover:border-sand-400 text-charcoal-900 transition-colors'
					>
						›
					</Link>
					{!isToday && (
						<Link
							href={ganttHref(view, today, statussen)}
							className='text-xs px-3 py-1.5 rounded-full bg-white border border-cream-300 hover:border-sand-400 text-charcoal-900 transition-colors'
						>
							Vandaag
						</Link>
					)}
				</div>
			</div>

			<div className='flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-cream-300'>
				<span className='text-[11px] text-charcoal-900/60 mr-1'>
					Status:
				</span>
				{STATUSSEN.map((s) => {
					const isActive = statussen.includes(s);
					const next = toggleStatus(statussen, s);
					return (
						<Link
							key={s}
							href={ganttHref(view, date, next)}
							className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
								isActive
									? 'bg-forest-500 text-white'
									: 'bg-white text-charcoal-900/70 border border-cream-300 hover:border-sand-400'
							}`}
						>
							{s}
						</Link>
					);
				})}
				{statussen.length > 0 && (
					<Link
						href={ganttHref(view, date, [])}
						className='text-[11px] text-charcoal-900/60 underline hover:text-charcoal-900 ml-2'
					>
						Reset
					</Link>
				)}
			</div>
		</div>
	);
}
