import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RootPage } from '@/pages/RootPage';

// Driver Pages
import { DriverDashboard } from '@/pages/driver/DriverDashboard';
import { TripPlanner } from '@/pages/driver/TripPlanner';
import { NavigationView } from '@/pages/driver/NavigationView';
import { HazardReport } from '@/pages/driver/HazardReport';

// Dispatcher Pages
import { DispatcherOps } from '@/pages/dispatcher/DispatcherOps';
import { DispatcherFleet } from '@/pages/dispatcher/DispatcherFleet';
import { DispatcherIncidents } from '@/pages/dispatcher/DispatcherIncidents';
import { DispatcherMap } from '@/pages/dispatcher/DispatcherMap';

// SDMA Pages
import { SDMADashboard } from '@/pages/sdma/SDMADashboard';
import { SDMAIncidents } from '@/pages/sdma/SDMAIncidents';
import { SDMARoads } from '@/pages/sdma/SDMARoads';
import { SDMAMap } from '@/pages/sdma/SDMAMap';
import { SDMAConnectivity } from '@/pages/sdma/SDMAConnectivity';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootPage />} />
        
        <Route element={<AppShell />}>
          {/* Driver Routes */}
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/trip" element={<TripPlanner />} />
          <Route path="/driver/navigation" element={<NavigationView />} />
          <Route path="/driver/report" element={<HazardReport />} />
          
          {/* Dispatcher Routes */}
          <Route path="/dispatcher" element={<DispatcherOps />} />
          <Route path="/dispatcher/fleet" element={<DispatcherFleet />} />
          <Route path="/dispatcher/incidents" element={<DispatcherIncidents />} />
          <Route path="/dispatcher/map" element={<DispatcherMap />} />
          
          {/* SDMA Routes */}
          <Route path="/sdma" element={<SDMADashboard />} />
          <Route path="/sdma/incidents" element={<SDMAIncidents />} />
          <Route path="/sdma/roads" element={<SDMARoads />} />
          <Route path="/sdma/map" element={<SDMAMap />} />
          <Route path="/sdma/connectivity" element={<SDMAConnectivity />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
