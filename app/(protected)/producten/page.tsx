import { getProducts } from '@/lib/products/queries';
import { ProductsClient } from '@/components/ProductsClient';

export default async function ProductenPage() {
	const products = await getProducts();
	return (
		<main className='max-w-6xl mx-auto px-6 py-8'>
			<ProductsClient initialProducts={products} />
		</main>
	);
}
