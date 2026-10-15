/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * SystemAppSelectorModal - Dynamic System & Installed Application Selector
 * Allows users to browse and select installed device applications dynamically.
 * Zero hardcoded package names: connects directly to device package authority.
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Check, 
  Plus, 
  X, 
  Filter, 
  Layers, 
  ShieldCheck,
  CheckSquare,
  Square,
  Cpu
} from 'lucide-react';
import { PackageManager, AppPackageInfo } from '../../utils/packageManager';

interface SystemAppSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackages: string[];
  onConfirmSelection: (packages: string[]) => void;
}

export const SystemAppSelectorModal: React.FC<SystemAppSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedPackages,
  onConfirmSelection,
}) => {
  const [apps, setApps] = useState<AppPackageInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedSet, setSelectedSet] = useState<Set<string>>(() => new Set(selectedPackages));

  // Add Custom App inline form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newPackageId, setNewPackageId] = useState<string>('');
  const [newCategory, setNewCategory] = useState<AppPackageInfo['category']>('installed');

  useEffect(() => {
    setSelectedSet(new Set(selectedPackages));
  }, [selectedPackages]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchApps = async () => {
      setLoading(true);
      try {
        const result = await PackageManager.fetchAllApps();
        setApps(result);
      } catch (err) {
        console.warn('Failed to load apps:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleApp = (pkgName: string) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(pkgName)) {
        next.delete(pkgName);
      } else {
        next.add(pkgName);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      filteredApps.forEach((app) => next.add(app.packageName));
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedSet(new Set());
  };

  const handleAddCustomApp = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newAppName.trim();
    let pkg = newPackageId.trim();

    if (!name) return;
    if (!pkg) {
      pkg = `app.${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }

    const customApp: AppPackageInfo = {
      packageName: pkg,
      appName: name,
      category: newCategory,
      isSystemApp: false,
      userAdded: true,
      versionName: 'User Configured'
    };

    const updated = PackageManager.addConfiguredApp(customApp);
    setApps(updated);
    setSelectedSet((prev) => new Set([...prev, pkg]));
    setNewAppName('');
    setNewPackageId('');
    setShowAddForm(false);
  };

  const handleConfirm = () => {
    onConfirmSelection(Array.from(selectedSet));
    onClose();
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.appName.toLowerCase().includes(search.toLowerCase()) ||
      app.packageName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' ||
      (activeCategory === 'system' && app.isSystemApp) ||
      (activeCategory === 'installed' && !app.isSystemApp) ||
      app.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-1">
              <Smartphone size={16} />
              <span>System & Installed Application Directory</span>
            </div>
            <h2 className="text-xl font-black text-white">Select Target Restricted Apps</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Choose applications installed on your system to enforce in this governance contract.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-gray-800/60 hover:bg-gray-800 transition border border-gray-700/60"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-gray-800 bg-gray-950/40 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search installed apps or package ID..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Cancel' : 'Add App'}</span>
            </button>
          </div>

          {/* Add Custom App Form */}
          {showAddForm && (
            <form onSubmit={handleAddCustomApp} className="p-3 bg-gray-900 border border-emerald-500/30 rounded-2xl space-y-2.5 animate-in fade-in">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Add Installed App on This Device</span>
                <span className="text-[10px] text-gray-400 font-normal">Custom Package Registration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="App Display Name (e.g. Work Messenger)"
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
                <input
                  type="text"
                  value={newPackageId}
                  onChange={(e) => setNewPackageId(e.target.value)}
                  placeholder="Package ID (optional, auto-generated)"
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none"
                >
                  <option value="installed">Installed App</option>
                  <option value="social">Social Media</option>
                  <option value="productivity">Productivity</option>
                  <option value="messaging">Messaging</option>
                  <option value="entertainment">Entertainment</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                >
                  Save App
                </button>
              </div>
            </form>
          )}

          {/* Category Filters */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {['all', 'installed', 'social', 'messaging', 'entertainment', 'system'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition ${
                    activeCategory === cat
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] font-mono text-red-400 hover:text-red-300 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Selected Counter & Chips */}
        {selectedSet.size > 0 && (
          <div className="px-6 py-2.5 bg-emerald-950/30 border-b border-gray-800 flex items-center justify-between text-xs shrink-0">
            <span className="text-emerald-400 font-mono font-bold">
              {selectedSet.size} App{selectedSet.size !== 1 ? 's' : ''} Selected for Lockdown
            </span>
            <span className="text-[11px] text-gray-400">
              Zero hardcoding enforced
            </span>
          </div>
        )}

        {/* App List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500 animate-pulse">
              Scanning system and installed applications...
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Smartphone size={32} className="mx-auto text-gray-600" />
              <p className="text-xs text-gray-400">No applications match your filter.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-gray-800 text-emerald-400 rounded-xl text-xs font-bold"
              >
                + Register Device App
              </button>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isChecked = selectedSet.has(app.packageName);
              return (
                <div
                  key={app.packageName}
                  onClick={() => toggleApp(app.packageName)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                      : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className={`p-1 rounded-lg transition ${
                        isChecked ? 'text-emerald-400' : 'text-gray-600'
                      }`}
                    >
                      {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{app.appName}</span>
                        {app.isSystemApp && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                            System
                          </span>
                        )}
                        {app.userAdded && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 truncate max-w-xs">
                        {app.packageName}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-gray-900 text-gray-400 shrink-0">
                    {app.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
          >
            <Check size={15} />
            <span>Apply Selected Apps ({selectedSet.size})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemAppSelectorModal;
