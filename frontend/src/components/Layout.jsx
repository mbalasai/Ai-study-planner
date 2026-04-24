import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LayoutDashboard, BookOpen, MessageSquare, BarChart, User, LogOut, Sun, Moon } from 'lucide-react';

const Sidebar = () => {
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
        <aside className="w-64 glass border-r bg-white/80 dark:bg-slate-900/80 dark:border-slate-800 flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                    <BookOpen size={24} />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                    StudyAI
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.path}
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

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const Topbar = () => {
    const { user } = useContext(AuthContext);
    const { darkMode, toggleTheme } = useContext(ThemeContext);

    return (
        <header className="h-20 px-8 flex items-center justify-between glass z-10 sticky top-0 bg-white/70 dark:bg-slate-900/70">
            <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                    Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Let's learn something new today!</p>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-800/50 shadow-sm">
                    <span>🔥</span>
                    <span>{user?.streak_count || 0} Day Streak!</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-transparent dark:border-slate-700"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white dark:ring-slate-800 transition-transform hover:scale-105 cursor-pointer">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-300 dark:bg-primary-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10 animate-blob"></div>
                <div className="absolute bottom-0 left-20 w-96 h-96 bg-indigo-300 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10 animate-blob animation-delay-2000"></div>

                <Topbar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative z-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
