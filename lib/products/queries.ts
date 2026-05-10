import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type {
	ProductRequirement,
	ProductWithRequirements,
} from '@/lib/types/database';

export const getProducts = cache(
	async (): Promise<ProductWithRequirements[]> => {
		const supabase = await createClient();
		const { data: products, error } = await supabase
			.from('products')
			.select('*')
			.order('naam', { ascending: true });

		if (error || !products) {
			console.error('Failed to fetch products:', error);
			return [];
		}

		const { data: requirements } = await supabase
			.from('product_requirements')
			.select('*')
			.order('sort_order', { ascending: true });

		const reqsByProduct = new Map<string, ProductRequirement[]>();
		(requirements ?? []).forEach((r) => {
			const list = reqsByProduct.get(r.product_id) ?? [];
			list.push(r);
			reqsByProduct.set(r.product_id, list);
		});

		return products.map((p) => ({
			...p,
			requirements: reqsByProduct.get(p.id) ?? [],
		}));
	},
);
