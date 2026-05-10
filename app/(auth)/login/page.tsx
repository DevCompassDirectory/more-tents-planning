'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/lib/auth/actions';

const initialState: LoginState = { error: null };

export default function LoginPage() {
	const [state, formAction, pending] = useActionState(login, initialState);

	return (
		<main className='min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-forest-700 via-forest-500 to-forest-500'>
			<div className='bg-white rounded-lg p-10 sm:p-12 w-full max-w-md shadow-2xl'>
				<h1 className='font-display text-3xl text-forest-500'>
					More Tents
				</h1>
				<p className='text-xs text-charcoal-900/60 uppercase tracking-widest mb-8 mt-1'>
					Planning en Projectbeheer
				</p>

				<form
					action={formAction}
					className='space-y-4'
				>
					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-charcoal-900 mb-1.5'>
							Email
						</label>
						<input
							name='email'
							type='email'
							required
							autoComplete='username'
							placeholder='pascal@moretents.com'
							className='w-full px-4 py-3 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors'
						/>
					</div>

					<div>
						<label className='block text-xs font-semibold uppercase tracking-wider text-charcoal-900 mb-1.5'>
							Wachtwoord
						</label>
						<input
							name='password'
							type='password'
							required
							autoComplete='current-password'
							placeholder='••••••••'
							className='w-full px-4 py-3 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors'
						/>
					</div>

					{state.error && (
						<div className='bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 text-center'>
							{state.error}
						</div>
					)}

					<button
						type='submit'
						disabled={pending}
						className='w-full py-3 bg-forest-500 hover:bg-forest-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors'
					>
						{pending ? 'Bezig met inloggen...' : 'Inloggen'}
					</button>
				</form>
			</div>
		</main>
	);
}
