export type Unit = 'ml' | 'oz';

export const ML_PER_OZ = 29.5735;

/** Everything is stored in ml; these helpers round and label for the chosen unit. */
export function unitHelpers(unit: Unit, locale = 'en') {
  const isOz = unit === 'oz';
  const snap = (ml: number) =>
    isOz ? Math.max(1, Math.round(ml / ML_PER_OZ)) * ML_PER_OZ : Math.round(ml / 10) * 10;
  const show = (ml: number) => {
    if (ml <= 0) return '0';
    return isOz
      ? String(Math.max(1, Math.round(ml / ML_PER_OZ)))
      : (Math.round(ml / 10) * 10).toLocaleString(locale);
  };
  const fmt = (ml: number) => `${show(ml)} ${unit}`;
  const presets: { label: string; ml: number }[] = isOz
    ? [5, 8, 12, 16].map((n) => ({ label: String(n), ml: n * ML_PER_OZ }))
    : [150, 250, 330, 500].map((n) => ({ label: String(n), ml: n }));

  return {
    unit,
    isOz,
    snap,
    show,
    fmt,
    presets,
    /** Smallest pour allowed. */
    minMl: isOz ? ML_PER_OZ : 50,
    /** One keyboard step on the pour slider. */
    stepMl: isOz ? ML_PER_OZ : 10,
  };
}

export type UnitHelpers = ReturnType<typeof unitHelpers>;
