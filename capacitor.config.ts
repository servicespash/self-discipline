import type { CapacitorConfig } from '@capacitor/cli';

// The web app is server-rendered, so the Android shell loads the live site.
// Change server.url to the published address once the app is published.
const config: CapacitorConfig = {
  appId: 'app.lovable.cymaticdiscipline',
  appName: 'Cymatic Discipline OS',
  webDir: 'public',
  server: {
    url: 'https://id-preview--8f9dbc6e-2704-43e6-a8f3-b11b61fc08fe.lovable.app',
    cleartext: false,
  },
  android: { allowMixedContent: false },
};

export default config;
