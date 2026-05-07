import { logout } from '@/lib/auth/actions';
import type { User } from '@supabase/supabase-js';

export function Header({
	user,
	unreadCount,
}: {
	user: User;
	unreadCount: number;
}) {
	return (
		<header className='bg-forest-500 text-white sticky top-0 z-50 shadow-sm'>
			<div className='max-w-6xl mx-auto px-6 h-14 flex items-center justify-between'>
				<div className='font-display text-xl font-bold tracking-tight'>
					More Tents
				</div>
				<div className='flex items-center gap-3'>
					{unreadCount > 0 && (
						<span className='bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full'>
							{unreadCount}{' '}
							{unreadCount === 1 ? 'wijziging' : 'wijzigingen'}
						</span>
					)}
					<span className='text-sm opacity-80 hidden sm:inline'>
						{user.email}
					</span>
					<form action={logout}>
						<button
							type='submit'
							className='bg-white/15 hover:bg-white/25 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors'
						>
							Uitloggen
						</button>
					</form>
				</div>
			</div>
		</header>
	);
}
