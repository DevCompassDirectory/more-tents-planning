'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type ProjectFile = {
	id: string;
	file_name: string;
	file_size: number | null;
	storage_path: string;
	uploaded_at: string;
	uploaded_by: string | null;
};

export function ProjectFiles({ projectId }: { projectId: string }) {
	const [files, setFiles] = useState<ProjectFile[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const loadFiles = useCallback(async () => {
		const supabase = createClient();
		const { data, error } = await supabase
			.from('project_files')
			.select('*')
			.eq('project_id', projectId)
			.order('uploaded_at', { ascending: false });
		if (error) {
			setError('Documenten laden mislukt: ' + error.message);
			return;
		}
		setFiles(data ?? []);
	}, [projectId]);

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

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;

		setUploading(true);
		setError(null);
		try {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				setError('Niet ingelogd');
				return;
			}

			const safeName = file.name.replace(/[^\w\-.]/g, '_');
			const storagePath = `${projectId}/${Date.now()}-${safeName}`;

			const { error: uploadError } = await supabase.storage
				.from('project-files')
				.upload(storagePath, file, {
					contentType: file.type || 'application/pdf',
					upsert: false,
				});
			if (uploadError) {
				setError('Upload mislukt: ' + uploadError.message);
				return;
			}

			const { error: insertError } = await supabase
				.from('project_files')
				.insert({
					project_id: projectId,
					storage_path: storagePath,
					file_name: file.name,
					file_size: file.size,
					mime_type: file.type || 'application/pdf',
					uploaded_by: user.email ?? '',
				});
			if (insertError) {
				setError('Bestand registreren mislukt: ' + insertError.message);
				return;
			}

			await loadFiles();
		} finally {
			setUploading(false);
		}
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
					disabled={uploading}
					className='text-xs px-3 py-1.5 bg-forest-500 hover:bg-forest-600 disabled:opacity-60 text-white rounded-lg font-medium transition-colors'
				>
					{uploading ? 'Uploaden...' : '+ PDF toevoegen'}
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
						<button
							key={file.id}
							type='button'
							onClick={() => handleOpen(file.storage_path)}
							className='w-full text-left bg-white hover:bg-forest-50 border border-cream-300 hover:border-forest-500 rounded-xl px-4 py-3 transition-colors flex items-center gap-3 group'
						>
							<span className='text-2xl flex-shrink-0'>📄</span>
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
					))}
				</div>
			)}
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
