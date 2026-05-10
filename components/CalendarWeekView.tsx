'use client';

import type { Project } from '@/lib/types/database';
import { isUnseen } from '@/lib/projects/seen';
import { eventsForDate, todayDate, weekDates } from '@/lib/planning/calendar';
import { CalendarEventButton } from '@/components/CalendarEventButton';

const DAY_NAMES_FULL = [
	'maandag',
	'dinsdag',
	'woensdag',
	'donderdag',
	'vrijdag',
	'zaterdag',
	'zondag',
];
const DAY_NAMES_SHORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

function dayNumber(iso: string): number {
	return parseInt(iso.slice(8, 10), 10);
}

function shortDate(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}-${m[2]}`;
}

type Props = {
	date: string;
	projects: Project[];
	currentUserEmail: string;
	onSelectProject: (p: Project) => void;
};

export function CalendarWeekView({
	date,
	projects,
	currentUserEmail,
	onSelectProject,
}: Props) {
	const dates = weekDates(date);
	const todayISO = todayDate();

	return (
		<>
			{/* Desktop: 7 kolommen */}
			<div className='hidden md:block bg-white rounded-2xl border border-cream-300 overflow-hidden shadow-sm'>
				<div className='grid grid-cols-7'>
					{dates.map((iso, i) => {
						const weekend = i >= 5;
						const isToday = iso === todayISO;
						return (
							<div
								key={iso}
								className={`px-2 py-3 text-center text-xs border-l border-forest-600 first:border-l-0 ${
									weekend
										? 'bg-forest-600 text-white/90'
										: 'bg-forest-500 text-white'
								}`}
							>
								<div className='font-normal opacity-80'>
									{DAY_NAMES_FULL[i]}
								</div>
								<div className='mt-0.5'>
									{isToday ? (
										<span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-forest-500 font-semibold'>
											{dayNumber(iso)}
										</span>
									) : (
										<span className='font-semibold'>
											{shortDate(iso)}
										</span>
									)}
								</div>
							</div>
						);
					})}
				</div>
				<div className='grid grid-cols-7 min-h-[400px]'>
					{dates.map((iso, i) => {
						const weekend = i >= 5;
						const events = eventsForDate(projects, iso);
						return (
							<div
								key={iso}
								className={`p-2 border-l border-cream-300 first:border-l-0 ${
									weekend ? 'bg-paper-50/40' : 'bg-white'
								}`}
							>
								<div className='space-y-1'>
									{events.length === 0 ? (
										<div className='text-[11px] text-charcoal-900/30 italic px-1 py-1'>
											—
										</div>
									) : (
										events.map((ev, j) => (
											<CalendarEventButton
												key={`${ev.project.id}-${ev.type}-${j}`}
												event={ev}
												unseen={isUnseen(
													ev.project,
													currentUserEmail,
												)}
												onClick={() =>
													onSelectProject(ev.project)
												}
												size='large'
											/>
										))
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Mobile: verticaal stacked */}
			<div className='md:hidden bg-white rounded-2xl border border-cream-300 overflow-hidden shadow-sm divide-y divide-cream-300'>
				{dates.map((iso, i) => {
					const weekend = i >= 5;
					const isToday = iso === todayISO;
					const events = eventsForDate(projects, iso);
					return (
						<div
							key={iso}
							className={`grid items-start gap-3 px-3 py-2.5 ${
								weekend ? 'bg-paper-50/40' : ''
							}`}
							style={{ gridTemplateColumns: '40px 1fr' }}
						>
							<div className='text-center'>
								<div className='text-[10px] text-charcoal-900/50 uppercase'>
									{DAY_NAMES_SHORT[i]}
								</div>
								<div
									className={`text-base font-semibold ${
										isToday
											? 'inline-flex items-center justify-center w-7 h-7 rounded-full bg-forest-500 text-white'
											: 'text-charcoal-900'
									}`}
								>
									{dayNumber(iso)}
								</div>
							</div>
							<div className='py-1'>
								{events.length === 0 ? (
									<div className='text-xs text-charcoal-900/30 italic'>
										—
									</div>
								) : (
									<div className='space-y-1'>
										{events.map((ev, j) => (
											<CalendarEventButton
												key={`${ev.project.id}-${ev.type}-${j}`}
												event={ev}
												unseen={isUnseen(
													ev.project,
													currentUserEmail,
												)}
												onClick={() =>
													onSelectProject(ev.project)
												}
												size='normal'
											/>
										))}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
