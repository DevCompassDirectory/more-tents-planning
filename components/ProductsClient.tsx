'use client';

import { useState, useTransition } from 'react';
import {
	saveProduct,
	deleteProduct,
	type ProductInput,
} from '@/lib/products/actions';
import {
	LINE_ITEM_CATEGORIES,
	type LineItemCategorie,
	type ProductWithRequirements,
} from '@/lib/types/database';

type EditState = {
	id: string | null;
	naam: string;
	maat: string;
	categorie: LineItemCategorie;
	notities: string;
	requirements: { naam: string; aantal: number }[];
};

export function ProductsClient({
	initialProducts,
}: {
	initialProducts: ProductWithRequirements[];
}) {
	const [search, setSearch] = useState('');
	const [selectedId, setSelectedId] = useState<string | null>(
		initialProducts[0]?.id ?? null,
	);
	const [edit, setEdit] = useState<EditState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const filtered = initialProducts.filter(
		(p) => !search || p.naam.toLowerCase().includes(search.toLowerCase()),
	);
	const selected = initialProducts.find((p) => p.id === selectedId) ?? null;

	function startEditFor(p: ProductWithRequirements | null) {
		if (p) {
			setEdit({
				id: p.id,
				naam: p.naam,
				maat: p.maat,
				categorie: p.categorie,
				notities: p.notities,
				requirements: p.requirements.map((r) => ({
					naam: r.naam,
					aantal: r.aantal,
				})),
			});
		} else {
			setEdit({
				id: null,
				naam: '',
				maat: '',
				categorie: 'Tenten',
				notities: '',
				requirements: [],
			});
		}
		setError(null);
	}

	function patchEdit(patch: Partial<EditState>) {
		setEdit((prev) => (prev ? { ...prev, ...patch } : prev));
	}

	function patchReq(
		idx: number,
		patch: Partial<EditState['requirements'][number]>,
	) {
		setEdit((prev) =>
			prev
				? {
						...prev,
						requirements: prev.requirements.map((r, i) =>
							i === idx ? { ...r, ...patch } : r,
						),
					}
				: prev,
		);
	}

	function addReq() {
		setEdit((prev) =>
			prev
				? {
						...prev,
						requirements: [
							...prev.requirements,
							{ naam: '', aantal: 1 },
						],
					}
				: prev,
		);
	}

	function removeReq(idx: number) {
		setEdit((prev) =>
			prev
				? {
						...prev,
						requirements: prev.requirements.filter(
							(_, i) => i !== idx,
						),
					}
				: prev,
		);
	}

	function handleSave() {
		if (!edit) return;
		setError(null);
		const input: ProductInput = {
			naam: edit.naam,
			maat: edit.maat,
			categorie: edit.categorie,
			notities: edit.notities,
			requirements: edit.requirements,
		};
		startTransition(async () => {
			const result = await saveProduct(edit.id, input);
			if (result.error) {
				setError(result.error);
			} else {
				setEdit(null);
				if (result.productId) setSelectedId(result.productId);
			}
		});
	}

	function handleDelete() {
		if (!edit?.id) return;
		if (!window.confirm(`Product "${edit.naam}" verwijderen?`)) return;
		startTransition(async () => {
			const result = await deleteProduct(edit.id!);
			if (result.error) {
				setError(result.error);
			} else {
				setEdit(null);
				setSelectedId(null);
			}
		});
	}

	return (
		<div>
			<div className='mb-6 flex justify-between items-center gap-3 flex-wrap'>
				<h1 className='font-display text-2xl text-charcoal-900'>
					Producten
				</h1>
				<button
					type='button'
					onClick={() => startEditFor(null)}
					className='px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white text-sm font-medium rounded-lg transition-colors'
				>
					+ Nieuw product
				</button>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-[280px_1fr] bg-white rounded-2xl border border-cream-300 overflow-hidden min-h-[500px]'>
				<div className='border-r-0 md:border-r border-cream-300 border-b md:border-b-0'>
					<div className='p-3 border-b border-cream-300'>
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder='Zoek...'
							className='w-full px-3 py-2 text-sm border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors'
						/>
					</div>
					<div className='max-h-[600px] overflow-y-auto'>
						{filtered.length === 0 ? (
							<div className='p-4 text-sm text-charcoal-900/60 text-center'>
								Geen producten
							</div>
						) : (
							filtered.map((p) => (
								<button
									key={p.id}
									type='button'
									onClick={() => {
										setSelectedId(p.id);
										setEdit(null);
									}}
									className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
										selectedId === p.id
											? 'bg-forest-50/50 border-forest-500'
											: 'border-transparent hover:bg-paper-50'
									}`}
								>
									<div className='text-sm font-medium text-charcoal-900'>
										{p.naam}
									</div>
									<div className='text-xs text-charcoal-900/60 mt-0.5'>
										{p.maat ? `${p.maat} • ` : ''}
										{p.categorie}
									</div>
								</button>
							))
						)}
					</div>
				</div>

				<div className='p-6'>
					{edit ? (
						<ProductForm
							edit={edit}
							error={error}
							pending={pending}
							onPatch={patchEdit}
							onPatchReq={patchReq}
							onAddReq={addReq}
							onRemoveReq={removeReq}
							onSave={handleSave}
							onDelete={edit.id ? handleDelete : null}
							onCancel={() => setEdit(null)}
						/>
					) : selected ? (
						<ProductView
							product={selected}
							onEdit={() => startEditFor(selected)}
						/>
					) : (
						<div className='text-center text-charcoal-900/60 py-12 text-sm'>
							Geen product geselecteerd. Klik op + Nieuw product
							om te beginnen.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function ProductView({
	product,
	onEdit,
}: {
	product: ProductWithRequirements;
	onEdit: () => void;
}) {
	return (
		<div>
			<div className='flex justify-between items-start gap-3 mb-5'>
				<div>
					<div className='font-display text-xl text-charcoal-900'>
						{product.naam}
					</div>
					<div className='text-sm text-charcoal-900/60 mt-0.5'>
						{product.maat ? `${product.maat} • ` : ''}
						{product.categorie}
					</div>
				</div>
				<button
					type='button'
					onClick={onEdit}
					className='px-3 py-1.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 text-sm font-medium rounded-lg transition-colors'
				>
					Bewerken
				</button>
			</div>

			{product.notities && (
				<div className='text-sm text-charcoal-900/80 mb-5 leading-relaxed'>
					{product.notities}
				</div>
			)}

			<div className='text-xs font-bold text-forest-500 uppercase tracking-wider pb-1.5 mb-3 border-b border-forest-50'>
				Benodigdheden
			</div>
			{product.requirements.length === 0 ? (
				<div className='text-sm text-charcoal-900/60 italic'>
					Nog geen benodigdheden gekoppeld.
				</div>
			) : (
				<div className='space-y-1'>
					{product.requirements.map((r) => (
						<div
							key={r.id}
							className='flex justify-between text-sm py-1.5 border-b border-cream-300/60'
						>
							<span>{r.naam}</span>
							<span className='font-medium'>
								{formatNum(r.aantal)}×
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function ProductForm({
	edit,
	error,
	pending,
	onPatch,
	onPatchReq,
	onAddReq,
	onRemoveReq,
	onSave,
	onDelete,
	onCancel,
}: {
	edit: EditState;
	error: string | null;
	pending: boolean;
	onPatch: (patch: Partial<EditState>) => void;
	onPatchReq: (
		idx: number,
		patch: Partial<EditState['requirements'][number]>,
	) => void;
	onAddReq: () => void;
	onRemoveReq: (idx: number) => void;
	onSave: () => void;
	onDelete: (() => void) | null;
	onCancel: () => void;
}) {
	return (
		<div>
			<div className='grid grid-cols-1 sm:grid-cols-[1fr_140px_140px] gap-3 mb-3'>
				<Field label='Naam'>
					<input
						value={edit.naam}
						onChange={(e) => onPatch({ naam: e.target.value })}
						placeholder='Stretchtent'
						className={inputCls}
					/>
				</Field>
				<Field label='Maat (optioneel)'>
					<input
						value={edit.maat}
						onChange={(e) => onPatch({ maat: e.target.value })}
						placeholder='6x10'
						className={inputCls}
					/>
				</Field>
				<Field label='Categorie'>
					<select
						value={edit.categorie}
						onChange={(e) =>
							onPatch({
								categorie: e.target.value as LineItemCategorie,
							})
						}
						className={inputCls}
					>
						{LINE_ITEM_CATEGORIES.map((c) => (
							<option
								key={c}
								value={c}
							>
								{c}
							</option>
						))}
					</select>
				</Field>
			</div>

			<Field
				label='Notities (optioneel)'
				className='mb-5'
			>
				<textarea
					value={edit.notities}
					onChange={(e) => onPatch({ notities: e.target.value })}
					rows={2}
					placeholder='Bijzonderheden...'
					className={`${inputCls} resize-y min-h-[60px]`}
				/>
			</Field>

			<div className='text-xs font-bold text-forest-500 uppercase tracking-wider pb-1.5 mb-3 border-b border-forest-50'>
				Benodigdheden
			</div>

			<div className='space-y-2 mb-3'>
				{edit.requirements.map((r, idx) => (
					<div
						key={idx}
						className='grid grid-cols-[1fr_100px_36px] gap-2 items-center'
					>
						<input
							value={r.naam}
							onChange={(e) =>
								onPatchReq(idx, { naam: e.target.value })
							}
							placeholder='Bijv. Hoekpaal 2,5m'
							className={inputCls}
						/>
						<input
							type='number'
							step='0.01'
							value={r.aantal}
							onChange={(e) =>
								onPatchReq(idx, {
									aantal: parseFloat(e.target.value) || 0,
								})
							}
							className={`${inputCls} text-right`}
						/>
						<button
							type='button'
							onClick={() => onRemoveReq(idx)}
							className='w-9 h-9 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition-colors'
							aria-label='Verwijder regel'
						>
							×
						</button>
					</div>
				))}
			</div>

			<button
				type='button'
				onClick={onAddReq}
				className='text-xs px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-600 border border-forest-100 rounded-lg font-medium transition-colors'
			>
				+ Regel toevoegen
			</button>

			{error && (
				<div className='bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mt-5'>
					{error}
				</div>
			)}

			<div className='flex flex-wrap gap-2 mt-6 pt-4 border-t border-cream-300'>
				{onDelete && (
					<button
						type='button'
						onClick={onDelete}
						disabled={pending}
						className='px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg text-sm transition-colors disabled:opacity-60'
					>
						Verwijderen
					</button>
				)}
				<div className='flex-1' />
				<button
					type='button'
					onClick={onCancel}
					disabled={pending}
					className='px-4 py-2 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg text-sm transition-colors disabled:opacity-60'
				>
					Annuleer
				</button>
				<button
					type='button'
					onClick={onSave}
					disabled={pending}
					className='px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60'
				>
					{pending ? 'Opslaan...' : 'Opslaan'}
				</button>
			</div>
		</div>
	);
}

const inputCls =
	'w-full px-3 py-2 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors text-sm';

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

function formatNum(n: number): string {
	if (Number.isInteger(n)) return String(n);
	return n.toFixed(2).replace('.', ',');
}
