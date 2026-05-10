'use client';

import { useState, useMemo } from 'react';
import {
	PROJECT_STATUSES,
	type Project,
	type ProjectStatus,
} from '@/lib/types/database';
import {
	filterProjectsInRange,
	filterProjectsByStatus,
	buildDayGroups,
	totalManuren,
} from '@/lib/planning/print';
import { PrintFormatA } from '@/components/PrintFormatA';

type FormatId = 'a' | 'b' | 'c';

function todayPlus(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

export function PrintViewClient({ projects }: { projects: Project[] }) {
	const [from, setFrom] = useState(() => todayPlus(0));
	const [to, setTo] = useState(() => todayPlus(13));
	const [format, setFormat] = useState<FormatId>('a');
	const [statussen, setStatussen] = useState<ProjectStatus[]>([]);

	const { groups, total } = useMemo(() => {
		const inRange = filterProjectsInRange(projects, from, to);
		const filtered = filterProjectsByStatus(inRange, statussen);
		const g = buildDayGroups(filtered, from, to);
		return { groups: g, total: totalManuren(g) };
	}, [projects, from, to, statussen]);

	function toggleStatus(s: ProjectStatus) {
		setStatussen((prev) =>
			prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
		);
	}

	return (
		<>
			<div className='no-print space-y-3 mb-5'>
				<div className='flex flex-wrap gap-3 items-center justify-between'>
					<div className='flex items-center gap-2 flex-wrap'>
						<span className='text-xs font-semibold text-charcoal-900/60 uppercase tracking-wider mr-1'>
							Periode
						</span>
						<input
							type='date'
							value={from}
							onChange={(e) => setFrom(e.target.value)}
							className='px-3 py-2 border border-cream-300 rounded-xl bg-white focus:border-forest-500 outline-none transition-colors text-sm'
						/>
						<span className='text-charcoal-900/40'>–</span>
						<input
							type='date'
							value={to}
							onChange={(e) => setTo(e.target.value)}
							className='px-3 py-2 border border-cream-300 rounded-xl bg-white focus:border-forest-500 outline-none transition-colors text-sm'
						/>
					</div>
					<button
						type='button'
						onClick={() => window.print()}
						className='px-5 py-2.5 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-xl text-sm transition-colors'
					>
						Afdrukken
					</button>
				</div>

				<div className='flex flex-wrap gap-2 items-center'>
					<span className='text-xs font-semibold text-charcoal-900/60 uppercase tracking-wider mr-1'>
						Format
					</span>
					<FormatChip
						active={format === 'a'}
						onClick={() => setFormat('a')}
					>
						A: Per dag gegroepeerd
					</FormatChip>
					<FormatChip
						active={false}
						disabled
						onClick={() => {}}
					>
						B: Compacte tabel (binnenkort)
					</FormatChip>
					<FormatChip
						active={false}
						disabled
						onClick={() => {}}
					>
						C: Crew rooster (binnenkort)
					</FormatChip>
				</div>

				<div className='flex flex-wrap gap-2 items-center'>
					<span className='text-xs font-semibold text-charcoal-900/60 uppercase tracking-wider mr-1'>
						Statussen
					</span>
					{PROJECT_STATUSES.map((s) => (
						<StatusChip
							key={s}
							status={s}
							active={statussen.includes(s)}
							onClick={() => toggleStatus(s)}
						/>
					))}
					{statussen.length > 0 && (
						<button
							type='button'
							onClick={() => setStatussen([])}
							className='text-xs text-forest-500 hover:text-forest-600 font-medium ml-1'
						>
							Reset
						</button>
					)}
				</div>
			</div>

			<div id='planning-print'>
				{format === 'a' && (
					<PrintFormatA
						groups={groups}
						from={from}
						to={to}
						statussen={statussen}
						total={total}
					/>
				)}
			</div>
		</>
	);
}

function FormatChip({
	active,
	disabled,
	onClick,
	children,
}: {
	active: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type='button'
			disabled={disabled}
			onClick={onClick}
			className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors whitespace-nowrap ${
				disabled
					? 'bg-paper-50 text-charcoal-900/30 border-cream-300 cursor-not-allowed'
					: active
						? 'bg-forest-500 text-white border-forest-500'
						: 'bg-white text-charcoal-900/70 border-cream-300 hover:border-charcoal-900/30'
			}`}
		>
			{children}
		</button>
	);
}

function StatusChip({
	status,
	active,
	onClick,
}: {
	status: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className={`px-3 py-1 text-xs rounded-full font-medium border transition-colors ${
				active
					? 'bg-forest-500 text-white border-forest-500'
					: 'bg-white text-charcoal-900/70 border-cream-300 hover:border-charcoal-900/30'
			}`}
		>
			{status}
		</button>
	);
}
