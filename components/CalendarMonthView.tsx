'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types/database';
import { isUnseen } from '@/lib/projects/seen';
import {
	type MonthCell,
	eventsForDate,
	isWeekend,
	monthCells,
	summarizeEvents,
	todayDate,
	weekGroups,
} from '@/lib/planning/calendar';
import { CalendarEventButton } from '@/components/CalendarEventButton';

const DAYS_FULL = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const DAYS_MINI = ['m', 'd', 'w', 'd', 'v', 'z', 'z'];
const DAY_NAMES_SHORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

type Props = {
	year: number;
	month: number;
	date: string;
	projects: Project[];
	currentUserEmail: string;
	onSelectProject: (p: Project) => void;
};

export function CalendarMonthView({
	year,
	month,
	date,
	projects,
	currentUserEmail,
	onSelectProject,
}: Props) {
	const cells = monthCells(year, month);
	const todayISO = todayDate();
	const [selectedDay, setSelectedDay] = useState<string>(date);

	useEffect(() => {
		setSelectedDay(date);
	}, [date]);

	function handleSelectDay(iso: string) {
		setSelectedDay(iso);
		const el = document.getElementById(`mobile-day-${iso}`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	return (
		<>
			<div className='hidden md:block bg-white rounded-lg border border-cream-300 overflow-hidden shadow-sm'>
				<div className='grid grid-cols-7 bg-forest-500 text-white'>
					{DAYS_FULL.map((d) => (
						<div
							key={d}
							className='px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider'
						>
							{d}
						</div>
					))}
				</div>
				<div className='grid grid-cols-7'>
					{cells.map((cell, i) => (
						<DesktopCell
							key={cell.iso}
							cell={cell}
							isLastInRow={(i + 1) % 7 === 0}
							isToday={cell.iso === todayISO}
							projects={projects}
							currentUserEmail={currentUserEmail}
							onSelectProject={onSelectProject}
						/>
					))}
				</div>
			</div>

			<div className='md:hidden space-y-3'>
				<MobileMiniGrid
					cells={cells}
					projects={projects}
					todayISO={todayISO}
					selectedDay={selectedDay}
					onSelectDay={handleSelectDay}
				/>
				<MobileWeekSections
					cells={cells}
					projects={projects}
					currentUserEmail={currentUserEmail}
					selectedDay={selectedDay}
					todayISO={todayISO}
					onSelectProject={onSelectProject}
				/>
			</div>
		</>
	);
}

function DesktopCell({
	cell,
	isLastInRow,
	isToday,
	projects,
	currentUserEmail,
	onSelectProject,
}: {
	cell: MonthCell;
	isLastInRow: boolean;
	isToday: boolean;
	projects: Project[];
	currentUserEmail: string;
	onSelectProject: (p: Project) => void;
}) {
	const weekend = isWeekend(cell.iso);
	const events = eventsForDate(projects, cell.iso);

	const cellBg = !cell.inMonth
		? 'bg-paper-50/60'
		: isToday
			? 'bg-forest-50'
			: weekend
				? 'bg-paper-50/40'
				: 'bg-white';

	return (
		<div
			className={`min-h-[110px] p-2 border-r border-b border-cream-300 ${
				isLastInRow ? '!border-r-0' : ''
			} ${cellBg}`}
		>
			{isToday && cell.inMonth ? (
				<div className='w-6 h-6 bg-forest-500 text-white rounded-full text-xs font-bold flex items-center justify-center mb-1'>
					{cell.day}
				</div>
			) : (
				<div
					className={`text-xs font-semibold mb-1 ${
						cell.inMonth
							? 'text-charcoal-900'
							: 'text-charcoal-900/30'
					}`}
				>
					{cell.day}
				</div>
			)}
			<div className='space-y-0.5'>
				{events.map((ev, j) => (
					<CalendarEventButton
						key={`${ev.project.id}-${ev.type}-${j}`}
						event={ev}
						unseen={isUnseen(ev.project, currentUserEmail)}
						onClick={() => onSelectProject(ev.project)}
						size='normal'
					/>
				))}
			</div>
		</div>
	);
}

function MobileMiniGrid({
	cells,
	projects,
	todayISO,
	selectedDay,
	onSelectDay,
}: {
	cells: MonthCell[];
	projects: Project[];
	todayISO: string;
	selectedDay: string;
	onSelectDay: (iso: string) => void;
}) {
	return (
		<div className='bg-white rounded-lg border border-cream-300 p-3 shadow-sm'>
			<div className='grid grid-cols-7 text-[10px] text-charcoal-900/50 text-center mb-1.5'>
				{DAYS_MINI.map((d, i) => (
					<div key={i}>{d}</div>
				))}
			</div>
			<div className='grid grid-cols-7 gap-1'>
				{cells.map((cell) => {
					const summary = summarizeEvents(
						eventsForDate(projects, cell.iso),
					);
					const isSelected = cell.iso === selectedDay;
					const isToday = cell.iso === todayISO;

					let bg = '';
					let textColor = cell.inMonth
						? 'text-charcoal-900'
						: 'text-charcoal-900/30';
					if (cell.inMonth && summary.totalEvents > 0) {
						if (summary.hasAfbouw && !summary.hasOpbouw) {
							bg = 'bg-amber-100';
							textColor = 'text-amber-800';
						} else {
							bg = 'bg-green-100';
							textColor = 'text-green-800';
						}
					}

					const isOutlined = isSelected && cell.inMonth;
					const isTodayRing = isToday && cell.inMonth && !isSelected;

					return (
						<button
							key={cell.iso}
							type='button'
							onClick={() => onSelectDay(cell.iso)}
							className={`relative aspect-square flex items-center justify-center text-xs rounded-md transition-colors ${bg} ${textColor} ${
								isOutlined
									? 'outline outline-2 outline-forest-500 -outline-offset-2'
									: ''
							} ${isTodayRing ? 'ring-1 ring-forest-500' : ''}`}
						>
							{cell.day}
						</button>
					);
				})}
			</div>
		</div>
	);
}

function MobileWeekSections({
	cells,
	projects,
	currentUserEmail,
	selectedDay,
	todayISO,
	onSelectProject,
}: {
	cells: MonthCell[];
	projects: Project[];
	currentUserEmail: string;
	selectedDay: string;
	todayISO: string;
	onSelectProject: (p: Project) => void;
}) {
	const weeks = weekGroups(cells);

	return (
		<div className='space-y-2'>
			{weeks.map((wk) => (
				<section
					key={wk.weekNr}
					className='bg-white rounded-lg border border-cream-300 px-3 py-2.5 shadow-sm'
				>
					<header className='flex justify-between items-baseline pb-2 border-b border-cream-300 mb-2'>
						<span className='text-xs font-semibold text-forest-500'>
							Week {wk.weekNr}
						</span>
						<span className='text-[11px] text-charcoal-900/50'>
							{wk.cells[0].day} · {wk.cells[6].day}
						</span>
					</header>
					<div className='space-y-0.5'>
						{wk.cells.map((cell, dayIdx) => {
							const events = eventsForDate(projects, cell.iso);
							const isSelected = cell.iso === selectedDay;
							const isToday = cell.iso === todayISO;
							const dayName = DAY_NAMES_SHORT[dayIdx];
							return (
								<div
									key={cell.iso}
									id={`mobile-day-${cell.iso}`}
									className={`grid items-start gap-2 px-2 py-1 rounded-lg ${
										isSelected
											? 'bg-paper-50 border-l-2 border-forest-500'
											: ''
									} ${!cell.inMonth ? 'opacity-60' : ''}`}
									style={{ gridTemplateColumns: '34px 1fr' }}
								>
									<div className='text-center pt-0.5'>
										<div
											className={`text-[10px] uppercase ${
												isSelected
													? 'text-forest-500 font-semibold'
													: 'text-charcoal-900/50'
											}`}
										>
											{dayName}
										</div>
										<div
											className={`text-sm font-medium ${
												isToday && cell.inMonth
													? 'inline-flex items-center justify-center w-6 h-6 rounded-lg bg-forest-500 text-white'
													: isSelected
														? 'text-forest-500'
														: cell.inMonth
															? 'text-charcoal-900'
															: 'text-charcoal-900/50'
											}`}
										>
											{cell.day}
										</div>
									</div>
									<div className='py-0.5 min-w-0'>
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
															onSelectProject(
																ev.project,
															)
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
				</section>
			))}
		</div>
	);
}
