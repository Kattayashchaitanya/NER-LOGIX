import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useNetworkStore } from '@/store/networkStore';
import { DEMO_CORRIDORS } from '@/data/demo';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { MapContainer } from '@/components/map/MapContainer';
import { DEMO_ROUTES } from '@/data/demo';
import { formatTimeAgo, getIncidentTypeLabel } from '@/utils';
import {
  Activity,
  AlertTriangle,
  Truck,
  Wifi,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  },
};

export function RootPage() {
  const navigate = useNavigate();
  const { setRole } = useAppStore();

  const activeIncidents = useNetworkStore((s) => s.activeIncidents);
  const roadSegments = useNetworkStore((s) => s.roadSegments);
  const activeVehicles = useNetworkStore((s) => s.activeVehicles);
  const disruptions = useNetworkStore((s) => s.disruptions);

  // Derived Operational Metrics
  const activeTrips = useMemo(
    () => activeVehicles.filter((v) => v.status === 'on_route' || v.status === 'emergency_pickup').length,
    [activeVehicles]
  );

  const blockedRoads = useMemo(
    () => roadSegments.filter((r) => r.status === 'blocked'),
    [roadSegments]
  );

  const pendingVerifications = useMemo(
    () => activeIncidents.filter((i) => i.syncStatus === 'pending_verification' || i.syncStatus === 'synced').length,
    [activeIncidents]
  );

  const regionalRisk = useMemo(() => {
    if (blockedRoads.length > 0 || disruptions.length > 0) return 'high';
    if (activeIncidents.length > 0) return 'moderate';
    return 'low';
  }, [blockedRoads, disruptions, activeIncidents]);

  const vehiclesSafe = useMemo(
    () => activeVehicles.filter((v) => v.riskLevel === 'low' && !v.affectedByDisruptionId).length,
    [activeVehicles]
  );

  const vehiclesModerate = useMemo(
    () => activeVehicles.filter((v) => v.riskLevel === 'moderate' && !v.affectedByDisruptionId).length,
    [activeVehicles]
  );

  const vehiclesHighRisk = useMemo(
    () => activeVehicles.filter((v) => v.riskLevel === 'high' || v.riskLevel === 'blocked' || Boolean(v.affectedByDisruptionId)).length,
    [activeVehicles]
  );

  const totalFleet = activeVehicles.length || 1;

  // Dynamic corridor cards
  const dynamicCorridors = useMemo(() => {
    return DEMO_CORRIDORS.map((c) => {
      const corridorVehicles = activeVehicles.filter((v) => v.assignedCorridorId === c.id);
      const corridorIncidents = activeIncidents.filter((i) => {
        if (c.id === 'cor-001') {
          return i.locationName.includes('Mao') || i.locationName.includes('Senapati') || i.affectedRouteId === 'route-b';
        }
        if (c.id === 'cor-002') {
          return i.locationName.includes('Wokha') || i.locationName.includes('Doyyang') || i.affectedRouteId === 'route-a';
        }
        return false;
      });

      const hasBlockage = roadSegments.some((r) => {
        if (c.id === 'cor-001' && (r.id === 'rd-001' || r.id === 'rd-005')) return r.status === 'blocked';
        if (c.id === 'cor-002' && (r.id === 'rd-002' || r.id === 'rd-003')) return r.status === 'blocked';
        return false;
      });

      const level = hasBlockage
        ? 'blocked'
        : corridorIncidents.length > 0
        ? 'moderate'
        : 'low';

      return {
        ...c,
        activeVehicles: corridorVehicles.length,
        incidents: corridorIncidents.length,
        riskLevel: level as 'low' | 'moderate' | 'high' | 'blocked',
      };
    });
  }, [activeVehicles, activeIncidents, roadSegments]);

  const handleNavigate = (role: 'driver' | 'dispatcher' | 'sdma', path: string) => {
    setRole(role);
    navigate(path);
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top metrics bar */}
        <div className="px-6 py-4 border-b border-[#e4e4e7] bg-white">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h1 className="text-base font-bold text-[#18181b]">Regional Corridor Overview</h1>
              <p className="text-xs text-[#71717a] font-medium">North Eastern Region — Live Operations & Road Safety Snapshot</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              All Systems Nominal
            </div>
          </div>
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-3.5"
          >
            <motion.div variants={stagger.item}>
              <MetricCard
                label="Active Transports"
                value={activeTrips}
                subtext="En route in NE Region"
                icon={<Truck className="w-5 h-5 text-blue-600" />}
              />
            </motion.div>
            <motion.div variants={stagger.item}>
              <MetricCard
                label="Corridor Risk Status"
                value={regionalRisk === 'high' ? 'High Risk' : regionalRisk === 'moderate' ? 'Moderate Risk' : 'Nominal (Safe)'}
                subtext={blockedRoads.length > 0 ? `${blockedRoads.length} corridor blocked` : 'All passes open'}
                riskLevel={regionalRisk}
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </motion.div>
            <motion.div variants={stagger.item}>
              <MetricCard
                label="Active Hazards"
                value={activeIncidents.length.toString().padStart(2, '0')}
                subtext={pendingVerifications > 0 ? `${pendingVerifications} in SDMA verification` : 'Zero active blockages'}
                riskLevel={activeIncidents.length > 0 ? 'high' : 'low'}
                icon={<AlertTriangle className="w-5 h-5" />}
              />
            </motion.div>
            <motion.div variants={stagger.item}>
              <MetricCard
                label="Network Link"
                value="Autonomous"
                subtext="Cloud + Offline Cache"
                riskLevel="low"
                icon={<Wifi className="w-5 h-5 text-emerald-600" />}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Map + panels */}
        <div className="flex-1 flex min-h-0">
          {/* Map */}
          <div className="flex-1 min-w-0">
            <MapContainer
              center={[25.5, 93.0]}
              zoom={7}
              routes={Object.values(DEMO_ROUTES)}
              incidents={activeIncidents}
              vehicles={activeVehicles}
              roadSegments={roadSegments}
            />
          </div>

          {/* Right panel */}
          <div className="w-80 border-l border-[#e4e4e7] bg-white overflow-y-auto flex flex-col shrink-0 divide-y divide-[#e4e4e7]">
            {/* Corridor status */}
            <div className="p-4">
              <h2 className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-3">
                Corridor Status
              </h2>
              <div className="space-y-2">
                {dynamicCorridors.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#18181b]">{c.name}</p>
                      <p className="text-xs text-[#71717a] font-medium">
                        {c.activeVehicles} vehicles · {c.incidents} incident{c.incidents !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <RiskBadge level={c.riskLevel} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Fleet summary */}
            <div className="p-4">
              <h2 className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-3">
                Fleet Safety Distribution
              </h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#52525b] font-medium">Nominal / Safe</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${(vehiclesSafe / totalFleet) * 100}%` }} />
                    </div>
                    <span className="font-bold text-emerald-700 tabular-nums w-5 text-right">{vehiclesSafe}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#52525b] font-medium">Moderate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: `${(vehiclesModerate / totalFleet) * 100}%` }} />
                    </div>
                    <span className="font-bold text-amber-700 tabular-nums w-5 text-right">{vehiclesModerate}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#52525b] font-medium">High Risk / Alert</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-rose-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-600 rounded-full" style={{ width: `${(vehiclesHighRisk / totalFleet) * 100}%` }} />
                    </div>
                    <span className="font-bold text-rose-700 tabular-nums w-5 text-right">{vehiclesHighRisk}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent incidents */}
            <div className="p-4 flex-1">
              <h2 className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-3">
                Verified Incident Queue
              </h2>
              {activeIncidents.length === 0 ? (
                <div className="py-6 text-center text-[#71717a]">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-1.5 opacity-90" />
                  <p className="text-xs font-bold text-[#18181b]">All Corridors Clear</p>
                  <p className="text-xs text-[#71717a] mt-0.5 font-medium">No active road hazards or closures reported.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeIncidents.slice(0, 3).map((inc) => (
                    <div key={inc.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[#18181b]">
                          {getIncidentTypeLabel(inc.type)}
                        </span>
                        <StatusBadge syncStatus={inc.syncStatus} />
                      </div>
                      <p className="text-xs text-[#52525b] font-medium truncate">{inc.locationName}</p>
                      <p className="text-[11px] text-[#71717a] mt-0.5">{formatTimeAgo(inc.reportedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role switcher panel */}
      <div className="w-72 border-l border-[#e4e4e7] bg-[#fafafa] p-5 flex flex-col gap-6 shrink-0">
        <div>
          <h2 className="text-xs font-bold text-[#18181b] uppercase tracking-wider mb-1">
            Operational Workspaces
          </h2>
          <p className="text-xs text-[#71717a] leading-relaxed mb-4 font-medium">
            Select a stakeholder profile to open the dedicated control room.
          </p>
          <RoleSwitcher />
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-bold text-[#71717a] uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Driver Route Planner', sub: 'Predictive safety scores', action: () => handleNavigate('driver', '/driver/trip') },
              { label: 'Fleet Operations Radar', sub: 'Live transport tracking', action: () => handleNavigate('dispatcher', '/dispatcher') },
              { label: 'SDMA Verification Desk', sub: 'Highway hazard triage', action: () => handleNavigate('sdma', '/sdma/incidents') },
            ].map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[#e4e4e7] hover:border-blue-300 hover:shadow-xs transition-all text-left group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-[#18181b]">{qa.label}</p>
                  <p className="text-xs text-[#71717a] font-medium">{qa.sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#71717a] group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* System info */}
        <div className="mt-auto pt-4 border-t border-[#e4e4e7]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#71717a] mb-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Autonomous Grid Status</span>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Dynamic Risk Engine', status: 'Operational' },
              { label: 'IndexedDB Offline Cache', status: 'Synchronized' },
              { label: 'Disaster Authority Link', status: 'Connected' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-[#71717a] font-medium">{s.label}</span>
                <span className="text-emerald-700 font-bold">{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
