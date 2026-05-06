'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type LoginState = {
	error: string | null;
};

export async function login(
	_prevState: LoginState,
	formData: FormData,
): Promise<LoginState> {
	const email = (formData.get('email') as string)?.trim();
	const password = formData.get('password') as string;

	if (!email || !password) {
		return { error: 'Vul email en wachtwoord in' };
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return { error: 'Email of wachtwoord onjuist' };
	}

	redirect('/');
}

export async function logout() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect('/login');
}
