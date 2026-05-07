import {
	LINE_ITEM_CATEGORIES,
	type LineItemCategorie,
} from '@/lib/types/database';

export type ParsedPdfFields = {
	offerte_nr?: string;
	klant_naam?: string;
	locatie?: string;
	datum_opbouw?: string; // YYYY-MM-DD
	tijd_opbouw?: string; // HH:MM
	datum_afbouw?: string;
	tijd_afbouw?: string;
	pascal_opbouw?: boolean;
	pascal_afbouw?: boolean;
	jip_opbouw?: boolean;
	jip_afbouw?: boolean;
	line_items: ParsedLineItem[];
};

export type ParsedLineItem = {
	categorie: LineItemCategorie;
	naam: string;
	aantal: string;
};

// ----------------------------------------------------------------------------
// Categorie-mapping: hoe een categorienaam in een offerte vertaald wordt
// naar onze database-enum. Sleutels zijn altijd lowercase.
//
// Drie soorten waardes:
//   - LineItemCategorie: het item komt onder die categorie
//   - "skip": deze sectie wordt overgeslagen, geen line items
//
// Voeg hier nieuwe categorienamen toe zodra je ze in offertes tegenkomt
// die nog niet correct geparseerd worden.
// ----------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, LineItemCategorie | 'skip'> = {
	// Database categorieën (1-op-1)
	tenten: 'Tenten',
	vloeren: 'Vloeren',
	meubilair: 'Meubilair',
	meubiliar: 'Meubilair', // bekende typo-variant in Odoo
	verlichting: 'Verlichting',
	verwarming: 'Verwarming',
	decoratie: 'Decoratie',
	overig: 'Overig',

	// Wordt overgeslagen: hoort niet thuis op een pakbon
	transport: 'skip',

	// Custom categorienamen die naar Overig vallen
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

// ----------------------------------------------------------------------------
// Hoofdparser
// ----------------------------------------------------------------------------

export function parsePdfText(text: string): ParsedPdfFields {
	const result: ParsedPdfFields = { line_items: [] };

	// Offerte nummer (S00117 etc)
	const offerteMatch =
		text.match(/Offerte\s*#\s*(S\d+)/i) || text.match(/\b(S\d{4,6})\b/);
	if (offerteMatch) result.offerte_nr = offerteMatch[1];

	// Klant naam (na "Factuuradres")
	const klantMatch = text.match(/Factuuradres\s+(.+?)(?=\s{2,}|\n|$)/);
	if (klantMatch) result.klant_naam = klantMatch[1].trim();

	// Locatie (na "Afleveradres", tot klant naam herhaald)
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
			/Afleveradres\s+([A-Za-z][^\n]{2,60})(?=\s+\d{4}|\s+[A-Z][a-z]+\s+[A-Z])/,
		);
		if (fallback) result.locatie = fallback[1].trim();
	}

	// Datum + tijd: zoekt patroon "DD-MM-YYYY HH:MM tot DD-MM-YYYY HH:MM"
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

	// Verkoper naam mappen op personeel (Pascal/Jip)
	const verkoperMatch = text.match(/Verkoper\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
	if (verkoperMatch) {
		const naam = verkoperMatch[1].toLowerCase();
		if (naam.includes('jip')) {
			result.jip_opbouw = true;
			result.jip_afbouw = true;
		}
		if (naam.includes('pascal')) {
			result.pascal_opbouw = true;
			result.pascal_afbouw = true;
		}
	}

	result.line_items = parseLineItems(text);

	return result;
}

// ----------------------------------------------------------------------------
// Line items parser
// ----------------------------------------------------------------------------

function parseLineItems(text: string): ParsedLineItem[] {
	const items: ParsedLineItem[] = [];

	// Stop bij subtotalen
	const main = text.split(/Excl\.?\s*btw/i)[0];

	// Schoon de tekst op: weg met datum-bereiken, BTW labels en euro bedragen
	const clean = main
		.replace(
			/\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+tot\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}/g,
			' ',
		)
		.replace(/\d+\s*%\s*BTW/g, ' ')
		.replace(/[\d.]+,\d{2}\s*€/g, ' ')
		.replace(/\s{2,}/g, ' ');

	// Splits op alle bekende categorienamen
	const catKeys = Object.keys(CATEGORY_MAP);
	const catRegex = new RegExp(`\\b(${catKeys.join('|')})\\b`, 'gi');
	const parts = clean.split(catRegex);

	// Items vóór de eerste herkende categorie vallen onder "Overig"
	let currentCat: LineItemCategorie | 'skip' = 'Overig';

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];

		// Is dit een categoriewoord?
		const lookup = CATEGORY_MAP[part.toLowerCase()];
		if (lookup) {
			currentCat = lookup;
			continue;
		}

		// Sla items in een "skip" sectie (Transport) volledig over
		if (currentCat === 'skip') continue;

		// Zoek items in deze part: productnaam gevolgd door "X,XX Stuks"
		const itemPattern =
			/([A-Za-z(][\w\s(),.\/-]{3,60}?)\s+(\d+[,.]\d{2})\s+[Ss]tuks/g;
		let match;
		while ((match = itemPattern.exec(part)) !== null) {
			const naam = match[1].trim().replace(/\s+/g, ' ');
			const aantal = match[2].replace('.', ',') + '\u00a0st';
			if (naam.length > 3) {
				// currentCat is hier per definitie geen "skip" meer
				items.push({
					categorie: currentCat as LineItemCategorie,
					naam,
					aantal,
				});
			}
		}
	}

	// Veiligheidsfilter: alleen geldige database categorieën doorlaten
	return items.filter((it) => LINE_ITEM_CATEGORIES.includes(it.categorie));
}
