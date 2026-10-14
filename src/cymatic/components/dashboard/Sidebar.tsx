import React from 'react';
import { NavLink } from './';
import { 
  X, 
  Home, 
  CheckSquare, 
  CalendarDays, 
  Wallet, 
  HeartPulse, 
  Monitor, 
  Sparkles, 
  Lock, 
  Smartphone, 
  ShieldAlert, 
  DollarSign, 
  ShieldCheck,
  Scale
} from 'lucide-react';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `w-full flex items-center gap-3 p-3 rounded-2xl transition-all border group relative ${
      isActive
        ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900/50 border-transparent'
    }`}
  >
    {({ isActive }) => (
      <>
        {isActive && <div className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-full" />}
        <Icon size={17} className={isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-emerald-400/80 transition-colors shrink-0'} />
        <span className="font-black uppercase tracking-wider text-[11px] truncate">{label}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <>
    {/* Mobile Backdrop */}
    {isMobileMenuOpen && (
      <div 
        className="fixed inset-0 z-40 bg-gray-950/80 backdrop-blur-sm md:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    )}

    <aside className={`
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-72 
      transition-transform duration-300 ease-in-out
      border-r border-gray-800/60 flex flex-col justify-between 
      bg-gray-950/95 backdrop-blur-2xl shadow-2xl shrink-0 h-full overflow-hidden
    `}>
      <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
        <div className="flex items-center justify-between mb-6 md:hidden">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Navigation</span>
          <button 
            type="button"
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1">
          {[
            { to: '/dashboard', icon: Home, label: 'Core Engine' },
            { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
            { to: '/calendar', icon: CalendarDays, label: 'Calendar Grid' },
            { to: '/wallet', icon: Wallet, label: 'Capital Tracker' },
            { to: '/prayer', icon: HeartPulse, label: 'Prayer Discipline' },
            { to: '/makeover', icon: Monitor, label: 'Room Makeover' },
            { to: '/rio', icon: Sparkles, label: 'Google Sync' },
            { to: '/settings', icon: Lock, label: 'Lockdown Protocols' },
            { to: '/apps', icon: Smartphone, label: 'App Authority' },
            { to: '/focus', icon: ShieldAlert, label: 'Focus & VPN Firewall' },
            { to: '/reseller', icon: DollarSign, label: 'Referrals & Team Seats' },
            { to: '/wellbeing', icon: HeartPulse, label: 'Wellbeing Manager' },
            { to: '/governance', icon: Scale, label: 'Governance & Contracts' },
            { to: '/trust', icon: ShieldCheck, label: 'Trust & Legal' },
          ].map(item => (
            <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} onClick={() => setIsMobileMenuOpen(false)} />
          ))}
        </nav>
      </div>

      <div className="p-3.5 m-3 bg-gray-900/60 border border-gray-800 rounded-2xl space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-gray-300 font-bold">Isabirye Latif</span>
          <span className="text-[9px] text-emerald-400">CODE OWNER</span>
        </div>
        <div className="text-[10px] text-gray-500 font-mono">
          Auditor: <span className="text-gray-400">Cymatic Security Board</span>
        </div>
        <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[10px] font-mono text-gray-500">
          <NavLink to="/terms" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-300 transition-colors">Terms</NavLink>
          <span>•</span>
          <NavLink to="/privacy" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-gray-300 transition-colors">Privacy</NavLink>
          <span>•</span>
          <NavLink to="/cloud" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-400 transition-colors">Cloudflare</NavLink>
        </div>
      </div>
    </aside>
  </>
);
