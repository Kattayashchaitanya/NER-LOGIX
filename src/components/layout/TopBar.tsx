import { cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { Wifi, WifiOff, RefreshCw, ChevronRight } from 'lucide-react';
import type { NetworkStatus } from '@/types';

function NetworkIndicator({ status }: { status: NetworkStatus }) {
  const config = {
    online: { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Online', color: 'text-[#16a34a]' },
    offline: { icon: <WifiOff className="w-3.5 h-3.5" />, label: 'Offline', color: 'text-[#dc2626]' },
    syncing: { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Syncing', color: 'text-[#d97706]' },
  };
  const cfg = config[status];
  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', cfg.color)}>
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

interface TopBarProps {
  className?: string;
}

const roleLabels = {
  driver: 'Driver View',
  dispatcher: 'Dispatcher View',
  sdma: 'SDMA View',
};

export function TopBar({ className }: TopBarProps) {
  const { role, networkStatus, toggleSidebar } = useAppStore();

  return (
    <header
      className={cn(
        'h-12 bg-white border-b border-[#e4e4e3] flex items-center px-4 gap-4 shrink-0',
        'shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="text-[#8a8a87] hover:text-[#1a1a19] transition-colors p-1"
        aria-label="Toggle sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-[#1a1a19] rounded flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-[#1a1a19] tracking-tight">NER-LOGIX</span>
          <span className="hidden sm:inline text-[11px] text-[#8a8a87] ml-2">Logistics Intelligence Platform</span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="hidden md:flex items-center gap-1 text-xs text-[#8a8a87] ml-2">
        <ChevronRight className="w-3 h-3" />
        <span>{roleLabels[role]}</span>
      </div>

      <div className="flex-1" />

      {/* System indicators */}
      <div className="flex items-center gap-4 divide-x divide-[#e4e4e3]">
        <AnimatePresence mode="wait">
          <motion.div
            key={networkStatus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <NetworkIndicator status={networkStatus} />
          </motion.div>
        </AnimatePresence>

        <div className="pl-4 text-xs text-[#8a8a87]">
          NE Region — {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
