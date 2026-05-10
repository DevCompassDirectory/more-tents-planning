'use server';

import { createClient } from '@/lib/supabase/server';

export type ProjectLineItem = {
	id: string;
	naam: string;
	aantal: string;
	categorie: string;
	sort_order: number;
};

export async function getLineItemsForProject(
	projectId: string,
): Promise<ProjectLineItem[]> {
	const supabase = await createClient();
	const { data } = await supabase
		.from('line_items')
		.select('id, naam, aantal, categorie, sort_order')
		.eq('project_id', projectId)
		.order('sort_order', { ascending: true });
	if (!data) return [];
	return data.map((row) => ({
		id: String(row.id),
		naam: String(row.naam ?? ''),
		aantal: String(row.aantal ?? ''),
		categorie: String(row.categorie ?? 'Overig'),
		sort_order: Number(row.sort_order ?? 0),
	}));
}
