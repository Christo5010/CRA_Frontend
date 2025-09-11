
import React, { useEffect, useState, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, FileText, Folder, Users, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import logo from '../../assets/logo.png'

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const { signOut, user } = useAuth();
  const { cras } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isCraSubMenuOpen, setCraSubMenuOpen] = useState(false);
  const [isDocsSubMenuOpen, setDocsSubMenuOpen] = useState(false);

  const pendingCRACount = useMemo(() => {
    if (!cras) return 0;
    return cras.filter(cra => cra.status === 'Soumis').length;
  }, [cras]);

  useEffect(() => {
    if (location.pathname.startsWith('/cra') || location.pathname.startsWith('/dashboard')) {
      setCraSubMenuOpen(true);
    } else {
      setCraSubMenuOpen(false);
    }
     if (location.pathname.startsWith('/mes-documents')) {
      setDocsSubMenuOpen(true);
    } else {
      setDocsSubMenuOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Déconnexion réussie." });
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-gray-700 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
    
  const subNavLinkClass = ({ isActive }) =>
    `flex items-center pl-11 pr-4 py-2.5 rounded-lg transition-colors duration-200 text-sm ${
      isActive
        ? 'bg-gray-600 text-white'
        : 'text-gray-400 hover:bg-gray-600 hover:text-white'
    }`;

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const isConsultant = user?.role === 'consultant';

  return (
    <>
    {/* Desktop sidebar */}
    <aside className="w-64 bg-gray-800 text-white flex flex-col hidden md:flex">
      <div className="p-6 flex items-center space-x-3">
        {/* <div className="w-10 h-10 bg-white text-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-2xl font-bold">7</span>
        </div> */}
        {/* <span className="text-xl font-semibold">Seven Opportunity</span> */}
        <div className="w-48 h-16">
          <img src={logo} alt="logo" className="filter invert brightness-0" />
        </div>
      </div>

      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-2">
          <li>
            <NavLink to="/mon-cra" className={navLinkClass}>
              <Calendar className="w-5 h-5 mr-3" />
              Mon CRA
            </NavLink>
          </li>

          {isManagerOrAdmin && (
             <li>
                <button
                  onClick={() => setCraSubMenuOpen(!isCraSubMenuOpen)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                >
                    <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-3" />
                        <span>CRA</span>
                    </div>
                    <div className="flex items-center">
                    {pendingCRACount > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-2">
                            {pendingCRACount}
                        </span>
                    )}
                    </div>
                </button>
                {isCraSubMenuOpen && (
                  <ul className="pt-2 space-y-1">
                     <li>
                      <NavLink to="/dashboard" className={subNavLinkClass}>
                        <LayoutDashboard className="w-4 h-4 mr-3" />
                        Tableau de bord
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/cra" className={subNavLinkClass}>
                        <Users className="w-4 h-4 mr-3" />
                        Liste
                      </NavLink>
                    </li>
                  </ul>
                )}
            </li>
          )}
          
          {isConsultant && (
            <li>
              <button
                onClick={() => setDocsSubMenuOpen(!isDocsSubMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
              >
                <div className="flex items-center">
                  <Folder className="w-5 h-5 mr-3" />
                  <span>Mes Documents</span>
                </div>
              </button>
              {isDocsSubMenuOpen && (
                <ul className="pt-2 space-y-1">
                  <li>
                    <NavLink to="/mes-documents/mes-cra" className={subNavLinkClass}>
                      <FileText className="w-4 h-4 mr-3" />
                      Mes CRA
                    </NavLink>
                  </li>
                </ul>
              )}
            </li>
          )}
          
          {user?.role === 'admin' && (
            <li>
              <NavLink to="/accounts" className={navLinkClass}>
                <Users className="w-5 h-5 mr-3" />
                Comptes
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="p-3 bg-gray-700/50 rounded-lg mb-4">
          <p className="font-semibold">{user?.name || user?.email}</p>
          <p className="text-sm text-gray-400">{user?.role}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white mb-2"
          onClick={() => navigate('/account-settings')}
        >
          <Settings className="w-5 h-5 mr-3" />
          Paramètres du compte
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Déconnexion
        </Button>
      </div>
    </aside>

    {/* Mobile sidebar overlay */}
    {mobileOpen && (
      <div className="fixed inset-0 z-30 md:hidden">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-800 text-white p-0 flex flex-col shadow-xl">
          <div className="p-6 flex items-center space-x-3 border-b border-gray-700">
            {/* <div className="w-10 h-10 bg-white text-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold">7</span>
            </div>
            <span className="text-xl font-semibold">Seven Opportunity</span> */}
            <div className="w-48 h-16">
              <img src={logo} alt="logo" className="filter invert brightness-0" />
            </div>
          </div>
          <nav className="flex-1 px-4 py-2 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <NavLink to="/mon-cra" className={navLinkClass} onClick={onClose}>
                  <Calendar className="w-5 h-5 mr-3" />
                  Mon CRA
                </NavLink>
              </li>
              {isManagerOrAdmin && (
                <li>
                  <button
                    onClick={() => setCraSubMenuOpen(!isCraSubMenuOpen)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-3" />
                      <span>CRA</span>
                    </div>
                    {pendingCRACount > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center mr-2">
                        {pendingCRACount}
                      </span>
                    )}
                  </button>
                  {isCraSubMenuOpen && (
                    <ul className="pt-2 space-y-1">
                      <li>
                        <NavLink to="/dashboard" className={subNavLinkClass} onClick={onClose}>
                          <LayoutDashboard className="w-4 h-4 mr-3" />
                          Tableau de bord
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/cra" className={subNavLinkClass} onClick={onClose}>
                          <Users className="w-4 h-4 mr-3" />
                          Liste
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>
              )}
              {isConsultant && (
                <li>
                  <button
                    onClick={() => setDocsSubMenuOpen(!isDocsSubMenuOpen)}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <Folder className="w-5 h-5 mr-3" />
                      <span>Mes Documents</span>
                    </div>
                  </button>
                  {isDocsSubMenuOpen && (
                    <ul className="pt-2 space-y-1">
                      <li>
                        <NavLink to="/mes-documents/mes-cra" className={subNavLinkClass} onClick={onClose}>
                          <FileText className="w-4 h-4 mr-3" />
                          Mes CRA
                        </NavLink>
                      </li>
                    </ul>
                  )}
                </li>
              )}
              {user?.role === 'admin' && (
                <li>
                  <NavLink to="/accounts" className={navLinkClass} onClick={onClose}>
                    <Users className="w-5 h-5 mr-3" />
                    Comptes
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-700">
            <div className="p-3 bg-gray-700/50 rounded-lg mb-4">
              <p className="font-semibold">{user?.name || user?.email}</p>
              <p className="text-sm text-gray-400">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white mb-2"
              onClick={() => { onClose(); navigate('/account-settings'); }}
            >
              <Settings className="w-5 h-5 mr-3" />
              Paramètres du compte
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white"
              onClick={async () => { await handleLogout(); onClose(); }}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </aside>
      </div>
    )}
    
    </>
  );
};

export default Sidebar;
