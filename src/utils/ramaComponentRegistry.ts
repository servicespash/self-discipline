/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Rama Reactive UI Component Registry
 * Enables dynamic injection of content-aware views (contact selector, media player, contract preview)
 * into Rama Floating Hub based on context.
 */

import React from 'react';

export type HubViewType = 'default' | 'contacts' | 'media_player' | 'contract_preview' | 'voice_commands';

export interface HubComponentRegistration {
  id: HubViewType;
  title: string;
  renderComponent: (props: { data?: any; onClose: () => void }) => React.ReactNode;
}

class RamaComponentRegistryEngine {
  private registry: Map<HubViewType, HubComponentRegistration> = new Map();
  private activeView: HubViewType = 'default';
  private activeData: any = null;
  private listeners: Set<(view: HubViewType, data: any) => void> = new Set();

  public register(registration: HubComponentRegistration) {
    this.registry.set(registration.id, registration);
  }

  public setView(view: HubViewType, data?: any) {
    this.activeView = view;
    this.activeData = data;
    this.notifyListeners();
  }

  public getView(): { view: HubViewType; data: any } {
    return { view: this.activeView, data: this.activeData };
  }

  public subscribe(callback: (view: HubViewType, data: any) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners() {
    for (const l of this.listeners) {
      l(this.activeView, this.activeData);
    }
  }
}

export const RamaComponentRegistry = new RamaComponentRegistryEngine();
