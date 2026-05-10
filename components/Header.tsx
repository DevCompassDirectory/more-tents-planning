import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { UserMenu } from '@/components/UserMenu';

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
				<Link
					href='/'
					className='font-display text-xl font-bold tracking-tight'
				>
					More Tents
				</Link>
				<div className='flex items-center gap-3'>
					{unreadCount > 0 && (
						<span className='bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg'>
							{unreadCount}{' '}
							{unreadCount === 1 ? 'wijziging' : 'wijzigingen'}
						</span>
					)}
					<UserMenu user={user} />
				</div>
			</div>
		</header>
	);
}
