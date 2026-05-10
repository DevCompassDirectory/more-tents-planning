import type { ProductWithRequirements } from '@/lib/types/database';

function normalize(s: string): string {
	return s
		.toLowerCase()
		.replace(/×/g, 'x') // unicode multiplication → letter x
		.replace(/[^a-z0-9]/g, '');
}

export function findProductMatch(
	lineItemName: string,
	products: ProductWithRequirements[],
): ProductWithRequirements | null {
	const target = normalize(lineItemName);

	// Specificiteit: producten met maat eerst, dan langere naam+maat
	const sorted = [...products].sort((a, b) => {
		const aSpec = (a.maat ? 1000 : 0) + a.naam.length + a.maat.length;
		const bSpec = (b.maat ? 1000 : 0) + b.naam.length + b.maat.length;
		return bSpec - aSpec;
	});

	for (const p of sorted) {
		const naamN = normalize(p.naam);
		if (!naamN || !target.includes(naamN)) continue;

		if (p.maat) {
			const maatN = normalize(p.maat);
			if (!target.includes(maatN)) continue;
		}

		return p;
	}
	return null;
}

export function parseAantal(s: string): number {
	const m = s.match(/(\d+[,.]?\d*)/);
	if (!m) return 1;
	return parseFloat(m[1].replace(',', '.'));
}
