import { cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import {
  LayoutDashboard,
  Map,
  Route,
  Navigation,
  AlertTriangle,
  Truck,
  ShieldCheck,
  FileCheck,
  Activity,
  Package,
  TrendingUp,
} from 'lucide-react';
import type { UserRole } from '@/types';
import { RoleSwitcher } from './RoleSwitcher';
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: Record<UserRole, NavItem[]> = {
  driver: [
    { to: '/driver', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/driver/trip', label: 'Trip Planner', icon: <Route className="w-4 h-4" /> },
    { to: '/driver/navigation', label: 'Navigation', icon: <Navigation className="w-4 h-4" /> },
    { to: '/driver/report', label: 'Report Hazard', icon: <AlertTriangle className="w-4 h-4" /> },
  ],
  dispatcher: [
    { to: '/dispatcher', label: 'Operations', icon: <Activity className="w-4 h-4" /> },
    { to: '/dispatcher/fleet', label: 'Fleet', icon: <Truck className="w-4 h-4" /> },
    { to: '/dispatcher/incidents', label: 'Incidents', icon: <AlertTriangle className="w-4 h-4" />, badge: '3' },
    { to: '/dispatcher/map', label: 'Regional Map', icon: <Map className="w-4 h-4" /> },
  ],
  sdma: [
    { to: '/sdma', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/sdma/incidents', label: 'Verification Queue', icon: <FileCheck className="w-4 h-4" />, badge: '2' },
    { to: '/sdma/roads', label: 'Road Status', icon: <Package className="w-4 h-4" /> },
    { to: '/sdma/map', label: 'Accessibility Map', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/sdma/connectivity', label: 'Connectivity Intel', icon: <TrendingUp className="w-4 h-4" /> },
  ],
};

const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  driver: { label: 'Driver', color: 'text-[#1e40af]', bg: 'bg-[#eff6ff]' },
  dispatcher: { label: 'Dispatcher', color: 'text-[#9a3412]', bg: 'bg-[#fff7ed]' },
  sdma: { label: 'Govt / SDMA', color: 'text-[#166534]', bg: 'bg-[#f0fdf4]' },
};

export function Sidebar() {
  const { role, sidebarCollapsed } = useAppStore();
  const location = useLocation();
  const items = navItems[role];
  const rc = roleConfig[role];

  return (
    <AnimatePresence initial={false}>
      {!sidebarCollapsed && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white border-r border-[#e4e4e3] flex flex-col shrink-0 overflow-hidden"
          style={{ width: 220 }}
        >
          {/* Role switcher */}
          <div className="px-3 py-3 border-b border-[#e4e4e3]">
            <RoleSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {items.map((item) => {
              const isActive =
                item.to === `/${role}` || item.to === `/${role}/`
                  ? location.pathname === item.to || location.pathname === `/${role}/`
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === `/${role}` || item.to === `/${role}/`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 mx-2 rounded text-sm transition-colors duration-100',
                    isActive
                      ? 'bg-[#eff6ff] text-[#1e40af] font-medium'
                      : 'text-[#5a5a57] hover:bg-[#f5f5f4] hover:text-[#1a1a19]',
                  )}
                >
                  <span className={isActive ? 'text-[#2563eb]' : 'text-[#8a8a87]'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[#dc2626] text-white text-[10px] font-bold leading-none">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom info */}
          <div className="px-4 py-3 border-t border-[#e4e4e3]">
            <p className="text-[10px] text-[#8a8a87] leading-relaxed">
              NER-LOGIX v1.0
              <br />
              SIH 2026 Prototype
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
