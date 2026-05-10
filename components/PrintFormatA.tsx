import {
	type DayGroup,
	type DayEvent,
	formatDayLabel,
	formatRangeLabel,
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

export function PrintFormatA({ groups, from, to, statussen, total }: Props) {
	const generated = formatDayLabel(new Date().toISOString().slice(0, 10));
	const filterLabel =
		statussen.length === 0 ? 'Alle statussen' : statussen.join(', ');

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

			{groups.map((g) => (
				<DayBlock
					key={g.date}
					group={g}
				/>
			))}

			<footer className='mt-4 pt-2.5 border-t border-sand-400 flex justify-between text-sm font-medium text-forest-500'>
				<span>Totaal voor periode</span>
				<span>{total} manuur</span>
			</footer>
		</article>
	);
}

function DayBlock({ group }: { group: DayGroup }) {
	const isEmpty = group.events.length === 0;
	return (
		<div className='planning-day mb-3.5'>
			<div
				className={`px-2.5 py-1 rounded text-sm font-medium flex justify-between items-center mb-1.5 ${
					isEmpty
						? 'bg-cream-300 text-charcoal-900/60'
						: 'bg-forest-500 text-white'
				}`}
			>
				<span>{formatDayLabel(group.date)}</span>
				<span>{group.totalManuren} manuur</span>
			</div>
			{isEmpty ? (
				<div className='text-xs text-charcoal-900/40 italic px-2 pb-1'>
					Geen werk
				</div>
			) : (
				group.events.map((e, i) => (
					<EventRow
						key={`${e.project.id}-${e.type}-${i}`}
						event={e}
					/>
				))
			)}
		</div>
	);
}

function EventRow({ event }: { event: DayEvent }) {
	const opbouw = event.type === 'opbouw';
	const pillClasses = opbouw
		? 'bg-green-100 text-green-800'
		: 'bg-amber-100 text-amber-800';
	const pillLabel = opbouw ? 'OP' : 'AF';

	const namen: string[] = [];
	if (event.pascal) namen.push('Pascal');
	if (event.jip) namen.push('Jip');
	const inhuur = renderInhuurLabel(event.inhuur);
	if (inhuur) namen.push(inhuur);

	const trim5 = (s: string) => s.slice(0, 5);
	const tijd =
		event.startTime && event.endTime
			? `${trim5(event.startTime)} - ${trim5(event.endTime)}`
			: event.startTime
				? `vanaf ${trim5(event.startTime)}`
				: 'tijd onbekend';

	const manuLabel = event.manuren === null ? '—' : `${event.manuren} mu`;

	const notitie = event.project.notities?.trim() ?? '';
	const showNotitie = opbouw && notitie.length > 0;

	const klant = event.project.klant_naam || 'Onbekende klant';
	const locatie = event.project.locatie ? ` · ${event.project.locatie}` : '';

	return (
		<div className='grid grid-cols-[auto_1fr_auto] gap-2 text-xs leading-snug py-0.5 items-start'>
			<span
				className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium tracking-wider mt-0.5 ${pillClasses}`}
			>
				{pillLabel}
			</span>
			<div>
				<div>
					{klant}
					{locatie}
				</div>
				<div className='text-charcoal-900/60'>
					{tijd} · {event.aantalMan} man
					{namen.length > 0 ? ` (${namen.join(', ')})` : ''}
				</div>
				{showNotitie && (
					<div className='text-charcoal-900/50 italic mt-0.5'>
						Notitie: {notitie}
					</div>
				)}
			</div>
			<span className='text-charcoal-900/60 whitespace-nowrap'>
				{manuLabel}
			</span>
		</div>
	);
}
