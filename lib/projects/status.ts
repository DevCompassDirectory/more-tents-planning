import type { ProjectStatus } from '@/lib/types/database';

const STATUS_BADGE: Record<ProjectStatus, string> = {
	Nieuw: 'bg-blue-100 text-blue-800',
	'Uitvraag gedaan': 'bg-violet-100 text-violet-800',
	Gepland: 'bg-yellow-100 text-yellow-800',
	Bevestigd: 'bg-green-100 text-green-800',
	Gewijzigd: 'bg-orange-50 text-orange-700',
	Afgerond: 'bg-gray-100 text-gray-700',
	Geannuleerd: 'bg-red-100 text-red-800',
};

const STATUS_BORDER: Record<ProjectStatus, string> = {
	Nieuw: 'border-l-blue-500',
	'Uitvraag gedaan': 'border-l-violet-600',
	Gepland: 'border-l-yellow-500',
	Bevestigd: 'border-l-forest-500',
	Gewijzigd: 'border-l-amber-500',
	Afgerond: 'border-l-gray-400',
	Geannuleerd: 'border-l-red-500',
};

export function statusBadgeClasses(status: ProjectStatus): string {
	return STATUS_BADGE[status] ?? STATUS_BADGE['Nieuw'];
}

export function statusBorderClasses(status: ProjectStatus): string {
	return STATUS_BORDER[status] ?? STATUS_BORDER['Nieuw'];
}
