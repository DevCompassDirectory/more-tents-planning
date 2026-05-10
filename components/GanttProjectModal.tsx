'use client';

import { useEffect, useState } from 'react';
import type { Project } from '@/lib/types/database';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectForm } from '@/components/ProjectForm';
import {
	getLineItemsForProject,
	type ProjectLineItem,
} from '@/lib/projects/lineItems';

type Props = {
	project: Project;
	currentUserEmail: string;
	onClose: () => void;
};

export function GanttProjectModal({
	project,
	currentUserEmail,
	onClose,
}: Props) {
	const [lineItems, setLineItems] = useState<ProjectLineItem[] | null>(null);
	const [showFullDetail, setShowFullDetail] = useState(false);
	const [editing, setEditing] = useState<Project | null>(null);

	useEffect(() => {
		let cancelled = false;
		getLineItemsForProject(project.id).then((items) => {
			if (!cancelled) setLineItems(items);
		});
		return () => {
			cancelled = true;
		};
	}, [project.id]);

	const grouped = lineItems ? groupByCategory(lineItems) : null;

	return (
		<>
			<Modal
				open={!showFullDetail && editing === null}
				onClose={onClose}
				title={project.klant_naam || 'Project'}
			>
				<div className='flex flex-col max-h-[85vh]'>
					<div className='px-6 py-3 border-b border-cream-300 flex items-center gap-2 flex-wrap'>
						{project.status && (
							<StatusBadge status={project.status} />
						)}
						<span className='text-xs text-charcoal-900/60'>
							{[project.locatie, project.offerte_nr]
								.filter(Boolean)
								.join(' · ')}
						</span>
					</div>

					<FasenSection project={project} />

					<div className='px-6 py-4 border-t border-cream-300 overflow-y-auto'>
						<div className='flex items-baseline justify-between mb-3'>
							<span className='text-[10px] uppercase tracking-wider font-semibold text-charcoal-900/50'>
								Producten
								{lineItems && ` · ${lineItems.length} items`}
							</span>
						</div>
						{!lineItems && (
							<div className='text-xs text-charcoal-900/40 italic py-4'>
								Producten laden...
							</div>
						)}
						{lineItems && lineItems.length === 0 && (
							<div className='text-xs text-charcoal-900/40 italic py-4'>
								Geen producten gekoppeld.
							</div>
						)}
						{grouped &&
							grouped.map(([categorie, items]) => (
								<div
									key={categorie}
									className='mb-3'
								>
									<div className='text-[10px] text-forest-500 font-semibold uppercase tracking-wider mb-1.5'>
										{categorie}
									</div>
									<div className='space-y-1'>
										{items.map((it) => (
											<div
												key={it.id}
												className='grid items-baseline gap-3 text-xs'
												style={{
													gridTemplateColumns:
														'1fr auto',
												}}
											>
												<span>{it.naam}</span>
												<span className='text-charcoal-900/60 tabular-nums whitespace-nowrap'>
													{it.aantal}
												</span>
											</div>
										))}
									</div>
								</div>
							))}
					</div>

					<div className='px-6 py-3 border-t border-cream-300 flex gap-2 justify-end bg-white'>
						<button
							type='button'
							onClick={onClose}
							className='text-xs px-3 py-2 rounded-full bg-white border border-cream-300 hover:border-sand-400 text-charcoal-900 font-medium'
						>
							Sluiten
						</button>
						<button
							type='button'
							onClick={() => setShowFullDetail(true)}
							className='text-xs px-4 py-2 rounded-full bg-forest-500 hover:bg-forest-600 text-white font-medium'
						>
							Volledige details
						</button>
					</div>
				</div>
			</Modal>

			<Modal
				open={showFullDetail && editing === null}
				onClose={() => {
					setShowFullDetail(false);
					onClose();
				}}
				title={project.klant_naam || 'Project'}
			>
				<ProjectDetail
					project={project}
					currentUserEmail={currentUserEmail}
					onClose={() => {
						setShowFullDetail(false);
						onClose();
					}}
					onEdit={() => {
						setShowFullDetail(false);
						setEditing(project);
					}}
				/>
			</Modal>

			<Modal
				open={editing !== null}
				onClose={() => {
					setEditing(null);
					onClose();
				}}
				title='Project bewerken'
			>
				{editing && (
					<ProjectForm
						initialProject={editing}
						onClose={() => {
							setEditing(null);
							onClose();
						}}
					/>
				)}
			</Modal>
		</>
	);
}

function FasenSection({ project }: { project: Project }) {
	const opbouwTimeline = [
		project.laad_datum_opbouw &&
			`${formatDate(project.laad_datum_opbouw)} laden${formatTime(project.laad_tijd_opbouw)}`,
		project.datum_opbouw &&
			`${formatDate(project.datum_opbouw)} opbouw${formatTimeRange(project.tijd_opbouw, project.eindtijd_opbouw)}`,
	].filter(Boolean) as string[];

	const afbouwTimeline = [
		project.datum_afbouw &&
			`${formatDate(project.datum_afbouw)} afbouw${formatTimeRange(project.tijd_afbouw, project.eindtijd_afbouw)}`,
		project.laad_datum_afbouw &&
			`${formatDate(project.laad_datum_afbouw)} lossen${formatTime(project.laad_tijd_afbouw)}`,
	].filter(Boolean) as string[];

	const opbouwCrew = collectCrew(
		project.pascal_opbouw,
		project.jip_opbouw,
		project.inhuur_opbouw,
	);
	const afbouwCrew = collectCrew(
		project.pascal_afbouw,
		project.jip_afbouw,
		project.inhuur_afbouw,
	);

	return (
		<div className='px-6 py-4 bg-paper-50/40 border-b border-cream-300'>
			<div className='text-[10px] uppercase tracking-wider font-semibold text-charcoal-900/50 mb-3'>
				Crew & fasen
			</div>
			<div className='grid sm:grid-cols-2 gap-3'>
				<FaseCard
					color='bg-forest-500'
					label='Opbouw-fase'
					timeline={opbouwTimeline}
					crew={opbouwCrew}
				/>
				<FaseCard
					color='bg-amber-400'
					label='Afbouw-fase'
					timeline={afbouwTimeline}
					crew={afbouwCrew}
				/>
			</div>
		</div>
	);
}

function FaseCard({
	color,
	label,
	timeline,
	crew,
}: {
	color: string;
	label: string;
	timeline: string[];
	crew: string;
}) {
	return (
		<div className='bg-white border border-cream-300 rounded-xl p-3'>
			<div className='flex items-center gap-1.5 mb-1.5'>
				<span className={`w-2 h-2 rounded-sm ${color}`} />
				<span className='text-xs font-semibold text-charcoal-900'>
					{label}
				</span>
			</div>
			<div className='text-[11px] text-charcoal-900/70 leading-relaxed'>
				{timeline.length === 0 ? (
					<span className='italic text-charcoal-900/40'>
						Geen datums ingevuld
					</span>
				) : (
					timeline.map((line, i) => <div key={i}>{line}</div>)
				)}
			</div>
			<div className='text-[11px] text-forest-500 font-medium mt-2 pt-2 border-t border-cream-300'>
				{crew || (
					<span className='text-charcoal-900/40 italic font-normal'>
						Geen crew
					</span>
				)}
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const colors: Record<string, string> = {
		Bevestigd: 'bg-green-100 text-green-800',
		Aangevraagd: 'bg-amber-100 text-amber-800',
		Definitief: 'bg-blue-100 text-blue-800',
	};
	const cls = colors[status] || 'bg-charcoal-900/10 text-charcoal-900/70';
	return (
		<span
			className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}
		>
			{status}
		</span>
	);
}

function collectCrew(
	pascal: boolean | null | undefined,
	jip: boolean | null | undefined,
	inhuur: string | null | undefined,
): string {
	const parts: string[] = [];
	if (pascal) parts.push('Pascal');
	if (jip) parts.push('Jip');
	if (inhuur && inhuur.trim()) parts.push(inhuur.trim());
	return parts.join(' · ');
}

function formatDate(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}-${m[2]}`;
}

function formatTime(time: string | null | undefined): string {
	if (!time) return '';
	const m = time.match(/^(\d{2}):(\d{2})/);
	if (!m) return '';
	return ` · ${m[1]}:${m[2]}`;
}

function formatTimeRange(
	start: string | null | undefined,
	end: string | null | undefined,
): string {
	const s = formatTime(start).replace(' · ', '');
	const e = formatTime(end).replace(' · ', '');
	if (s && e) return ` · ${s} — ${e}`;
	if (s) return ` · ${s}`;
	return '';
}

function groupByCategory(
	items: ProjectLineItem[],
): [string, ProjectLineItem[]][] {
	const map = new Map<string, ProjectLineItem[]>();
	for (const it of items) {
		const cat = it.categorie || 'Overig';
		if (!map.has(cat)) map.set(cat, []);
		map.get(cat)!.push(it);
	}
	return Array.from(map.entries());
}
