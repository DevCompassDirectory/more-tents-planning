'use client';

import { useState, useRef, useEffect, useActionState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { extractPdfText } from '@/lib/pdf/extractText';
import { parsePdfText, type ParsedPdfFields } from '@/lib/pdf/parsePdf';
import {
	createProjectFromPdf,
	type CreateProjectState,
} from '@/lib/projects/actions';
import { PROJECT_STATUSES } from '@/lib/types/database';
import { DayContext } from '@/components/DayContext';

const initialState: CreateProjectState = { error: null, success: false };

export function PdfImportFab() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [file, setFile] = useState<File | null>(null);
	const [open, setOpen] = useState(false);

	function handleFabClick() {
		fileInputRef.current?.click();
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0];
		if (!selected) return;
		setFile(selected);
		setOpen(true);
		e.target.value = '';
	}

	function handleClose() {
		setOpen(false);
		setFile(null);
	}

	return (
		<>
			<input
				ref={fileInputRef}
				type='file'
				accept='.pdf,application/pdf'
				onChange={handleFileChange}
				className='hidden'
			/>
			<button
				type='button'
				onClick={handleFabClick}
				className='fixed bottom-9 right-24 w-12 h-12 bg-white border-2 border-forest-500 text-forest-500 rounded-full text-xl shadow-md hover:bg-forest-50 flex items-center justify-center transition-transform hover:scale-110 z-50'
				aria-label='Project importeren uit PDF offerte'
				title='Project importeren uit PDF offerte'
			>
				📄
			</button>

			<Modal
				open={open}
				onClose={handleClose}
				title='Nieuw project van offerte'
				wide
			>
				{file && (
					<PdfImportContent
						file={file}
						onClose={handleClose}
					/>
				)}
			</Modal>
		</>
	);
}

function PdfImportContent({
	file,
	onClose,
}: {
	file: File;
	onClose: () => void;
}) {
	const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
	const [parsed, setParsed] = useState<ParsedPdfFields | null>(null);
	const [loading, setLoading] = useState(true);
	const [extractError, setExtractError] = useState<string | null>(null);

	useEffect(() => {
		let blobUrl = '';
		let cancelled = false;

		async function run() {
			try {
				blobUrl = URL.createObjectURL(file);
				if (!cancelled) setPdfBlobUrl(blobUrl);

				const text = await extractPdfText(file);
				if (cancelled) return;

				setParsed(parsePdfText(text));
			} catch (e) {
				if (!cancelled)
					setExtractError(
						'Kon PDF niet inlezen: ' + (e as Error).message,
					);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		run();

		return () => {
			cancelled = true;
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	}, [file]);

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
			<div className='overflow-y-auto'>
				{loading && (
					<div className='p-8 text-center text-charcoal-900/60'>
						PDF inlezen en parseren...
					</div>
				)}
				{extractError && (
					<div className='p-8 text-red-700'>{extractError}</div>
				)}
				{parsed && (
					<PdfImportForm
						file={file}
						parsed={parsed}
						onClose={onClose}
					/>
				)}
			</div>
		</div>
	);
}

function PdfImportForm({
	file,
	parsed,
	onClose,
}: {
	file: File;
	parsed: ParsedPdfFields;
	onClose: () => void;
}) {
	const [state, formAction, pending] = useActionState(
		createProjectFromPdf,
		initialState,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [datumOpbouw, setDatumOpbouw] = useState(parsed.datum_opbouw ?? '');
	const [datumAfbouw, setDatumAfbouw] = useState(parsed.datum_afbouw ?? '');
	const [inhuurOpbouw, setInhuurOpbouw] = useState('');
	const [inhuurAfbouw, setInhuurAfbouw] = useState('');

	function addInhuurName(phase: 'opbouw' | 'afbouw', name: string) {
		const setter = phase === 'opbouw' ? setInhuurOpbouw : setInhuurAfbouw;
		const current = phase === 'opbouw' ? inhuurOpbouw : inhuurAfbouw;
		const names = current
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		if (names.includes(name)) return;
		setter([...names, name].join(', '));
	}

	useEffect(() => {
		if (fileInputRef.current) {
			const dt = new DataTransfer();
			dt.items.add(file);
			fileInputRef.current.files = dt.files;
		}
	}, [file]);

	useEffect(() => {
		if (state.success) onClose();
	}, [state.success, onClose]);

	const isDetected = (v: string | undefined) => v !== undefined && v !== '';

	const detCls = (v: string | undefined) =>
		isDetected(v) ? 'border-forest-500 bg-forest-50/50' : '';

	const detBadge = (v: string | undefined) =>
		isDetected(v) ? (
			<span className='ml-1 text-[10px] bg-forest-50 text-forest-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider'>
				herkend
			</span>
		) : null;

	const totalDetected = (
		[
			parsed.offerte_nr,
			parsed.klant_naam,
			parsed.locatie,
			parsed.datum_opbouw,
			parsed.tijd_opbouw,
			parsed.datum_afbouw,
			parsed.tijd_afbouw,
		] as (string | undefined)[]
	).filter(isDetected).length;

	return (
		<form
			action={formAction}
			className='px-6 py-5'
		>
			<input
				ref={fileInputRef}
				type='file'
				name='pdf'
				className='hidden'
			/>
			<input
				type='hidden'
				name='line_items_json'
				value={JSON.stringify(parsed.line_items)}
			/>

			<div className='bg-forest-50 border border-forest-100 rounded-xl px-4 py-3 mb-5'>
				<div className='text-xs font-bold uppercase tracking-wider text-forest-600 mb-1'>
					PDF herkend
				</div>
				<div className='text-sm text-charcoal-900/80'>
					{totalDetected} {totalDetected === 1 ? 'veld' : 'velden'} en{' '}
					{parsed.line_items.length}{' '}
					{parsed.line_items.length === 1 ? 'artikel' : 'artikelen'}{' '}
					automatisch ingevuld.
				</div>
			</div>

			<Section title='Algemeen'>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
					<Field
						label={<>Offerte nr {detBadge(parsed.offerte_nr)}</>}
					>
						<input
							name='offerte_nr'
							defaultValue={parsed.offerte_nr ?? ''}
							placeholder='MT-2026-001'
							className={`${inputCls} ${detCls(parsed.offerte_nr)}`}
						/>
					</Field>
					<Field label='Status'>
						<select
							name='status'
							defaultValue='Nieuw'
							className={inputCls}
						>
							{PROJECT_STATUSES.map((s) => (
								<option
									key={s}
									value={s}
								>
									{s}
								</option>
							))}
						</select>
					</Field>
				</div>
				<Field
					label={<>Klant naam {detBadge(parsed.klant_naam)}</>}
					className='mb-3'
				>
					<input
						name='klant_naam'
						defaultValue={parsed.klant_naam ?? ''}
						placeholder='Naam klant of bedrijf'
						className={`${inputCls} ${detCls(parsed.klant_naam)}`}
					/>
				</Field>
				<Field label={<>Locatie {detBadge(parsed.locatie)}</>}>
					<input
						name='locatie'
						defaultValue={parsed.locatie ?? ''}
						placeholder='Locatienaam of adres'
						className={`${inputCls} ${detCls(parsed.locatie)}`}
					/>
				</Field>
			</Section>

			<Section title={<>Opbouw {detBadge(parsed.datum_opbouw)}</>}>
				<div className='grid grid-cols-3 gap-3 mb-4'>
					<Field label='Datum'>
						<input
							type='date'
							name='datum_opbouw'
							value={datumOpbouw}
							onChange={(e) => setDatumOpbouw(e.target.value)}
							className={`${inputCls} ${detCls(parsed.datum_opbouw)}`}
						/>
					</Field>
					<Field label='Starttijd'>
						<input
							type='time'
							name='tijd_opbouw'
							defaultValue={parsed.tijd_opbouw ?? ''}
							className={`${inputCls} ${detCls(parsed.tijd_opbouw)}`}
						/>
					</Field>
					<Field label='Eindtijd'>
						<input
							type='time'
							name='eindtijd_opbouw'
							className={inputCls}
						/>
					</Field>
				</div>
				<DayContext
					date={datumOpbouw}
					currentInhuur={inhuurOpbouw}
					onAddInhuur={(name) => addInhuurName('opbouw', name)}
				/>
			</Section>

			<Section title={<>Afbouw {detBadge(parsed.datum_afbouw)}</>}>
				<div className='grid grid-cols-3 gap-3 mb-4'>
					<Field label='Datum'>
						<input
							type='date'
							name='datum_afbouw'
							value={datumAfbouw}
							onChange={(e) => setDatumAfbouw(e.target.value)}
							className={`${inputCls} ${detCls(parsed.datum_afbouw)}`}
						/>
					</Field>
					<Field label='Starttijd'>
						<input
							type='time'
							name='tijd_afbouw'
							defaultValue={parsed.tijd_afbouw ?? ''}
							className={`${inputCls} ${detCls(parsed.tijd_afbouw)}`}
						/>
					</Field>
					<Field label='Eindtijd'>
						<input
							type='time'
							name='eindtijd_afbouw'
							className={inputCls}
						/>
					</Field>
				</div>
				<DayContext
					date={datumAfbouw}
					currentInhuur={inhuurAfbouw}
					onAddInhuur={(name) => addInhuurName('afbouw', name)}
				/>
			</Section>

			<Section title='Personeel'>
				<div className='grid grid-cols-[auto_1fr_1fr] gap-3 items-center mb-4'>
					<div></div>
					<div className='text-xs font-bold text-charcoal-900/60 uppercase tracking-wider text-center'>
						Opbouw
					</div>
					<div className='text-xs font-bold text-charcoal-900/60 uppercase tracking-wider text-center'>
						Afbouw
					</div>

					<div className='text-sm font-medium'>Pascal</div>
					<YesNoSelect name='pascal_opbouw' />
					<YesNoSelect name='pascal_afbouw' />

					<div className='text-sm font-medium'>Jip</div>
					<YesNoSelect name='jip_opbouw' />
					<YesNoSelect name='jip_afbouw' />
				</div>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
					<Field label='Inhuur opbouw'>
						<input
							name='inhuur_opbouw'
							value={inhuurOpbouw}
							onChange={(e) => setInhuurOpbouw(e.target.value)}
							placeholder='Kevin, Bart'
							className={inputCls}
						/>
					</Field>
					<Field label='Inhuur afbouw'>
						<input
							name='inhuur_afbouw'
							value={inhuurAfbouw}
							onChange={(e) => setInhuurAfbouw(e.target.value)}
							placeholder='Kevin'
							className={inputCls}
						/>
					</Field>
				</div>
			</Section>

			<Section title='Laden & Lossen (optioneel)'>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
					<Field label='Laaddatum opbouw'>
						<input
							type='date'
							name='laad_datum_opbouw'
							className={inputCls}
						/>
					</Field>
					<Field label='Laadtijd'>
						<input
							type='time'
							name='laad_tijd_opbouw'
							defaultValue='18:00'
							className={inputCls}
						/>
					</Field>
				</div>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
					<Field label='Losdatum afbouw'>
						<input
							type='date'
							name='laad_datum_afbouw'
							className={inputCls}
						/>
					</Field>
					<Field label='Lostijd'>
						<input
							type='time'
							name='laad_tijd_afbouw'
							defaultValue='18:00'
							className={inputCls}
						/>
					</Field>
				</div>
			</Section>

			{parsed.line_items.length > 0 && (
				<Section
					title={`Herkende artikelen (${parsed.line_items.length})`}
				>
					<div className='bg-paper-50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1'>
						{parsed.line_items.map((it, i) => (
							<div
								key={i}
								className='flex justify-between text-xs gap-2 py-1 border-b border-cream-300/60 last:border-b-0'
							>
								<span className='flex-1 truncate'>
									<span className='text-charcoal-900/60'>
										{it.categorie}
									</span>{' '}
									— {it.naam}
								</span>
								<span className='font-semibold whitespace-nowrap'>
									{it.aantal}
								</span>
							</div>
						))}
					</div>
				</Section>
			)}

			<Section
				title='Notities'
				last
			>
				<textarea
					name='notities'
					rows={2}
					placeholder='Bijzonderheden...'
					className={`${inputCls} resize-y min-h-[60px]`}
				/>
			</Section>

			{state.error && (
				<div className='bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mt-4'>
					{state.error}
				</div>
			)}

			<div className='flex gap-3 justify-end pt-5 mt-6 border-t border-cream-300 sticky bottom-0 bg-white -mx-6 -mb-5 px-6 py-4'>
				<button
					type='button'
					onClick={onClose}
					className='px-5 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-xl transition-colors'
				>
					Annuleer
				</button>
				<button
					type='submit'
					disabled={pending}
					className='px-5 py-2.5 bg-forest-500 hover:bg-forest-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors'
				>
					{pending ? 'Opslaan...' : 'Project opslaan'}
				</button>
			</div>
		</form>
	);
}

const inputCls =
	'w-full px-3 py-2.5 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors text-sm';

function Section({
	title,
	children,
	last,
}: {
	title: React.ReactNode;
	children: React.ReactNode;
	last?: boolean;
}) {
	return (
		<div className={last ? '' : 'mb-6'}>
			<div className='text-xs font-bold text-forest-500 uppercase tracking-wider pb-1.5 mb-3 border-b border-forest-50 flex items-center'>
				{title}
			</div>
			{children}
		</div>
	);
}

function Field({
	label,
	children,
	className,
}: {
	label: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex flex-col gap-1 ${className ?? ''}`}>
			<label className='text-xs font-semibold text-charcoal-900 flex items-center'>
				{label}
			</label>
			{children}
		</div>
	);
}

function YesNoSelect({ name }: { name: string }) {
	return (
		<select
			name={name}
			defaultValue='Ja'
			className={inputCls}
		>
			<option value='Ja'>Ja</option>
			<option value='Nee'>Nee</option>
		</select>
	);
}
