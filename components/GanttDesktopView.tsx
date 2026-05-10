'use client';

import type { Project } from '@/lib/types/database';
import {
	type GanttSegmentType,
	dayName,
	dayNumber,
	getProjectSegments,
	isWeekend,
	todayDate,
} from '@/lib/planning/gantt';

const SEGMENT_BG: Record<GanttSegmentType, string> = {
	load: 'bg-blue-500',
	op: 'bg-forest-500',
	stand: 'bg-forest-100',
	af: 'bg-amber-300',
	unload: 'bg-blue-500',
};

const DAY_WIDTH = 28;
const LABEL_WIDTH = 200;

type Props = {
	projects: Project[];
	days: string[];
	onSelectProject: (p: Project) => void;
};

export function GanttDesktopView({ projects, days, onSelectProject }: Props) {
	const todayISO = todayDate();
	const todayIdx = days.indexOf(todayISO);
	const totalWidth = LABEL_WIDTH + days.length * DAY_WIDTH;

	if (projects.length === 0) {
		return (
			<div className='bg-white rounded-2xl border border-cream-300 p-12 text-center'>
				<p className='text-sm text-charcoal-900/60'>
					Geen projecten in deze periode.
				</p>
			</div>
		);
	}

	return (
		<div className='bg-white rounded-2xl border border-cream-300 overflow-x-auto shadow-sm'>
			<div
				style={{
					gridTemplateColumns: `${LABEL_WIDTH}px repeat(${days.length}, ${DAY_WIDTH}px)`,
					minWidth: totalWidth,
				}}
				className='grid text-xs'
			>
				<div className='sticky left-0 z-20 bg-white px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-charcoal-900/50 border-r border-b border-cream-300'>
					Project
				</div>
				{days.map((iso) => {
					const weekend = isWeekend(iso);
					const isToday = iso === todayISO;
					return (
						<div
							key={iso}
							className={`text-center py-1.5 text-[9px] leading-tight border-b border-cream-300 ${
								isToday
									? 'bg-forest-50'
									: weekend
										? 'bg-paper-50'
										: ''
							}`}
						>
							<div
								className={`uppercase ${
									isToday
										? 'text-forest-500 font-bold'
										: 'text-charcoal-900/50'
								}`}
							>
								{dayName(iso)}
							</div>
							<div
								className={
									isToday
										? 'text-forest-500 font-bold'
										: 'font-semibold text-charcoal-900'
								}
							>
								{dayNumber(iso)}
							</div>
						</div>
					);
				})}

				{projects.map((p, rowIdx) => (
					<ProjectRow
						key={p.id}
						project={p}
						days={days}
						todayIdx={todayIdx}
						isLast={rowIdx === projects.length - 1}
						onClick={() => onSelectProject(p)}
					/>
				))}
			</div>

			<div className='flex flex-wrap gap-3 px-4 py-3 border-t border-cream-300 text-[11px] text-charcoal-900/70'>
				<span className='flex items-center gap-1.5'>
					<span className='inline-block w-3 h-3 rounded-sm bg-blue-500' />
					Laden / lossen
				</span>
				<span className='flex items-center gap-1.5'>
					<span className='inline-block w-3 h-3 rounded-sm bg-forest-500' />
					Opbouw
				</span>
				<span className='flex items-center gap-1.5'>
					<span className='inline-block w-3 h-3 rounded-sm bg-forest-100' />
					Standtijd
				</span>
				<span className='flex items-center gap-1.5'>
					<span className='inline-block w-3 h-3 rounded-sm bg-amber-300' />
					Afbouw
				</span>
				<span className='ml-auto italic text-charcoal-900/50'>
					Tip: klik op een balk voor producten en details
				</span>
			</div>
		</div>
	);
}

function ProjectRow({
	project,
	days,
	todayIdx,
	isLast,
	onClick,
}: {
	project: Project;
	days: string[];
	todayIdx: number;
	isLast: boolean;
	onClick: () => void;
}) {
	const segments = getProjectSegments(project);
	const totalCells = days.length;
	const rowBorder = isLast ? '' : 'border-b border-cream-300';

	return (
		<>
			<button
				type='button'
				onClick={onClick}
				className={`sticky left-0 z-10 bg-white text-left px-3 py-3 ${rowBorder} hover:bg-paper-50/80 transition-colors`}
			>
				<div className='font-medium text-charcoal-900 truncate text-xs'>
					{project.klant_naam || 'Naamloos'}
				</div>
				<div className='text-[10px] text-charcoal-900/60 truncate'>
					{project.locatie || ''}
				</div>
			</button>

			<button
				type='button'
				onClick={onClick}
				style={{ gridColumn: `2 / span ${totalCells}` }}
				className={`relative h-[50px] ${rowBorder} hover:bg-paper-50/40 transition-colors text-left`}
			>
				{days.map((iso, i) => {
					if (!isWeekend(iso) && iso !== days[todayIdx]) return null;
					const isToday = iso === days[todayIdx];
					const bg = isToday ? 'bg-forest-50/40' : 'bg-paper-50/50';
					return (
						<div
							key={iso}
							className={`absolute top-0 bottom-0 ${bg}`}
							style={{ left: i * DAY_WIDTH, width: DAY_WIDTH }}
						/>
					);
				})}

				{todayIdx >= 0 && (
					<div
						className='absolute top-0 bottom-0 border-l-[1.5px] border-dashed border-forest-500/40 pointer-events-none'
						style={{ left: todayIdx * DAY_WIDTH + DAY_WIDTH / 2 }}
					/>
				)}

				{segments.map((seg, i) => {
					const startIdx = days.indexOf(seg.from);
					const endIdx = days.indexOf(seg.to);
					if (startIdx < 0 && endIdx < 0) return null;
					const left = Math.max(0, startIdx) * DAY_WIDTH;
					const right = Math.min(days.length - 1, endIdx) * DAY_WIDTH;
					const width = right - left + DAY_WIDTH;
					if (width <= 0) return null;
					const isFirst = i === 0;
					const isLastSeg = i === segments.length - 1;
					return (
						<div
							key={i}
							className={`absolute top-[14px] h-[22px] ${SEGMENT_BG[seg.type]}`}
							style={{
								left,
								width,
								borderTopLeftRadius: isFirst ? 4 : 0,
								borderBottomLeftRadius: isFirst ? 4 : 0,
								borderTopRightRadius: isLastSeg ? 4 : 0,
								borderBottomRightRadius: isLastSeg ? 4 : 0,
							}}
							title={seg.type}
						/>
					);
				})}
			</button>
		</>
	);
}
