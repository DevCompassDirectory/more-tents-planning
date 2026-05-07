'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { LineItemCategorie } from '@/lib/types/database';

export type CreateProjectState = {
	error: string | null;
	success: boolean;
};

export async function createProject(
	_prevState: CreateProjectState,
	formData: FormData,
): Promise<CreateProjectState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: 'Niet ingelogd', success: false };
	}

	const get = (k: string): string =>
		((formData.get(k) as string | null) ?? '').trim();
	const getOrNull = (k: string): string | null => {
		const v = get(k);
		return v === '' ? null : v;
	};
	const getBool = (k: string): boolean => formData.get(k) === 'Ja';

	const userEmail = user.email ?? '';

	const { error } = await supabase.from('projects').insert({
		offerte_nr: get('offerte_nr'),
		klant_naam: get('klant_naam'),
		status: get('status') || 'Nieuw',
		locatie: get('locatie'),
		datum_opbouw: getOrNull('datum_opbouw'),
		tijd_opbouw: getOrNull('tijd_opbouw'),
		eindtijd_opbouw: getOrNull('eindtijd_opbouw'),
		datum_afbouw: getOrNull('datum_afbouw'),
		tijd_afbouw: getOrNull('tijd_afbouw'),
		eindtijd_afbouw: getOrNull('eindtijd_afbouw'),
		pascal_opbouw: getBool('pascal_opbouw'),
		pascal_afbouw: getBool('pascal_afbouw'),
		jip_opbouw: getBool('jip_opbouw'),
		jip_afbouw: getBool('jip_afbouw'),
		inhuur_opbouw: get('inhuur_opbouw'),
		inhuur_afbouw: get('inhuur_afbouw'),
		laad_datum_opbouw: getOrNull('laad_datum_opbouw'),
		laad_tijd_opbouw: getOrNull('laad_tijd_opbouw'),
		laad_datum_afbouw: getOrNull('laad_datum_afbouw'),
		laad_tijd_afbouw: getOrNull('laad_tijd_afbouw'),
		notities: get('notities'),
		seen_by: [userEmail],
		created_by: userEmail,
	});

	if (error) {
		console.error('Failed to create project:', error);
		return { error: 'Opslaan mislukt: ' + error.message, success: false };
	}

	revalidatePath('/', 'page');
	return { error: null, success: true };
}

const TRACKED_FIELDS: Record<string, string> = {
	klant_naam: 'Klant naam',
	offerte_nr: 'Offerte nr',
	status: 'Status',
	locatie: 'Locatie',
	datum_opbouw: 'Datum opbouw',
	tijd_opbouw: 'Tijd opbouw',
	eindtijd_opbouw: 'Eindtijd opbouw',
	datum_afbouw: 'Datum afbouw',
	tijd_afbouw: 'Tijd afbouw',
	eindtijd_afbouw: 'Eindtijd afbouw',
	pascal_opbouw: 'Pascal opbouw',
	pascal_afbouw: 'Pascal afbouw',
	jip_opbouw: 'Jip opbouw',
	jip_afbouw: 'Jip afbouw',
	inhuur_opbouw: 'Inhuur opbouw',
	inhuur_afbouw: 'Inhuur afbouw',
	laad_datum_opbouw: 'Laaddatum opbouw',
	laad_tijd_opbouw: 'Laadtijd opbouw',
	laad_datum_afbouw: 'Losdatum afbouw',
	laad_tijd_afbouw: 'Lostijd afbouw',
	notities: 'Notities',
};

const TIME_FIELDS = new Set([
	'tijd_opbouw',
	'eindtijd_opbouw',
	'tijd_afbouw',
	'eindtijd_afbouw',
	'laad_tijd_opbouw',
	'laad_tijd_afbouw',
]);

function formatValue(v: unknown): string {
	if (v === null || v === undefined || v === '') return '—';
	if (typeof v === 'boolean') return v ? 'Ja' : 'Nee';
	return String(v);
}

export type UpdateProjectState = {
	error: string | null;
	success: boolean;
};

export async function updateProject(
	projectId: string,
	_prevState: UpdateProjectState,
	formData: FormData,
): Promise<UpdateProjectState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: 'Niet ingelogd', success: false };

	const userEmail = user.email ?? '';

	const { data: current, error: fetchErr } = await supabase
		.from('projects')
		.select('*')
		.eq('id', projectId)
		.single();

	if (fetchErr || !current) {
		return { error: 'Project niet gevonden', success: false };
	}

	const get = (k: string): string =>
		((formData.get(k) as string | null) ?? '').trim();
	const getOrNull = (k: string): string | null => {
		const v = get(k);
		return v === '' ? null : v;
	};
	const getBool = (k: string): boolean => formData.get(k) === 'Ja';

	const note = get('change_note');

	const newValues = {
		offerte_nr: get('offerte_nr'),
		klant_naam: get('klant_naam'),
		status: get('status') || 'Nieuw',
		locatie: get('locatie'),
		datum_opbouw: getOrNull('datum_opbouw'),
		tijd_opbouw: getOrNull('tijd_opbouw'),
		eindtijd_opbouw: getOrNull('eindtijd_opbouw'),
		datum_afbouw: getOrNull('datum_afbouw'),
		tijd_afbouw: getOrNull('tijd_afbouw'),
		eindtijd_afbouw: getOrNull('eindtijd_afbouw'),
		pascal_opbouw: getBool('pascal_opbouw'),
		pascal_afbouw: getBool('pascal_afbouw'),
		jip_opbouw: getBool('jip_opbouw'),
		jip_afbouw: getBool('jip_afbouw'),
		inhuur_opbouw: get('inhuur_opbouw'),
		inhuur_afbouw: get('inhuur_afbouw'),
		laad_datum_opbouw: getOrNull('laad_datum_opbouw'),
		laad_tijd_opbouw: getOrNull('laad_tijd_opbouw'),
		laad_datum_afbouw: getOrNull('laad_datum_afbouw'),
		laad_tijd_afbouw: getOrNull('laad_tijd_afbouw'),
		notities: get('notities'),
	};

	const diffs: { field: string; old: string; new: string }[] = [];
	for (const [key, label] of Object.entries(TRACKED_FIELDS)) {
		let oldVal: unknown = (current as Record<string, unknown>)[key];
		let newVal: unknown = (newValues as Record<string, unknown>)[key];

		// Tijden uit Postgres komen als "HH:MM:SS"; normaliseer naar "HH:MM"
		if (TIME_FIELDS.has(key)) {
			if (typeof oldVal === 'string') oldVal = oldVal.slice(0, 5);
			if (typeof newVal === 'string') newVal = newVal.slice(0, 5);
		}

		const oldNorm = oldVal === null || oldVal === undefined ? '' : oldVal;
		const newNorm = newVal === null || newVal === undefined ? '' : newVal;

		if (oldNorm !== newNorm) {
			diffs.push({
				field: label,
				old: formatValue(oldVal),
				new: formatValue(newVal),
			});
		}
	}

	const updateData: Record<string, unknown> = { ...newValues };

	if (diffs.length > 0) {
		const changeEntry = {
			changes: diffs,
			note,
			by: userEmail,
			at: new Date().toISOString(),
		};
		const existingChanges = Array.isArray(current.changes)
			? current.changes
			: [];
		updateData.changes = [...existingChanges, changeEntry];
		updateData.seen_by = [userEmail];
	}

	const { error } = await supabase
		.from('projects')
		.update(updateData)
		.eq('id', projectId);

	if (error) {
		console.error('Failed to update project:', error);
		return { error: 'Opslaan mislukt: ' + error.message, success: false };
	}

	revalidatePath('/', 'page');
	return { error: null, success: true };
}

export async function deleteProject(
	projectId: string,
): Promise<{ error: string | null }> {
	const supabase = await createClient();
	const { error } = await supabase
		.from('projects')
		.delete()
		.eq('id', projectId);

	if (error) {
		return { error: 'Verwijderen mislukt: ' + error.message };
	}

	revalidatePath('/', 'page');
	return { error: null };
}

export async function markAsSeen(
	projectId: string,
): Promise<{ error: string | null }> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: 'Niet ingelogd' };

	const userEmail = user.email ?? '';

	const { data: current, error: fetchErr } = await supabase
		.from('projects')
		.select('seen_by')
		.eq('id', projectId)
		.single();

	if (fetchErr || !current) return { error: 'Project niet gevonden' };

	const currentSeenBy = Array.isArray(current.seen_by) ? current.seen_by : [];
	if (currentSeenBy.includes(userEmail)) {
		return { error: null };
	}

	const newSeenBy = [...currentSeenBy, userEmail];

	const { error } = await supabase
		.from('projects')
		.update({ seen_by: newSeenBy })
		.eq('id', projectId);

	if (error) {
		return { error: 'Markeren mislukt: ' + error.message };
	}

	revalidatePath('/', 'page');
	return { error: null };
}

export async function createProjectFromPdf(
	_prevState: CreateProjectState,
	formData: FormData,
): Promise<CreateProjectState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return { error: 'Niet ingelogd', success: false };
	const userEmail = user.email ?? '';

	const file = formData.get('pdf') as File | null;

	const get = (k: string): string =>
		((formData.get(k) as string | null) ?? '').trim();
	const getOrNull = (k: string): string | null => {
		const v = get(k);
		return v === '' ? null : v;
	};
	const getBool = (k: string): boolean => formData.get(k) === 'Ja';

	// 1. Insert project
	const { data: project, error: projectError } = await supabase
		.from('projects')
		.insert({
			offerte_nr: get('offerte_nr'),
			klant_naam: get('klant_naam'),
			status: get('status') || 'Nieuw',
			locatie: get('locatie'),
			datum_opbouw: getOrNull('datum_opbouw'),
			tijd_opbouw: getOrNull('tijd_opbouw'),
			eindtijd_opbouw: getOrNull('eindtijd_opbouw'),
			datum_afbouw: getOrNull('datum_afbouw'),
			tijd_afbouw: getOrNull('tijd_afbouw'),
			eindtijd_afbouw: getOrNull('eindtijd_afbouw'),
			pascal_opbouw: getBool('pascal_opbouw'),
			pascal_afbouw: getBool('pascal_afbouw'),
			jip_opbouw: getBool('jip_opbouw'),
			jip_afbouw: getBool('jip_afbouw'),
			inhuur_opbouw: get('inhuur_opbouw'),
			inhuur_afbouw: get('inhuur_afbouw'),
			laad_datum_opbouw: getOrNull('laad_datum_opbouw'),
			laad_tijd_opbouw: getOrNull('laad_tijd_opbouw'),
			laad_datum_afbouw: getOrNull('laad_datum_afbouw'),
			laad_tijd_afbouw: getOrNull('laad_tijd_afbouw'),
			notities: get('notities'),
			seen_by: [userEmail],
			created_by: userEmail,
		})
		.select('id')
		.single();

	if (projectError || !project) {
		return {
			error:
				'Project aanmaken mislukt: ' +
				(projectError?.message ?? 'geen data'),
			success: false,
		};
	}

	const projectId = project.id;

	// 2. Insert line items
	const lineItemsJson = formData.get('line_items_json') as string | null;
	if (lineItemsJson) {
		try {
			const lineItems = JSON.parse(lineItemsJson) as {
				categorie: string;
				naam: string;
				aantal: string;
			}[];
			if (lineItems.length > 0) {
				const rows = lineItems.map((item, idx) => ({
					project_id: projectId,
					categorie: item.categorie,
					naam: item.naam,
					aantal: item.aantal,
					sort_order: idx,
				}));
				const { error: itemsError } = await supabase
					.from('line_items')
					.insert(rows);
				if (itemsError) {
					console.error('Failed to insert line items:', itemsError);
				}
			}
		} catch (e) {
			console.error('Failed to parse line items:', e);
		}
	}

	// 3. Upload PDF naar Storage en koppel als project_file
	if (file && file.size > 0) {
		const arrayBuffer = await file.arrayBuffer();
		const safeName = file.name.replace(/[^\w\-.]/g, '_');
		const storagePath = `${projectId}/${Date.now()}-${safeName}`;

		const { error: uploadError } = await supabase.storage
			.from('project-files')
			.upload(storagePath, new Uint8Array(arrayBuffer), {
				contentType: file.type || 'application/pdf',
				upsert: false,
			});

		if (uploadError) {
			console.error('Failed to upload PDF:', uploadError);
		} else {
			const { error: fileEntryError } = await supabase
				.from('project_files')
				.insert({
					project_id: projectId,
					storage_path: storagePath,
					file_name: file.name,
					file_size: file.size,
					mime_type: file.type || 'application/pdf',
					uploaded_by: userEmail,
				});
			if (fileEntryError) {
				console.error('Failed to insert project_file:', fileEntryError);
			}
		}
	}

	revalidatePath('/', 'page');
	return { error: null, success: true };
}

export type UpdateLineItemsState = {
	error: string | null;
	success: boolean;
};

export async function updateLineItems(
	projectId: string,
	items: { categorie: LineItemCategorie; naam: string; aantal: string }[],
): Promise<UpdateLineItemsState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: 'Niet ingelogd', success: false };

	const { error: deleteError } = await supabase
		.from('line_items')
		.delete()
		.eq('project_id', projectId);
	if (deleteError) {
		return {
			error: 'Verwijderen oude artikelen mislukt: ' + deleteError.message,
			success: false,
		};
	}

	if (items.length > 0) {
		const rows = items.map((item, idx) => ({
			project_id: projectId,
			categorie: item.categorie,
			naam: item.naam,
			aantal: item.aantal,
			sort_order: idx,
		}));
		const { error: insertError } = await supabase
			.from('line_items')
			.insert(rows);
		if (insertError) {
			return {
				error: 'Opslaan artikelen mislukt: ' + insertError.message,
				success: false,
			};
		}
	}

	revalidatePath('/', 'page');
	return { error: null, success: true };
}
