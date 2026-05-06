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
