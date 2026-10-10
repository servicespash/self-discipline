import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'icon.svg', 'splash-screen.png'],
      manifest: {
        id: '/',
        name: 'Cymatic Discipline OS',
        short_name: 'CymaticOS',
        description: 'High-performance architectural discipline, resonance operating system, and executive lockdown engine.',
        theme_color: '#030712',
        background_color: '#030712',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        start_url: '/',
        scope: '/',
        orientation: 'any',
        dir: 'ltr',
        lang: 'en-US',
        categories: ['productivity', 'utilities', 'lifestyle'],
        prefer_related_applications: false,
        // Deep-linking metadata for OS launch interception
        launch_handler: {
          client_mode: ['navigate-existing', 'auto']
        },
        handle_links: 'preferred',
        icons: [
          { 
            src: '/pwa-192x192.png', 
            sizes: '192x192', 
            type: 'image/png', 
            purpose: 'any' 
          },
          { 
            src: '/pwa-512x512.png', 
            sizes: '512x512', 
            type: 'image/png', 
            purpose: 'any' 
          },
          { 
            src: '/pwa-512x512.png', 
            sizes: '512x512', 
            type: 'image/png', 
            purpose: 'maskable' 
          },
          { 
            src: '/splash-screen.png', 
            sizes: '512x512', 
            type: 'image/png',
            purpose: 'any'
          }
        ],
        // App launch splash screen associations and visual previews
        screenshots: [
          {
            src: '/splash-screen.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Cymatic Discipline OS Mobile Lockdown Engine'
          },
          {
            src: '/splash-screen.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Cymatic Discipline OS System Workspace'
          }
        ],
        // Shortcuts with associated splash screens and deep-linking URLs
        shortcuts: [
          {
            name: 'Task Manager & Lockdown',
            short_name: 'Tasks',
            description: 'Direct launch to high-impact task execution and algorithmic lockdown',
            url: '/#/tasks',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/splash-screen.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              }
            ]
          },
          {
            name: 'Discipline Calendar Grid',
            short_name: 'Calendar',
            description: 'Google Calendar live synchronizer and daily discipline lockdown scheduler',
            url: '/#/calendar',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/splash-screen.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              }
            ]
          },
          {
            name: 'Prayer Discipline Core',
            short_name: 'Prayers',
            description: 'Spiritual grounding, prayer streak tracking, and daily centering',
            url: '/#/prayer',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/splash-screen.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              }
            ]
          },
          {
            name: 'Room Makeover Protocol',
            short_name: 'Makeover',
            description: 'Physical space discipline, concrete dumbbell workouts, and room audits',
            url: '/#/makeover',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/splash-screen.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              }
            ]
          },
          {
            name: 'Rama AI Execution Hub',
            short_name: 'Rama AI',
            description: 'Instant executive consultation, focus tutoring, and memory access',
            url: '/#/?action=summon_rama',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/splash-screen.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              }
            ]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}']
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  build: {
    minify: 'esbuild',
    target: 'esnext'
  },
  server: {
    hmr: false
  }
});
