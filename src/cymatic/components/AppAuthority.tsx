/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AppAuthority - Dedicated Package Discovery & Application Authority Control Center
 * Real runtime discovery from Android Capacitor bridge or user package registry.
 * Zero simulated mock lists. Fully responsive across mobile & desktop.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { NavLink } from './';
import { PackageManager, AppPackageInfo } from '../utils/packageManager';
import { DisciplineBridge } from '../DisciplineBridge';
import { 
  Smartphone, 
  Search, 
  Lock, 
  Unlock, 
  Plus, 
  X, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  Filter, 
  Trash2, 
  ArrowRight,
  Flame,
  Layers,
  Cpu
} from 'lucide-react';

export default function AppAuthority() {
  const [apps, setApps] = useState<AppPackageInfo[]>([]);
  const [blockedApps, setBlockedApps] = useState<string[]>(() => PackageManager.getBlockedPackages());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'installed' | 'system' | 'social' | 'blocked'>('all');
  
  // Custom package registration modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newCategory, setNewCategory] = useState<AppPackageInfo['category']>('social');
  const [newIsSystem, setNewIsSystem] = useState(false);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadApps = async () => {
    const loaded = await PackageManager.fetchAllApps();
    setApps(loaded);
  };

  useEffect(() => {
    loadApps();
  }, []);

  const toggleAppBlock = (packageName: string) => {
    const updated = PackageManager.toggleBlockPackage(packageName);
    setBlockedApps(updated);
    const isNowBlocked = updated.includes(packageName);
    showToast(isNowBlocked ? `Suppressed target package: ${packageName}` : `Restored / Whitelisted package: ${packageName}`);
  };

  const handleRegisterPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const pkg = newPackageName.trim();
    const name = newAppName.trim();
    if (!pkg || !name) return;

    const newApp: AppPackageInfo = {
      packageName: pkg,
      appName: name,
      category: newCategory,
      isSystemApp: newIsSystem,
      versionName: '1.0.0',
      userAdded: true
    };

    const updated = PackageManager.addConfiguredApp(newApp);
    setApps(updated);
    setShowAddModal(false);
    setNewPackageName('');
    setNewAppName('');
    showToast(`Registered package authority: ${name} (${pkg})`);
  };

  const handleDeletePackage = (packageName: string) => {
    const updated = PackageManager.removeConfiguredApp(packageName);
    setApps(updated);
    showToast(`Removed custom package: ${packageName}`);
  };

  const handleSuppressAllSocial = () => {
    const socialPkgs = apps.filter(a => a.category === 'social' || a.category === 'entertainment').map(a => a.packageName);
    const merged = Array.from(new Set([...blockedApps, ...socialPkgs]));
    PackageManager.saveBlockedPackages(merged);
    setBlockedApps(merged);
    showToast(`Suppressed ${socialPkgs.length} social & entertainment packages.`);
  };

  const handleRestoreAll = () => {
    PackageManager.saveBlockedPackages([]);
    setBlockedApps([]);
    showToast('Restored all packages to active authority.');
  };

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        app.appName.toLowerCase().includes(q) ||
        app.packageName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeTab === 'installed') return !app.isSystemApp;
      if (activeTab === 'system') return app.isSystemApp;
      if (activeTab === 'social') return app.category === 'social' || app.category === 'entertainment';
      if (activeTab === 'blocked') return blockedApps.includes(app.packageName);
      return true;
    });
  }, [apps, searchQuery, activeTab, blockedApps]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 text-gray-100 min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 bg-emerald-950/95 border border-emerald-500/50 rounded-2xl shadow-2xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in zoom-in-95">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/40 border border-gray-800 rounded-3xl shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            <Smartphone size={12} /> App Authority & Package Discovery
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Application Authority & Package Registry
          </h2>
          <p className="text-xs text-gray-400 max-w-2xl">
            Live discovery of system applications and user-installed packages. Target distractors for interception without simulated fake data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Package Target</span>
          </button>

          <NavLink
            to="/settings"
            className="px-4 py-2.5 bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Lockdown Protocols</span>
            <ArrowRight size={14} className="text-emerald-400" />
          </NavLink>
        </div>
      </div>

      {/* Controls & Search Toolbar */}
      <div className="p-4 sm:p-6 bg-gray-900/90 border border-gray-800 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search packages by app label or package identifier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-gray-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Batch Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSuppressAllSocial}
              className="px-3 py-2 bg-red-950/60 hover:bg-red-900/70 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Suppress all social & entertainment packages"
            >
              Suppress Social
            </button>
            <button
              type="button"
              onClick={handleRestoreAll}
              className="px-3 py-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Restore all packages to active status"
            >
              Restore All
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {[
            { id: 'all', label: 'All Discovered Apps', count: apps.length },
            { id: 'installed', label: 'Installed Apps', count: apps.filter(a => !a.isSystemApp).length },
            { id: 'system', label: 'System Apps', count: apps.filter(a => a.isSystemApp).length },
            { id: 'social', label: 'Social & Distraction', count: apps.filter(a => a.category === 'social' || a.category === 'entertainment').length },
            { id: 'blocked', label: 'Suppressed Targets', count: blockedApps.length }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-gray-950 shadow-md font-black'
                  : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-gray-900/60 text-[10px] font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Apps Inventory Grid */}
      {filteredApps.length === 0 ? (
        <div className="p-10 bg-gray-900/40 border border-gray-800 rounded-3xl text-center space-y-3">
          <Smartphone size={32} className="mx-auto text-gray-600" />
          <h4 className="text-sm font-black text-white uppercase tracking-wider">No Matching Packages Found</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {searchQuery 
              ? `No packages match "${searchQuery}". Try a different search term or reset filters.`
              : 'No packages currently configured in this view. You can register any Android package identifier manually.'}
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Register Custom Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredApps.map(app => {
            const isBlocked = blockedApps.includes(app.packageName);

            return (
              <div 
                key={app.packageName}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 min-w-0 ${
                  isBlocked 
                    ? 'bg-red-950/20 border-red-500/30' 
                    : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-white truncate max-w-[150px]">
                        {app.appName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-bold ${
                        app.isSystemApp 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {app.isSystemApp ? 'System' : 'Installed'}
                      </span>
                      {app.category && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-gray-950 text-gray-400 border border-gray-800">
                          {app.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[10px] font-mono text-gray-500 truncate max-w-full block" title={app.packageName}>
                      {app.packageName}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isBlocked ? (
                      <span className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-[9px] font-mono font-bold text-red-400 flex items-center gap-1">
                        <Lock size={10} /> Suppressed
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Unlock size={10} /> Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-[10px] text-gray-400 gap-2">
                  <span className="truncate">
                    Ver: <strong className="text-gray-300 font-mono">{app.versionName || '1.0'}</strong>
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {app.userAdded && (
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(app.packageName)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete custom package"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleAppBlock(app.packageName)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                        isBlocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black shadow-md'
                          : 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {isBlocked ? 'Restore App' : 'Suppress / Block'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register Custom Package */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Plus size={16} className="text-emerald-400" /> Register Package Target
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegisterPackage} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Android Package Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. com.discord or com.spotify.music"
                  value={newPackageName}
                  onChange={e => setNewPackageName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 font-mono text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  App Name / Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Discord or Spotify"
                  value={newAppName}
                  onChange={e => setNewAppName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                >
                  <option value="social">Social & Media</option>
                  <option value="entertainment">Entertainment & Video</option>
                  <option value="messaging">Messaging & Chat</option>
                  <option value="productivity">Productivity</option>
                  <option value="system">System App</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSystem"
                  checked={newIsSystem}
                  onChange={e => setNewIsSystem(e.target.checked)}
                  className="rounded border-gray-800 text-emerald-500 focus:ring-0 bg-gray-950"
                />
                <label htmlFor="isSystem" className="text-gray-300 cursor-pointer">
                  Mark as System Application
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-black rounded-xl uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Save Authority Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
