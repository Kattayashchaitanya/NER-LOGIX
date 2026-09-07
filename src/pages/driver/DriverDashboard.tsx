import { motion } from 'framer-motion';
import { DEMO_DRIVER, DEMO_TRIP, DEMO_METRICS } from '@/data/demo';
import { MetricCard } from '@/components/ui/MetricCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { MapContainer } from '@/components/map/MapContainer';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import {
  Truck,
  MapPin,
  Package,
  Thermometer,
  Clock,
  Navigation,
  AlertTriangle,
  Signal,
  Route,
} from 'lucide-react';

export function DriverDashboard() {
  const navigate = useNavigate();
  const { activeTripId, isJourneyActive } = useAppStore();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#e4e4e3]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-base font-semibold text-[#1a1a19]">Driver Overview</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-[#8a8a87]" />
              <span className="text-xs text-[#8a8a87]">
                {DEMO_DRIVER.name} · {DEMO_DRIVER.vehicleId} · {DEMO_DRIVER.vehicleType}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isJourneyActive ? (
              <StatusBadge label="Journey Active" variant="success" pulse />
            ) : (
              <StatusBadge label={activeTripId ? `Trip ${activeTripId} Planned` : "No Active Trip"} variant="neutral" />
            )}
            <Button
              size="sm"
              variant={isJourneyActive ? "primary" : "outline"}
              onClick={() => navigate(isJourneyActive ? '/driver/navigation' : '/driver/trip')}
              iconLeft={isJourneyActive ? <Navigation className="w-3.5 h-3.5" /> : <Route className="w-3.5 h-3.5" />}
            >
              {isJourneyActive ? 'Resume Navigation' : 'Plan Trip'}
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <MetricCard label="Network" value="Online" riskLevel="low" icon={<Signal className="w-4 h-4" />} />
          <MetricCard label="Regional Risk" value="Moderate" riskLevel="moderate" icon={<AlertTriangle className="w-4 h-4" />} />
          <MetricCard label="Active Incidents" value={`0${DEMO_METRICS.activeIncidents}`} subtext="In your corridor" riskLevel="high" />
          <MetricCard label="Pending Reports" value="0" subtext="No unsent reports" riskLevel="low" />
        </div>
      </div>

      {/* Map + sidebar */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1">
          <MapContainer
            center={[25.8, 93.2]}
            zoom={7}
          />
        </div>

        {/* Driver info panel */}
        <div className="w-72 border-l border-[#e4e4e3] bg-white overflow-y-auto shrink-0">
          {/* Trip info */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide mb-3">
              Demo Trip
            </h2>

            <div className="space-y-3">
              {/* Origin */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-white">A</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1a1a19]">{DEMO_TRIP.origin.name}</p>
                  <p className="text-[10px] text-[#8a8a87]">{DEMO_TRIP.origin.district}, {DEMO_TRIP.origin.state}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pl-[9px]">
                <div className="w-px h-6 bg-[#e4e4e3]" />
              </div>

              {/* Destination */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#dc2626] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-white">B</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#1a1a19]">{DEMO_TRIP.destination.name}</p>
                  <p className="text-[10px] text-[#8a8a87]">{DEMO_TRIP.destination.district}, {DEMO_TRIP.destination.state}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cargo info */}
          <div className="px-4 py-3 border-b border-[#e4e4e3]">
            <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide mb-3">
              Cargo
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#8a8a87]" />
                <span className="text-xs text-[#1a1a19]">{DEMO_TRIP.cargo.type}</span>
              </div>
              {DEMO_TRIP.cargo.temperatureControlled && (
                <div className="flex items-center gap-2">
                  <Thermometer className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span className="text-xs text-[#2563eb]">Temperature Controlled</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#8a8a87]">Priority:</span>
                <StatusBadge label="Critical" variant="danger" />
              </div>
              {DEMO_TRIP.cargo.weight && (
                <div className="text-[11px] text-[#8a8a87]">Weight: {DEMO_TRIP.cargo.weight}</div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="px-4 py-3">
            <h2 className="text-xs font-semibold text-[#1a1a19] uppercase tracking-wide mb-3">
              Actions
            </h2>
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full"
                size="sm"
                onClick={() => navigate('/driver/trip')}
                iconLeft={<MapPin className="w-3.5 h-3.5" />}
              >
                Start Trip Planning
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => navigate('/driver/navigation')}
                iconLeft={<Navigation className="w-3.5 h-3.5" />}
              >
                Navigation Mode
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                size="sm"
                onClick={() => navigate('/driver/report')}
                iconLeft={<AlertTriangle className="w-3.5 h-3.5" />}
              >
                Report Hazard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
