/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Capacitor Native Runtime Configuration for Android & iOS
 */
export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    url?: string;
    cleartext?: boolean;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.cymatic.disciplineos',
  appName: 'Cymatic Discipline OS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    DisciplineNative: {
      usageStatsPermissionRequired: true,
      overlayPermissionRequired: true,
      notificationSuppressionActive: true
    }
  }
};

export default config;
