'use client';

import { useState } from 'react';
import type { Project } from '@/lib/types/database';
import { statusBadgeClasses } from '@/lib/projects/status';
import { formatDate, formatTime } from '@/lib/utils/date';
import { isUnseen } from '@/lib/projects/seen';
import { markAsSeen, deleteProject } from '@/lib/projects/actions';
import { ProjectFiles } from '@/components/ProjectFiles';
import { PakbonOverlay } from '@/components/PakbonOverlay';

export function ProjectDetail({
	project: p,
	currentUserEmail,
	onClose,
	onEdit,
}: {
	project: Project;
	currentUserEmail: string;
	onClose: () => void;
	onEdit: () => void;
}) {
	const unseen = isUnseen(p, currentUserEmail);
	const [pakbonOpen, setPakbonOpen] = useState(false);

	async function handleMarkAsSeen() {
		const result = await markAsSeen(p.id);
		if (result.error) {
			window.alert(result.error);
		} else {
			onClose();
		}
	}
	async function handleDelete() {
		const naam = p.klant_naam || 'naamloos';
		if (
			!window.confirm(
				`Project "${naam}" verwijderen? Dit kan niet ongedaan worden gemaakt.`,
			)
		) {
			return;
		}
		const result = await deleteProject(p.id);
		if (result.error) {
			window.alert(result.error);
			return;
		}
		onClose();
	}

	return (
		<>
			<div>
				<div className='px-7 pt-6 pb-4'>
					<div className='flex items-center gap-3 mb-5'>
						<span
							className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-lg ${statusBadgeClasses(p.status)}`}
						>
							{p.status}
						</span>
						<span className='text-sm text-charcoal-900/60'>
							{p.offerte_nr || 'geen offerte nr'}
						</span>
					</div>

					<Grid>
						<DetailItem
							label='Klant'
							value={p.klant_naam || '—'}
						/>
						<DetailItem
							label='Locatie'
							value={p.locatie || '—'}
						/>
					</Grid>

					<Grid>
						<DetailItem
							label='Opbouw'
							value={
								p.datum_opbouw
									? `${formatDate(p.datum_opbouw)}  ${formatTime(p.tijd_opbouw)}${
											p.eindtijd_opbouw
												? ` – ${formatTime(p.eindtijd_opbouw)}`
												: ''
										}`
									: '—'
							}
						/>
						<DetailItem
							label='Afbouw'
							value={
								p.datum_afbouw
									? `${formatDate(p.datum_afbouw)}  ${formatTime(p.tijd_afbouw)}${
											p.eindtijd_afbouw
												? ` – ${formatTime(p.eindtijd_afbouw)}`
												: ''
										}`
									: '—'
							}
						/>
					</Grid>

					{(p.laad_datum_opbouw || p.laad_datum_afbouw) && (
						<Grid>
							{p.laad_datum_opbouw ? (
								<DetailItem
									label='Laden opbouw'
									value={`${formatDate(p.laad_datum_opbouw)}  ${formatTime(p.laad_tijd_opbouw)}`}
								/>
							) : (
								<div />
							)}
							{p.laad_datum_afbouw ? (
								<DetailItem
									label='Lossen afbouw'
									value={`${formatDate(p.laad_datum_afbouw)}  ${formatTime(p.laad_tijd_afbouw)}`}
								/>
							) : (
								<div />
							)}
						</Grid>
					)}

					<Grid>
						<div>
							<div className='text-xs font-bold uppercase tracking-wider text-charcoal-900/60 mb-1.5'>
								Team opbouw
							</div>
							<CrewIndicator
								label='Pascal'
								present={p.pascal_opbouw}
							/>
							<CrewIndicator
								label='Jip'
								present={p.jip_opbouw}
							/>
							{p.inhuur_opbouw && (
								<CrewIndicator
									label={p.inhuur_opbouw}
									present={true}
								/>
							)}
						</div>
						<div>
							<div className='text-xs font-bold uppercase tracking-wider text-charcoal-900/60 mb-1.5'>
								Team afbouw
							</div>
							<CrewIndicator
								label='Pascal'
								present={p.pascal_afbouw}
							/>
							<CrewIndicator
								label='Jip'
								present={p.jip_afbouw}
							/>
							{p.inhuur_afbouw && (
								<CrewIndicator
									label={p.inhuur_afbouw}
									present={true}
								/>
							)}
						</div>
					</Grid>

					{p.notities && (
						<div className='mt-4 mb-4'>
							<div className='text-xs font-bold uppercase tracking-wider text-charcoal-900/60 mb-1.5'>
								Notities
							</div>
							<div className='text-sm leading-relaxed'>
								{p.notities}
							</div>
						</div>
					)}

					<div className='mt-4'>
						<ProjectFiles project={p} />
					</div>

					{p.changes && p.changes.length > 0 && (
						<div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4'>
							<div className='text-xs font-bold uppercase tracking-wider text-orange-800 mb-2'>
								Wijzigingshistorie
							</div>
							{p.changes
								.slice()
								.reverse()
								.map((entry, i) => (
									<div
										key={i}
										className='mb-3 pb-3 border-b border-orange-200 last:border-b-0 last:mb-0 last:pb-0'
									>
										{entry.changes.map((c, j) => (
											<div
												key={j}
												className='text-sm text-orange-800 mb-1'
											>
												<span className='font-medium'>
													{c.field}:
												</span>{' '}
												&ldquo;{c.old}&rdquo; → &ldquo;
												{c.new}&rdquo;
											</div>
										))}
										{entry.note && (
											<div className='text-xs text-orange-700 italic mt-1'>
												&ldquo;{entry.note}&rdquo;
											</div>
										)}
										<div className='text-xs text-orange-700 mt-1'>
											door {entry.by} op{' '}
											{new Date(entry.at).toLocaleString(
												'nl-NL',
												{
													dateStyle: 'short',
													timeStyle: 'short',
												},
											)}
										</div>
									</div>
								))}
							{unseen && (
								<button
									type='button'
									onClick={handleMarkAsSeen}
									className='mt-2 px-3 py-1.5 text-xs font-medium bg-white border border-orange-300 text-orange-800 hover:bg-orange-100 rounded-lg transition-colors'
								>
									Als gezien markeren ✓
								</button>
							)}
						</div>
					)}
				</div>

				<div className='px-5 sm:px-7 py-3 sm:py-4 border-t border-cream-300 sticky bottom-0 bg-white'>
					<div className='grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3'>
						<button
							type='button'
							onClick={() => setPakbonOpen(true)}
							className='px-4 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg transition-colors text-sm'
						>
							📋 Pakbon
						</button>
						<button
							type='button'
							onClick={handleDelete}
							className='px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors text-sm'
						>
							🗑 Verwijderen
						</button>
						<div className='hidden sm:block sm:flex-1' />
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg transition-colors text-sm'
						>
							Sluiten
						</button>
						<button
							type='button'
							onClick={onEdit}
							className='px-4 py-2.5 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg transition-colors text-sm'
						>
							Bewerken
						</button>
					</div>
				</div>
			</div>

			{pakbonOpen && (
				<PakbonOverlay
					project={p}
					onClose={() => setPakbonOpen(false)}
				/>
			)}
		</>
	);
}

function Grid({ children }: { children: React.ReactNode }) {
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
			{children}
		</div>
	);
}

function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<div className='text-xs font-bold uppercase tracking-wider text-charcoal-900/60 mb-1.5'>
				{label}
			</div>
			<div className='text-sm'>{value}</div>
		</div>
	);
}

function CrewIndicator({
	label,
	present,
}: {
	label: string;
	present: boolean;
}) {
	return (
		<div className='flex items-center gap-2 text-sm mb-1'>
			<span
				className={`w-2 h-2 rounded-lg shrink-0 ${
					present ? 'bg-forest-500' : 'bg-gray-300'
				}`}
			/>
			<span>
				{label}: {present ? 'aanwezig' : 'niet aanwezig'}
			</span>
		</div>
	);
}
