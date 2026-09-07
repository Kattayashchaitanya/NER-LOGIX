import { MapContainer } from '@/components/map/MapContainer';
import { DEMO_ROUTES } from '@/data/demo';
import { useNetworkStore, getReactiveDisplayRoute } from '@/store/networkStore';
import { Map } from 'lucide-react';

export function DispatcherMap() {
  const activeVehicles = useNetworkStore((state) => state.activeVehicles);
  const activeIncidents = useNetworkStore((state) => state.activeIncidents);
  const reactiveRoutes = activeVehicles
    .map(getReactiveDisplayRoute)
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-3 bg-white border-b border-[#e4e4e3] flex items-center gap-2">
        <Map className="w-4 h-4 text-[#8a8a87]" />
        <h1 className="text-sm font-semibold text-[#1a1a19]">Regional Map</h1>
      </div>
      <div className="flex-1 min-h-0">
        <MapContainer
          center={[25.5, 93.0]}
          zoom={7}
          routes={[...Object.values(DEMO_ROUTES), ...reactiveRoutes]}
          selectedRouteId={reactiveRoutes[0]?.id}
          incidents={activeIncidents}
          vehicles={activeVehicles}
        />
      </div>
    </div>
  );
}
