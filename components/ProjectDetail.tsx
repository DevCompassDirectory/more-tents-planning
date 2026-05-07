'use client';

import type { Project } from '@/lib/types/database';
import { statusBadgeClasses } from '@/lib/projects/status';
import { formatDate, formatTime } from '@/lib/utils/date';

export function ProjectDetail({
	project: p,
	onClose,
}: {
	project: Project;
	onClose: () => void;
}) {
	return (
		<div>
			<div className='px-7 pt-6 pb-4'>
				<div className='flex items-center gap-3 mb-5'>
					<span
						className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${statusBadgeClasses(p.status)}`}
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
					<div className='mt-4'>
						<div className='text-xs font-bold uppercase tracking-wider text-charcoal-900/60 mb-1.5'>
							Notities
						</div>
						<div className='text-sm leading-relaxed'>
							{p.notities}
						</div>
					</div>
				)}
			</div>

			<div className='flex gap-3 px-7 py-4 border-t border-cream-300 sticky bottom-0 bg-white'>
				<button
					type='button'
					onClick={onClose}
					className='px-5 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-xl transition-colors'
				>
					Sluiten
				</button>
				<div className='flex-1' />
				<button
					type='button'
					disabled
					className='px-5 py-2.5 bg-forest-500/40 text-white font-medium rounded-xl cursor-not-allowed'
					title='Bewerken volgt in de volgende stap'
				>
					Bewerken
				</button>
			</div>
		</div>
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
				className={`w-2 h-2 rounded-full flex-shrink-0 ${
					present ? 'bg-forest-500' : 'bg-gray-300'
				}`}
			/>
			<span>
				{label}: {present ? 'aanwezig' : 'niet aanwezig'}
			</span>
		</div>
	);
}
