"use client";

import { useActionState, useEffect } from "react";
import { createProject, type CreateProjectState } from "@/lib/projects/actions";
import { PROJECT_STATUSES } from "@/lib/types/database";

const initialState: CreateProjectState = { error: null, success: false };

export function ProjectForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createProject, initialState);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  return (
    <form action={formAction} className="px-7 py-6">
      <Section title="Algemeen">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Offerte nr">
            <input name="offerte_nr" placeholder="MT-2026-001" className={inputCls} />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue="Nieuw" className={inputCls}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Klant naam" className="mb-3">
          <input name="klant_naam" placeholder="Naam klant of bedrijf" className={inputCls} />
        </Field>
        <Field label="Locatie">
          <input name="locatie" placeholder="Locatienaam of adres" className={inputCls} />
        </Field>
      </Section>

      <Section title="Opbouw">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Datum">
            <input type="date" name="datum_opbouw" className={inputCls} />
          </Field>
          <Field label="Starttijd">
            <input type="time" name="tijd_opbouw" className={inputCls} />
          </Field>
          <Field label="Eindtijd">
            <input type="time" name="eindtijd_opbouw" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Afbouw">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Datum">
            <input type="date" name="datum_afbouw" className={inputCls} />
          </Field>
          <Field label="Starttijd">
            <input type="time" name="tijd_afbouw" className={inputCls} />
          </Field>
          <Field label="Eindtijd">
            <input type="time" name="eindtijd_afbouw" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Laden & Lossen (optioneel)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Laaddatum opbouw">
            <input type="date" name="laad_datum_opbouw" className={inputCls} />
          </Field>
          <Field label="Laadtijd">
            <input type="time" name="laad_tijd_opbouw" defaultValue="18:00" className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Losdatum afbouw">
            <input type="date" name="laad_datum_afbouw" className={inputCls} />
          </Field>
          <Field label="Lostijd">
            <input type="time" name="laad_tijd_afbouw" defaultValue="18:00" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Personeel">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-3 items-center mb-4">
          <div></div>
          <div className="text-xs font-bold text-charcoal-900/60 uppercase tracking-wider text-center">Opbouw</div>
          <div className="text-xs font-bold text-charcoal-900/60 uppercase tracking-wider text-center">Afbouw</div>

          <div className="text-sm font-medium">Pascal</div>
          <YesNoSelect name="pascal_opbouw" />
          <YesNoSelect name="pascal_afbouw" />

          <div className="text-sm font-medium">Jip</div>
          <YesNoSelect name="jip_opbouw" />
          <YesNoSelect name="jip_afbouw" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Inhuur opbouw">
            <input name="inhuur_opbouw" placeholder="Kevin, Bart" className={inputCls} />
          </Field>
          <Field label="Inhuur afbouw">
            <input name="inhuur_afbouw" placeholder="Kevin" className={inputCls} />
          </Field>
        </div>
      </Section>

      <Section title="Notities" last>
        <textarea
          name="notities"
          rows={3}
          placeholder="Bijzonderheden..."
          className={`${inputCls} resize-y min-h-[80px]`}
        />
      </Section>

      {state.error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mt-4">
          {state.error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-5 mt-6 border-t border-cream-300 sticky bottom-0 bg-white -mb-6 -mx-7 px-7 pb-6">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-paper-50 hover:bg-cream-300 text-charcoal-900 font-medium rounded-xl transition-colors"
        >
          Annuleer
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-forest-500 hover:bg-forest-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          {pending ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2.5 border border-cream-300 rounded-lg bg-paper-50 focus:bg-white focus:border-forest-500 outline-none transition-colors text-sm";

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
    <div className={last ? "" : "mb-7"}>
      <div className="text-xs font-bold text-forest-500 uppercase tracking-wider pb-1.5 mb-3 border-b border-forest-50">
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
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label className="text-xs font-semibold text-charcoal-900">{label}</label>
      {children}
    </div>
  );
}

function YesNoSelect({ name }: { name: string }) {
  return (
    <select name={name} defaultValue="Ja" className={inputCls}>
      <option value="Ja">Ja</option>
      <option value="Nee">Nee</option>
    </select>
  );
}