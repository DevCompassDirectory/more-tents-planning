'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { LineItemCategorie } from '@/lib/types/database';

export type ProductInput = {
	naam: string;
	maat: string;
	categorie: LineItemCategorie;
	notities: string;
	requirements: { naam: string; aantal: number }[];
};

export async function saveProduct(
	productId: string | null,
	input: ProductInput,
): Promise<{ error: string | null; productId: string | null }> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return { error: 'Niet ingelogd', productId: null };

	const productData = {
		naam: input.naam.trim(),
		maat: input.maat.trim(),
		categorie: input.categorie,
		notities: input.notities.trim(),
	};

	if (!productData.naam) {
		return { error: 'Naam is verplicht', productId: null };
	}

	let id = productId;

	if (id) {
		const { error } = await supabase
			.from('products')
			.update(productData)
			.eq('id', id);
		if (error)
			return {
				error: 'Bijwerken mislukt: ' + error.message,
				productId: null,
			};
	} else {
		const { data, error } = await supabase
			.from('products')
			.insert(productData)
			.select('id')
			.single();
		if (error || !data)
			return {
				error: 'Opslaan mislukt: ' + (error?.message ?? 'geen data'),
				productId: null,
			};
		id = data.id;
	}

	// Vervang alle requirements
	await supabase.from('product_requirements').delete().eq('product_id', id);

	const cleanReqs = input.requirements.filter(
		(r) => r.naam.trim().length > 0,
	);
	if (cleanReqs.length > 0) {
		const rows = cleanReqs.map((r, idx) => ({
			product_id: id,
			naam: r.naam.trim(),
			aantal: r.aantal,
			sort_order: idx,
		}));
		const { error } = await supabase
			.from('product_requirements')
			.insert(rows);
		if (error) {
			console.error('Requirements opslaan mislukt:', error);
		}
	}

	revalidatePath('/producten');
	return { error: null, productId: id };
}

export async function deleteProduct(
	productId: string,
): Promise<{ error: string | null }> {
	const supabase = await createClient();
	const { error } = await supabase
		.from('products')
		.delete()
		.eq('id', productId);
	if (error) return { error: 'Verwijderen mislukt: ' + error.message };
	revalidatePath('/producten');
	return { error: null };
}
