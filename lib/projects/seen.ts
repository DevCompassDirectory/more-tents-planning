import type { Project } from '@/lib/types/database';

export function isUnseen(project: Project, userEmail: string): boolean {
	if (!project.changes || project.changes.length === 0) return false;
	const seenBy = Array.isArray(project.seen_by) ? project.seen_by : [];
	return !seenBy.includes(userEmail);
}

export function unseenProjects(
	projects: Project[],
	userEmail: string,
): Project[] {
	return projects.filter((p) => isUnseen(p, userEmail));
}
