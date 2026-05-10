// Pure helpers voor de planning print: types, manuren-berekening,
// inhuur-telling en het groeperen van projecten per dag in een
// gekozen datumrange. Geen UI, geen Supabase calls.

export type EventType = 'opbouw' | 'afbouw';

// Subset van het volledige Project type met velden die de print nodig heeft.
export type PrintProject = {
	id: string;
	offerte_nr: string | null;
	klant_naam: string | null;
	locatie: string | null;
	status: string;
	datum_opbouw: string | null;
	tijd_opbouw: string | null;
	eindtijd_opbouw: string | null;
	datum_afbouw: string | null;
	tijd_afbouw: string | null;
	eindtijd_afbouw: string | null;
	pascal_opbouw: boolean | null;
	pascal_afbouw: boolean | null;
	jip_opbouw: boolean | null;
	jip_afbouw: boolean | null;
	inhuur_opbouw: string | null;
	inhuur_afbouw: string | null;
	notities: string | null;
};

export type DayEvent = {
	project: PrintProject;
	type: EventType;
	date: string;
	startTime: string | null;
	endTime: string | null;
	pascal: boolean;
	jip: boolean;
	inhuur: string | null;
	aantalMan: number;
	manuren: number | null;
};

export type DayGroup = {
	date: string;
	dayName: string;
	events: DayEvent[];
	totalManuren: number;
};

const DAY_NAMES_NL = [
	'Zondag',
	'Maandag',
	'Dinsdag',
	'Woensdag',
	'Donderdag',
	'Vrijdag',
	'Zaterdag',
];

const MONTH_NAMES_NL = [
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

// Telt inhuurpersoneel uit een tekstveld. Puur getal ("3") wint;
// anders komma-gescheiden namen ("Kevin, Bart" = 2). Leeg of null = 0.
export function parseInhuurCount(text: string | null): number {
	if (!text) return 0;
	const trimmed = text.trim();
	if (!trimmed) return 0;
	if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
	return trimmed.split(',').filter((s) => s.trim().length > 0).length;
}

// Manuren = werkuren tussen begin- en eindtijd maal aantal personen.
// Retourneert null als gegevens incompleet zijn of de tijden onjuist staan.
// Ondersteunt geen events die over middernacht heen lopen.
export function calculateManuren(
	startTime: string | null,
	endTime: string | null,
	aantalMan: number,
): number | null {
	if (!startTime || !endTime || aantalMan <= 0) return null;
	const [sh, sm] = startTime.split(':').map(Number);
	const [eh, em] = endTime.split(':').map(Number);
	if (
		Number.isNaN(sh) ||
		Number.isNaN(sm) ||
		Number.isNaN(eh) ||
		Number.isNaN(em)
	) {
		return null;
	}
	const minutes = eh * 60 + em - (sh * 60 + sm);
	if (minutes <= 0) return null;
	return Math.round((minutes / 60) * aantalMan * 10) / 10;
}

// YYYY-MM-DD strings tussen from en to inclusief.
export function generateDateRange(from: string, to: string): string[] {
	const dates: string[] = [];
	const start = new Date(from + 'T00:00:00');
	const end = new Date(to + 'T00:00:00');
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
	const d = new Date(start);
	while (d.getTime() <= end.getTime()) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		dates.push(`${yyyy}-${mm}-${dd}`);
		d.setDate(d.getDate() + 1);
	}
	return dates;
}

export function getDayName(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00');
	if (Number.isNaN(d.getTime())) return '';
	return DAY_NAMES_NL[d.getDay()];
}

// "Maandag 18 mei"
export function formatDayLabel(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00');
	if (Number.isNaN(d.getTime())) return dateStr;
	return `${getDayName(dateStr)} ${d.getDate()} ${MONTH_NAMES_NL[d.getMonth()]}`;
}

// "18 t/m 24 mei 2026" of "28 mei t/m 3 juni 2026" afhankelijk van overlap.
export function formatRangeLabel(from: string, to: string): string {
	const a = new Date(from + 'T00:00:00');
	const b = new Date(to + 'T00:00:00');
	if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
		return `${from} t/m ${to}`;
	}
	const sameYear = a.getFullYear() === b.getFullYear();
	const sameMonth = sameYear && a.getMonth() === b.getMonth();
	if (sameMonth) {
		return `${a.getDate()} t/m ${b.getDate()} ${MONTH_NAMES_NL[b.getMonth()]} ${b.getFullYear()}`;
	}
	if (sameYear) {
		return `${a.getDate()} ${MONTH_NAMES_NL[a.getMonth()]} t/m ${b.getDate()} ${MONTH_NAMES_NL[b.getMonth()]} ${b.getFullYear()}`;
	}
	return `${a.getDate()} ${MONTH_NAMES_NL[a.getMonth()]} ${a.getFullYear()} t/m ${b.getDate()} ${MONTH_NAMES_NL[b.getMonth()]} ${b.getFullYear()}`;
}

// Filtert op een of meerdere statussen. Lege array = geen filter.
export function filterProjectsByStatus(
	projects: PrintProject[],
	statussen: string[],
): PrintProject[] {
	if (statussen.length === 0) return projects;
	return projects.filter((p) => statussen.includes(p.status));
}

// Houdt projecten over die opbouw of afbouw binnen de range hebben.
export function filterProjectsInRange(
	projects: PrintProject[],
	fromDate: string,
	toDate: string,
): PrintProject[] {
	return projects.filter((p) => {
		const op = p.datum_opbouw;
		const af = p.datum_afbouw;
		if (op && op >= fromDate && op <= toDate) return true;
		if (af && af >= fromDate && af <= toDate) return true;
		return false;
	});
}

function buildEvent(project: PrintProject, type: EventType): DayEvent {
	const opbouw = type === 'opbouw';
	const date = (opbouw ? project.datum_opbouw : project.datum_afbouw) ?? '';
	const startTime = opbouw ? project.tijd_opbouw : project.tijd_afbouw;
	const endTime = opbouw ? project.eindtijd_opbouw : project.eindtijd_afbouw;
	const pascal =
		(opbouw ? project.pascal_opbouw : project.pascal_afbouw) === true;
	const jip = (opbouw ? project.jip_opbouw : project.jip_afbouw) === true;
	const inhuur = opbouw ? project.inhuur_opbouw : project.inhuur_afbouw;
	const inhuurCount = parseInhuurCount(inhuur);
	const aantalMan = (pascal ? 1 : 0) + (jip ? 1 : 0) + inhuurCount;
	return {
		project,
		type,
		date,
		startTime,
		endTime,
		pascal,
		jip,
		inhuur,
		aantalMan,
		manuren: calculateManuren(startTime, endTime, aantalMan),
	};
}

// Per dag in de range een groep met alle opbouw- en afbouw-events.
// Lege dagen krijgen een groep met events: [].
export function buildDayGroups(
	projects: PrintProject[],
	fromDate: string,
	toDate: string,
): DayGroup[] {
	const dates = generateDateRange(fromDate, toDate);
	return dates.map((date) => {
		const events: DayEvent[] = [];
		for (const project of projects) {
			if (project.datum_opbouw === date)
				events.push(buildEvent(project, 'opbouw'));
			if (project.datum_afbouw === date)
				events.push(buildEvent(project, 'afbouw'));
		}
		const total = events.reduce((sum, e) => sum + (e.manuren ?? 0), 0);
		return {
			date,
			dayName: getDayName(date),
			events,
			totalManuren: Math.round(total * 10) / 10,
		};
	});
}

// Range-totaal aan manuren over alle dagen.
export function totalManuren(groups: DayGroup[]): number {
	const total = groups.reduce((sum, g) => sum + g.totalManuren, 0);
	return Math.round(total * 10) / 10;
}
