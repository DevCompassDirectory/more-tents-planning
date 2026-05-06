export type ProjectStatus =
	| 'Nieuw'
	| 'Uitvraag gedaan'
	| 'Gepland'
	| 'Bevestigd'
	| 'Gewijzigd'
	| 'Afgerond'
	| 'Geannuleerd';

export const PROJECT_STATUSES: ProjectStatus[] = [
	'Nieuw',
	'Uitvraag gedaan',
	'Gepland',
	'Bevestigd',
	'Gewijzigd',
	'Afgerond',
	'Geannuleerd',
];

export type LineItemCategorie =
	| 'Tenten'
	| 'Vloeren'
	| 'Meubilair'
	| 'Transport'
	| 'Verlichting'
	| 'Verwarming'
	| 'Decoratie'
	| 'Overig';

export const LINE_ITEM_CATEGORIES: LineItemCategorie[] = [
	'Tenten',
	'Vloeren',
	'Meubilair',
	'Transport',
	'Verlichting',
	'Verwarming',
	'Decoratie',
	'Overig',
];

export type ChangeFieldDiff = {
	field: string;
	old: string;
	new: string;
};

export type ChangeEntry = {
	changes: ChangeFieldDiff[];
	note: string;
	by: string;
	at: string;
};

export type Project = {
	id: string;
	offerte_nr: string;
	klant_naam: string;
	status: ProjectStatus;
	locatie: string;
	datum_opbouw: string | null;
	tijd_opbouw: string | null;
	eindtijd_opbouw: string | null;
	datum_afbouw: string | null;
	tijd_afbouw: string | null;
	eindtijd_afbouw: string | null;
	pascal_opbouw: boolean;
	pascal_afbouw: boolean;
	jip_opbouw: boolean;
	jip_afbouw: boolean;
	inhuur_opbouw: string;
	inhuur_afbouw: string;
	laad_datum_opbouw: string | null;
	laad_tijd_opbouw: string | null;
	laad_datum_afbouw: string | null;
	laad_tijd_afbouw: string | null;
	notities: string;
	changes: ChangeEntry[];
	seen_by: string[];
	created_by: string;
	created_at: string;
	updated_at: string;
};

export type LineItem = {
	id: string;
	project_id: string;
	categorie: LineItemCategorie;
	naam: string;
	aantal: string;
	sort_order: number;
	created_at: string;
};

export type ProjectFile = {
	id: string;
	project_id: string;
	storage_path: string;
	file_name: string;
	file_size: number;
	mime_type: string;
	uploaded_by: string;
	uploaded_at: string;
};
