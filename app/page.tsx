import { createClient } from '@/lib/supabase/server';

export default async function Home() {
	let connectionStatus: string;
	let statusColor: string;

	try {
		const supabase = await createClient();
		const { data, error } = await supabase.auth.getUser();
		if (error && error.message !== 'Auth session missing!') {
			connectionStatus = `Fout: ${error.message}`;
			statusColor = 'text-red-700';
		} else if (data.user) {
			connectionStatus = `Ingelogd als ${data.user.email}`;
			statusColor = 'text-forest-600';
		} else {
			connectionStatus = 'Verbonden, geen sessie';
			statusColor = 'text-forest-600';
		}
	} catch (e) {
		connectionStatus = `Verbindingsfout: ${(e as Error).message}`;
		statusColor = 'text-red-700';
	}

	return (
		<main className='min-h-screen p-12 flex flex-col items-center justify-center gap-10'>
			<div className='text-center'>
				<h1 className='font-display text-5xl md:text-6xl text-forest-500 leading-tight'>
					More Tents{' '}
					<span className='text-sand-400 italic'>Planning</span>
				</h1>
				<p className='mt-3 text-charcoal-900/70 tracking-widest uppercase text-xs'>
					Projectbeheer en planning
				</p>
			</div>

			<div className='flex gap-4 flex-wrap justify-center max-w-2xl'>
				<Swatch
					name='forest-500'
					bg='bg-forest-500'
					fg='text-white'
				/>
				<Swatch
					name='forest-600'
					bg='bg-forest-600'
					fg='text-white'
				/>
				<Swatch
					name='sand-400'
					bg='bg-sand-400'
					fg='text-charcoal-900'
				/>
				<Swatch
					name='cream-300'
					bg='bg-cream-300'
					fg='text-charcoal-900'
				/>
				<Swatch
					name='paper-50'
					bg='bg-paper-50 border border-cream-300'
					fg='text-charcoal-900'
				/>
				<Swatch
					name='charcoal-900'
					bg='bg-charcoal-900'
					fg='text-white'
				/>
			</div>

			<div className='bg-white border border-cream-300 rounded-2xl px-6 py-4 shadow-sm'>
				<div className='text-xs uppercase tracking-widest text-charcoal-900/60 mb-1'>
					Supabase status
				</div>
				<div className={`font-medium ${statusColor}`}>
					{connectionStatus}
				</div>
			</div>
		</main>
	);
}

function Swatch({ name, bg, fg }: { name: string; bg: string; fg: string }) {
	return (
		<div
			className={`w-28 h-28 rounded-2xl flex items-end p-3 text-xs font-medium ${bg} ${fg}`}
		>
			{name}
		</div>
	);
}
