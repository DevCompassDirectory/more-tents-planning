'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types/database';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectForm } from '@/components/ProjectForm';
import type { CalendarView } from '@/lib/planning/calendar';
import { CalendarMonthView } from '@/components/CalendarMonthView';
import { CalendarWeekView } from '@/components/CalendarWeekView';

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
				<CalendarMonthView
					year={year}
					month={month}
					date={date}
					projects={projects}
					currentUserEmail={currentUserEmail}
					onSelectProject={setSelected}
				/>
			)}
			{view === 'week' && (
				<CalendarWeekView
					date={date}
					projects={projects}
					currentUserEmail={currentUserEmail}
					onSelectProject={setSelected}
				/>
			)}

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
