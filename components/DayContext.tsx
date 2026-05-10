'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type ProjectActivity = {
	id: string;
	offerte_nr: string;
	klant_naam: string;
	locatie: string;
	labels: { kind: string; tijd?: string }[];
	pascal: boolean;
	jip: boolean;
	inhuur: string[];
};

type DbRow = {
	id: string;
	offerte_nr: string | null;
	klant_naam: string | null;
	locatie: string | null;
	datum_opbouw: string | null;
	datum_afbouw: string | null;
	tijd_opbouw: string | null;
	eindtijd_opbouw: string | null;
	tijd_afbouw: string | null;
	eindtijd_afbouw: string | null;
	laad_datum_opbouw: string | null;
	laad_tijd_opbouw: string | null;
	laad_datum_afbouw: string | null;
	laad_tijd_afbouw: string | null;
	pascal_opbouw: boolean | null;
	pascal_afbouw: boolean | null;
	jip_opbouw: boolean | null;
	jip_afbouw: boolean | null;
	inhuur_opbouw: string | null;
	inhuur_afbouw: string | null;
};

const FIELDS =
	'id,offerte_nr,klant_naam,locatie,datum_opbouw,datum_afbouw,tijd_opbouw,eindtijd_opbouw,tijd_afbouw,eindtijd_afbouw,laad_datum_opbouw,laad_tijd_opbouw,laad_datum_afbouw,laad_tijd_afbouw,pascal_opbouw,pascal_afbouw,jip_opbouw,jip_afbouw,inhuur_opbouw,inhuur_afbouw';

export function DayContext({
	date,
	currentInhuur,
	excludeProjectId,
	onAddInhuur,
}: {
	date: string;
	currentInhuur: string;
	excludeProjectId?: string;
	onAddInhuur: (name: string) => void;
}) {
	const [activities, setActivities] = useState<ProjectActivity[]>([]);

	useEffect(() => {
		if (!date) {
			setActivities([]);
			return;
		}

		let cancelled = false;

		async function load() {
			const supabase = createClient();
			const { data, error } = await supabase
				.from('projects')
				.select(FIELDS)
				.or(
					`datum_opbouw.eq.${date},datum_afbouw.eq.${date},laad_datum_opbouw.eq.${date},laad_datum_afbouw.eq.${date}`,
				);

			if (cancelled) return;

			if (error) {
				console.error('DayContext load error:', error);
				setActivities([]);
				return;
			}

			const rows = (data ?? []) as DbRow[];
			const list = rows
				.filter((p) => p.id !== excludeProjectId)
				.map((p) => projectToActivity(p, date));
			setActivities(list);
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [date, excludeProjectId]);

	if (!date || activities.length === 0) return null;

	const currentNames = currentInhuur
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);

	return (
		<div className='bg-amber-50 border-l-[3px] border-amber-500 rounded-r-lg p-3.5 mb-4'>
			<div className='text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-2.5'>
				📅{' '}
				{activities.length === 1
					? '1 ander project'
					: `${activities.length} andere projecten`}{' '}
				op {formatDateNL(date)}
			</div>
			<div className='space-y-1.5'>
				{activities.map((a) => (
					<div
						key={a.id}
						className='bg-white rounded-lg border border-cream-300 px-3 py-2'
					>
						<div className='mb-1.5'>
							<div className='text-sm font-medium text-charcoal-900 truncate'>
								{a.offerte_nr && (
									<span className='text-charcoal-900/50 font-normal mr-1.5'>
										{a.offerte_nr}
									</span>
								)}
								{a.klant_naam || '—'}
							</div>
							<div className='text-xs text-charcoal-900/60 truncate'>
								{a.locatie ? `${a.locatie} • ` : ''}
								{a.labels
									.map(
										(l) =>
											`${l.kind}${l.tijd ? ' ' + l.tijd : ''}`,
									)
									.join(', ')}
							</div>
						</div>
						<div className='flex flex-wrap gap-1'>
							{a.pascal && <PersonChip name='Pascal' />}
							{a.jip && <PersonChip name='Jip' />}
							{a.inhuur.map((name) => (
								<InhuurChip
									key={name}
									name={name}
									alreadyAdded={currentNames.includes(name)}
									onAdd={() => onAddInhuur(name)}
								/>
							))}
						</div>
					</div>
				))}
			</div>
			<div className='text-[11px] text-amber-800/80 mt-2 leading-relaxed'>
				Klik op een inhuur-naam om die over te nemen.
			</div>
		</div>
	);
}

function PersonChip({ name }: { name: string }) {
	return (
		<span className='text-[11px] px-2 py-0.5 bg-forest-50 text-forest-600 rounded-lg font-medium'>
			{name}
		</span>
	);
}

function InhuurChip({
	name,
	alreadyAdded,
	onAdd,
}: {
	name: string;
	alreadyAdded: boolean;
	onAdd: () => void;
}) {
	if (alreadyAdded) {
		return (
			<span className='text-[11px] px-2 py-0.5 bg-forest-50 text-forest-600 rounded-lg font-medium'>
				✓ {name}
			</span>
		);
	}
	return (
		<button
			type='button'
			onClick={onAdd}
			className='text-[11px] px-2 py-0.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 border border-cream-300 rounded-lg transition-colors'
		>
			+ {name}
		</button>
	);
}

function projectToActivity(p: DbRow, date: string): ProjectActivity {
	const trim5 = (s: string | null) => (s ? s.slice(0, 5) : undefined);
	const labels: { kind: string; tijd?: string }[] = [];

	if (p.datum_opbouw === date) {
		const start = trim5(p.tijd_opbouw);
		const end = trim5(p.eindtijd_opbouw);
		labels.push({
			kind: 'opbouw',
			tijd: start ? `${start}${end ? '-' + end : ''}` : undefined,
		});
	}
	if (p.datum_afbouw === date) {
		const start = trim5(p.tijd_afbouw);
		const end = trim5(p.eindtijd_afbouw);
		labels.push({
			kind: 'afbouw',
			tijd: start ? `${start}${end ? '-' + end : ''}` : undefined,
		});
	}
	if (
		p.laad_datum_opbouw === date &&
		p.laad_datum_opbouw !== p.datum_opbouw
	) {
		labels.push({ kind: 'laden', tijd: trim5(p.laad_tijd_opbouw) });
	}
	if (
		p.laad_datum_afbouw === date &&
		p.laad_datum_afbouw !== p.datum_afbouw
	) {
		labels.push({ kind: 'lossen', tijd: trim5(p.laad_tijd_afbouw) });
	}

	const opbouwActief =
		p.datum_opbouw === date || p.laad_datum_opbouw === date;
	const afbouwActief =
		p.datum_afbouw === date || p.laad_datum_afbouw === date;

	const pascal =
		(opbouwActief && !!p.pascal_opbouw) ||
		(afbouwActief && !!p.pascal_afbouw);
	const jip =
		(opbouwActief && !!p.jip_opbouw) || (afbouwActief && !!p.jip_afbouw);

	const inhuurSet = new Set<string>();
	if (opbouwActief && p.inhuur_opbouw) {
		p.inhuur_opbouw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.forEach((n) => inhuurSet.add(n));
	}
	if (afbouwActief && p.inhuur_afbouw) {
		p.inhuur_afbouw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.forEach((n) => inhuurSet.add(n));
	}

	return {
		id: p.id,
		offerte_nr: p.offerte_nr ?? '',
		klant_naam: p.klant_naam ?? '',
		locatie: p.locatie ?? '',
		labels,
		pascal,
		jip,
		inhuur: Array.from(inhuurSet),
	};
}

function formatDateNL(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	const months = [
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
	return `${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}
