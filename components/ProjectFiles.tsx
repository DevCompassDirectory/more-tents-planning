'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UpdateFromPdfModal } from '@/components/UpdateFromPdfModal';
import type { Project } from '@/lib/types/database';

type ProjectFile = {
	id: string;
	file_name: string;
	file_size: number | null;
	storage_path: string;
	uploaded_at: string;
	uploaded_by: string | null;
	mime_type: string | null;
};

export function ProjectFiles({ project }: { project: Project }) {
	const [files, setFiles] = useState<ProjectFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [modalOpen, setModalOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const loadFiles = useCallback(async () => {
		const supabase = createClient();
		const { data, error } = await supabase
			.from('project_files')
			.select('*')
			.eq('project_id', project.id)
			.order('uploaded_at', { ascending: false });
		if (error) {
			setError('Documenten laden mislukt: ' + error.message);
			return;
		}
		setFiles(data ?? []);
	}, [project.id]);

	useEffect(() => {
		setLoading(true);
		setError(null);
		loadFiles().finally(() => setLoading(false));
	}, [loadFiles]);

	async function handleOpen(storagePath: string) {
		const supabase = createClient();
		const { data, error } = await supabase.storage
			.from('project-files')
			.createSignedUrl(storagePath, 300);
		if (error || !data) {
			setError(
				'Bestand openen mislukt: ' + (error?.message ?? 'geen url'),
			);
			return;
		}
		window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
	}

	async function downloadAsFile(pf: ProjectFile): Promise<File | null> {
		const supabase = createClient();
		const { data, error } = await supabase.storage
			.from('project-files')
			.download(pf.storage_path);
		if (error || !data) {
			console.error('Download mislukt:', error);
			return null;
		}
		return new File([data], pf.file_name, {
			type: pf.mime_type ?? 'application/pdf',
		});
	}

	async function handleDelete(file: ProjectFile, idx: number) {
		const isTop = idx === 0;
		const nextFile = isTop && files.length > 1 ? files[1] : null;

		const message = nextFile
			? `PDF "${file.file_name}" verwijderen? Daarna wordt het project vergeleken met "${nextFile.file_name}" zodat je kunt kiezen welke velden je terugzet.`
			: `PDF "${file.file_name}" verwijderen?`;

		if (!window.confirm(message)) return;

		setDeleting(file.id);
		setError(null);

		try {
			const supabase = createClient();

			const { error: storageErr } = await supabase.storage
				.from('project-files')
				.remove([file.storage_path]);
			if (storageErr) {
				console.error('Storage verwijderen gaf fout:', storageErr);
			}

			const { error: dbErr } = await supabase
				.from('project_files')
				.delete()
				.eq('id', file.id);
			if (dbErr) {
				setError('Verwijderen mislukt: ' + dbErr.message);
				return;
			}

			await loadFiles();

			if (nextFile) {
				const downloaded = await downloadAsFile(nextFile);
				if (downloaded) {
					setSelectedFile(downloaded);
					setModalOpen(true);
				}
			}
		} finally {
			setDeleting(null);
		}
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0];
		e.target.value = '';
		if (!f) return;
		setSelectedFile(f);
		setModalOpen(true);
	}

	function handleModalClose() {
		setModalOpen(false);
		setSelectedFile(null);
	}

	async function handleSuccess() {
		handleModalClose();
		await loadFiles();
	}

	return (
		<div className='bg-paper-50 rounded-2xl p-5'>
			<div className='flex items-center justify-between mb-3 gap-3'>
				<div className='text-xs font-bold text-forest-500 uppercase tracking-wider'>
					Documenten {files.length > 0 && `(${files.length})`}
				</div>
				<input
					ref={fileInputRef}
					type='file'
					accept='.pdf,application/pdf'
					onChange={handleFileChange}
					className='hidden'
				/>
				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					className='text-xs px-3 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg font-medium transition-colors'
				>
					+ PDF toevoegen
				</button>
			</div>

			{error && (
				<div className='bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2 mb-3'>
					{error}
				</div>
			)}

			{loading ? (
				<div className='text-sm text-charcoal-900/60 py-4 text-center'>
					Documenten laden...
				</div>
			) : files.length === 0 ? (
				<div className='text-sm text-charcoal-900/60 py-4 text-center'>
					Nog geen documenten gekoppeld.
				</div>
			) : (
				<div className='space-y-2'>
					{files.map((file, idx) => (
						<div
							key={file.id}
							className='flex bg-white border border-cream-300 rounded-xl overflow-hidden transition-colors'
						>
							<button
								type='button'
								onClick={() => handleOpen(file.storage_path)}
								className='flex-1 flex items-center gap-3 px-4 py-3 hover:bg-forest-50 transition-colors text-left min-w-0 group'
							>
								<span className='text-2xl flex-shrink-0'>
									📄
								</span>
								<div className='flex-1 min-w-0'>
									<div className='flex items-center gap-2 flex-wrap'>
										<span className='text-sm font-medium text-charcoal-900 truncate'>
											{file.file_name}
										</span>
										{idx === 0 && files.length > 1 && (
											<span className='text-[10px] bg-forest-50 text-forest-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider'>
												Laatst toegevoegd
											</span>
										)}
									</div>
									<div className='text-xs text-charcoal-900/60 mt-0.5'>
										{formatDateTime(file.uploaded_at)}
										{file.file_size
											? ` • ${formatBytes(file.file_size)}`
											: ''}
										{file.uploaded_by
											? ` • ${file.uploaded_by}`
											: ''}
									</div>
								</div>
								<span className='text-xs text-forest-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0'>
									Open →
								</span>
							</button>
							<button
								type='button'
								onClick={() => handleDelete(file, idx)}
								disabled={deleting === file.id}
								className='px-4 border-l border-cream-300 hover:bg-red-50 text-red-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-wait text-sm'
								title='Verwijder PDF'
								aria-label='Verwijder PDF'
							>
								{deleting === file.id ? '...' : '🗑'}
							</button>
						</div>
					))}
				</div>
			)}

			<UpdateFromPdfModal
				project={project}
				file={selectedFile}
				open={modalOpen}
				onClose={handleModalClose}
				onSuccess={handleSuccess}
			/>
		</div>
	);
}

function formatDateTime(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleString('nl-NL', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
