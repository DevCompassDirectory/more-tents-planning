import { createClient } from '@/lib/supabase/server';
import { logout } from '@/lib/auth/actions';

export default async function Home() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

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

			<div className='bg-white border border-cream-300 rounded-2xl px-6 py-4 shadow-sm text-center'>
				<div className='text-xs uppercase tracking-widest text-charcoal-900/60 mb-1'>
					Ingelogd als
				</div>
				<div className='font-medium text-forest-600'>{user?.email}</div>
			</div>

			<form action={logout}>
				<button
					type='submit'
					className='px-6 py-3 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-full transition-colors'
				>
					Uitloggen
				</button>
			</form>
		</main>
	);
}
