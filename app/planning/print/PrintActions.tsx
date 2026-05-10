'use client';

import { useRouter } from 'next/navigation';

export function PrintActions() {
	const router = useRouter();
	return (
		<div
			className='no-print'
			style={{ display: 'flex', gap: 12, marginBottom: 24 }}
		>
			<button
				type='button'
				onClick={() => window.print()}
				style={{
					padding: '10px 22px',
					borderRadius: 10,
					background: '#3F7855',
					color: '#fff',
					fontSize: 14,
					fontWeight: 600,
					border: 'none',
					cursor: 'pointer',
				}}
			>
				Afdrukken
			</button>
			<button
				type='button'
				onClick={() => router.push('/')}
				style={{
					padding: '10px 22px',
					borderRadius: 10,
					background: '#F5F4EF',
					color: '#2C2C2C',
					fontSize: 14,
					fontWeight: 600,
					border: 'none',
					cursor: 'pointer',
				}}
			>
				Sluiten
			</button>
		</div>
	);
}
