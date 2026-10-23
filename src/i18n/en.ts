import { DRINK_LIST, type DrinkKey } from '../lib/drinks';

/**
 * English copy. Every other locale is typed as `Messages`, so a missing or extra key
 * is a type error. Functions take already-formatted amounts ("250 ml") and names.
 */
export const en = {
  common: {
    close: 'Close',
    closeNamed: (title: string) => `Close ${title.toLowerCase()}`,
    skip: 'Skip',
    cancel: 'Cancel',
    back: 'Back',
    done: 'Done',
    continue: 'Continue',
  },
  unitNames: { ml: 'milliliters', oz: 'ounces' },

  welcome: {
    title: 'Track every sip',
    sub: 'Each drink fills Stray up in its own color.',
    start: 'Get started',
    account: 'I already have an account',
    language: (name: string) => `Language: ${name}`,
    replay: 'Stray fills up with four different drinks, then turns into the real Stray. Play again.',
  },
  units: {
    title: 'Which units do you use?',
    sub: 'You can switch anytime in settings.',
  },
  firstSip: {
    title: 'Add your first sip',
    lede: 'Stray is empty. Tap the glass to pour some water in.',
    emptyAlt: 'Stray, an empty cat silhouette',
    addWater: 'Add water',
  },
  filled: {
    sub: 'Your first sip is in',
    alt: (amount: string) => `Stray, holding your first ${amount} of water`,
    speech: 'Ooh. Cold.',
  },

  goal: {
    sex: { female: ['Female', ''], male: ['Male', ''], none: ['Prefer not to say', 'Uses the common goal'] },
    activity: {
      low: ['Low activity', 'Mostly sitting, short walks'],
      medium: ['Medium activity', 'On your feet often, light exercise'],
      high: ['High activity', 'Daily workouts or a physical job'],
    },
    climate: {
      cool: ['Cool', 'Mild days, rarely hot'],
      temperate: ['Temperate', 'Warm summers, cool winters'],
      hot: ['Hot', 'Hot or humid most of the year'],
    },
    sheets: { sex: 'Sex', weight: 'Weight', activity: 'Activity level', climate: 'Climate', custom: 'Custom goal' },
    kind: { custom: 'Custom goal', personal: 'Your goal', common: 'Common goal' },
    infoLabel: 'How this goal is worked out',
    heading: 'Calculate your goal',
    info: 'A starting point from your answers below, not medical advice. You can change it anytime.',
    customValue: (amount: string) => `Custom goal: ${amount}`,
    weightIn: { kg: 'Weight in kilograms', lb: 'Weight in pounds' },
    weightSkip: 'Prefer not to say',
    lower: (step: string) => `Lower goal by ${step}`,
    raise: (step: string) => `Raise goal by ${step}`,
    useCalculated: 'Use the calculated goal instead',
    save: 'Set my goal',
  },

  reminders: {
    title: 'Smart reminders',
    lede: 'Stray only nudges you when you fall behind your pace for the day.',
    /** Shown at 11:20, 15:05 and 19:40. */
    messages: (toGo: string) => [
      `I’m staring at you. ${toGo} to go before lunch.`,
      'Nothing since lunch. I noticed. Cats notice.',
      'One more glass and I’ll stop meowing. Probably.',
    ],
    show: (n: number, total: number) => `Show reminder ${n} of ${total}`,
    alt: 'Stray sitting in shallow water',
    cta: 'Remind me to drink',
  },

  weekly: {
    title: 'Every Sunday, Stray reads your week',
    lede: 'Stray, your AI companion, looks at what you drank and when, then tells you what it noticed and one thing to try next week.',
    name: 'Stray’s weekly read',
    homeSub: 'From your AI companion, every Sunday',
    example: 'Example week',
    yours: 'Your week',
    wholeWeek: 'Whole week',
    goalHit: (n: number, total: number) => `Goal hit ${n} of ${total}`,
    notTracked: (day: string) => `${day}, before you started tracking`,
    tapHint: 'Tap a day for Stray’s take on it',
    barLabel: (day: string, amount: string) => `${day}, ${amount}. Show Stray’s read for this day.`,
    readingWeek: 'Stray is reading your week…',
    readingDay: (day: string) => `Stray is reading ${day}…`,
    tryThis: 'Try this: ',
    notConfigured: 'I can’t read yet. Add GEMINI_API_KEY to .env and restart the dev server.',
    failed: 'I dozed off mid-read. Typical.',
    busy: 'Too many reads. My eyes need a minute.',
    retry: 'Try again',
    send: 'Send my weekly read',
    sendSub: (time: string) => `Sundays at ${time}, from your drink log only`,
    cta: 'Start drinking',
  },

  home: {
    /** Stray's reaction under 25, 50, 75, 100, 110, 130 and 150% of the goal, then above. */
    lines: [
      'Still pretty empty in here.',
      'Keep going. I’m watching.',
      'Over halfway. Almost impressed.',
      'So close. One more and I purr.',
      'Goal done. One head pat, allowed.',
      'Overachiever. I respect it, quietly.',
      'Are you part fish? Asking for me.',
      'I’m full. You can ease up now.',
    ],
    progress: (pct: number, goal: string) => `${pct}% of your ${goal} goal`,
    reached: 'Goal reached. Nice.',
    reachedExtra: (extra: string) => `Goal reached, plus ${extra} extra`,
    fill: (pct: number) => `Stray is ${pct} percent full`,
    fullAlt: 'Stray in full color. Today’s goal is done.',
    undo: (drink: string) => `Undo ${drink.toLowerCase()}`,
  },
  streak: (days: number, left: number, next: number) =>
    `${days}-day streak. ${left} ${left === 1 ? 'day' : 'days'} to your ${next}-day milestone.`,

  pour: {
    add: (drink: string) => `Add ${drink.toLowerCase()}`,
    amount: (drink: string, unitName: string) => `${drink} amount in ${unitName}`,
    hint: {
      glass: 'Drag up or down inside the glass to pour',
      cup: 'Drag up or down inside the cup to pour',
      carton: 'Drag up or down inside the carton to pour',
      can: 'Drag up or down inside the can to pour',
      mug: 'Drag up or down inside the mug to pour',
      bottle: 'Drag up or down inside the bottle to pour',
    },
    counts: (pct: number, caffeineMg: number) =>
      `Counts as ${pct}% toward your goal${caffeineMg ? `, ${caffeineMg} mg caffeine per serving` : ''}`,
    noAlcohol: 'Alcohol doesn’t count toward your goal',
  },
  picker: { edit: 'Add or edit', editLabel: 'Add or edit drinks' },

  settings: {
    title: 'Settings',
    goal: 'Daily goal, change weight, activity or climate ›',
    units: 'Units',
    language: 'Language',
    beverages: 'Add or edit beverages',
    clear: 'Clear today’s drinks',
    clearConfirm: 'Tap again to clear today',
    replay: 'Replay onboarding',
    demoLoad: 'Load demo week',
    demoClear: 'Remove demo week',
    reset: 'Reset all data',
    resetConfirm: 'Tap again to erase everything',
  },
  beverages: {
    title: 'Beverages',
    note: 'Switch drinks on to add them to your Home row. The % is how much of each drink counts toward your goal.',
    filter: 'Filter by type',
    caffeine: (mg: number) => `${mg} mg caffeine`,
    counts: (pct: number) => `Counts ${pct} percent`,
    always: 'Always',
    show: (drink: string) => `Show ${drink.toLowerCase()} on Home`,
  },
  categories: {
    all: (n: number) => `All ${n}`,
    water: 'Water',
    tea: 'Tea',
    coffee: 'Coffee',
    fruit: 'Fruit',
    alcohol: 'Alcohol',
    other: 'Other',
  },
  /** [name, short label under the icon on Home]. */
  drinks: Object.fromEntries(DRINK_LIST.map((d) => [d.key, [d.name, d.short]])) as Record<DrinkKey, [string, string]>,
};

export type Messages = typeof en;
