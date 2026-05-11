'use server';

import { createClient } from '@/lib/supabase/server';
import type { Project } from '@/lib/types/database';

export async function findProjectByOfferteNr(
	offerteNr: string,
): Promise<Project | null> {
	const trimmed = offerteNr?.trim();
	if (!trimmed) return null;
	const supabase = await createClient();
	const { data } = await supabase
		.from('projects')
		.select('*')
		.eq('offerte_nr', trimmed)
		.limit(1);
	return (data && (data[0] as Project)) || null;
}
