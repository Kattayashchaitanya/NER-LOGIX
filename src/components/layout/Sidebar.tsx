import { cn } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useNetworkStore } from '@/store/networkStore';
import { DEMO_DRIVER } from '@/data/demo';
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
  Warehouse,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'danger' | 'warning' | 'info';
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const { role, sidebarCollapsed } = useAppStore();
  const location = useLocation();

  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);

  const pendingVerificationCount = activeIncidents.filter(
    (i) => i.syncStatus === 'pending_verification' || i.syncStatus === 'synced'
  ).length;

  const affectedVehiclesCount = activeVehicles.filter(
    (v) => Boolean(v.affectedByDisruptionId) && v.rerouteStatus !== 'active' && v.status !== 'emergency_pickup'
  ).length;

  const emergencyPickupsCount = activeVehicles.filter(
    (v) => v.status === 'emergency_pickup'
  ).length;

  const driverVehicle = activeVehicles.find((v) => v.id === DEMO_DRIVER.vehicleId);
  const driverHasAlert = Boolean(driverVehicle?.affectedByDisruptionId);

  const roleNavGroups: Record<UserRole, NavGroup[]> = {
    driver: [
      {
        title: 'Journey Operations',
        items: [
          { to: '/driver', label: 'Journey Cockpit', icon: <LayoutDashboard className="w-4 h-4" /> },
          {
            to: '/driver/navigation',
            label: 'Navigation & Route',
            icon: <Navigation className="w-4 h-4" />,
            badge: driverHasAlert ? 'Hazard' : undefined,
            badgeVariant: 'danger',
          },
          { to: '/driver/report', label: 'Report Road Hazard', icon: <AlertTriangle className="w-4 h-4" /> },
        ],
      },
      {
        title: 'Corridor Support',
        items: [
          { to: '/driver/trip', label: 'Trip Planner & Detours', icon: <Route className="w-4 h-4" /> },
        ],
      },
    ],
    dispatcher: [
      {
        title: 'Fleet Command',
        items: [
          { to: '/dispatcher', label: 'Operations Control', icon: <Activity className="w-4 h-4" /> },
          {
            to: '/dispatcher/fleet',
            label: 'Fleet Monitoring',
            icon: <Truck className="w-4 h-4" />,
            badge: affectedVehiclesCount > 0 ? affectedVehiclesCount : undefined,
            badgeVariant: 'danger',
          },
          {
            to: '/dispatcher/incidents',
            label: 'Corridor Incidents',
            icon: <AlertTriangle className="w-4 h-4" />,
            badge: activeIncidents.length > 0 ? activeIncidents.length : undefined,
            badgeVariant: 'warning',
          },
        ],
      },
      {
        title: 'Spatial Intelligence',
        items: [
          { to: '/dispatcher/map', label: 'Corridor GIS Map', icon: <Map className="w-4 h-4" /> },
        ],
      },
    ],
    sdma: [
      {
        title: 'Disaster Intelligence',
        items: [
          { to: '/sdma', label: 'Accessibility Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
          {
            to: '/sdma/incidents',
            label: 'Verification Queue',
            icon: <FileCheck className="w-4 h-4" />,
            badge: pendingVerificationCount > 0 ? pendingVerificationCount : undefined,
            badgeVariant: 'warning',
          },
          { to: '/sdma/roads', label: 'Road Status Registry', icon: <Package className="w-4 h-4" /> },
        ],
      },
      {
        title: 'Corridor Analysis',
        items: [
          { to: '/sdma/connectivity', label: 'Connectivity Intel', icon: <TrendingUp className="w-4 h-4" /> },
          { to: '/sdma/map', label: 'Regional Hazard GIS', icon: <ShieldCheck className="w-4 h-4" /> },
        ],
      },
    ],
    contractor: [
      {
        title: 'Emergency Logistics',
        items: [
          {
            to: '/contractor',
            label: 'Supply Operations',
            icon: <Warehouse className="w-4 h-4" />,
            badge: emergencyPickupsCount > 0 ? emergencyPickupsCount : undefined,
            badgeVariant: 'warning',
          },
        ],
      },
    ],
  };

  const navGroups = roleNavGroups[role] || roleNavGroups.driver;

  const roleMeta: Record<UserRole, { label: string; sub: string; tag: string }> = {
    driver: {
      label: DEMO_DRIVER.name,
      sub: `${DEMO_DRIVER.vehicleId} · Assam–Manipur`,
      tag: 'Field Operator',
    },
    dispatcher: {
      label: 'Regional Dispatch Desk',
      sub: `${activeVehicles.length} Transports Monitored`,
      tag: 'Fleet Control',
    },
    sdma: {
      label: 'SDMA Regional Authority',
      sub: 'Hazard Verification Unit',
      tag: 'Govt Intel',
    },
    contractor: {
      label: 'Buffer Storage Partner',
      sub: 'Relief Consignment Nodes',
      tag: 'Supply Contractor',
    },
  };

  const currentMeta = roleMeta[role];

  return (
    <AnimatePresence initial={false}>
      {!sidebarCollapsed && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 232, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          className="bg-white border-r border-[#e4e4e3] flex flex-col shrink-0 overflow-hidden z-30 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]"
          style={{ width: 232 }}
        >
          {/* Role Header Indicator */}
          <div className="px-4 py-3.5 border-b border-[#e5e5e4] bg-[#fafafa]">
            <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-wider">
              {currentMeta.tag}
            </span>
            <p className="text-xs font-bold text-[#18181b] truncate mt-0.5">
              {currentMeta.label}
            </p>
            <p className="text-[11px] text-[#71717a] truncate font-medium">
              {currentMeta.sub}
            </p>
          </div>

          {/* Grouped Navigation */}
          <nav className="flex-1 py-3 px-2.5 overflow-y-auto space-y-4">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider">
                  {group.title}
                </p>

                <div className="space-y-0.5">
                  {group.items.map((item) => {
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
                          'group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none',
                          isActive
                            ? role === 'driver'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                              : role === 'dispatcher'
                                ? 'bg-orange-50 text-orange-950 border border-orange-200 shadow-2xs'
                                : role === 'sdma'
                                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 shadow-2xs'
                                  : 'bg-purple-50 text-purple-950 border border-purple-200 shadow-2xs'
                            : 'text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#18181b]'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              'shrink-0 transition-colors',
                              isActive
                                ? role === 'driver'
                                  ? 'text-blue-700'
                                  : role === 'dispatcher'
                                    ? 'text-orange-700'
                                    : role === 'sdma'
                                      ? 'text-emerald-700'
                                      : 'text-purple-700'
                                : 'text-[#71717a] group-hover:text-[#18181b]'
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge !== undefined && (
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none shrink-0 ml-1.5 shadow-2xs',
                              item.badgeVariant === 'danger'
                                ? 'bg-rose-600 text-white'
                                : item.badgeVariant === 'warning'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Clean Bottom Status */}
          <div className="px-3.5 py-2.5 border-t border-[#e5e5e4] bg-[#fafafa] flex items-center justify-between text-[11px]">
            <span className="text-[#71717a]">Corridor Grid</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Online
            </span>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
