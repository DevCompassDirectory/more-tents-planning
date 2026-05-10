import Link from 'next/link';
import type { Project } from '@/lib/types/database';
import {
	type MonthCell,
	calendarHref,
	eventsForDate,
	monthCells,
	monthName,
	quarterMonths,
	summarizeEvents,
	todayDate,
} from '@/lib/planning/calendar';

const DAYS_MINI = ['m', 'd', 'w', 'd', 'v', 'z', 'z'];

type Props = {
	date: string;
	projects: Project[];
};

export function CalendarQuarterView({ date, projects }: Props) {
	const months = quarterMonths(date);
	const todayISO = todayDate();

	return (
		<div className='bg-white rounded-lg border border-cream-300 p-4 sm:p-6 shadow-sm'>
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				{months.map(({ year, month }) => (
					<MiniMonth
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

function MiniMonth({
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
			<div className='mb-2'>
				<Link
					href={calendarHref('maand', firstISO)}
					className='text-sm font-medium text-forest-500 hover:underline capitalize'
				>
					{monthName(month)} {year}
				</Link>
			</div>
			<div className='grid grid-cols-7 text-[10px] text-charcoal-900/50 text-center mb-1'>
				{DAYS_MINI.map((d, i) => (
					<div key={i}>{d}</div>
				))}
			</div>
			<div className='grid grid-cols-7 gap-1'>
				{cells.map((cell) => (
					<MiniDay
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

function MiniDay({
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

	let bg = '';
	let textColor = cell.inMonth ? 'text-charcoal-900' : 'text-charcoal-900/30';

	if (cell.inMonth && summary.totalEvents > 0) {
		if (summary.hasAfbouw && !summary.hasOpbouw) {
			bg = 'bg-amber-100';
			textColor = 'text-amber-800';
		} else {
			bg = 'bg-green-100';
			textColor = 'text-green-800';
		}
	}

	return (
		<Link
			href={calendarHref('maand', cell.iso)}
			className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-opacity hover:opacity-80 ${bg} ${textColor} ${
				isToday && cell.inMonth
					? 'ring-1 ring-forest-500 ring-inset'
					: ''
			}`}
		>
			{cell.day}
		</Link>
	);
}

function Legend() {
	return (
		<div className='flex flex-wrap gap-3 mt-4 text-[11px] text-charcoal-900/60'>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-green-100 border border-green-200' />
				Opbouw
			</span>
			<span className='flex items-center gap-1'>
				<span className='inline-block w-3 h-3 rounded-lg bg-amber-100 border border-amber-200' />
				Afbouw
			</span>
		</div>
	);
}
