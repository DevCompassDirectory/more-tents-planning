import type {
	CalendarDayEvent,
	CalendarEventType,
} from '@/lib/planning/calendar';

const STYLES: Record<CalendarEventType, string> = {
	op: 'bg-green-100 text-green-800 border-l-2 border-green-700',
	af: 'bg-amber-50 text-amber-800 border-l-2 border-amber-500',
	load: 'bg-blue-50 text-blue-800 border-l-2 border-blue-500',
	unload: 'bg-blue-50 text-blue-800 border-l-2 border-blue-500',
};

function labelFor(event: CalendarDayEvent): string {
	const klant = event.project.klant_naam || 'naamloos';
	switch (event.type) {
		case 'op':
			return `↑ ${klant}`;
		case 'af':
			return `↓ ${klant}`;
		case 'load':
			return '● Laden';
		case 'unload':
			return '● Lossen';
	}
}

const SIZE_CLASSES = {
	tiny: 'text-[10px] px-1 py-0.5',
	normal: 'text-[11px] px-1.5 py-0.5',
	large: 'text-xs px-2 py-1',
};

export function CalendarEventButton({
	event,
	unseen,
	onClick,
	size = 'normal',
}: {
	event: CalendarDayEvent;
	unseen: boolean;
	onClick: () => void;
	size?: keyof typeof SIZE_CLASSES;
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			title={event.project.klant_naam || 'naamloos'}
			className={`relative block w-full text-left rounded font-medium hover:opacity-80 transition-opacity ${SIZE_CLASSES[size]} ${STYLES[event.type]}`}
		>
			<span className='block truncate'>{labelFor(event)}</span>
			{unseen && (
				<span className='absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-lg' />
			)}
		</button>
	);
}
