export type CalendarView = 'week' | 'maand' | 'kwartaal' | 'jaar';

export function parseCalendarView(
	value: string | undefined | null,
): CalendarView {
	if (value === 'week') return 'week';
	if (value === 'kwartaal') return 'kwartaal';
	if (value === 'jaar') return 'jaar';
	return 'maand';
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseCalendarDate(value: string | undefined | null): string {
	if (value && ISO_RE.test(value)) return value;
	return todayDate();
}

export function todayDate(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${dd}`;
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
