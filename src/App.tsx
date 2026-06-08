import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddCapabilityWizard from './pages/AddCapabilityWizard';
import CapabilityDetails from './pages/CapabilityDetails';
import TriggerCapability from './pages/TriggerCapability';
import MetricsDashboard from './pages/MetricsDashboard';

type Page =
  | { name: 'dashboard' }
  | { name: 'add' }
  | { name: 'details'; id: string }
  | { name: 'trigger'; id: string }
  | { name: 'metrics'; id?: string };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'dashboard' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // A counter bumped whenever metrics are updated externally; Dashboard subscribes to re-fetch.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMetricsUpdated = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const isAdd = page.name === 'add';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isAdd && (
        <Sidebar
          currentPage="dashboard"
          onNavigate={() => setPage({ name: 'dashboard' })}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      <main
        className={`flex-1 transition-all duration-300 ${isAdd ? '' : sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
        style={{ minWidth: 0 }}
      >
        {page.name === 'dashboard' && (
          <Dashboard
            key={refreshKey}
            onAddCapability={() => setPage({ name: 'add' })}
            onViewCapability={id => setPage({ name: 'details', id })}
            onTriggerCapability={id => setPage({ name: 'trigger', id })}
            onMetricsCapability={id => setPage({ name: 'metrics', id })}
          />
        )}

        {page.name === 'add' && (
          <AddCapabilityWizard
            onComplete={() => setPage({ name: 'dashboard' })}
            onCancel={() => setPage({ name: 'dashboard' })}
          />
        )}

        {page.name === 'details' && (
          <CapabilityDetails
            capabilityId={page.id}
            onBack={() => setPage({ name: 'dashboard' })}
          />
        )}

        {page.name === 'trigger' && (
          <TriggerCapability
            capabilityId={page.id}
            onBack={() => setPage({ name: 'dashboard' })}
          />
        )}

        {page.name === 'metrics' && (
          <MetricsDashboard
            capabilityId={page.id}
            onBack={() => setPage({ name: 'dashboard' })}
            onMetricsUpdated={handleMetricsUpdated}
          />
        )}
      </main>
    </div>
  );
}
