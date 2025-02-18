'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Oprava } from '@/types/oprava';

const opravaSchema = z.object({
  datumOpravy: z.string(),
  popis: z.string().min(1, "Popis je povinný").max(500, "Popis je příliš dlouhý"),
  cena: z.number().min(0, "Cena nemůže být záporná"),
  typOpravy: z.enum(["běžná", "servisní", "porucha"]),
  stav: z.enum(["plánovaná", "probíhá", "dokončená"]),
  servis: z.string().optional(),
  poznamka: z.string().optional(),
});

type OpravaFormData = z.infer<typeof opravaSchema>;

interface OpravaFormProps {
  autoId: number;
  onSuccess: (oprava: Oprava) => void;
  onCancel: () => void;
}

export function OpravaForm({ autoId, onSuccess, onCancel }: OpravaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<OpravaFormData>({
    resolver: zodResolver(opravaSchema),
    defaultValues: {
      datumOpravy: new Date().toISOString().split('T')[0],
      typOpravy: 'běžná',
      stav: 'plánovaná',
    }
  });

  const onSubmit = async (data: OpravaFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/auta/${autoId}/opravy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se uložit opravu');
      }

      const oprava = await response.json();
      onSuccess(oprava);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nastala chyba');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Datum opravy</label>
        <input
          type="date"
          {...register('datumOpravy')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.datumOpravy && (
          <p className="mt-1 text-sm text-red-600">{errors.datumOpravy.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Popis</label>
        <textarea
          {...register('popis')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
        {errors.popis && (
          <p className="mt-1 text-sm text-red-600">{errors.popis.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Cena</label>
        <input
          type="number"
          {...register('cena', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.cena && (
          <p className="mt-1 text-sm text-red-600">{errors.cena.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Typ opravy</label>
        <select
          {...register('typOpravy')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="běžná">Běžná</option>
          <option value="servisní">Servisní</option>
          <option value="porucha">Porucha</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Stav</label>
        <select
          {...register('stav')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="plánovaná">Plánovaná</option>
          <option value="probíhá">Probíhá</option>
          <option value="dokončená">Dokončená</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Servis</label>
        <input
          type="text"
          {...register('servis')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Poznámka</label>
        <textarea
          {...register('poznamka')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={2}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Zrušit
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Ukládání...' : 'Uložit'}
        </button>
      </div>
    </form>
  );
}