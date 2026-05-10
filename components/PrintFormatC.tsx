import {
	type DayGroup,
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

type CellEvent = {
	type: 'opbouw' | 'afbouw';
	klant: string;
};

function shortKlant(name: string): string {
	if (!name) return '?';
	const first = name.split(/\s+/)[0];
	return first.slice(0, 3);
}

function shortDate(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}-${m[2]}`;
}

function isWeekend(iso: string): boolean {
	const d = new Date(iso + 'T00:00:00');
	const day = d.getDay();
	return day === 0 || day === 6;
}

function isFixedMember(name: string): boolean {
	return name === 'Pascal' || name === 'Jip';
}

function chunk<T>(array: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		out.push(array.slice(i, i + size));
	}
	return out;
}

const CREW_COL_WIDTH = 90;
const DAY_COL_WIDTH = 80;
const PRINT_CHUNK_SIZE = 11; // max dagen per A4-landscape pagina

export function PrintFormatC({ groups, from, to, statussen, total }: Props) {
	const generated = formatDayLabel(new Date().toISOString().slice(0, 10));
	const filterLabel =
		statussen.length === 0 ? 'Alle statussen' : statussen.join(', ');

	const cellMap = new Map<string, Map<string, CellEvent[]>>();

	for (const g of groups) {
		const memberMap = new Map<string, CellEvent[]>();
		for (const e of g.events) {
			const cell: CellEvent = {
				type: e.type,
				klant: e.project.klant_naam || '?',
			};
			if (e.pascal) {
				const list = memberMap.get('Pascal') ?? [];
				list.push(cell);
				memberMap.set('Pascal', list);
			}
			if (e.jip) {
				const list = memberMap.get('Jip') ?? [];
				list.push(cell);
				memberMap.set('Jip', list);
			}
			if (e.inhuur) {
				const trimmed = e.inhuur.trim();
				if (trimmed && !/^\d+$/.test(trimmed)) {
					for (const name of trimmed
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)) {
						const list = memberMap.get(name) ?? [];
						list.push(cell);
						memberMap.set(name, list);
					}
				}
			}
		}
		cellMap.set(g.date, memberMap);
	}

	const memberSet = new Set<string>(['Pascal', 'Jip']);
	for (const memberMap of cellMap.values()) {
		for (const name of memberMap.keys()) {
			memberSet.add(name);
		}
	}

	const members = Array.from(memberSet).sort((a, b) => {
		if (a === 'Pascal' && b !== 'Pascal') return -1;
		if (b === 'Pascal' && a !== 'Pascal') return 1;
		if (a === 'Jip' && b !== 'Jip') return -1;
		if (b === 'Jip' && a !== 'Jip') return 1;
		return a.localeCompare(b);
	});

	const dates = groups.map((g) => g.date);
	const dayCount = dates.length;
	const dateChunks = chunk(dates, PRINT_CHUNK_SIZE);

	return (
		<article className='print:max-w-none mx-auto bg-white text-charcoal-900 px-6 py-4'>
			{dayCount > 7 && (
				<style>{`@media print { @page { size: A4 landscape; margin: 14mm 18mm; } }`}</style>
			)}

			<header className='flex justify-between items-start border-b border-sand-400 pb-2.5 mb-4'>
				<div>
					<div className='text-lg font-medium text-forest-500'>
						More Tents Planning · Crew rooster
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

			{dayCount === 0 ? (
				<div className='text-sm text-charcoal-900/60 italic py-8 text-center'>
					Geen dagen in deze periode.
				</div>
			) : (
				<>
					{/* Schermweergave: één scrollbare tabel met sticky Crew kolom */}
					<div className='overflow-x-auto print:hidden'>
						<CrewTable
							dates={dates}
							members={members}
							cellMap={cellMap}
						/>
					</div>

					{/* Printweergave: tabel in chunks van max 11 dagen,
					    elk op een eigen pagina */}
					<div className='hidden print:block'>
						{dateChunks.map((chunkDates, i) => (
							<div
								key={i}
								className={i > 0 ? 'break-before-page' : ''}
							>
								<CrewTable
									dates={chunkDates}
									members={members}
									cellMap={cellMap}
								/>
							</div>
						))}
					</div>
				</>
			)}

			<div className='mt-3 flex flex-wrap gap-3 text-[11px] text-charcoal-900/60'>
				<span className='flex items-center gap-1'>
					<span className='inline-block w-3 h-3 rounded-lg bg-green-100 border border-green-200' />
					Opbouw
				</span>
				<span className='flex items-center gap-1'>
					<span className='inline-block w-3 h-3 rounded-lg bg-amber-100 border border-amber-200' />
					Afbouw
				</span>
				<span className='italic'>
					Anonieme inhuur (alleen aantal) niet weergegeven.
				</span>
			</div>

			<footer className='mt-3 pt-2.5 border-t border-sand-400 flex justify-between items-center text-xs text-charcoal-900/70 gap-3'>
				<span>
					{members.length}{' '}
					{members.length === 1 ? 'crew member' : 'crew members'} over{' '}
					{dayCount} {dayCount === 1 ? 'dag' : 'dagen'}
				</span>
				<span className='font-medium text-forest-500 whitespace-nowrap'>
					Totaal: {total} manuur
				</span>
			</footer>

			{dayCount > 7 && (
				<div className='no-print mt-3 text-[11px] text-charcoal-900/60 italic'>
					Deze periode wordt automatisch liggend afgedrukt
					{dayCount > PRINT_CHUNK_SIZE &&
						`, verdeeld over ${dateChunks.length} pagina's`}
					.
				</div>
			)}
		</article>
	);
}

function CrewTable({
	dates,
	members,
	cellMap,
}: {
	dates: string[];
	members: string[];
	cellMap: Map<string, Map<string, CellEvent[]>>;
}) {
	const dayCount = dates.length;
	return (
		<table
			className='text-xs border-collapse'
			style={{
				tableLayout: 'fixed',
				width: CREW_COL_WIDTH + DAY_COL_WIDTH * dayCount,
			}}
		>
			<colgroup>
				<col style={{ width: CREW_COL_WIDTH }} />
				{dates.map((d) => (
					<col
						key={d}
						style={{ width: DAY_COL_WIDTH }}
					/>
				))}
			</colgroup>
			<thead>
				<tr>
					<th className='text-left px-2 py-1 font-medium bg-forest-500 text-white sticky left-0 z-20'>
						Crew
					</th>
					{dates.map((d) => (
						<th
							key={d}
							className={`px-1 py-1 font-medium text-center border-l border-forest-600 ${
								isWeekend(d)
									? 'bg-forest-600 text-white/85'
									: 'bg-forest-500 text-white'
							}`}
						>
							<div className='text-[10px] font-normal opacity-80'>
								{getDayName(d)}
							</div>
							<div>{shortDate(d)}</div>
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{members.map((m) => {
					const isFixed = isFixedMember(m);
					return (
						<tr
							key={m}
							className='border-b border-cream-300/60 last:border-b-0'
						>
							<td
								className={`px-2 py-1 whitespace-nowrap font-medium bg-white truncate sticky left-0 z-10 ${
									isFixed
										? 'text-forest-600'
										: 'text-charcoal-900'
								}`}
							>
								{m}
							</td>
							{dates.map((d) => {
								const events = cellMap.get(d)?.get(m) ?? [];
								const weekendBg = isWeekend(d)
									? 'bg-paper-50'
									: '';
								return (
									<td
										key={d}
										className={`px-1 py-1 border-l border-cream-300/60 align-top ${weekendBg}`}
									>
										<div className='space-y-0.5'>
											{events.map((ev, i) => (
												<div
													key={i}
													title={`${ev.klant} (${ev.type})`}
													className={`text-[9px] px-1 py-0.5 rounded-lg font-medium text-center truncate ${
														ev.type === 'opbouw'
															? 'bg-green-100 text-green-800'
															: 'bg-amber-100 text-amber-800'
													}`}
												>
													{shortKlant(ev.klant)}
												</div>
											))}
										</div>
									</td>
								);
							})}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}
