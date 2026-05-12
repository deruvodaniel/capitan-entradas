"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface TierInput {
  name: string;
  price: string;
  capacity: string;
}

interface ShowFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    title: string;
    venue: string;
    address: string;
    mapUrl: string;
    startsAt: string;
    doorsAt: string;
    description: string;
    coverImageUrl: string;
    tiers: TierInput[];
  };
}

export default function ShowForm({ action, defaultValues }: ShowFormProps) {
  const [tiers, setTiers] = useState<TierInput[]>(
    defaultValues?.tiers || [{ name: "", price: "", capacity: "" }]
  );

  function addTier() {
    setTiers([...tiers, { name: "", price: "", capacity: "" }]);
  }

  function removeTier(i: number) {
    setTiers(tiers.filter((_, idx) => idx !== i));
  }

  function updateTier(i: number, field: keyof TierInput, value: string) {
    const updated = [...tiers];
    updated[i] = { ...updated[i], [field]: value };
    setTiers(updated);
  }

  return (
    <form action={action} className="space-y-6 max-w-xl">
      <div>
        <label className="text-sm font-medium text-muted">Título</label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
          placeholder="CAPITAN en Monte Grande"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted">Lugar</label>
          <input
            name="venue"
            required
            defaultValue={defaultValues?.venue}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
            placeholder="11pm Centro Cultural"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted">
            Dirección <span className="text-muted/60 font-normal">(opcional)</span>
          </label>
          <input
            name="address"
            defaultValue={defaultValues?.address}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
            placeholder="Monte Grande, Buenos Aires"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted">
          Link de Google Maps <span className="text-muted/60 font-normal">(opcional)</span>
        </label>
        <input
          name="mapUrl"
          type="url"
          defaultValue={defaultValues?.mapUrl}
          className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
          placeholder="https://maps.app.goo.gl/..."
        />
        <p className="mt-1 text-xs text-muted">
          Pegá el link de compartir de Google Maps. Si no lo completás, se genera automáticamente desde la dirección.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted">
            Fecha y hora del show
          </label>
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={defaultValues?.startsAt}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted">
            Apertura de puertas (opcional)
          </label>
          <input
            name="doorsAt"
            type="datetime-local"
            defaultValue={defaultValues?.doorsAt}
            className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted">
          Descripción (opcional)
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-muted">
          URL de imagen de portada (opcional)
        </label>
        <input
          name="coverImageUrl"
          type="url"
          defaultValue={defaultValues?.coverImageUrl}
          className="mt-1 w-full px-4 py-3 bg-card border border-card-border rounded-lg focus:outline-none focus:border-accent"
          placeholder="https://..."
        />
      </div>

      {/* Tiers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-muted">
            Tipos de entrada
          </label>
          <button
            type="button"
            onClick={addTier}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar tier
          </button>
        </div>
        <div className="space-y-3">
          {tiers.map((tier, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                name="tierName"
                value={tier.name}
                onChange={(e) => updateTier(i, "name", e.target.value)}
                placeholder="Nombre (ej: Anticipada)"
                className="flex-1 px-3 py-2 bg-card border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
              <input
                name="tierPrice"
                value={tier.price}
                onChange={(e) => updateTier(i, "price", e.target.value)}
                placeholder="Precio ($)"
                type="number"
                step="0.01"
                className="w-28 px-3 py-2 bg-card border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
              <input
                name="tierCapacity"
                value={tier.capacity}
                onChange={(e) => updateTier(i, "capacity", e.target.value)}
                placeholder="Cap."
                type="number"
                className="w-20 px-3 py-2 bg-card border border-card-border rounded-lg text-sm focus:outline-none focus:border-accent"
              />
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="p-2 text-muted hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent-hover transition-colors"
      >
        Guardar show
      </button>
    </form>
  );
}
