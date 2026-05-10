import Link from 'next/link';
import type { Project } from '@/lib/types/database';
import {
	type MonthCell,
	calendarHref,
	eventsForDate,
	monthCells,
	monthName,
	summarizeEvents,
	todayDate,
	yearMonths,
} from '@/lib/planning/calendar';

type Props = {
	date: string;
	projects: Project[];
};

export function CalendarYearView({ date, projects }: Props) {
	const months = yearMonths(date);
	const todayISO = todayDate();

	return (
		<div className='bg-white rounded-lg border border-cream-300 p-4 sm:p-6 shadow-sm'>
			<div className='grid grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6'>
				{months.map(({ year, month }) => (
					<YearMonth
						key={`${year}-${month}`}
						year={year}
						month={month}
						projects={projects}
						todayISO={todayISO}
					/>
				))}
			</div>
			<Legend />
		</div>
	);
}

function YearMonth({
	year,
	month,
	projects,
	todayISO,
}: {
	year: number;
	month: number;
	projects: Project[];
	todayISO: string;
}) {
	const cells = monthCells(year, month);
	const firstISO = `${year}-${String(month + 1).padStart(2, '0')}-01`;

	return (
		<div>
			<div className='text-center mb-1.5'>
				<Link
					href={calendarHref('maand', firstISO)}
					className='text-xs font-semibold text-forest-500 hover:underline capitalize'
				>
					{monthName(month, true)}
				</Link>
			</div>
			<div className='grid grid-cols-7 gap-[2px]'>
				{cells.map((cell) => (
					<YearDay
						key={cell.iso}
						cell={cell}
						projects={projects}
						todayISO={todayISO}
					/>
				))}
			</div>
		</div>
	);
}

function YearDay({
	cell,
	projects,
	todayISO,
}: {
	cell: MonthCell;
	projects: Project[];
	todayISO: string;
}) {
	const summary = summarizeEvents(eventsForDate(projects, cell.iso));
	const isToday = cell.iso === todayISO;

	let bg = 'bg-paper-50';
	if (!cell.inMonth) {
		bg = 'bg-transparent';
	} else if (summary.hasAfbouw && !summary.hasOpbouw) {
		bg = 'bg-amber-200';
	} else if (summary.totalEvents >= 3) {
		bg = 'bg-green-700';
	} else if (summary.totalEvents === 2) {
		bg = 'bg-green-500';
	} else if (summary.totalEvents === 1) {
		bg = 'bg-green-200';
	}

	const eventLabel = `${cell.iso} · ${summary.totalEvents} event${summary.totalEvents !== 1 ? 's' : ''}`;

	return (
		<Link
			href={calendarHref('maand', cell.iso)}
			title={eventLabel}
			className={`block aspect-square rounded-lg transition-opacity hover:opacity-80 ${bg} ${
				isToday && cell.inMonth ? 'ring-1 ring-forest-500' : ''
			}`}
		/>
	);
}

function Legend() {
	return (
		<div className='flex flex-wrap items-center gap-3 mt-5 text-[11px] text-charcoal-900/60'>
			<span>Drukte:</span>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-paper-50 border border-cream-300' />
				geen
			</span>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-green-200' />
				1 event
			</span>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-green-500' />
				2 events
			</span>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-green-700' />
				3+
			</span>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-amber-200' />
				afbouw
			</span>
		</div>
	);
}
