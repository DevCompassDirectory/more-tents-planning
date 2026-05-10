import {
	type DayGroup,
	type DayEvent,
	formatRangeLabel,
	formatDayLabel,
	getDayName,
} from '@/lib/planning/print';

type Props = {
	groups: DayGroup[];
	from: string;
	to: string;
	statussen: string[];
	total: number;
};

function renderInhuurLabel(s: string | null): string {
	if (!s) return '';
	const t = s.trim();
	if (!t) return '';
	if (/^\d+$/.test(t)) return `${t} inhuur`;
	return t;
}

function shortDate(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}-${m[2]}`;
}

type Row = DayEvent & { date: string };

export function PrintFormatB({ groups, from, to, statussen, total }: Props) {
	const generated = formatDayLabel(new Date().toISOString().slice(0, 10));
	const filterLabel =
		statussen.length === 0 ? 'Alle statussen' : statussen.join(', ');

	const rows: Row[] = groups.flatMap((g) =>
		g.events.map((e) => ({ ...e, date: g.date })),
	);

	const eventCount = rows.length;
	const workDays = groups.filter((g) => g.events.length > 0).length;
	const emptyDays = groups.length - workDays;

	return (
		<article className='max-w-[760px] mx-auto bg-white text-charcoal-900 px-6 py-4'>
			<header className='flex justify-between items-start border-b border-sand-400 pb-2.5 mb-4'>
				<div>
					<div className='text-lg font-medium text-forest-500'>
						More Tents Planning
					</div>
					<div className='text-xs text-charcoal-900/60'>
						{formatRangeLabel(from, to)}
					</div>
				</div>
				<div className='text-right text-xs text-charcoal-900/60'>
					<div>Gegenereerd {generated}</div>
					<div>Filter: {filterLabel}</div>
				</div>
			</header>

			{rows.length === 0 ? (
				<div className='text-sm text-charcoal-900/60 italic py-8 text-center'>
					Geen events in deze periode.
				</div>
			) : (
				<table className='w-full text-xs border-collapse'>
					<thead>
						<tr className='bg-forest-500 text-white'>
							<th className='text-left px-2 py-1.5 font-medium whitespace-nowrap'>
								Datum
							</th>
							<th className='text-left px-1 py-1.5 font-medium w-8'></th>
							<th className='text-left px-2 py-1.5 font-medium'>
								Klant / Locatie
							</th>
							<th className='text-left px-2 py-1.5 font-medium whitespace-nowrap'>
								Tijd
							</th>
							<th className='text-left px-2 py-1.5 font-medium'>
								Crew
							</th>
							<th className='text-right px-2 py-1.5 font-medium whitespace-nowrap'>
								Mu
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row, i) => (
							<EventRow
								key={`${row.project.id}-${row.type}-${i}`}
								row={row}
							/>
						))}
					</tbody>
				</table>
			)}

			<footer className='mt-4 pt-2.5 border-t border-sand-400 flex justify-between items-center text-xs text-charcoal-900/70 gap-3'>
				<span>
					{eventCount} {eventCount === 1 ? 'event' : 'events'} op{' '}
					{workDays} {workDays === 1 ? 'werkdag' : 'werkdagen'}
					{emptyDays > 0
						? ` · ${emptyDays} dag${emptyDays === 1 ? '' : 'en'} zonder werk`
						: ''}
				</span>
				<span className='font-medium text-forest-500 whitespace-nowrap'>
					Totaal: {total} manuur
				</span>
			</footer>
		</article>
	);
}

function EventRow({ row }: { row: Row }) {
	const opbouw = row.type === 'opbouw';
	const pillClasses = opbouw
		? 'bg-green-100 text-green-800'
		: 'bg-amber-100 text-amber-800';
	const pillLabel = opbouw ? 'OP' : 'AF';

	const namen: string[] = [];
	if (row.pascal) namen.push('Pascal');
	if (row.jip) namen.push('Jip');
	const inhuur = renderInhuurLabel(row.inhuur);
	if (inhuur) namen.push(inhuur);

	const trim5 = (s: string) => s.slice(0, 5);
	const tijd =
		row.startTime && row.endTime
			? `${trim5(row.startTime)} - ${trim5(row.endTime)}`
			: row.startTime
				? `vanaf ${trim5(row.startTime)}`
				: '—';

	const manuLabel = row.manuren === null ? '—' : `${row.manuren}`;
	const klant = row.project.klant_naam || 'Onbekende klant';
	const locatie = row.project.locatie || '';

	return (
		<tr className='border-b border-cream-300/60 last:border-b-0 align-top'>
			<td className='px-2 py-1 whitespace-nowrap'>
				{getDayName(row.date)} {shortDate(row.date)}
			</td>
			<td className='px-1 py-1'>
				<span
					className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wider ${pillClasses}`}
				>
					{pillLabel}
				</span>
			</td>
			<td className='px-2 py-1'>
				<div>{klant}</div>
				{locatie && (
					<div className='text-charcoal-900/60'>{locatie}</div>
				)}
			</td>
			<td className='px-2 py-1 whitespace-nowrap'>{tijd}</td>
			<td className='px-2 py-1'>
				{row.aantalMan > 0 ? (
					<>
						<span>{row.aantalMan} man</span>
						{namen.length > 0 && (
							<div className='text-charcoal-900/60 text-[11px]'>
								{namen.join(', ')}
							</div>
						)}
					</>
				) : (
					<span className='text-charcoal-900/40'>—</span>
				)}
			</td>
			<td className='px-2 py-1 text-right whitespace-nowrap'>
				{manuLabel}
			</td>
		</tr>
	);
}
