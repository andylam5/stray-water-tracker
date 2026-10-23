export const ROUTES = {
  welcome: '/',
  units: '/units',
  firstSip: '/first-sip',
  pour: '/first-sip/pour',
  filled: '/first-sip/done',
  goal: '/goal',
  reminders: '/reminders',
  weeklyRead: '/weekly-read',
  /** The weekly read opened from Home, outside onboarding. */
  week: '/week',
  home: '/home',
} as const;
