import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { cn } from '@/utils';
import { getRiskColor } from '@/utils';
import type { Route, Incident, Vehicle } from '@/types';

// Fix Leaflet default icon path issue with Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapContainerProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  routes?: Route[];
  selectedRouteId?: string;
  incidents?: Incident[];
  vehicles?: Vehicle[];
  originMarker?: { latlng: [number, number]; label: string };
  destinationMarker?: { latlng: [number, number]; label: string };
}

function createIncidentIcon(severity: string) {
  const colors: Record<string, string> = {
    low: '#16a34a',
    moderate: '#d97706',
    high: '#dc2626',
    critical: '#7f1d1d',
  };
  const color = colors[severity] ?? '#dc2626';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:24px;height:24px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function createVehicleIcon(riskLevel: string) {
  const colors: Record<string, string> = {
    low: '#16a34a',
    moderate: '#d97706',
    high: '#dc2626',
    blocked: '#7f1d1d',
  };
  const color = colors[riskLevel] ?? '#2563eb';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;
      background:${color};
      border:2px solid white;
      border-radius:4px;
      box-shadow:0 2px 6px rgba(0,0,0,0.2);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0">
        <rect x="1" y="3" width="15" height="13" rx="2"/>
        <path d="M16 8l4 3v5h-4V8z"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

function createPointIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      border:2px solid white;
      border-radius:50% 50% 50% 0;
      width:28px;height:28px;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">
      <div style="
        transform:rotate(45deg);
        color:white;font-size:9px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        width:100%;height:100%;font-family:Inter,sans-serif;
      ">${label}</div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

export function MapContainer({
  className,
  center = [25.5, 93.0],
  zoom = 7,
  routes = [],
  selectedRouteId,
  incidents = [],
  vehicles = [],
  originMarker,
  destinationMarker,
}: MapContainerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const map = L.map(divRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-draw overlays when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old layers
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    // Draw routes
    routes.forEach((route) => {
      const isReactive = route.id.startsWith('reactive-');
      const isSelected = route.id === selectedRouteId;
      const color = isReactive ? '#2563eb' : getRiskColor(route.riskLevel);
      const opacity = isSelected ? 1 : selectedRouteId ? 0.35 : 0.75;
      const weight = isReactive || isSelected ? 5 : 3;

      const line = L.polyline(route.waypoints, {
        color,
        weight,
        opacity,
        dashArray: isReactive ? undefined : route.recommended ? undefined : '8 4',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      line.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:13px;">
          <strong>${route.label}</strong><br/>
          Risk: ${route.riskScore}/100 &bull; ETA: ${Math.floor(route.etaMinutes / 60)}h ${route.etaMinutes % 60}m
        </div>`,
        { maxWidth: 220 },
      );

      layersRef.current.push(line);
    });

    // Draw incidents
    incidents.forEach((inc) => {
      const icon = createIncidentIcon(inc.severity);
      const marker = L.marker(inc.location, { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:12px;">
          <strong style="font-size:13px;">${inc.id}</strong><br/>
          <span style="text-transform:capitalize;">${inc.type.replace('_', ' ')}</span> — ${inc.severity.toUpperCase()}<br/>
          <span style="color:#6b7280;">${inc.locationName}</span>
        </div>`,
        { maxWidth: 240 },
      );
      layersRef.current.push(marker);
    });

    // Draw vehicles
    vehicles.forEach((v) => {
      const icon = createVehicleIcon(v.riskLevel);
      const marker = L.marker(v.location, { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:12px;">
          <strong>${v.id}</strong><br/>
          ${v.driverName} &bull; ${v.type}<br/>
          <span style="text-transform:capitalize;color:${v.status === 'emergency_pickup' ? '#c2410c;font-weight:600' : v.rerouteStatus === 'active' ? '#2563eb;font-weight:600' : v.affectedByDisruptionId ? '#dc2626;font-weight:600' : '#6b7280'};">
            ${v.status === 'emergency_pickup' ? 'EMERGENCY PICKUP' : v.rerouteStatus === 'active' ? 'REROUTED FROM CURRENT POSITION' : v.affectedByDisruptionId ? '⚠️ AFFECTED BY DISRUPTION' : v.status.replace('_', ' ')}
          </span>
          ${v.rerouteStatus === 'active' && v.rerouteFromLabel ? `<br/><span style="color:#1d4ed8;font-size:10px;font-weight:500;">${v.rerouteFromLabel} → ${v.rerouteTo || v.destination || ''}</span>` : ''}
          ${v.rerouteStatus === 'no_alternative' ? `<br/><span style="color:#dc2626;font-size:10px;font-weight:500;">No alternate route from current position</span>` : ''}
          ${v.impactReason ? `<br/><span style="color:#dc2626;font-size:10px;font-weight:500;">${v.impactReason}</span>` : ''}
          ${v.cargoType ? `<br/><span style="color:#4b5563;font-size:10px;">📦 ${v.cargoType}</span>` : ''}
        </div>`,
        { maxWidth: 220 },
      );
      layersRef.current.push(marker);
    });

    // Origin / destination markers
    if (originMarker) {
      const m = L.marker(originMarker.latlng, {
        icon: createPointIcon('#2563eb', 'A'),
      }).addTo(map);
      m.bindPopup(`<strong>${originMarker.label}</strong>`);
      layersRef.current.push(m);
    }

    if (destinationMarker) {
      const m = L.marker(destinationMarker.latlng, {
        icon: createPointIcon('#dc2626', 'B'),
      }).addTo(map);
      m.bindPopup(`<strong>${destinationMarker.label}</strong>`);
      layersRef.current.push(m);
    }
  }, [routes, selectedRouteId, incidents, vehicles, originMarker, destinationMarker]);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <div ref={divRef} className="w-full h-full" />
    </div>
  );
}
