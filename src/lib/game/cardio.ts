export type CardioType = 'running' | 'walking' | 'cycling' | 'hiit';

export interface CardioOptionMeta {
  id: CardioType;
  label: string;
  icon: string;
  unit: 'km' | 'min';
  factor: number;
  maxRaw: number;
  placeholder: string;
  hint: string;
}

export const CARDIO_OPTIONS: CardioOptionMeta[] = [
  {
    id: 'running',
    label: 'Corrida',
    icon: '🏃',
    unit: 'km',
    factor: 1.0,
    maxRaw: 15,
    placeholder: 'Ex.: 3.0',
    hint: '1 km = 1,0 km eq. (máx. 15 km)',
  },
  {
    id: 'walking',
    label: 'Caminhada',
    icon: '🚶',
    unit: 'km',
    factor: 0.5,
    maxRaw: 25,
    placeholder: 'Ex.: 6.0',
    hint: '2 km = 1,0 km eq. (máx. 25 km)',
  },
  {
    id: 'cycling',
    label: 'Bicicleta',
    icon: '🚴',
    unit: 'km',
    factor: 1 / 3,
    maxRaw: 45,
    placeholder: 'Ex.: 9.0',
    hint: '3 km = 1,0 km eq. (máx. 45 km)',
  },
  {
    id: 'hiit',
    label: 'HIIT / Funcional',
    icon: '🔥',
    unit: 'min',
    factor: 0.12,
    maxRaw: 60,
    placeholder: 'Ex.: 25',
    hint: '25 min = 3,0 km eq. (máx. 60 min)',
  },
];

const CARDIO_MAP = new Map<CardioType, CardioOptionMeta>(
  CARDIO_OPTIONS.map((o) => [o.id, o])
);

export function getCardioOption(type?: CardioType): CardioOptionMeta {
  return CARDIO_MAP.get(type ?? 'running') ?? CARDIO_OPTIONS[0];
}

export interface CardioLikeEntry {
  cardio?: boolean;
  cardioType?: CardioType;
  km?: number;
  durationMinutes?: number;
}

/**
 * Converte qualquer modalidade de cárdio para KM Equivalente (km eq.),
 * mantendo compatibilidade retroativa com registros antigos (corrida 1:1).
 */
export function getCardioEquivalentKm(entry: CardioLikeEntry): number {
  if (!entry.cardio) return 0;
  const opt = getCardioOption(entry.cardioType);
  const raw =
    opt.unit === 'min'
      ? Number(entry.durationMinutes) || 0
      : Number(entry.km) || 0;
  const safeRaw = Math.min(opt.maxRaw, Math.max(0, raw));
  return Math.round(safeRaw * opt.factor * 100) / 100;
}

export function formatCardioEntryBadge(entry: CardioLikeEntry): string {
  const opt = getCardioOption(entry.cardioType);
  const eq = getCardioEquivalentKm(entry);
  if (opt.unit === 'min') {
    const mins = Math.max(0, Math.round(Number(entry.durationMinutes) || 0));
    return mins > 0 ? `${opt.label} ${mins} min (${eq.toFixed(1).replace('.', ',')} km eq.)` : opt.label;
  }
  const km = Math.max(0, Number(entry.km) || 0);
  if (km <= 0) return opt.label;
  if (opt.id === 'running') {
    return `${opt.label} (${km} km)`;
  }
  return `${opt.label} ${km} km (${eq.toFixed(1).replace('.', ',')} km eq.)`;
}
