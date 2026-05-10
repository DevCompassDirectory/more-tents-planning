'use client';

import { useActionState, useEffect, useState } from 'react';
import {
	createProject,
	updateProject,
	deleteProject,
	type CreateProjectState,
} from '@/lib/projects/actions';
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
			action={formAction}
			className='px-7 py-6'
		>
			<Section title='Algemeen'>
				<div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3'>
					<Field label='Offerte nr'>
						<input
							name='offerte_nr'
							defaultValue={v('offerte_nr')}
							placeholder='MT-2026-001'
							className={inputCls}
						/>
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
				<div className='bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mt-4'>
					{state.error}
				</div>
			)}

			<div className='flex gap-3 pt-5 mt-6 border-t border-cream-300 sticky bottom-0 bg-white -mb-6 -mx-7 px-7 pb-6'>
				{isEdit && (
					<button
						type='button'
						onClick={handleDelete}
						className='px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-xl transition-colors'
					>
						Verwijder
					</button>
				)}
				<div className='flex-1' />
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
					{pending ? 'Opslaan...' : 'Opslaan'}
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
