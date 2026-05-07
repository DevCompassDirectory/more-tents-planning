import {
	LINE_ITEM_CATEGORIES,
	type LineItemCategorie,
} from '@/lib/types/database';

export type ParsedPdfFields = {
	offerte_nr?: string;
	klant_naam?: string;
	locatie?: string;
	datum_opbouw?: string;
	tijd_opbouw?: string;
	datum_afbouw?: string;
	tijd_afbouw?: string;
	line_items: ParsedLineItem[];
};

export type ParsedLineItem = {
	categorie: LineItemCategorie;
	naam: string;
	aantal: string;
};

const CATEGORY_MAP: Record<string, LineItemCategorie | 'skip'> = {
	tenten: 'Tenten',
	vloeren: 'Vloeren',
	meubilair: 'Meubilair',
	meubiliar: 'Meubilair',
	verlichting: 'Verlichting',
	verwarming: 'Verwarming',
	decoratie: 'Decoratie',
	overig: 'Overig',

	transport: 'skip',

	diensten: 'Overig',
	glazen: 'Overig',
	glaswerk: 'Overig',
	servies: 'Overig',
	bestek: 'Overig',
	linnen: 'Overig',
	catering: 'Overig',
	bar: 'Overig',
	sanitair: 'Overig',
	geluid: 'Overig',
	audio: 'Overig',
};

export function parsePdfText(text: string): ParsedPdfFields {
	const result: ParsedPdfFields = { line_items: [] };

	// Offerte- of ordernummer (S00117 etc)
	const numberMatch =
		text.match(/(?:Offerte|Order)\s*#\s*(S\d+)/i) ||
		text.match(/\b(S\d{4,6})\b/);
	if (numberMatch) result.offerte_nr = numberMatch[1];

	// Klant naam: tussen "Factuuradres" en eerste straat+nummer+postcode
	// Pattern: <klant> <straatnaam> <huisnummer[letter]> <postcode> <plaats>
	const klantStrict = text.match(
		/Factuuradres\s+(.+?)\s+\S+\s+\d+[A-Za-z]?\s+\d{4}\s*[A-Z]{2}/,
	);
	if (klantStrict) {
		result.klant_naam = klantStrict[1].trim();
	} else {
		// Fallback: alles tot eerste echte break (oude gedrag)
		const klantFallback = text.match(/Factuuradres\s+(.+?)(?=\s{2,}|\n|$)/);
		if (klantFallback) result.klant_naam = klantFallback[1].trim();
	}

	// Locatie: tussen "Afleveradres" en herhaling van klant naam
	if (result.klant_naam) {
		const escapedKlant = result.klant_naam.replace(
			/[.*+?^${}()|[\]\\]/g,
			'\\$&',
		);
		const locatiePattern = new RegExp(
			'Afleveradres\\s+(.+?)\\s+' + escapedKlant,
		);
		const locatieMatch = text.match(locatiePattern);
		if (locatieMatch) result.locatie = locatieMatch[1].trim();
	}
	if (!result.locatie) {
		const fallback = text.match(
			/Afleveradres\s+([A-Za-z][^\n]{2,80})(?=\s+\d{4}|\s+[A-Z][a-z]+\s+[A-Z])/,
		);
		if (fallback) result.locatie = fallback[1].trim();
	}

	// Datum + tijd
	const dateRangePattern =
		/(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})\s+tot\s+(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})/g;
	const dateMatches = [...text.matchAll(dateRangePattern)];
	if (dateMatches.length > 0) {
		const first = dateMatches[0];
		const [d1, m1, y1] = first[1].split('-');
		result.datum_opbouw = `${y1}-${m1}-${d1}`;
		result.tijd_opbouw = first[2];
		const [d2, m2, y2] = first[3].split('-');
		result.datum_afbouw = `${y2}-${m2}-${d2}`;
		result.tijd_afbouw = first[4];
	}

	result.line_items = parseLineItems(text);

	return result;
}

function parseLineItems(text: string): ParsedLineItem[] {
	const items: ParsedLineItem[] = [];

	const main = text.split(/Excl\.?\s*btw/i)[0];

	const clean = main
		.replace(
			/\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+tot\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/g,
			' ',
		)
		.replace(/\d+\s*%\s*BTW/g, ' ')
		.replace(/[\d.]+,\d{2}\s*€/g, ' ')
		.replace(/\s{2,}/g, ' ');

	const catKeys = Object.keys(CATEGORY_MAP);
	const catRegex = new RegExp(`\\b(${catKeys.join('|')})\\b`, 'gi');
	const parts = clean.split(catRegex);

	let currentCat: LineItemCategorie | 'skip' = 'Overig';

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];

		const lookup = CATEGORY_MAP[part.toLowerCase()];
		if (lookup) {
			currentCat = lookup;
			continue;
		}

		if (currentCat === 'skip') continue;

		const itemPattern =
			/([A-Za-z(][\w\s(),.\/-]{3,60}?)\s+(\d+[,.]\d{2})\s+[Ss]tuks/g;
		let match;
		while ((match = itemPattern.exec(part)) !== null) {
			const naam = match[1].trim().replace(/\s+/g, ' ');
			const aantal = match[2].replace('.', ',') + '\u00a0st';
			if (naam.length > 3) {
				items.push({
					categorie: currentCat as LineItemCategorie,
					naam,
					aantal,
				});
			}
		}
	}

	return items.filter((it) => LINE_ITEM_CATEGORIES.includes(it.categorie));
}
