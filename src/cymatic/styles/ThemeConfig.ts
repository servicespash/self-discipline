// @ts-nocheck -- ported from servicespash/self-discipline (looser original tsconfig)
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Centralized Design System Configuration - Cymatic Discipline OS
 * Enforces unified tokens across all views: spacing, colors, typography, and container metrics.
 */

export const ThemeConfig = {
  colors: {
    brand: '#10b981', // Emerald 500
    brandHover: '#059669', // Emerald 600
    brandActive: '#047857', // Emerald 700
    brandSubtle: 'rgba(16, 185, 129, 0.1)',
    brandBorder: 'rgba(16, 185, 129, 0.25)',
    
    // Backgrounds & Surfaces
    bgApp: '#030712', // Gray 950
    bgCard: '#111827', // Gray 900
    bgCardSubtle: 'rgba(17, 24, 39, 0.75)',
    bgInput: '#030712', // Gray 950
    
    // Borders
    borderSubtle: '#1f2937', // Gray 800
    borderMuted: '#374151', // Gray 700
    borderHighlight: '#10b981',
    
    // Status colors
    danger: '#ef4444', // Red 500
    dangerBg: 'rgba(239, 68, 68, 0.12)',
    dangerBorder: 'rgba(239, 68, 68, 0.35)',
    warning: '#f59e0b', // Amber 500
    info: '#3b82f6', // Blue 500
    success: '#10b981',
    
    // Text colors
    textPrimary: '#f9fafb', // Gray 50
    textSecondary: '#9ca3af', // Gray 400
    textMuted: '#6b7280', // Gray 500
  },
  
  spacing: {
    containerMax: '1280px',
    layoutPaddingX: '1rem', // 16px on mobile
    layoutPaddingSmX: '1.5rem', // 24px on tablet
    layoutPaddingLgX: '2rem', // 32px on desktop
    cardPaddingMobile: '1rem', // 16px
    cardPaddingDesktop: '1.5rem', // 24px
    gapGrid: '1rem',
  },
  
  typography: {
    fontSans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    titleMain: 'text-xl sm:text-2xl font-black tracking-tight text-white',
    sectionHeader: 'text-sm font-black uppercase tracking-wider text-white',
    subText: 'text-xs text-gray-400',
    monoBadge: 'font-mono text-[10px] tracking-wider font-bold',
  },

  radius: {
    card: 'rounded-3xl',
    subCard: 'rounded-2xl',
    button: 'rounded-xl',
    pill: 'rounded-full',
  }
} as const;

export default ThemeConfig;
