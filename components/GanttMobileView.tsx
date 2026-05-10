'use client';

import type { Project } from '@/lib/types/database';

const NL_DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const NL_MAANDEN_KORT = [
	'jan',
	'feb',
	'mrt',
	'apr',
	'mei',
	'jun',
	'jul',
	'aug',
	'sep',
	'okt',
	'nov',
	'dec',
];

type EventType = 'load' | 'op' | 'af' | 'unload';
type DayAction = { type: EventType; project: Project };

type EventTypeInfo = {
	label: string;
	bar: string;
	text: string;
};

const TYPE_INFO: Record<EventType, EventTypeInfo> = {
	load: { label: 'LADEN', bar: 'bg-blue-500', text: 'text-blue-600' },
	op: { label: 'OPBOUW', bar: 'bg-forest-500', text: 'text-forest-500' },
	af: { label: 'AFBOUW', bar: 'bg-amber-400', text: 'text-amber-700' },
	unload: { label: 'LOSSEN', bar: 'bg-blue-500', text: 'text-blue-600' },
};

type Props = {
	projects: Project[];
	days: string[];
	onSelectProject: (p: Project) => void;
};

function actionsOnDay(projects: Project[], iso: string): DayAction[] {
	const out: DayAction[] = [];
	for (const p of projects) {
		if (p.laad_datum_opbouw === iso) out.push({ type: 'load', project: p });
		if (p.datum_opbouw === iso) out.push({ type: 'op', project: p });
		if (p.datum_afbouw === iso) out.push({ type: 'af', project: p });
		if (p.laad_datum_afbouw === iso)
			out.push({ type: 'unload', project: p });
	}
	return out;
}

function formatDayLabel(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	const monthIdx = parseInt(m[2], 10) - 1;
	const day = parseInt(m[3], 10);
	const date = new Date(iso + 'T12:00:00');
	const dayIdx = (date.getDay() + 6) % 7;
	const dayShort = NL_DAGEN[dayIdx];
	return `${dayShort.charAt(0).toUpperCase() + dayShort.slice(1)} ${day} ${NL_MAANDEN_KORT[monthIdx]}`;
}

export function GanttMobileView({ projects, days, onSelectProject }: Props) {
	const sections = days
		.map((iso) => ({ iso, actions: actionsOnDay(projects, iso) }))
		.filter((s) => s.actions.length > 0);

	if (sections.length === 0) {
		return (
			<div className='bg-white rounded-2xl border border-cream-300 p-12 text-center'>
				<p className='text-sm text-charcoal-900/60'>
					Geen acties in deze periode.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-2'>
			{sections.map((s) => (
				<DaySection
					key={s.iso}
					iso={s.iso}
					actions={s.actions}
					onSelectProject={onSelectProject}
				/>
			))}
		</div>
	);
}

function DaySection({
	iso,
	actions,
	onSelectProject,
}: {
	iso: string;
	actions: DayAction[];
	onSelectProject: (p: Project) => void;
}) {
	return (
		<section className='bg-white rounded-2xl border border-cream-300 px-3 py-2.5 shadow-sm'>
			<header className='flex justify-between items-baseline pb-2 border-b border-cream-300 mb-2'>
				<span className='text-xs font-semibold text-forest-500'>
					{formatDayLabel(iso)}
				</span>
				<span className='text-[10px] text-charcoal-900/50'>
					{actions.length} {actions.length === 1 ? 'actie' : 'acties'}
				</span>
			</header>
			<div className='space-y-1.5'>
				{actions.map((a, i) => (
					<ActionRow
						key={i}
						action={a}
						onClick={() => onSelectProject(a.project)}
					/>
				))}
			</div>
		</section>
	);
}

function ActionRow({
	action,
	onClick,
}: {
	action: DayAction;
	onClick: () => void;
}) {
	const info = TYPE_INFO[action.type];
	const p = action.project;
	return (
		<button
			type='button'
			onClick={onClick}
			className='w-full grid items-start gap-2 py-1 px-2 rounded-md hover:bg-paper-50 text-left'
			style={{ gridTemplateColumns: '4px 1fr' }}
		>
			<div
				className={`${info.bar} rounded-sm self-stretch min-h-[32px]`}
			/>
			<div>
				<div className={`text-[10px] font-semibold ${info.text}`}>
					{info.label}
				</div>
				<div className='text-xs font-medium text-charcoal-900'>
					{p.klant_naam || 'Naamloos'}
				</div>
				<div className='text-[10px] text-charcoal-900/60'>
					{p.locatie || ''}
				</div>
			</div>
		</button>
	);
}
