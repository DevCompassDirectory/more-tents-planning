'use client';

import { useEffect } from 'react';

export function Modal({
	open,
	onClose,
	title,
	children,
	wide,
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	wide?: boolean;
}) {
	useEffect(() => {
		if (!open) return;
		function handleEsc(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		document.addEventListener('keydown', handleEsc);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', handleEsc);
			document.body.style.overflow = '';
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className='fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4'
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className={`bg-white rounded-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ${
					wide ? 'max-w-6xl' : 'max-w-2xl'
				}`}
			>
				<div className='px-7 py-5 border-b border-cream-300 flex items-center justify-between shrink-0'>
					<div className='font-display text-2xl'>{title}</div>
					<button
						type='button'
						onClick={onClose}
						className='w-9 h-9 rounded-full hover:bg-paper-50 text-charcoal-900/60 hover:text-charcoal-900 flex items-center justify-center text-xl transition-colors'
						aria-label='Sluiten'
					>
						×
					</button>
				</div>
				<div className='flex-1 overflow-y-auto'>{children}</div>
			</div>
		</div>
	);
}
