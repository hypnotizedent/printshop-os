import { useState } from 'react';
import { MobileNavigation } from './mobile/MobileNavigation';
import { MobileTimeClock } from './mobile/MobileTimeClock';
import { MobileChecklist } from './mobile/MobileChecklist';
import { MobileSOPViewer } from './mobile/MobileSOPViewer';
import { OfflineIndicator } from './mobile/OfflineIndicator';
import { useIsMobile } from '../../hooks/use-mobile';
import { useInactivity } from '../../hooks/useInactivity';

export const ProductionPage = () => {
  const [currentPage, setCurrentPage] = useState('time-clock');
  const isMobile = useIsMobile();

  // Auto-logout after 5 minutes of inactivity
  useInactivity({
    timeout: 5 * 60 * 1000, // 5 minutes
    onInactive: () => {
      console.log('User inactive - would logout in production');
      // In production: logout() and redirect to login
    }
  });

  const renderPage = () => {
    switch (currentPage) {
      case 'time-clock':
        return <MobileTimeClock />;
      case 'checklists':
        return <MobileChecklist />;
      case 'sops':
        return <MobileSOPViewer />;
      case 'dashboard':
        return (
          <div className="min-h-screen bg-background p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Production Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Active Jobs</h3>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Today's Output</h3>
                <p className="text-3xl font-bold text-green-600">2,450</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">On Schedule</h3>
                <p className="text-3xl font-bold text-purple-600">95%</p>
              </div>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Quality Rate</h3>
                <p className="text-3xl font-bold text-orange-600">98.5%</p>
              </div>
            </div>
          </div>
        );
      default:
        return <MobileTimeClock />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <MobileNavigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
      <OfflineIndicator />
    </div>
  );
};
