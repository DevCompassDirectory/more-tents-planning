import { createClient } from '@/lib/supabase/server';
import {
	type PrintProject,
	type DayGroup,
	type DayEvent,
	filterProjectsByStatus,
	filterProjectsInRange,
	buildDayGroups,
	totalManuren,
	formatRangeLabel,
	formatDayLabel,
} from '@/lib/planning/print';
import { PrintActions } from './PrintActions';
import './print.css';

const FIELDS =
	'id,offerte_nr,klant_naam,locatie,status,datum_opbouw,tijd_opbouw,eindtijd_opbouw,datum_afbouw,tijd_afbouw,eindtijd_afbouw,pascal_opbouw,pascal_afbouw,jip_opbouw,jip_afbouw,inhuur_opbouw,inhuur_afbouw,notities';

type SearchParams = Promise<{
	from?: string;
	to?: string;
	statussen?: string;
}>;

function todayPlus(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d.toISOString().slice(0, 10);
}

function renderInhuurLabel(s: string | null): string {
	if (!s) return '';
	const t = s.trim();
	if (!t) return '';
	if (/^\d+$/.test(t)) return `${t} inhuur`;
	return t;
}

export default async function PrintPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	const params = await searchParams;
	const from = params.from ?? todayPlus(0);
	const to = params.to ?? todayPlus(13);
	const statussen =
		params.statussen
			?.split(',')
			.map((s) => s.trim())
			.filter(Boolean) ?? [];

	const supabase = await createClient();
	const { data, error } = await supabase
		.from('projects')
		.select(FIELDS)
		.or(`datum_opbouw.gte.${from},datum_afbouw.gte.${from}`);

	if (error) {
		return (
			<div className='planning-print-page'>
				<PrintActions />
				<p style={{ color: '#dc2626' }}>
					Fout bij laden van projecten: {error.message}
				</p>
			</div>
		);
	}

	const all = (data ?? []) as PrintProject[];
	const inRange = filterProjectsInRange(all, from, to);
	const filtered = filterProjectsByStatus(inRange, statussen);
	const groups = buildDayGroups(filtered, from, to);
	const total = totalManuren(groups);
	const generated = formatDayLabel(new Date().toISOString().slice(0, 10));
	const filterLabel =
		statussen.length === 0 ? 'Alle statussen' : statussen.join(', ');

	return (
		<div className='planning-print-page'>
			<PrintActions />
			<article style={{ maxWidth: 760, margin: '0 auto' }}>
				<header
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						borderBottom: '1px solid #C1B994',
						paddingBottom: 10,
						marginBottom: 18,
					}}
				>
					<div>
						<div
							style={{
								fontSize: 18,
								fontWeight: 500,
								color: '#3F7855',
							}}
						>
							More Tents Planning
						</div>
						<div style={{ fontSize: 13, color: '#666' }}>
							{formatRangeLabel(from, to)}
						</div>
					</div>
					<div
						style={{
							textAlign: 'right',
							fontSize: 12,
							color: '#666',
						}}
					>
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

				<footer
					style={{
						marginTop: 16,
						paddingTop: 10,
						borderTop: '1px solid #C1B994',
						display: 'flex',
						justifyContent: 'space-between',
						fontSize: 14,
						fontWeight: 500,
						color: '#3F7855',
					}}
				>
					<span>Totaal voor periode</span>
					<span>{total} manuur</span>
				</footer>
			</article>
		</div>
	);
}

function DayBlock({ group }: { group: DayGroup }) {
	const isEmpty = group.events.length === 0;
	return (
		<div
			className='planning-day'
			style={{ marginBottom: 14 }}
		>
			<div
				style={{
					background: isEmpty ? '#E5E3DA' : '#3F7855',
					color: isEmpty ? '#666' : '#fff',
					padding: '5px 10px',
					borderRadius: 3,
					fontSize: 13,
					fontWeight: 500,
					display: 'flex',
					justifyContent: 'space-between',
					marginBottom: 6,
				}}
			>
				<span>{formatDayLabel(group.date)}</span>
				<span>{group.totalManuren} manuur</span>
			</div>
			{isEmpty ? (
				<div
					style={{
						fontSize: 12,
						color: '#999',
						fontStyle: 'italic',
						padding: '2px 0 6px',
					}}
				>
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
	const pillBg = opbouw ? '#DCFCE7' : '#FFEDD5';
	const pillColor = opbouw ? '#166534' : '#C2410C';
	const pillLabel = opbouw ? 'OP' : 'AF';

	const namen: string[] = [];
	if (event.pascal) namen.push('Pascal');
	if (event.jip) namen.push('Jip');
	const inhuur = renderInhuurLabel(event.inhuur);
	if (inhuur) namen.push(inhuur);

	const tijd =
		event.startTime && event.endTime
			? `${event.startTime} - ${event.endTime}`
			: event.startTime
				? `vanaf ${event.startTime}`
				: 'tijd onbekend';

	const manuLabel = event.manuren === null ? '—' : `${event.manuren} mu`;
	const showNotitie =
		opbouw &&
		event.project.notities &&
		event.project.notities.trim().length > 0;

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'auto 1fr auto',
				gap: 8,
				fontSize: 12,
				lineHeight: 1.5,
				padding: '3px 0',
				alignItems: 'start',
			}}
		>
			<span
				style={{
					background: pillBg,
					color: pillColor,
					padding: '1px 6px',
					borderRadius: 3,
					fontSize: 11,
					fontWeight: 500,
					letterSpacing: '0.03em',
					alignSelf: 'start',
					marginTop: 2,
				}}
			>
				{pillLabel}
			</span>
			<div>
				<div>
					{event.project.klant_naam ?? 'Onbekende klant'}
					{event.project.locatie ? ` · ${event.project.locatie}` : ''}
				</div>
				<div style={{ color: '#666' }}>
					{tijd} · {event.aantalMan} man
					{namen.length > 0 ? ` (${namen.join(', ')})` : ''}
				</div>
				{showNotitie ? (
					<div
						style={{
							color: '#888',
							fontStyle: 'italic',
							marginTop: 2,
						}}
					>
						Notitie: {event.project.notities}
					</div>
				) : null}
			</div>
			<span style={{ color: '#666', whiteSpace: 'nowrap' }}>
				{manuLabel}
			</span>
		</div>
	);
}
