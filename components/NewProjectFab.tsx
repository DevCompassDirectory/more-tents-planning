'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ProjectForm } from '@/components/ProjectForm';

export function NewProjectFab() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='fixed bottom-7 right-7 w-14 h-14 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-2xl leading-none shadow-lg shadow-forest-500/40 flex items-center justify-center transition-transform hover:scale-110 z-50'
				aria-label='Nieuw project'
				title='Nieuw project'
			>
				+
			</button>

			<Modal
				open={open}
				onClose={() => setOpen(false)}
				title='Nieuw project'
			>
				<ProjectForm onClose={() => setOpen(false)} />
			</Modal>
		</>
	);
}
