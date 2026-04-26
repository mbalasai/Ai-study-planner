import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const data = await register(name, email, password);
            
            if (data?.accessToken) {
                // Auto-logged in!
                navigate('/');
            } else {
                setSuccess('Account created! Please sign in.');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6">
            <div className="w-full max-w-md glass p-6 sm:p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 dark:opacity-20 animate-blob" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary-400 rounded-full mix-blend-multiply filter blur-2xl opacity-50 dark:opacity-20 animate-blob animation-delay-2000" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-primary-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/30">
                        <BookOpen size={32} />
                    </div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 mb-2">
                        Create Account
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Start organizing your studies today</p>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm relative z-10 flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm relative z-10 flex items-center gap-2">
                        <span>✅</span>
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input
                            type="text"
                            id="register-name"
                            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            id="register-email"
                            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Password <span className="text-slate-400 font-normal">(min 6 characters)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="register-password"
                                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-slate-900 dark:text-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-indigo-500 to-primary-600 hover:from-indigo-600 hover:to-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account…</> : 'Sign Up'}
                    </button>
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Sign in</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
