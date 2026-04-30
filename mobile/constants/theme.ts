const shared = {
  bias: {
    left:           '#3b82f6',
    'center-left':  '#60a5fa',
    center:         '#6b7280',
    'center-right': '#f97316',
    right:          '#ef4444',
    neutral:        '#9ca3af',
  } as Record<string, string>,
  category: {
    tech:          '#6366f1',
    science:       '#06b6d4',
    health:        '#10b981',
    sports:        '#f59e0b',
    politics:      '#ef4444',
    business:      '#8b5cf6',
    entertainment: '#ec4899',
    environment:   '#84cc16',
    general:       '#6b7280',
  } as Record<string, string>,
}

export const LightColors = {
  primary:    '#1a1a2e',
  accent:     '#e8b84b',
  background: '#f5f5f5',
  card:       '#ffffff',
  text:       '#1a1a2e',
  muted:      '#6b7280',
  border:     '#e5e7eb',
  ...shared,
}

export const DarkColors = {
  primary:    '#f3f4f6',
  accent:     '#e8b84b',
  background: '#0f0f14',
  card:       '#1c1c28',
  text:       '#f3f4f6',
  muted:      '#9ca3af',
  border:     '#2d2d44',
  ...shared,
}

export type ColorScheme = typeof LightColors

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
}

export const Font = {
  size: {
    xs:  11,
    sm:  13,
    md:  15,
    lg:  17,
    xl:  20,
    xxl: 26,
  },
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
  },
}
