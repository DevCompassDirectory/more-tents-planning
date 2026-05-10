'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
	updateLineItems,
	type UpdateLineItemsState,
} from '@/lib/projects/actions';
import {
	LINE_ITEM_CATEGORIES,
	type LineItemCategorie,
	type Project,
	type ProductWithRequirements,
	type ProductRequirement,
} from '@/lib/types/database';
import { findProductMatch, parseAantal } from '@/lib/products/match';
import { formatDate } from '@/lib/utils/date';

type LineItem = {
	id?: string;
	categorie: LineItemCategorie;
	naam: string;
	aantal: string;
};

const COMPANY = {
	name: 'More Tents B.V.',
	address: 'Voltastraat 19, 6372 CK Landgraaf',
	phone: '+31 6 10 81 85 86',
	email: 'info@moretents.com',
	slogan: 'Wij bouwen waar jullie verhalen beginnen',
};

export function PakbonOverlay({
	project,
	onClose,
}: {
	project: Project;
	onClose: () => void;
}) {
	const [items, setItems] = useState<LineItem[]>([]);
	const [products, setProducts] = useState<ProductWithRequirements[]>([]);
	const [loading, setLoading] = useState(true);
	const [editMode, setEditMode] = useState(false);
	const [editItems, setEditItems] = useState<LineItem[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		const supabase = createClient();

		const [itemsRes, productsRes, reqsRes] = await Promise.all([
			supabase
				.from('line_items')
				.select('*')
				.eq('project_id', project.id)
				.order('sort_order', { ascending: true }),
			supabase.from('products').select('*'),
			supabase
				.from('product_requirements')
				.select('*')
				.order('sort_order', { ascending: true }),
		]);

		if (itemsRes.error) {
			setError('Artikelen laden mislukt: ' + itemsRes.error.message);
			return;
		}
		setItems(
			(itemsRes.data ?? []).map((row) => ({
				id: row.id,
				categorie: row.categorie,
				naam: row.naam,
				aantal: row.aantal,
			})),
		);

		if (productsRes.data) {
			const reqsByProduct = new Map<string, ProductRequirement[]>();
			(reqsRes.data ?? []).forEach((r) => {
				const list = reqsByProduct.get(r.product_id) ?? [];
				list.push(r);
				reqsByProduct.set(r.product_id, list);
			});
			setProducts(
				productsRes.data.map((p) => ({
					...p,
					requirements: reqsByProduct.get(p.id) ?? [],
				})),
			);
		}
	}, [project.id]);

	useEffect(() => {
		setLoading(true);
		loadData().finally(() => setLoading(false));
	}, [loadData]);

	useEffect(() => {
		function onEsc(e: KeyboardEvent) {
			if (e.key === 'Escape' && !editMode) onClose();
		}
		document.addEventListener('keydown', onEsc);
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onEsc);
			document.body.style.overflow = '';
		};
	}, [onClose, editMode]);

	function startEdit() {
		setEditItems(items.map((it) => ({ ...it })));
		setEditMode(true);
		setError(null);
	}

	function cancelEdit() {
		setEditMode(false);
		setEditItems([]);
	}

	function updateRow(idx: number, patch: Partial<LineItem>) {
		setEditItems((prev) =>
			prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
		);
	}

	function addRow() {
		setEditItems((prev) => [
			...prev,
			{ categorie: 'Overig', naam: '', aantal: '1,00 st' },
		]);
	}

	function removeRow(idx: number) {
		setEditItems((prev) => prev.filter((_, i) => i !== idx));
	}

	async function saveEdits() {
		setSaving(true);
		setError(null);
		const cleaned = editItems
			.filter((it) => it.naam.trim().length > 0)
			.map((it) => ({
				categorie: it.categorie,
				naam: it.naam.trim(),
				aantal: it.aantal.trim() || '1,00 st',
			}));
		const result: UpdateLineItemsState = await updateLineItems(
			project.id,
			cleaned,
		);
		setSaving(false);
		if (!result.success) {
			setError(result.error ?? 'Onbekende fout');
			return;
		}
		await loadData();
		setEditMode(false);
		setEditItems([]);
	}

	const grouped = LINE_ITEM_CATEGORIES.map((cat) => ({
		categorie: cat,
		items: items.filter((it) => it.categorie === cat),
	})).filter((g) => g.items.length > 0);

	function crewNames(phase: 'op' | 'af'): string {
		const names: string[] = [];
		if (phase === 'op' ? project.pascal_opbouw : project.pascal_afbouw)
			names.push('Pascal');
		if (phase === 'op' ? project.jip_opbouw : project.jip_afbouw)
			names.push('Jip');
		const inhuur =
			phase === 'op' ? project.inhuur_opbouw : project.inhuur_afbouw;
		if (inhuur) {
			inhuur
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.forEach((n) => names.push(n));
		}
		return names.join(', ') || '—';
	}

	return (
		<div className='fixed inset-0 z-[100] bg-white overflow-y-auto'>
			<div className='no-print sticky top-0 bg-white border-b border-cream-300 px-6 py-3 flex items-center gap-3 z-10'>
				{!editMode ? (
					<>
						<button
							type='button'
							onClick={() => window.print()}
							className='px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg text-sm transition-colors'
						>
							🖶 Afdrukken
						</button>
						<button
							type='button'
							onClick={startEdit}
							className='px-4 py-2 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg text-sm transition-colors'
						>
							✎ Artikelen bewerken
						</button>
						<div className='flex-1' />
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg text-sm transition-colors'
						>
							Sluiten
						</button>
					</>
				) : (
					<>
						<div className='text-sm font-medium text-forest-500'>
							Artikelen bewerken
						</div>
						<div className='flex-1' />
						<button
							type='button'
							onClick={cancelEdit}
							disabled={saving}
							className='px-4 py-2 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-lg text-sm transition-colors disabled:opacity-60'
						>
							Annuleer
						</button>
						<button
							type='button'
							onClick={saveEdits}
							disabled={saving}
							className='px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60'
						>
							{saving ? 'Opslaan...' : 'Opslaan'}
						</button>
					</>
				)}
			</div>

			{error && (
				<div className='no-print mx-6 mt-3 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2'>
					{error}
				</div>
			)}

			{editMode ? (
				<EditTable
					items={editItems}
					onUpdate={updateRow}
					onRemove={removeRow}
					onAdd={addRow}
				/>
			) : (
				<div
					id='pakbon-print'
					className='max-w-3xl mx-auto px-6 py-8 text-charcoal-900'
				>
					<div className='flex justify-between items-start pb-4 mb-8 border-b-[3px] border-forest-500'>
						<div>
							<div className='font-display text-3xl font-bold text-forest-500'>
								More Tents
							</div>
							<div className='text-[11px] uppercase tracking-wider text-charcoal-900/60 mt-1'>
								{COMPANY.slogan}
							</div>
						</div>
						<div className='text-right text-xs text-charcoal-900/70'>
							<div className='font-display text-xl font-bold text-charcoal-900 mb-1'>
								PAKBON
							</div>
							<div>{project.offerte_nr}</div>
							<div>{new Date().toLocaleDateString('nl-NL')}</div>
						</div>
					</div>

					<div className='font-display text-2xl font-bold text-forest-500 mb-5'>
						{project.klant_naam || '—'}
					</div>

					<div className='grid grid-cols-[140px_1fr] gap-2 bg-paper-50 rounded-xl p-4 mb-7 text-sm'>
						<span className='text-charcoal-900/60 font-semibold'>
							Locatie
						</span>
						<span>{project.locatie || '—'}</span>
						<span className='text-charcoal-900/60 font-semibold'>
							Opbouw
						</span>
						<span>
							{project.datum_opbouw
								? `${formatDate(project.datum_opbouw)} om ${
										project.tijd_opbouw ?? '—'
									}${
										project.eindtijd_opbouw
											? ' tot ' + project.eindtijd_opbouw
											: ''
									}`
								: '—'}
						</span>
						<span className='text-charcoal-900/60 font-semibold'>
							Afbouw
						</span>
						<span>
							{project.datum_afbouw
								? `${formatDate(project.datum_afbouw)} om ${
										project.tijd_afbouw ?? '—'
									}${
										project.eindtijd_afbouw
											? ' tot ' + project.eindtijd_afbouw
											: ''
									}`
								: '—'}
						</span>
						{project.laad_datum_opbouw && (
							<>
								<span className='text-charcoal-900/60 font-semibold'>
									Laden
								</span>
								<span>
									{formatDate(project.laad_datum_opbouw)}
									{project.laad_tijd_opbouw
										? ' om ' + project.laad_tijd_opbouw
										: ''}
								</span>
							</>
						)}
						{project.laad_datum_afbouw && (
							<>
								<span className='text-charcoal-900/60 font-semibold'>
									Lossen
								</span>
								<span>
									{formatDate(project.laad_datum_afbouw)}
									{project.laad_tijd_afbouw
										? ' om ' + project.laad_tijd_afbouw
										: ''}
								</span>
							</>
						)}
					</div>

					{loading ? (
						<div className='text-sm text-charcoal-900/60 py-8 text-center'>
							Artikelen laden...
						</div>
					) : items.length === 0 ? (
						<div className='text-sm text-charcoal-900/60 py-6 mb-7'>
							Geen artikelen gekoppeld. Importeer een offerte of
							voeg artikelen handmatig toe via Bewerken.
						</div>
					) : (
						<div className='mb-7'>
							<div className='text-[10px] font-bold uppercase tracking-widest text-charcoal-900/60 border-b-2 border-forest-500 pb-1.5 mb-3'>
								Artikelen
							</div>
							<div className='grid grid-cols-[1fr_80px] gap-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-charcoal-900/60 border-b border-cream-300'>
								<span>Omschrijving</span>
								<span className='text-right'>Aantal</span>
							</div>
							{grouped.map((g) => (
								<div key={g.categorie}>
									<div className='text-[11px] font-bold text-forest-500 uppercase tracking-wider mt-3.5 mb-1'>
										{g.categorie}
									</div>
									{g.items.map((it, i) => {
										const match = findProductMatch(
											it.naam,
											products,
										);
										const reqs = match?.requirements ?? [];
										const aantal = parseAantal(it.aantal);
										return (
											<div
												key={i}
												className='border-b border-cream-300/60 last:border-b-0'
											>
												<div className='grid grid-cols-[1fr_80px] gap-2 py-1.5 text-sm'>
													<span>{it.naam}</span>
													<span className='text-right font-semibold'>
														{it.aantal}
													</span>
												</div>
												{reqs.length > 0 && (
													<div className='pl-4 pb-2 text-xs text-charcoal-900/70 space-y-0.5'>
														{reqs.map((r) => {
															const total =
																Math.round(
																	r.aantal *
																		aantal *
																		100,
																) / 100;
															return (
																<div
																	key={r.id}
																	className='flex gap-2'
																>
																	<span className='text-charcoal-900/40'>
																		•
																	</span>
																	<span>
																		{formatNum(
																			total,
																		)}
																		×{' '}
																		{r.naam}
																	</span>
																</div>
															);
														})}
													</div>
												)}
											</div>
										);
									})}
								</div>
							))}
						</div>
					)}

					<div className='grid grid-cols-2 gap-4 mb-6'>
						<div className='bg-forest-50 border border-forest-100 rounded-xl p-4'>
							<div className='text-[10px] font-bold uppercase tracking-wider text-forest-600 mb-2'>
								Team opbouw
							</div>
							<div className='text-base font-semibold text-charcoal-900'>
								{crewNames('op')}
							</div>
						</div>
						<div className='bg-forest-50 border border-forest-100 rounded-xl p-4'>
							<div className='text-[10px] font-bold uppercase tracking-wider text-forest-600 mb-2'>
								Team afbouw
							</div>
							<div className='text-base font-semibold text-charcoal-900'>
								{crewNames('af')}
							</div>
						</div>
					</div>

					{project.notities && (
						<div className='bg-amber-50 border-l-[3px] border-amber-500 rounded-r-lg px-4 py-3 text-sm mb-6 text-amber-900'>
							⚠ {project.notities}
						</div>
					)}

					<div className='mt-8 pt-3 border-t border-cream-300 text-[11px] text-charcoal-900/60 text-center'>
						{COMPANY.name} • {COMPANY.address} • {COMPANY.phone} •{' '}
						{COMPANY.email}
					</div>
				</div>
			)}
		</div>
	);
}

function EditTable({
	items,
	onUpdate,
	onRemove,
	onAdd,
}: {
	items: LineItem[];
	onUpdate: (idx: number, patch: Partial<LineItem>) => void;
	onRemove: (idx: number) => void;
	onAdd: () => void;
}) {
	return (
		<div className='max-w-4xl mx-auto px-6 py-6'>
			<div className='bg-white rounded-2xl border border-cream-300 overflow-hidden'>
				<div className='grid grid-cols-[140px_1fr_100px_40px] gap-2 px-4 py-2.5 bg-paper-50 border-b border-cream-300 text-[11px] font-bold uppercase tracking-wider text-charcoal-900/60'>
					<span>Categorie</span>
					<span>Omschrijving</span>
					<span className='text-right'>Aantal</span>
					<span></span>
				</div>
				{items.length === 0 && (
					<div className='px-4 py-6 text-sm text-charcoal-900/60 text-center'>
						Nog geen artikelen. Klik hieronder om er een toe te
						voegen.
					</div>
				)}
				{items.map((it, idx) => (
					<div
						key={idx}
						className='grid grid-cols-[140px_1fr_100px_40px] gap-2 px-4 py-2 border-b border-cream-300/60 last:border-b-0 items-center'
					>
						<select
							value={it.categorie}
							onChange={(e) =>
								onUpdate(idx, {
									categorie: e.target
										.value as LineItemCategorie,
								})
							}
							className='px-2 py-1.5 border border-cream-300 rounded-lg bg-paper-50 text-sm focus:bg-white focus:border-forest-500 outline-none'
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
						<input
							value={it.naam}
							onChange={(e) =>
								onUpdate(idx, { naam: e.target.value })
							}
							placeholder='Omschrijving'
							className='px-2 py-1.5 border border-cream-300 rounded-lg bg-paper-50 text-sm focus:bg-white focus:border-forest-500 outline-none'
						/>
						<input
							value={it.aantal}
							onChange={(e) =>
								onUpdate(idx, { aantal: e.target.value })
							}
							placeholder='1,00 st'
							className='px-2 py-1.5 border border-cream-300 rounded-lg bg-paper-50 text-sm text-right focus:bg-white focus:border-forest-500 outline-none'
						/>
						<button
							type='button'
							onClick={() => onRemove(idx)}
							className='w-8 h-8 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition-colors'
							title='Verwijder'
						>
							×
						</button>
					</div>
				))}
				<div className='px-4 py-3 bg-paper-50'>
					<button
						type='button'
						onClick={onAdd}
						className='px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-600 border border-forest-100 rounded-lg text-sm font-medium transition-colors'
					>
						+ Artikel toevoegen
					</button>
				</div>
			</div>
		</div>
	);
}

function formatNum(n: number): string {
	if (Number.isInteger(n)) return String(n);
	return n
		.toFixed(2)
		.replace(/\.?0+$/, '')
		.replace('.', ',');
}
