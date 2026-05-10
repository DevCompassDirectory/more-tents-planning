'use client';

import { useState } from 'react';
import {
	PROJECT_STATUSES,
	type Project,
	type ProjectStatus,
} from '@/lib/types/database';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectForm } from '@/components/ProjectForm';
import { statusBadgeClasses, statusBorderClasses } from '@/lib/projects/status';
import { formatDate, formatTime } from '@/lib/utils/date';
import { isUnseen } from '@/lib/projects/seen';

type FilterValue = 'alle' | 'ongelezen' | ProjectStatus;

export function ProjectListClient({
	projects,
	currentUserEmail,
}: {
	projects: Project[];
	currentUserEmail: string;
}) {
	const [selected, setSelected] = useState<Project | null>(null);
	const [editing, setEditing] = useState<Project | null>(null);

	const [search, setSearch] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [filter, setFilter] = useState<FilterValue>('alle');

	const unreadCount = projects.filter((p) =>
		isUnseen(p, currentUserEmail),
	).length;

	const filtered = projects.filter((p) => {
		if (filter === 'ongelezen') {
			if (!isUnseen(p, currentUserEmail)) return false;
		} else if (filter !== 'alle') {
			if (p.status !== filter) return false;
		}

		if (search.trim()) {
			const q = search.trim().toLowerCase();
			const klant = (p.klant_naam ?? '').toLowerCase();
			const offerte = (p.offerte_nr ?? '').toLowerCase();
			if (!klant.includes(q) && !offerte.includes(q)) return false;
		}

		if (dateFrom || dateTo) {
			if (!p.datum_opbouw) return false;
			if (dateFrom && p.datum_opbouw < dateFrom) return false;
			if (dateTo && p.datum_opbouw > dateTo) return false;
		}

		return true;
	});

	const hasActiveFilters =
		search.trim() !== '' ||
		dateFrom !== '' ||
		dateTo !== '' ||
		filter !== 'alle';

	function resetFilters() {
		setSearch('');
		setDateFrom('');
		setDateTo('');
		setFilter('alle');
	}

	if (projects.length === 0) {
		return (
			<div className='bg-white rounded-lg border border-cream-300 p-16 text-center'>
				<div className='font-display text-2xl text-forest-500 mb-2'>
					Nog geen projecten
				</div>
				<p className='text-sm text-charcoal-900/60 max-w-md mx-auto'>
					Klik op de + knop rechtsonder om een leeg project aan te
					maken, of op het PDF-icoon om een offerte te importeren.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className='space-y-3 mb-5'>
				<div className='flex flex-wrap gap-3'>
					<div className='flex-1 min-w-[220px]'>
						<input
							type='text'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder='Zoek op klant of offerte nr...'
							className='w-full px-4 py-2.5 border border-cream-300 rounded-lg bg-white focus:border-forest-500 outline-none transition-colors text-sm'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<input
							type='date'
							value={dateFrom}
							onChange={(e) => setDateFrom(e.target.value)}
							aria-label='Datum vanaf'
							className='px-3 py-2.5 border border-cream-300 rounded-lg bg-white focus:border-forest-500 outline-none transition-colors text-sm'
						/>
						<span className='text-charcoal-900/40'>–</span>
						<input
							type='date'
							value={dateTo}
							onChange={(e) => setDateTo(e.target.value)}
							aria-label='Datum tot'
							className='px-3 py-2.5 border border-cream-300 rounded-lg bg-white focus:border-forest-500 outline-none transition-colors text-sm'
						/>
					</div>
				</div>

				<div className='flex flex-wrap gap-2 items-center'>
					<FilterChip
						active={filter === 'alle'}
						onClick={() => setFilter('alle')}
					>
						Alle
					</FilterChip>
					<FilterChip
						active={filter === 'ongelezen'}
						onClick={() => setFilter('ongelezen')}
						amber
					>
						⚠ Ongelezen{unreadCount > 0 ? ` (${unreadCount})` : ''}
					</FilterChip>
					<span className='w-px h-5 bg-cream-300 mx-1' />
					{PROJECT_STATUSES.map((s) => (
						<FilterChip
							key={s}
							active={filter === s}
							onClick={() => setFilter(s)}
						>
							{s}
						</FilterChip>
					))}
				</div>

				{hasActiveFilters && (
					<div className='flex items-center justify-between text-xs text-charcoal-900/60'>
						<span>
							{filtered.length} van {projects.length} project
							{projects.length === 1 ? '' : 'en'}
						</span>
						<button
							type='button'
							onClick={resetFilters}
							className='text-forest-500 hover:text-forest-600 font-medium'
						>
							Filters wissen
						</button>
					</div>
				)}
			</div>

			{filtered.length === 0 ? (
				<div className='bg-white rounded-lg border border-cream-300 p-12 text-center'>
					<div className='font-display text-xl text-forest-500 mb-2'>
						Geen projecten gevonden
					</div>
					<p className='text-sm text-charcoal-900/60 mb-4'>
						Geen enkel project voldoet aan deze filters.
					</p>
					<button
						type='button'
						onClick={resetFilters}
						className='px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white text-sm font-medium rounded-lg transition-colors'
					>
						Filters wissen
					</button>
				</div>
			) : (
				<div className='space-y-3'>
					{filtered.map((p) => (
						<ProjectCard
							key={p.id}
							project={p}
							unseen={isUnseen(p, currentUserEmail)}
							onClick={() => setSelected(p)}
						/>
					))}
				</div>
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

function FilterChip({
	active,
	onClick,
	amber,
	children,
}: {
	active: boolean;
	onClick: () => void;
	amber?: boolean;
	children: React.ReactNode;
}) {
	const base =
		'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap';
	const states = active
		? amber
			? 'bg-amber-500 border-amber-500 text-white'
			: 'bg-forest-500 border-forest-500 text-white'
		: 'bg-white border-cream-300 text-charcoal-900/70 hover:text-charcoal-900 hover:border-charcoal-900/30';

	return (
		<button
			type='button'
			onClick={onClick}
			className={`${base} ${states}`}
		>
			{children}
		</button>
	);
}

function ProjectCard({
	project: p,
	unseen,
	onClick,
}: {
	project: Project;
	unseen: boolean;
	onClick: () => void;
}) {
	const cardCls = unseen
		? 'bg-orange-50 border-orange-200 border-l-amber-500'
		: `bg-white border-cream-300 ${statusBorderClasses(p.status)}`;

	return (
		<article
			onClick={onClick}
			className={`border rounded-lg p-5 shadow-sm border-l-4 grid grid-cols-[1fr_auto] gap-4 items-start cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${cardCls}`}
		>
			<div>
				<div className='font-medium text-base mb-1'>
					{p.klant_naam || 'Naamloos project'}
				</div>
				<div className='text-xs text-charcoal-900/60 mb-2'>
					{p.offerte_nr || 'geen offerte nr'}
				</div>
				<div className='flex flex-wrap gap-2'>
					{p.datum_opbouw && (
						<span className='text-xs bg-forest-50 text-forest-600 rounded-lg px-2.5 py-1 font-medium'>
							↑ {formatDate(p.datum_opbouw)}
							{p.tijd_opbouw
								? ` ${formatTime(p.tijd_opbouw)}`
								: ''}
						</span>
					)}
					{p.datum_afbouw && (
						<span className='text-xs bg-paper-50 text-charcoal-900/70 rounded-lg px-2.5 py-1 font-medium'>
							↓ {formatDate(p.datum_afbouw)}
							{p.tijd_afbouw
								? ` ${formatTime(p.tijd_afbouw)}`
								: ''}
						</span>
					)}
					{p.locatie && (
						<span className='text-xs bg-paper-50 text-charcoal-900/70 rounded-lg px-2.5 py-1 font-medium'>
							{p.locatie.split(',')[0]}
						</span>
					)}
					{unseen && (
						<span className='text-xs bg-amber-100 text-amber-800 rounded-lg px-2.5 py-1 font-medium'>
							⚠ Gewijzigd
						</span>
					)}
				</div>
			</div>
			<div className='flex flex-col items-end gap-1.5'>
				<span
					className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-lg whitespace-nowrap ${statusBadgeClasses(p.status)}`}
				>
					{p.status}
				</span>
				{unseen && (
					<span className='text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-amber-500 text-white'>
						Gewijzigd
					</span>
				)}
			</div>
		</article>
	);
}
