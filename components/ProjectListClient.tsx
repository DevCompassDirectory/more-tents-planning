'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types/database';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectForm } from '@/components/ProjectForm';
import { statusBadgeClasses, statusBorderClasses } from '@/lib/projects/status';
import { formatDate, formatTime } from '@/lib/utils/date';
import { isUnseen } from '@/lib/projects/seen';

export function ProjectListClient({
	projects,
	currentUserEmail,
}: {
	projects: Project[];
	currentUserEmail: string;
}) {
	const [selected, setSelected] = useState<Project | null>(null);
	const [editing, setEditing] = useState<Project | null>(null);

	if (projects.length === 0) {
		return (
			<div className='bg-white rounded-2xl border border-cream-300 p-16 text-center'>
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
			<div className='space-y-3'>
				{projects.map((p) => (
					<ProjectCard
						key={p.id}
						project={p}
						unseen={isUnseen(p, currentUserEmail)}
						onClick={() => setSelected(p)}
					/>
				))}
			</div>

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
			className={`border rounded-2xl p-5 shadow-sm border-l-4 grid grid-cols-[1fr_auto] gap-4 items-start cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all ${cardCls}`}
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
						<span className='text-xs bg-forest-50 text-forest-600 rounded-full px-2.5 py-1 font-medium'>
							↑ {formatDate(p.datum_opbouw)}
							{p.tijd_opbouw
								? ` ${formatTime(p.tijd_opbouw)}`
								: ''}
						</span>
					)}
					{p.datum_afbouw && (
						<span className='text-xs bg-paper-50 text-charcoal-900/70 rounded-full px-2.5 py-1 font-medium'>
							↓ {formatDate(p.datum_afbouw)}
							{p.tijd_afbouw
								? ` ${formatTime(p.tijd_afbouw)}`
								: ''}
						</span>
					)}
					{p.locatie && (
						<span className='text-xs bg-paper-50 text-charcoal-900/70 rounded-full px-2.5 py-1 font-medium'>
							{p.locatie.split(',')[0]}
						</span>
					)}
					{unseen && (
						<span className='text-xs bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 font-medium'>
							⚠ Gewijzigd
						</span>
					)}
				</div>
			</div>
			<div className='flex flex-col items-end gap-1.5'>
				<span
					className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${statusBadgeClasses(p.status)}`}
				>
					{p.status}
				</span>
				{unseen && (
					<span className='text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white'>
						Gewijzigd
					</span>
				)}
			</div>
		</article>
	);
}
