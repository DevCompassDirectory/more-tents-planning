'use client';

import { useState, useEffect, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { extractPdfText } from '@/lib/pdf/extractText';
import { parsePdfText, type ParsedPdfFields } from '@/lib/pdf/parsePdf';
import { updateProjectFromPdf } from '@/lib/projects/actions';
import type { Project } from '@/lib/types/database';
import { createClient } from '@/lib/supabase/client';

type Diff = {
	key: string;
	label: string;
	oldValue: string;
	newValue: string;
	rawValue: string; // wat we naar formData sturen
};

export function UpdateFromPdfModal({
	project,
	file,
	open,
	onClose,
	onSuccess,
}: {
	project: Project;
	file: File | null;
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}) {
	return (
		<Modal
			open={open}
			onClose={onClose}
			title='PDF vergelijken met project'
			wide
		>
			{file && (
				<UpdateFromPdfContent
					project={project}
					file={file}
					onClose={onClose}
					onSuccess={onSuccess}
				/>
			)}
		</Modal>
	);
}

function UpdateFromPdfContent({
	project,
	file,
	onClose,
	onSuccess,
}: {
	project: Project;
	file: File;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
	const [parsed, setParsed] = useState<ParsedPdfFields | null>(null);
	const [oldLineItemsCount, setOldLineItemsCount] = useState<number | null>(
		null,
	);
	const [diffs, setDiffs] = useState<Diff[]>([]);
	const [lineItemsDiff, setLineItemsDiff] = useState<Diff | null>(null);
	const [enabled, setEnabled] = useState<Record<string, boolean>>({});
	const [note, setNote] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		let blobUrl = '';
		let cancelled = false;

		async function run() {
			try {
				blobUrl = URL.createObjectURL(file);
				if (!cancelled) setPdfBlobUrl(blobUrl);

				const supabase = createClient();
				const { count } = await supabase
					.from('line_items')
					.select('*', { count: 'exact', head: true })
					.eq('project_id', project.id);
				if (!cancelled) setOldLineItemsCount(count ?? 0);

				const { data: oldItems } = await supabase
					.from('line_items')
					.select('categorie,naam,aantal')
					.eq('project_id', project.id)
					.order('sort_order', { ascending: true });

				const text = await extractPdfText(file);
				if (cancelled) return;

				const p = parsePdfText(text);
				setParsed(p);

				const computed = computeDiffs(project, p);
				setDiffs(computed);

				const liDiff = computeLineItemsDiff(
					oldItems ?? [],
					p.line_items,
				);
				setLineItemsDiff(liDiff);

				const initial: Record<string, boolean> = {};
				computed.forEach((d) => (initial[d.key] = true));
				if (liDiff) initial.line_items = true;
				setEnabled(initial);
			} catch (e) {
				if (!cancelled)
					setError('Kon PDF niet inlezen: ' + (e as Error).message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		run();

		return () => {
			cancelled = true;
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [file, project]);

	function toggle(key: string) {
		setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
	}

	function submit(applyChanges: boolean) {
		setError(null);
		const formData = new FormData();
		formData.append('pdf', file);
		if (note.trim()) formData.append('note', note.trim());

		if (applyChanges) {
			diffs.forEach((d) => {
				if (enabled[d.key]) formData.append(d.key, d.rawValue);
			});
			if (enabled.line_items && parsed) {
				formData.append(
					'line_items_json',
					JSON.stringify(parsed.line_items),
				);
			}
		}

		startTransition(async () => {
			const result = await updateProjectFromPdf(project.id, formData);
			if (result.success) {
				onSuccess();
			} else {
				setError(result.error ?? 'Onbekende fout');
			}
		});
	}

	const totalChanges =
		diffs.filter((d) => enabled[d.key]).length +
		(lineItemsDiff && enabled.line_items ? 1 : 0);

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 h-[calc(90vh-4rem)] overflow-hidden'>
			<div className='hidden md:block bg-paper-50 border-r border-cream-300'>
				{pdfBlobUrl && (
					<iframe
						src={pdfBlobUrl}
						className='w-full h-full'
						title='PDF preview'
					/>
				)}
			</div>

			<div className='overflow-y-auto px-6 py-5'>
				{loading && (
					<div className='text-center text-charcoal-900/60 py-8'>
						PDF inlezen en vergelijken...
					</div>
				)}

				{error && (
					<div className='bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4'>
						{error}
					</div>
				)}

				{!loading && parsed && (
					<>
						{diffs.length === 0 && !lineItemsDiff ? (
							<div className='bg-forest-50 border border-forest-100 rounded-xl px-4 py-3 mb-5'>
								<div className='text-sm font-medium text-forest-600 mb-1'>
									Geen wijzigingen gedetecteerd
								</div>
								<div className='text-xs text-charcoal-900/70'>
									De gegevens uit deze PDF komen overeen met
									het bestaande project. Wil je het bestand
									alleen aan de documenten koppelen?
								</div>
							</div>
						) : (
							<>
								<div className='bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5'>
									<div className='text-xs font-bold uppercase tracking-wider text-amber-800 mb-1'>
										Wijzigingen gevonden
									</div>
									<div className='text-sm text-amber-900'>
										{diffs.length + (lineItemsDiff ? 1 : 0)}{' '}
										{diffs.length +
											(lineItemsDiff ? 1 : 0) ===
										1
											? 'veld is'
											: 'velden zijn'}{' '}
										anders dan in het huidige project. Vink
										aan welke je wilt overnemen.
									</div>
								</div>

								<div className='space-y-2 mb-5'>
									{diffs.map((d) => (
										<DiffRow
											key={d.key}
											diff={d}
											enabled={!!enabled[d.key]}
											onToggle={() => toggle(d.key)}
										/>
									))}
									{lineItemsDiff && (
										<DiffRow
											diff={lineItemsDiff}
											enabled={!!enabled.line_items}
											onToggle={() =>
												toggle('line_items')
											}
										/>
									)}
								</div>

								<div className='mb-5'>
									<label className='text-xs font-semibold text-charcoal-900 mb-1 block'>
										Toelichting (optioneel)
									</label>
									<input
										value={note}
										onChange={(e) =>
											setNote(e.target.value)
										}
										placeholder="Bijv. 'Klant heeft datum verzet'"
										className='w-full px-3 py-2.5 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none text-sm transition-colors'
									/>
								</div>
							</>
						)}

						<div className='flex flex-wrap gap-3 justify-end pt-4 border-t border-cream-300'>
							<button
								type='button'
								onClick={onClose}
								disabled={pending}
								className='px-5 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-xl transition-colors disabled:opacity-60'
							>
								Annuleer
							</button>
							{(diffs.length > 0 || lineItemsDiff) && (
								<button
									type='button'
									onClick={() => submit(false)}
									disabled={pending}
									className='px-5 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-xl transition-colors disabled:opacity-60'
									title='PDF alleen toevoegen aan documenten zonder velden te wijzigen'
								>
									Alleen toevoegen
								</button>
							)}
							<button
								type='button'
								onClick={() => submit(true)}
								disabled={pending}
								className='px-5 py-2.5 bg-forest-500 hover:bg-forest-600 disabled:opacity-60 text-white font-medium rounded-xl transition-colors'
							>
								{pending
									? 'Bezig...'
									: totalChanges > 0
										? `${totalChanges} wijziging${totalChanges === 1 ? '' : 'en'} toepassen`
										: 'PDF toevoegen'}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

function DiffRow({
	diff,
	enabled,
	onToggle,
}: {
	diff: Diff;
	enabled: boolean;
	onToggle: () => void;
}) {
	return (
		<label
			className={`flex gap-3 items-start px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
				enabled
					? 'bg-forest-50/50 border-forest-100'
					: 'bg-paper-50 border-cream-300 opacity-60'
			}`}
		>
			<input
				type='checkbox'
				checked={enabled}
				onChange={onToggle}
				className='mt-0.5 w-4 h-4 accent-forest-500 cursor-pointer flex-shrink-0'
			/>
			<div className='flex-1 min-w-0'>
				<div className='text-xs font-semibold text-charcoal-900 mb-0.5'>
					{diff.label}
				</div>
				<div className='text-sm text-charcoal-900/80 truncate'>
					<span className='text-charcoal-900/50'>
						{diff.oldValue}
					</span>
					<span className='mx-2 text-forest-500'>→</span>
					<span className='font-medium'>{diff.newValue}</span>
				</div>
			</div>
		</label>
	);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function computeDiffs(project: Project, parsed: ParsedPdfFields): Diff[] {
	const list: Diff[] = [];

	const compare = (
		key: string,
		label: string,
		parsedVal: string | undefined,
		formatter?: (s: string) => string,
	) => {
		if (parsedVal === undefined || parsedVal === '') return;

		const projectVal = (project as unknown as Record<string, unknown>)[key];
		const oldNorm = normalize(key, projectVal);
		const newNorm = normalize(key, parsedVal);
		if (oldNorm === newNorm) return;

		const display = (raw: unknown): string => {
			if (raw === null || raw === undefined || raw === '') return '—';
			const str = key.startsWith('tijd_')
				? String(raw).slice(0, 5)
				: String(raw);
			return formatter ? formatter(str) : str;
		};

		list.push({
			key,
			label,
			oldValue: display(projectVal),
			newValue: display(parsedVal),
			rawValue: parsedVal,
		});
	};

	const fmtDate = (iso: string) => {
		const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
	};

	compare('offerte_nr', 'Offerte nr', parsed.offerte_nr);
	compare('klant_naam', 'Klant naam', parsed.klant_naam);
	compare('locatie', 'Locatie', parsed.locatie);
	compare('datum_opbouw', 'Datum opbouw', parsed.datum_opbouw, fmtDate);
	compare('tijd_opbouw', 'Tijd opbouw', parsed.tijd_opbouw);
	compare('datum_afbouw', 'Datum afbouw', parsed.datum_afbouw, fmtDate);
	compare('tijd_afbouw', 'Tijd afbouw', parsed.tijd_afbouw);

	return list;
}

function normalize(key: string, val: unknown): string {
	if (val === null || val === undefined) return '';
	let s = String(val);
	if (key.startsWith('tijd_')) s = s.slice(0, 5);
	return s;
}

function computeLineItemsDiff(
	oldItems: { categorie: string; naam: string; aantal: string }[],
	newItems: { categorie: string; naam: string; aantal: string }[],
): Diff | null {
	if (newItems.length === 0) return null;
	const sameLength = oldItems.length === newItems.length;
	const sameContent =
		sameLength &&
		oldItems.every(
			(it, i) =>
				it.categorie === newItems[i].categorie &&
				it.naam === newItems[i].naam &&
				it.aantal === newItems[i].aantal,
		);
	if (sameContent) return null;
	return {
		key: 'line_items',
		label: 'Artikelen (pakbon)',
		oldValue: `${oldItems.length} artikelen`,
		newValue: `${newItems.length} artikelen`,
		rawValue: '',
	};
}
