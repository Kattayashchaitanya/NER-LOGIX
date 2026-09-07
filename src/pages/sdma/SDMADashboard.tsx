import { motion } from 'framer-motion';
import { MapContainer } from '@/components/map/MapContainer';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_INCIDENTS, DEMO_ROAD_SEGMENTS, DEMO_METRICS, DEMO_CORRIDORS } from '@/data/demo';
import { formatTimeAgo, getIncidentTypeLabel } from '@/utils';
import { ShieldCheck, AlertTriangle, Map, FileCheck, Activity } from 'lucide-react';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.04 } } },
  item: { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0, transition: { duration: 0.18 } } },
};

const roadStatusConfig = {
  open: { label: 'Open', color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]' },
  caution: { label: 'Caution', color: 'text-[#d97706]', bg: 'bg-[#fffbeb]' },
  high_risk: { label: 'High Risk', color: 'text-[#dc2626]', bg: 'bg-[#fef2f2]' },
  blocked: { label: 'Blocked', color: 'text-[#7f1d1d]', bg: 'bg-[#fef2f2]' },
};

export function SDMADashboard() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#e4e4e3]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
              <h1 className="text-base font-semibold text-[#1a1a19]">SDMA — Regional Accessibility Dashboard</h1>
            </div>
            <p className="text-xs text-[#8a8a87]">State Disaster Management Authority · North Eastern Region</p>
          </div>
          <StatusBadge label="Authority Access" variant="success" />
        </div>

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <motion.div variants={stagger.item}>
            <MetricCard label="Pending Verification" value={`0${DEMO_METRICS.pendingVerifications}`} riskLevel="moderate" icon={<FileCheck className="w-4 h-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <MetricCard label="Active Incidents" value={`0${DEMO_METRICS.activeIncidents}`} riskLevel="high" icon={<AlertTriangle className="w-4 h-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <MetricCard label="Roads Blocked" value="02" riskLevel="high" icon={<Map className="w-4 h-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <MetricCard label="Regional Risk" value="Moderate" riskLevel="moderate" icon={<Activity className="w-4 h-4" />} />
          </motion.div>
        </motion.div>
      </div>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0">
          <MapContainer
            center={[25.5, 93.0]}
            zoom={7}
            incidents={DEMO_INCIDENTS}
            vehicles={[]}
          />
        </div>

        {/* Right panel */}
        <div className="w-80 border-l border-[#e4e4e3] bg-white overflow-y-auto shrink-0 flex flex-col">
          {/* Road segments */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide mb-3">Road Segment Status</h2>
            <div className="space-y-2.5">
              {DEMO_ROAD_SEGMENTS.map((seg) => {
                const cfg = roadStatusConfig[seg.status];
                return (
                  <div key={seg.id} className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#1a1a19] truncate">{seg.name}</p>
                      <p className="text-[10px] text-[#8a8a87]">{seg.fromLocation} → {seg.toLocation}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${cfg.color} ${cfg.bg} shrink-0 ml-2`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Corridor risk */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide mb-3">Corridor Risk</h2>
            <div className="space-y-2">
              {DEMO_CORRIDORS.map((c) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#1a1a19]">{c.name}</p>
                    <p className="text-[10px] text-[#8a8a87]">{c.incidents} incidents</p>
                  </div>
                  <RiskBadge level={c.riskLevel} size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Incident summary */}
          <div className="px-4 py-3 flex-1">
            <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide mb-3">Incident Queue</h2>
            <div className="space-y-3">
              {DEMO_INCIDENTS.map((inc) => (
                <div key={inc.id} className="pb-3 border-b border-[#f4f4f3] last:border-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-[#1a1a19]">{inc.id}</span>
                    <StatusBadge syncStatus={inc.syncStatus} />
                  </div>
                  <p className="text-xs text-[#5a5a57]">{getIncidentTypeLabel(inc.type)}</p>
                  <p className="text-[10px] text-[#8a8a87] truncate">{inc.locationName}</p>
                  <p className="text-[10px] text-[#c4c4c2]">{formatTimeAgo(inc.reportedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
