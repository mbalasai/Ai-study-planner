import React, { useContext, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LayoutDashboard, BookOpen, MessageSquare, BarChart, User, LogOut, Sun, Moon, Menu, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { name: 'Chatbot', path: '/chat', icon: <MessageSquare size={20} /> },
        { name: 'Progress', path: '/progress', icon: <BarChart size={20} /> },
        { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    ];

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
            
            <aside className={`
                fixed md:sticky top-0 left-0 z-50
                w-64 glass border-r bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 
                flex flex-col h-screen transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
            `}>
                <div className="p-6 flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                            <BookOpen size={24} />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                            StudyAI
                        </h1>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-thin">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.name}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                }`
                            }
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

const Topbar = ({ toggleSidebar }) => {
    const { user } = useContext(AuthContext);
    const { darkMode, toggleTheme } = useContext(ThemeContext);

    return (
        <header className="h-20 px-4 md:px-8 flex items-center justify-between glass z-10 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center">
                <button 
                    onClick={toggleSidebar}
                    className="mr-4 p-2 md:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h2 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white line-clamp-1">
                        Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Let's learn something new today!</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 md:space-x-6">
                <div className="flex items-center space-x-1.5 md:space-x-2 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800/50 shadow-sm text-xs md:text-sm">
                    <span>🔥</span>
                    <span className="hidden sm:inline">{user?.streak_count || 0} Day Streak!</span>
                    <span className="sm:hidden">{user?.streak_count || 0}</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-transparent dark:border-slate-700"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="flex items-center">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-slate-800 transition-transform hover:scale-105 cursor-pointer text-sm md:text-base">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-primary-300 dark:bg-primary-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none -z-10 animate-blob"></div>
                <div className="absolute bottom-0 left-0 md:left-20 w-64 h-64 md:w-96 md:h-96 bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none -z-10 animate-blob animation-delay-2000"></div>

                <Topbar toggleSidebar={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative z-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
