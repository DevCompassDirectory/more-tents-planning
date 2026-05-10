import type { Project } from '@/lib/types/database';

export type CalendarView = 'week' | 'maand' | 'kwartaal' | 'jaar';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// === Parsers ===

export function parseCalendarView(
	value: string | undefined | null,
): CalendarView {
	if (value === 'week') return 'week';
	if (value === 'kwartaal') return 'kwartaal';
	if (value === 'jaar') return 'jaar';
	return 'maand';
}

export function parseCalendarDate(value: string | undefined | null): string {
	if (value && ISO_RE.test(value)) return value;
	return todayDate();
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

export function isWeekend(iso: string): boolean {
	const day = toDate(iso).getDay();
	return day === 0 || day === 6;
}

// === Period navigation ===

export function prevPeriod(view: CalendarView, date: string): string {
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
		case 'jaar':
			d.setFullYear(d.getFullYear() - 1);
			break;
	}
	return fromDate(d);
}

export function nextPeriod(view: CalendarView, date: string): string {
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
		case 'jaar':
			d.setFullYear(d.getFullYear() + 1);
			break;
	}
	return fromDate(d);
}

export function periodRange(
	view: CalendarView,
	date: string,
): { from: string; to: string } {
	const d = toDate(date);
	switch (view) {
		case 'week': {
			const day = d.getDay();
			const offset = day === 0 ? -6 : 1 - day;
			const monday = new Date(d);
			monday.setDate(monday.getDate() + offset);
			const sunday = new Date(monday);
			sunday.setDate(sunday.getDate() + 6);
			return { from: fromDate(monday), to: fromDate(sunday) };
		}
		case 'maand': {
			const start = new Date(d.getFullYear(), d.getMonth(), 1, 12);
			const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
			return { from: fromDate(start), to: fromDate(end) };
		}
		case 'kwartaal': {
			const q = Math.floor(d.getMonth() / 3);
			const start = new Date(d.getFullYear(), q * 3, 1, 12);
			const end = new Date(d.getFullYear(), q * 3 + 3, 0, 12);
			return { from: fromDate(start), to: fromDate(end) };
		}
		case 'jaar': {
			const start = new Date(d.getFullYear(), 0, 1, 12);
			const end = new Date(d.getFullYear(), 11, 31, 12);
			return { from: fromDate(start), to: fromDate(end) };
		}
	}
}

// === ISO weeknummer ===

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

// === Periode label ===

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

export function monthName(month: number, short = false): string {
	const arr = short ? NL_MAANDEN_KORT : NL_MAANDEN;
	return arr[month] ?? '';
}

export function formatPeriodLabel(view: CalendarView, date: string): string {
	const { from, to } = periodRange(view, date);
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
		case 'jaar': {
			return String(fromD.getFullYear());
		}
	}
}

// === Date arrays ===

export function weekDates(date: string): string[] {
	const d = toDate(date);
	const day = d.getDay();
	const offset = day === 0 ? -6 : 1 - day;
	const monday = new Date(d);
	monday.setDate(monday.getDate() + offset);
	const out: string[] = [];
	for (let i = 0; i < 7; i++) {
		const dd = new Date(monday);
		dd.setDate(monday.getDate() + i);
		out.push(fromDate(dd));
	}
	return out;
}

export type MonthCell = { iso: string; day: number; inMonth: boolean };

export function monthCells(year: number, month: number): MonthCell[] {
	const firstOfMonth = new Date(year, month, 1, 12);
	const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7;
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const prevMonthDays = new Date(year, month, 0).getDate();
	const cells: MonthCell[] = [];

	for (let i = startDayOfWeek - 1; i >= 0; i--) {
		const d = new Date(year, month - 1, prevMonthDays - i, 12);
		cells.push({ iso: fromDate(d), day: d.getDate(), inMonth: false });
	}
	for (let i = 1; i <= daysInMonth; i++) {
		const d = new Date(year, month, i, 12);
		cells.push({ iso: fromDate(d), day: d.getDate(), inMonth: true });
	}
	while (cells.length % 7 !== 0) {
		const lastInMonth = startDayOfWeek + daysInMonth;
		const offset = cells.length - lastInMonth + 1;
		const d = new Date(year, month + 1, offset, 12);
		cells.push({ iso: fromDate(d), day: d.getDate(), inMonth: false });
	}
	return cells;
}

export function weekGroups(
	cells: MonthCell[],
): { weekNr: number; cells: MonthCell[] }[] {
	const out: { weekNr: number; cells: MonthCell[] }[] = [];
	for (let i = 0; i < cells.length; i += 7) {
		const week = cells.slice(i, i + 7);
		const weekNr = getISOWeekNumber(week[0].iso);
		out.push({ weekNr, cells: week });
	}
	return out;
}

export function quarterMonths(date: string): { year: number; month: number }[] {
	const d = toDate(date);
	const q = Math.floor(d.getMonth() / 3);
	const startMonth = q * 3;
	const year = d.getFullYear();
	return [
		{ year, month: startMonth },
		{ year, month: startMonth + 1 },
		{ year, month: startMonth + 2 },
	];
}

export function yearMonths(date: string): { year: number; month: number }[] {
	const year = toDate(date).getFullYear();
	return Array.from({ length: 12 }, (_, m) => ({ year, month: m }));
}

// === Events ===

export type CalendarEventType = 'op' | 'af' | 'load' | 'unload';
export type CalendarDayEvent = { type: CalendarEventType; project: Project };

export function eventsForDate(
	projects: Project[],
	iso: string,
): CalendarDayEvent[] {
	const events: CalendarDayEvent[] = [];
	for (const p of projects) {
		if (p.datum_opbouw === iso) events.push({ type: 'op', project: p });
		if (p.datum_afbouw === iso) events.push({ type: 'af', project: p });
		if (p.laad_datum_opbouw === iso)
			events.push({ type: 'load', project: p });
		if (p.laad_datum_afbouw === iso)
			events.push({ type: 'unload', project: p });
	}
	return events;
}

export type EventSummary = {
	hasOpbouw: boolean;
	hasAfbouw: boolean;
	totalEvents: number;
};

export function summarizeEvents(events: CalendarDayEvent[]): EventSummary {
	let hasOpbouw = false;
	let hasAfbouw = false;
	for (const e of events) {
		if (e.type === 'op' || e.type === 'load') hasOpbouw = true;
		if (e.type === 'af' || e.type === 'unload') hasAfbouw = true;
	}
	return { hasOpbouw, hasAfbouw, totalEvents: events.length };
}

// === URL ===

export function calendarHref(view: CalendarView, date: string): string {
	const params = new URLSearchParams({ tab: 'kalender', view, date });
	return `/?${params.toString()}`;
}
