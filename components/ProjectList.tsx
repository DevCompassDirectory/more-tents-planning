import { getProjects } from '@/lib/projects/queries';
import { statusBadgeClasses, statusBorderClasses } from '@/lib/projects/status';
import { formatDate, formatTime } from '@/lib/utils/date';

export async function ProjectList() {
	const projects = await getProjects();

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
		<div className='space-y-3'>
			{projects.map((p) => (
				<article
					key={p.id}
					className={`bg-white border border-cream-300 rounded-2xl p-5 shadow-sm border-l-4 grid grid-cols-[1fr_auto] gap-4 items-start ${statusBorderClasses(p.status)}`}
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
						</div>
					</div>
					<span
						className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${statusBadgeClasses(p.status)}`}
					>
						{p.status}
					</span>
				</article>
			))}
		</div>
	);
}
