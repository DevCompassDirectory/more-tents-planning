import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { NewProjectFab } from '@/components/NewProjectFab';

export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect('/login');
	}

	return (
		<>
			<Header user={user} />
			{children}
			<NewProjectFab />
		</>
	);
}
