export function formatDate(d: string | null): string {
	if (!d) return '—';
	const [y, m, day] = d.split('-');
	return `${day}-${m}-${y}`;
}

export function formatTime(t: string | null): string {
	if (!t) return '';
	return t.slice(0, 5);
}
