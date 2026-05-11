'use client';

import { useActionState, useEffect, useState } from 'react';
import {
	createProject,
	updateProject,
	deleteProject,
	type CreateProjectState,
} from '@/lib/projects/actions';
import { findProjectByOfferteNr } from '@/lib/projects/duplicate';
import { PROJECT_STATUSES, type Project } from '@/lib/types/database';
import { DayContext } from '@/components/DayContext';

const initialState: CreateProjectState = { error: null, success: false };

export function ProjectForm({
	onClose,
	initialProject,
}: {
	onClose: () => void;
	initialProject?: Project;
}) {
	const isEdit = !!initialProject;

	const action = isEdit
		? updateProject.bind(null, initialProject.id)
		: createProject;

	const [state, formAction, pending] = useActionState(action, initialState);

	useEffect(() => {
		if (state.success) onClose();
	}, [state.success, onClose]);

	const v = (key: keyof Project, fallback = ''): string => {
		if (!initialProject) return fallback;
		const val = initialProject[key];
		if (val === null || val === undefined) return fallback;
		return String(val);
	};

	const vBool = (key: keyof Project): 'Ja' | 'Nee' => {
		if (!initialProject) return 'Ja';
		return initialProject[key] === true ? 'Ja' : 'Nee';
	};

	const [datumOpbouw, setDatumOpbouw] = useState(v('datum_opbouw'));
	const [datumAfbouw, setDatumAfbouw] = useState(v('datum_afbouw'));
	const [inhuurOpbouw, setInhuurOpbouw] = useState(v('inhuur_opbouw'));
	const [inhuurAfbouw, setInhuurAfbouw] = useState(v('inhuur_afbouw'));
	const [duplicate, setDuplicate] = useState<Project | null>(null);

	async function handleOfferteNrBlur(e: React.FocusEvent<HTMLInputElement>) {
		const value = e.target.value.trim();
		if (!value) {
			setDuplicate(null);
			return;
		}
		if (initialProject && value === initialProject.offerte_nr) {
			setDuplicate(null);
			return;
		}
		const existing = await findProjectByOfferteNr(value);
		if (existing && existing.id !== initialProject?.id) {
			setDuplicate(existing);
		} else {
			setDuplicate(null);
		}
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		// Tweede klik (duplicate al bekend en zichtbaar) = bewust doorgaan
		if (duplicate) {
			formAction(formData);
			return;
		}

		// Eerste klik: doe een verse check (ook als blur nog niet liep)
		const offerteNr = ((formData.get('offerte_nr') as string) ?? '').trim();
		if (offerteNr && offerteNr !== (initialProject?.offerte_nr ?? '')) {
			const existing = await findProjectByOfferteNr(offerteNr);
			if (existing && existing.id !== initialProject?.id) {
				setDuplicate(existing);
				return; // Niet opslaan, laat user de waarschuwing zien
			}
		}

		formAction(formData);
	}

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

	async function handleDelete() {
		if (!initialProject) return;
		const naam = initialProject.klant_naam || 'naamloos';
		if (!window.confirm(`Project "${naam}" verwijderen?`)) return;
		const result = await deleteProject(initialProject.id);
		if (result.error) {
			window.alert(result.error);
		} else {
			onClose();
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className='px-7 py-6'
		>
			<Section title='Algemeen'>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
					<Field label='Offerte nr'>
						<input
							name='offerte_nr'
							defaultValue={v('offerte_nr')}
							onBlur={handleOfferteNrBlur}
							placeholder='MT-2026-001'
							className={`${inputCls} ${
								duplicate
									? 'border-amber-400 bg-amber-50/30'
									: ''
							}`}
						/>
						{duplicate && (
							<DuplicateInlineWarning duplicate={duplicate} />
						)}
					</Field>
					<Field label='Status'>
						<select
							name='status'
							defaultValue={v('status', 'Nieuw')}
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
					label='Klant naam'
					className='mb-3'
				>
					<input
						name='klant_naam'
						defaultValue={v('klant_naam')}
						placeholder='Naam klant of bedrijf'
						className={inputCls}
					/>
				</Field>
				<Field label='Locatie'>
					<input
						name='locatie'
						defaultValue={v('locatie')}
						placeholder='Locatienaam of adres'
						className={inputCls}
					/>
				</Field>
			</Section>

			<Section title='Opbouw'>
				<div className='grid grid-cols-3 gap-3 mb-4'>
					<Field label='Datum'>
						<input
							type='date'
							name='datum_opbouw'
							value={datumOpbouw}
							onChange={(e) => setDatumOpbouw(e.target.value)}
							className={inputCls}
						/>
					</Field>
					<Field label='Starttijd'>
						<input
							type='time'
							name='tijd_opbouw'
							defaultValue={v('tijd_opbouw').slice(0, 5)}
							className={inputCls}
						/>
					</Field>
					<Field label='Eindtijd'>
						<input
							type='time'
							name='eindtijd_opbouw'
							defaultValue={v('eindtijd_opbouw').slice(0, 5)}
							className={inputCls}
						/>
					</Field>
				</div>
				<DayContext
					date={datumOpbouw}
					currentInhuur={inhuurOpbouw}
					excludeProjectId={initialProject?.id}
					onAddInhuur={(name) => addInhuurName('opbouw', name)}
				/>
			</Section>

			<Section title='Afbouw'>
				<div className='grid grid-cols-3 gap-3 mb-4'>
					<Field label='Datum'>
						<input
							type='date'
							name='datum_afbouw'
							value={datumAfbouw}
							onChange={(e) => setDatumAfbouw(e.target.value)}
							className={inputCls}
						/>
					</Field>
					<Field label='Starttijd'>
						<input
							type='time'
							name='tijd_afbouw'
							defaultValue={v('tijd_afbouw').slice(0, 5)}
							className={inputCls}
						/>
					</Field>
					<Field label='Eindtijd'>
						<input
							type='time'
							name='eindtijd_afbouw'
							defaultValue={v('eindtijd_afbouw').slice(0, 5)}
							className={inputCls}
						/>
					</Field>
				</div>
				<DayContext
					date={datumAfbouw}
					currentInhuur={inhuurAfbouw}
					excludeProjectId={initialProject?.id}
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
					<YesNoSelect
						name='pascal_opbouw'
						value={vBool('pascal_opbouw')}
					/>
					<YesNoSelect
						name='pascal_afbouw'
						value={vBool('pascal_afbouw')}
					/>

					<div className='text-sm font-medium'>Jip</div>
					<YesNoSelect
						name='jip_opbouw'
						value={vBool('jip_opbouw')}
					/>
					<YesNoSelect
						name='jip_afbouw'
						value={vBool('jip_afbouw')}
					/>
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
							defaultValue={v('laad_datum_opbouw')}
							className={inputCls}
						/>
					</Field>
					<Field label='Laadtijd'>
						<input
							type='time'
							name='laad_tijd_opbouw'
							defaultValue={v('laad_tijd_opbouw', '18:00').slice(
								0,
								5,
							)}
							className={inputCls}
						/>
					</Field>
				</div>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
					<Field label='Losdatum afbouw'>
						<input
							type='date'
							name='laad_datum_afbouw'
							defaultValue={v('laad_datum_afbouw')}
							className={inputCls}
						/>
					</Field>
					<Field label='Lostijd'>
						<input
							type='time'
							name='laad_tijd_afbouw'
							defaultValue={v('laad_tijd_afbouw', '18:00').slice(
								0,
								5,
							)}
							className={inputCls}
						/>
					</Field>
				</div>
			</Section>

			<Section
				title='Notities'
				last={!isEdit}
			>
				<textarea
					name='notities'
					rows={3}
					defaultValue={v('notities')}
					placeholder='Bijzonderheden...'
					className={`${inputCls} resize-y min-h-[80px]`}
				/>
			</Section>

			{isEdit && (
				<Section
					title='Toelichting wijziging'
					last
				>
					<input
						name='change_note'
						placeholder="Optioneel - bijv. 'Klant heeft datum verzet'"
						className={inputCls}
					/>
				</Section>
			)}

			{state.error && (
				<div className='bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mt-4'>
					{state.error}
				</div>
			)}

			<div className='flex gap-3 pt-5 mt-6 border-t border-cream-300 sticky bottom-0 bg-white -mb-6 -mx-7 px-7 pb-6'>
				{isEdit && (
					<button
						type='button'
						onClick={handleDelete}
						className='px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors'
					>
						Verwijder
					</button>
				)}
				<div className='flex-1' />
				<button
					type='button'
					onClick={onClose}
					className='px-5 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg transition-colors'
				>
					Annuleer
				</button>
				<button
					type='submit'
					disabled={pending}
					className={`px-5 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors ${
						duplicate
							? 'bg-amber-500 hover:bg-amber-600'
							: 'bg-forest-500 hover:bg-forest-600'
					}`}
				>
					{pending
						? 'Opslaan...'
						: duplicate
							? 'Toch opslaan (duplicaat)'
							: 'Opslaan'}
				</button>
			</div>
		</form>
	);
}

function DuplicateInlineWarning({ duplicate }: { duplicate: Project }) {
	return (
		<div className='bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5 text-xs'>
			<div className='font-semibold text-amber-900 mb-0.5'>
				⚠️ Dit nummer is al in gebruik
			</div>
			<div className='text-amber-900/80 leading-relaxed'>
				{duplicate.klant_naam || 'Naamloos'}
				{duplicate.locatie && ` · ${duplicate.locatie}`}
				{duplicate.datum_opbouw &&
					` · opbouw ${formatDateNL(duplicate.datum_opbouw)}`}
			</div>
		</div>
	);
}

function formatDateNL(iso: string): string {
	const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}-${m[2]}-${m[1]}`;
}

const inputCls =
	'w-full px-3 py-2.5 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors text-sm';

function Section({
	title,
	children,
	last,
}: {
	title: string;
	children: React.ReactNode;
	last?: boolean;
}) {
	return (
		<div className={last ? '' : 'mb-7'}>
			<div className='text-xs font-bold text-forest-500 uppercase tracking-wider pb-1.5 mb-3 border-b border-forest-50'>
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
	label: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`flex flex-col gap-1 ${className ?? ''}`}>
			<label className='text-xs font-semibold text-charcoal-900'>
				{label}
			</label>
			{children}
		</div>
	);
}

function YesNoSelect({ name, value }: { name: string; value: 'Ja' | 'Nee' }) {
	return (
		<select
			name={name}
			defaultValue={value}
			className={inputCls}
		>
			<option value='Ja'>Ja</option>
			<option value='Nee'>Nee</option>
		</select>
	);
}
