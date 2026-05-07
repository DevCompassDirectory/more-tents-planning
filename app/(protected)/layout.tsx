import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { NewProjectFab } from '@/components/NewProjectFab';
import { getProjects } from '@/lib/projects/queries';
import { unseenProjects } from '@/lib/projects/seen';

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

	const projects = await getProjects();
	const unread = unseenProjects(projects, user.email ?? '');

	return (
		<>
			<Header
				user={user}
				unreadCount={unread.length}
			/>
			{children}
			<NewProjectFab />
		</>
	);
}
