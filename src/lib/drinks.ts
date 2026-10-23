export type DrinkKey =
  | 'water' | 'sparkling' | 'sports'
  | 'tea' | 'greentea' | 'herbal' | 'icedtea' | 'matcha'
  | 'coffee' | 'latte' | 'espresso'
  | 'juice' | 'smoothie' | 'lemonade'
  | 'milk' | 'soda' | 'beer' | 'redwine';

export type DrinkCategory = 'water' | 'tea' | 'coffee' | 'fruit' | 'alcohol' | 'other';

/** Vessel a drink is drawn and poured in. */
export type VesselShape = 'glass' | 'teacup' | 'togo' | 'straw' | 'carton' | 'can' | 'wine' | 'mug' | 'small' | 'bottle';

export interface Drink {
  key: DrinkKey;
  /** English name: the `en` locale's copy and what the weekly read sends to the model. */
  name: string;
  /** English label under the icon on Home. */
  short: string;
  cat: DrinkCategory;
  shape: VesselShape;
  /** Share of the volume that counts toward the goal (alcohol is 0). */
  hydration: number;
  /** Caffeine per serving, mg. */
  caffeine: number;
  /** Default pour, ml. */
  ml: number;
  /** Liquid color. */
  c: string;
  /** Highlight / back-wave color. */
  light: string;
  fizzy?: boolean;
  /** Dark liquid: use white text on its button. */
  dark?: boolean;
}

type Row = [DrinkKey, string, string, DrinkCategory, VesselShape, number, number, number, string, string, boolean?, boolean?];

// key, name, short, category, shape, hydration, caffeine mg, default ml, color, light, fizzy, dark
const CATALOG: Row[] = [
  ['water', 'Water', 'Water', 'water', 'glass', 1.0, 0, 250, '#4FA3F7', '#A9D3FB'],
  ['sparkling', 'Sparkling water', 'Sparkling', 'water', 'glass', 1.0, 0, 330, '#7FD3EA', '#D5F2FA', true],
  ['sports', 'Sports drink', 'Sports', 'other', 'bottle', 1.0, 0, 500, '#4FC3C9', '#BDE9EB'],
  ['tea', 'Black tea', 'Black tea', 'tea', 'teacup', 0.9, 47, 200, '#C98A3D', '#EBCB9C'],
  ['greentea', 'Green tea', 'Green tea', 'tea', 'teacup', 0.95, 25, 200, '#8DBF4E', '#D6EBB8'],
  ['herbal', 'Herbal tea', 'Herbal tea', 'tea', 'teacup', 1.0, 0, 200, '#E59A4F', '#F6D5B0'],
  ['icedtea', 'Iced tea', 'Iced tea', 'tea', 'glass', 0.9, 25, 330, '#D9893B', '#F2CFA0'],
  ['matcha', 'Matcha latte', 'Matcha', 'tea', 'straw', 0.85, 70, 300, '#7DAF5A', '#D3E8BF'],
  ['coffee', 'Coffee', 'Coffee', 'coffee', 'togo', 0.85, 95, 150, '#6B4430', '#DDB892', false, true],
  ['latte', 'Latte', 'Latte', 'coffee', 'mug', 0.9, 75, 250, '#C9A27E', '#EBD9C4'],
  ['espresso', 'Espresso', 'Espresso', 'coffee', 'small', 0.75, 63, 40, '#4A2C1D', '#C9A68C', false, true],
  ['juice', 'Juice', 'Juice', 'fruit', 'straw', 0.9, 0, 200, '#FF9E3D', '#FFD7A6'],
  ['smoothie', 'Smoothie', 'Smoothie', 'fruit', 'straw', 0.85, 0, 300, '#F06292', '#F9C4D6'],
  ['lemonade', 'Lemonade', 'Lemonade', 'fruit', 'glass', 0.9, 0, 300, '#F7D44C', '#FBEBA6'],
  ['milk', 'Milk', 'Milk', 'other', 'carton', 0.95, 0, 200, '#EADFCB', '#F8F4EC'],
  ['soda', 'Soda', 'Soda', 'other', 'can', 0.85, 34, 330, '#E53950', '#F5B3BD', true],
  ['beer', 'Beer', 'Beer', 'alcohol', 'mug', 0, 0, 330, '#F2B33D', '#FBEFD0'],
  ['redwine', 'Red wine', 'Red wine', 'alcohol', 'wine', 0, 0, 150, '#8E1F3A', '#D9A0AE', false, true],
];

/** Every drink, in catalog order. */
export const DRINK_LIST: Drink[] = CATALOG.map(([key, name, short, cat, shape, hydration, caffeine, ml, c, light, fizzy, dark]) => ({
  key, name, short, cat, shape, hydration, caffeine, ml, c, light, fizzy, dark,
}));

export const DRINKS = Object.fromEntries(DRINK_LIST.map((d) => [d.key, d])) as Record<DrinkKey, Drink>;

/** Look up a logged drink; unknown keys (from older data) fall back to water. */
export const drinkFor = (key: string): Drink => DRINKS[key as DrinkKey] ?? DRINKS.water;

/** How much of an entry counts toward the goal, ml. */
export const hydrationMl = (e: { k: string; ml: number }) => e.ml * drinkFor(e.k).hydration;

/** Filter chips on the beverages sheet, in order. */
export const CATEGORIES: (DrinkCategory | 'all')[] = ['all', 'water', 'tea', 'coffee', 'fruit', 'alcohol', 'other'];

/** Drinks on the Home row for a new user. Water is always on. */
export const DEFAULT_ENABLED: DrinkKey[] = ['water', 'sparkling', 'greentea', 'tea', 'coffee', 'latte', 'juice', 'smoothie', 'milk', 'soda'];

/** Pale liquids where a white "+" badge would vanish. */
export const LIGHT_BADGE: ReadonlySet<DrinkKey> = new Set(['milk', 'lemonade']);

/** Used until the user sets a goal in onboarding or settings. */
export const DEFAULT_GOAL_ML = 2400;
