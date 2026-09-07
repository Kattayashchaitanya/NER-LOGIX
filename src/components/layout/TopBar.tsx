import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useNetworkStore } from '@/store/networkStore';
import { useNavigate } from 'react-router-dom';
import { DriverVehicleSelector } from '@/components/ui/DriverVehicleSelector';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  Truck,
  Activity,
  ShieldCheck,
  Warehouse,
  AlertTriangle,
  Check,
  Menu,
} from 'lucide-react';
import type { NetworkStatus, UserRole } from '@/types';

function NetworkIndicator({
  status,
  onToggle,
}: {
  status: NetworkStatus;
  onToggle: () => void;
}) {
  const config = {
    online: {
      icon: <Wifi className="w-4 h-4" />,
      label: 'Online',
      badge: 'Live Sync',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100',
    },
    offline: {
      icon: <WifiOff className="w-4 h-4" />,
      label: 'Offline Mode',
      badge: 'Saved on Device',
      color: 'text-rose-700 bg-rose-50 border-rose-300 hover:bg-rose-100',
    },
    syncing: {
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      label: 'Syncing',
      badge: 'Uploading Data',
      color: 'text-amber-700 bg-amber-50 border-amber-300 hover:bg-amber-100',
    },
  };
  const cfg = config[status];

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs select-none',
        cfg.color
      )}
      title="Click to toggle Network status (Online / Offline mode test)"
    >
      {cfg.icon}
      <span className="font-bold">{cfg.label}</span>
      <span className="hidden lg:inline text-[11px] opacity-80 font-normal">({cfg.badge})</span>
    </button>
  );
}

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { role, setRole, networkStatus, setNetworkStatus, toggleSidebar, selectedDriverVehicleId } = useAppStore();
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const currentDriverVehicle =
    activeVehicles.find((v) => v.id === selectedDriverVehicleId) ||
    activeVehicles.find((v) => v.id === 'AS-01-J-4422') ||
    activeVehicles[0];
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [menuOpen]);

  const roleConfigs: Record<UserRole, {
    title: string;
    roleName: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    path: string;
  }> = {
    driver: {
      title: 'Driver',
      roleName: 'Driver Mode',
      subtitle: currentDriverVehicle
        ? `${currentDriverVehicle.driverName} · ${currentDriverVehicle.id}`
        : 'Arjun Baruah · AS-01-J-4422',
      description: 'Turn-by-turn navigation, mountain landslide bypass & hazard reporting',
      icon: <Truck className="w-4 h-4" />,
      color: 'bg-blue-600 text-white',
      path: '/driver',
    },
    dispatcher: {
      title: 'Dispatcher',
      roleName: 'Fleet Operations',
      subtitle: `${activeVehicles.length} Transports on Grid`,
      description: 'Live GPS fleet radar, reactive rerouting & incident command',
      icon: <Activity className="w-4 h-4" />,
      color: 'bg-orange-600 text-white',
      path: '/dispatcher',
    },
    sdma: {
      title: 'Disaster Team',
      roleName: 'SDMA Authority',
      subtitle: 'Disaster Management Unit',
      description: 'Highway hazard verification, road closures & risk zoning',
      icon: <ShieldCheck className="w-4 h-4" />,
      color: 'bg-emerald-600 text-white',
      path: '/sdma',
    },
    contractor: {
      title: 'Supply Godown',
      roleName: 'Contractor Storage',
      subtitle: 'Regional Relief Godowns',
      description: 'Emergency buffer intake, cold storage & ration reservation',
      icon: <Warehouse className="w-4 h-4" />,
      color: 'bg-purple-600 text-white',
      path: '/contractor',
    },
  };

  const currentWorkspace = roleConfigs[role] || roleConfigs.driver;

  const affectedCount = activeVehicles.filter(
    (v) => Boolean(v.affectedByDisruptionId) && v.rerouteStatus !== 'active' && v.status !== 'emergency_pickup'
  ).length;

  const handleNetworkToggle = () => {
    if (networkStatus === 'online') {
      setNetworkStatus('offline');
    } else if (networkStatus === 'offline') {
      setNetworkStatus('syncing');
      setTimeout(() => {
        setNetworkStatus('online');
      }, 1000);
    } else {
      setNetworkStatus('online');
    }
  };

  const handleSelectRole = (r: UserRole, targetPath: string) => {
    setRole(r);
    setMenuOpen(false);
    navigate(targetPath);
  };

  return (
    <header
      className={cn(
        'relative z-40 h-16 bg-white border-b border-[#e5e5e4] flex items-center px-4 md:px-5 gap-3 shrink-0 select-none shadow-xs',
        className
      )}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="text-[#52525b] hover:text-[#18181b] transition-colors p-2 rounded-xl hover:bg-[#f4f4f5] cursor-pointer"
        aria-label="Toggle navigation menu"
        title="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Brand Identity */}
      <div
        onClick={() => navigate('/driver')}
        className="flex items-center gap-2.5 mr-2 cursor-pointer"
      >
        <div className="w-8 h-8 bg-[#18181b] rounded-xl flex items-center justify-center shadow-xs text-white">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-[#18181b] tracking-tight block leading-tight">
            NER-LOGIX
          </span>
          <span className="text-[11px] text-[#71717a] font-semibold">
            North East Highway Grid
          </span>
        </div>
      </div>

      {/* Desktop Quick Role Switcher Tabs */}
      <div className="hidden md:flex items-center bg-[#f4f4f5] p-1 rounded-xl border border-[#e4e4e7]">
        {(Object.keys(roleConfigs) as UserRole[]).map((roleKey) => {
          const item = roleConfigs[roleKey];
          const isSelected = role === roleKey;
          return (
            <button
              key={roleKey}
              onClick={() => handleSelectRole(roleKey, item.path)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none',
                isSelected
                  ? `${item.color} shadow-xs`
                  : 'text-[#52525b] hover:text-[#18181b] hover:bg-white/80'
              )}
            >
              {item.icon}
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Workspace Dropdown */}
      <div className="md:hidden relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold shadow-xs cursor-pointer"
        >
          {currentWorkspace.icon}
          <span>{currentWorkspace.title}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 opacity-70 transition-transform', menuOpen && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              role="menu"
              className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl border border-[#e5e5e4] shadow-xl p-2 z-50 space-y-1"
            >
              {(Object.keys(roleConfigs) as UserRole[]).map((roleKey) => {
                const item = roleConfigs[roleKey];
                const isSelected = role === roleKey;
                return (
                  <button
                    key={roleKey}
                    role="menuitem"
                    onClick={() => handleSelectRole(roleKey, item.path)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left font-semibold text-xs cursor-pointer transition-colors',
                      isSelected ? 'bg-[#f4f4f5] text-[#18181b]' : 'hover:bg-[#fafafa] text-[#52525b]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded-lg', isSelected ? item.color : 'bg-[#f4f4f5] text-[#71717a]')}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-bold text-[#18181b]">{item.roleName}</p>
                        <p className="text-[11px] text-[#71717a] font-normal">{item.title}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Driver Workspace Vehicle Selector */}
      {role === 'driver' && (
        <div className="hidden xl:flex items-center gap-2">
          <div className="h-4 w-px bg-[#e5e5e4]" />
          <DriverVehicleSelector id="topbar-driver-vehicle-selector" />
        </div>
      )}

      <div className="flex-1" />

      {/* Right Tools: Hazard Alert & Network Status */}
      <div className="flex items-center gap-2 md:gap-3">
        {affectedCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{affectedCount} Hazard{affectedCount > 1 ? 's' : ''} on Highway</span>
          </div>
        )}

        <NetworkIndicator status={networkStatus} onToggle={handleNetworkToggle} />
      </div>
    </header>
  );
}

