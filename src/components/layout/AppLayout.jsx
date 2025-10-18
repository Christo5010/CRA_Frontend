
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import logo from '../../assets/logo.png'
import { useLocation } from 'react-router-dom';
import { useAppData } from '@/contexts/AppContext';
const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { fetchData } = useAppData();

  // Force-refresh shared data on section (route) change
  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col">
        <div className="md:hidden sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          {/* <span className="font-semibold">Seven Opportunity</span> */}
          <div className="w-48 h-16">
                    <img src={logo} alt="logo" />
                  </div>
          <div style={{ width: 40 }} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
