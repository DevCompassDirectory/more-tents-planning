'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types/database';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectForm } from '@/components/ProjectForm';
import { isUnseen } from '@/lib/projects/seen';
import type { CalendarView } from '@/lib/planning/calendar';

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

function formatISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

type EventType = 'op' | 'af' | 'load' | 'unload';
type CalEvent = { type: EventType; project: Project };

type Props = {
	projects: Project[];
	currentUserEmail: string;
	view: CalendarView;
	date: string;
};

export function CalendarClient({
	projects,
	currentUserEmail,
	view,
	date,
}: Props) {
	const [selected, setSelected] = useState<Project | null>(null);
	const [editing, setEditing] = useState<Project | null>(null);

	const dateObj = new Date(date + 'T12:00:00');
	const year = dateObj.getFullYear();
	const month = dateObj.getMonth();

	return (
		<>
			{view === 'maand' && (
				<MonthGrid
					year={year}
					month={month}
					projects={projects}
					currentUserEmail={currentUserEmail}
					onSelectProject={setSelected}
				/>
			)}
			{view !== 'maand' && <ComingSoonView view={view} />}

			<Modal
				open={selected !== null}
				onClose={() => setSelected(null)}
				title={selected?.klant_naam || 'Project'}
			>
				{selected && (
					<ProjectDetail
						project={selected}
						currentUserEmail={currentUserEmail}
						onClose={() => setSelected(null)}
						onEdit={() => {
							const p = selected;
							setSelected(null);
							setEditing(p);
						}}
					/>
				)}
			</Modal>

			<Modal
				open={editing !== null}
				onClose={() => setEditing(null)}
				title='Project bewerken'
			>
				{editing && (
					<ProjectForm
						initialProject={editing}
						onClose={() => setEditing(null)}
					/>
				)}
			</Modal>
		</>
	);
}

function MonthGrid({
	year,
	month,
	projects,
	currentUserEmail,
	onSelectProject,
}: {
	year: number;
	month: number;
	projects: Project[];
	currentUserEmail: string;
	onSelectProject: (p: Project) => void;
}) {
	const today = new Date();
	const todayISO = formatISODate(today);

	const firstOfMonth = new Date(year, month, 1);
	const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const prevMonthDays = new Date(year, month, 0).getDate();

	const cells: { date: Date; inMonth: boolean; iso: string }[] = [];

	for (let i = startDayOfWeek - 1; i >= 0; i--) {
		const d = new Date(year, month - 1, prevMonthDays - i);
		cells.push({ date: d, inMonth: false, iso: formatISODate(d) });
	}
	for (let i = 1; i <= daysInMonth; i++) {
		const d = new Date(year, month, i);
		cells.push({ date: d, inMonth: true, iso: formatISODate(d) });
	}
	while (cells.length % 7 !== 0) {
		const offset = cells.length - startDayOfWeek - daysInMonth + 1;
		const d = new Date(year, month + 1, offset);
		cells.push({ date: d, inMonth: false, iso: formatISODate(d) });
	}

	return (
		<div className='bg-white rounded-2xl border border-cream-300 overflow-hidden shadow-sm'>
			<div className='grid grid-cols-7 bg-forest-500 text-white'>
				{DAYS.map((d) => (
					<div
						key={d}
						className='px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider'
					>
						{d}
					</div>
				))}
			</div>

			<div className='grid grid-cols-7'>
				{cells.map((cell, i) => {
					const dayOfWeek = i % 7;
					const isWeekend = dayOfWeek >= 5;
					const isToday = cell.iso === todayISO && cell.inMonth;

					const events: CalEvent[] = [];
					for (const p of projects) {
						if (p.datum_opbouw === cell.iso)
							events.push({ type: 'op', project: p });
						if (p.datum_afbouw === cell.iso)
							events.push({ type: 'af', project: p });
						if (p.laad_datum_opbouw === cell.iso)
							events.push({ type: 'load', project: p });
						if (p.laad_datum_afbouw === cell.iso)
							events.push({ type: 'unload', project: p });
					}

					const cellBg = !cell.inMonth
						? 'bg-paper-50/60'
						: isToday
							? 'bg-forest-50'
							: isWeekend
								? 'bg-paper-50/40'
								: 'bg-white';

					return (
						<div
							key={cell.iso}
							className={`min-h-[80px] sm:min-h-[110px] p-1.5 sm:p-2 border-r border-b border-cream-300 [&:nth-child(7n)]:border-r-0 ${cellBg}`}
						>
							{isToday ? (
								<div className='w-6 h-6 bg-forest-500 text-white rounded-full text-xs font-bold flex items-center justify-center mb-1'>
									{cell.date.getDate()}
								</div>
							) : (
								<div
									className={`text-xs font-semibold mb-1 ${
										cell.inMonth
											? 'text-charcoal-900'
											: 'text-charcoal-900/30'
									}`}
								>
									{cell.date.getDate()}
								</div>
							)}

							<div className='space-y-0.5'>
								{events.map((ev, j) => (
									<CalendarEvent
										key={`${ev.project.id}-${ev.type}-${j}`}
										event={ev}
										unseen={isUnseen(
											ev.project,
											currentUserEmail,
										)}
										onClick={() =>
											onSelectProject(ev.project)
										}
									/>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ComingSoonView({ view }: { view: CalendarView }) {
	const labels: Record<CalendarView, string> = {
		week: 'Week-view',
		maand: 'Maand-view',
		kwartaal: 'Kwartaal-view',
		jaar: 'Jaar-view',
	};
	return (
		<div className='bg-white rounded-2xl border border-cream-300 p-12 text-center'>
			<div className='font-display text-2xl text-forest-500 mb-2'>
				{labels[view]}
			</div>
			<p className='text-sm text-charcoal-900/60'>
				Binnenkort beschikbaar.
			</p>
		</div>
	);
}

function CalendarEvent({
	event,
	unseen,
	onClick,
}: {
	event: CalEvent;
	unseen: boolean;
	onClick: () => void;
}) {
	const { type, project } = event;

	const styles: Record<EventType, string> = {
		op: 'bg-green-100 text-green-800 border-l-2 border-green-700',
		af: 'bg-amber-50 text-amber-800 border-l-2 border-amber-500',
		load: 'bg-blue-50 text-blue-800 border-l-2 border-blue-500',
		unload: 'bg-blue-50 text-blue-800 border-l-2 border-blue-500',
	};

	const labels: Record<EventType, string> = {
		op: `↑ ${project.klant_naam || 'naamloos'}`,
		af: `↓ ${project.klant_naam || 'naamloos'}`,
		load: '● Laden',
		unload: '● Lossen',
	};

	return (
		<button
			type='button'
			onClick={onClick}
			title={project.klant_naam || 'naamloos'}
			className={`relative block w-full text-left text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded truncate font-medium hover:opacity-80 transition-opacity ${styles[type]}`}
		>
			{labels[type]}
			{unseen && (
				<span className='absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full' />
			)}
		</button>
	);
}
