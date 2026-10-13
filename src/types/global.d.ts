export {};

export interface DisciplineNativePlugin {
  terminateLockdown: () => Promise<void>;
  suppressNotifications: (options: { suppress: boolean }) => Promise<void>;
  enforceIntentInterception: (options: { active: boolean; packages?: string[] }) => Promise<void>;
  startVpnTunnel: () => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  fetchInstalledApps: () => Promise<string>;
}

declare global {
  interface Window {
    launchQueue?: {
      setConsumer: (consumer: (launchParams: { targetURL?: string }) => void) => void;
    };
    DisciplineNative?: DisciplineNativePlugin;
    Capacitor?: {
      isPluginAvailable: (name: string) => boolean;
      Plugins: {
        DisciplineNative: DisciplineNativePlugin;
        [key: string]: any;
      };
    };
  }
}
