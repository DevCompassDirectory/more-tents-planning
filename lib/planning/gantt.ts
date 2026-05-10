import type { Project } from '@/lib/types/database';

export type GanttView = 'week' | 'maand' | 'kwartaal';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// === Parsers ===

export function parseGanttView(value: string | undefined | null): GanttView {
	if (value === 'week') return 'week';
	if (value === 'kwartaal') return 'kwartaal';
	return 'maand';
}

export function parseGanttDate(value: string | undefined | null): string {
	if (value && ISO_RE.test(value)) return value;
	return todayDate();
}

export function parseGanttStatussen(
	value: string | undefined | null,
): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

// === Date utilities ===

export function todayDate(): string {
	return fromDate(new Date());
}

function toDate(iso: string): Date {
	return new Date(iso + 'T12:00:00');
}

function fromDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${dd}`;
}

function nextDay(iso: string): string {
	const d = toDate(iso);
	d.setDate(d.getDate() + 1);
	return fromDate(d);
}

function prevDay(iso: string): string {
	const d = toDate(iso);
	d.setDate(d.getDate() - 1);
	return fromDate(d);
}

export function isWeekend(iso: string): boolean {
	const day = toDate(iso).getDay();
	return day === 0 || day === 6;
}

export function dayNumber(iso: string): number {
	return parseInt(iso.slice(8, 10), 10);
}

const NL_DAGEN_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

export function dayName(iso: string): string {
	const d = toDate(iso);
	const idx = (d.getDay() + 6) % 7;
	return NL_DAGEN_KORT[idx];
}

// === Period range ===

export type GanttPeriod = {
	from: string;
	to: string;
	days: string[];
};

export function ganttPeriodRange(view: GanttView, date: string): GanttPeriod {
	const d = toDate(date);
	switch (view) {
		case 'week': {
			const day = d.getDay();
			const offset = day === 0 ? -6 : 1 - day;
			const monday = new Date(d);
			monday.setDate(monday.getDate() + offset);
			const days: string[] = [];
			for (let i = 0; i < 7; i++) {
				const dd = new Date(monday);
				dd.setDate(monday.getDate() + i);
				days.push(fromDate(dd));
			}
			return { from: days[0], to: days[6], days };
		}
		case 'maand': {
			const start = new Date(d.getFullYear(), d.getMonth(), 1, 12);
			const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
			const days: string[] = [];
			for (
				let dd = new Date(start);
				dd <= end;
				dd.setDate(dd.getDate() + 1)
			) {
				days.push(fromDate(dd));
			}
			return { from: days[0], to: days[days.length - 1], days };
		}
		case 'kwartaal': {
			const q = Math.floor(d.getMonth() / 3);
			const start = new Date(d.getFullYear(), q * 3, 1, 12);
			const end = new Date(d.getFullYear(), q * 3 + 3, 0, 12);
			const days: string[] = [];
			for (
				let dd = new Date(start);
				dd <= end;
				dd.setDate(dd.getDate() + 1)
			) {
				days.push(fromDate(dd));
			}
			return { from: days[0], to: days[days.length - 1], days };
		}
	}
}

// === Period nav ===

export function prevGanttPeriod(view: GanttView, date: string): string {
	const d = toDate(date);
	switch (view) {
		case 'week':
			d.setDate(d.getDate() - 7);
			break;
		case 'maand':
			d.setMonth(d.getMonth() - 1);
			break;
		case 'kwartaal':
			d.setMonth(d.getMonth() - 3);
			break;
	}
	return fromDate(d);
}

export function nextGanttPeriod(view: GanttView, date: string): string {
	const d = toDate(date);
	switch (view) {
		case 'week':
			d.setDate(d.getDate() + 7);
			break;
		case 'maand':
			d.setMonth(d.getMonth() + 1);
			break;
		case 'kwartaal':
			d.setMonth(d.getMonth() + 3);
			break;
	}
	return fromDate(d);
}

// === Period label ===

const NL_MAANDEN = [
	'januari',
	'februari',
	'maart',
	'april',
	'mei',
	'juni',
	'juli',
	'augustus',
	'september',
	'oktober',
	'november',
	'december',
];
const NL_MAANDEN_KORT = [
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

export function getISOWeekNumber(iso: string): number {
	const d = toDate(iso);
	const target = new Date(d.valueOf());
	const dayNr = (d.getDay() + 6) % 7;
	target.setDate(target.getDate() - dayNr + 3);
	const firstThursday = target.valueOf();
	target.setMonth(0, 1);
	if (target.getDay() !== 4) {
		target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
	}
	return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export function formatGanttPeriodLabel(view: GanttView, date: string): string {
	const { from, to } = ganttPeriodRange(view, date);
	const fromD = toDate(from);
	const toD = toDate(to);

	switch (view) {
		case 'week': {
			const weekNr = getISOWeekNumber(from);
			const fd = fromD.getDate();
			const fm = NL_MAANDEN_KORT[fromD.getMonth()];
			const td = toD.getDate();
			const tm = NL_MAANDEN_KORT[toD.getMonth()];
			const ty = toD.getFullYear();
			if (fromD.getMonth() === toD.getMonth()) {
				return `Week ${weekNr} · ${fd} t/m ${td} ${tm} ${ty}`;
			}
			return `Week ${weekNr} · ${fd} ${fm} t/m ${td} ${tm} ${ty}`;
		}
		case 'maand': {
			const m = NL_MAANDEN[fromD.getMonth()];
			const y = fromD.getFullYear();
			return `${m.charAt(0).toUpperCase() + m.slice(1)} ${y}`;
		}
		case 'kwartaal': {
			const q = Math.floor(fromD.getMonth() / 3) + 1;
			const fm = NL_MAANDEN_KORT[fromD.getMonth()];
			const tm = NL_MAANDEN_KORT[toD.getMonth()];
			const y = fromD.getFullYear();
			return `Q${q} · ${fm} t/m ${tm} ${y}`;
		}
	}
}

// === URL ===

export function ganttHref(
	view: GanttView,
	date: string,
	statussen: string[] = [],
): string {
	const params = new URLSearchParams({ tab: 'gantt', view, date });
	if (statussen.length > 0) {
		params.set('status', statussen.join(','));
	}
	return `/?${params.toString()}`;
}

// === Project segments ===

export type GanttSegmentType = 'load' | 'op' | 'stand' | 'af' | 'unload';

export type GanttSegment = {
	type: GanttSegmentType;
	from: string;
	to: string;
};

export function getProjectSegments(p: Project): GanttSegment[] {
	const segments: GanttSegment[] = [];

	if (p.laad_datum_opbouw) {
		segments.push({
			type: 'load',
			from: p.laad_datum_opbouw,
			to: p.laad_datum_opbouw,
		});
	}
	if (p.datum_opbouw) {
		segments.push({
			type: 'op',
			from: p.datum_opbouw,
			to: p.datum_opbouw,
		});
	}
	if (p.datum_opbouw && p.datum_afbouw) {
		const start = nextDay(p.datum_opbouw);
		const end = prevDay(p.datum_afbouw);
		if (start <= end) {
			segments.push({ type: 'stand', from: start, to: end });
		}
	}
	if (p.datum_afbouw) {
		segments.push({
			type: 'af',
			from: p.datum_afbouw,
			to: p.datum_afbouw,
		});
	}
	if (p.laad_datum_afbouw) {
		segments.push({
			type: 'unload',
			from: p.laad_datum_afbouw,
			to: p.laad_datum_afbouw,
		});
	}

	return segments;
}

// === Filter helpers ===

export function projectInPeriod(p: Project, from: string, to: string): boolean {
	const segments = getProjectSegments(p);
	if (segments.length === 0) return false;
	for (const s of segments) {
		if (s.to >= from && s.from <= to) return true;
	}
	return false;
}

export function projectStartDate(p: Project): string | null {
	const candidates = [
		p.laad_datum_opbouw,
		p.datum_opbouw,
		p.datum_afbouw,
		p.laad_datum_afbouw,
	].filter((d): d is string => !!d);
	if (candidates.length === 0) return null;
	return candidates.sort()[0];
}

export function sortProjectsByStart(projects: Project[]): Project[] {
	return [...projects].sort((a, b) => {
		const sa = projectStartDate(a) ?? '9999-12-31';
		const sb = projectStartDate(b) ?? '9999-12-31';
		return sa.localeCompare(sb);
	});
}
