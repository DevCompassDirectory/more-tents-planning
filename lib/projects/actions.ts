'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
