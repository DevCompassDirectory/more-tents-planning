'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types/database';
import { GanttDesktopView } from '@/components/GanttDesktopView';
import { GanttMobileView } from '@/components/GanttMobileView';
import { GanttProjectModal } from '@/components/GanttProjectModal';
import type { GanttView } from '@/lib/planning/gantt';

type Props = {
	projects: Project[];
	days: string[];
	view: GanttView;
	currentUserEmail: string;
};

export function GanttClient({ projects, days, currentUserEmail }: Props) {
	const [selected, setSelected] = useState<Project | null>(null);

	return (
		<>
			<div className='hidden md:block'>
				<GanttDesktopView
					projects={projects}
					days={days}
					onSelectProject={setSelected}
				/>
			</div>
			<div className='md:hidden'>
				<GanttMobileView
					projects={projects}
					days={days}
					onSelectProject={setSelected}
				/>
			</div>

			{selected && (
				<GanttProjectModal
					project={selected}
					currentUserEmail={currentUserEmail}
					onClose={() => setSelected(null)}
				/>
			)}
		</>
	);
}
