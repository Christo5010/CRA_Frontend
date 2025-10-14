import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, FileText, Users, Settings, LogOut, Briefcase, BarChart2, Sun, Moon, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import logo from '../../assets/logo.png'

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = () => {
        signOut();
        navigate('/');
    };

    const navItems = [
        { to: "/mon-cra", icon: <Calendar className="w-5 h-5" />, text: "Mon CRA", roles: ['consultant', 'manager', 'admin'] },
        { to: "/mes-absences", icon: <Sun className="w-5 h-5" />, text: "Mes Absences", roles: ['consultant', 'manager', 'admin'] },
        { to: "/cra", icon: <Briefcase className="w-5 h-5" />, text: "Gestion CRA", roles: ['manager', 'admin'] },
        { to: "/gestion-absences", icon: <ClipboardCheck className="w-5 h-5" />, text: "Gestion Absences", roles: ['manager', 'admin'] },
        { to: "/dashboard", icon: <BarChart2 className="w-5 h-5" />, text: "Dashboard", roles: ['manager', 'admin'] },
        { to: "/mes-documents", icon: <FileText className="w-5 h-5" />, text: "Mes Documents", roles: ['consultant'] },
        { to: "/accounts", icon: <Users className="w-5 h-5" />, text: "Comptes", roles: ['admin'] },
    ];

    const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="w-64 bg-gray-800 text-white flex flex-col hidden md:flex">
                {/* <div className="p-6 text-center border-b border-gray-700">
                    <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <span className="text-2xl font-bold">7</span>
                    </div>
                    <h2 className="text-xl font-semibold">Seven</h2>
                    <p className="text-sm text-gray-400">Opportunity</p>
                </div> */}
                <div className="p-6 flex items-center space-x-3">
                  <div className="w-48 h-16">
                    <img src={logo} alt="logo" className="filter invert brightness-0" />
                  </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {filteredNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="ml-3">{item.text}</span>
                        </NavLink>
                    ))}
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
                        onClick={handleSignOut}
                        variant="ghost"
                        className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white"
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
                    <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-800 text-white flex flex-col shadow-xl">
                        <div className="p-6 text-center border-b border-gray-700">
                            <div className="w-12 h-12 bg-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <span className="text-2xl font-bold">7</span>
                            </div>
                            <h2 className="text-xl font-semibold">Seven</h2>
                            <p className="text-sm text-gray-400">Opportunity</p>
                        </div>
                        <nav className="flex-1 px-4 py-6 space-y-2">
                            {filteredNavItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`
                                    }
                                    onClick={onClose}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.text}</span>
                                </NavLink>
                            ))}
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
                                onClick={() => { handleSignOut(); onClose(); }}
                                variant="ghost"
                                className="w-full justify-start text-gray-400 hover:bg-gray-700 hover:text-white"
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