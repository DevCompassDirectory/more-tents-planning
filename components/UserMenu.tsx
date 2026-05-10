'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/auth/actions';
import type { User } from '@supabase/supabase-js';

export function UserMenu({ user }: { user: User }) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onClick(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		if (open) document.addEventListener('mousedown', onClick);
		return () => document.removeEventListener('mousedown', onClick);
	}, [open]);

	return (
		<div
			className='relative'
			ref={ref}
		>
			<button
				type='button'
				onClick={() => setOpen((o) => !o)}
				className='flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-sm font-medium transition-colors'
			>
				<span className='hidden sm:inline'>{user.email}</span>
				<span className='sm:hidden'>Account</span>
				<span className='text-xs opacity-70'>▾</span>
			</button>

			{open && (
				<div className='absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-cream-300 py-1 z-50 text-charcoal-900'>
					<div className='px-4 py-2 text-xs text-charcoal-900/60 border-b border-cream-300'>
						{user.email}
					</div>
					<Link
						href='/producten'
						onClick={() => setOpen(false)}
						className='block px-4 py-2 text-sm hover:bg-paper-50 transition-colors'
					>
						Producten beheer
					</Link>
					<div className='border-t border-cream-300 my-1' />
					<form action={logout}>
						<button
							type='submit'
							className='w-full text-left px-4 py-2 text-sm hover:bg-paper-50 transition-colors'
						>
							Uitloggen
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
