import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { insforge } from '../api/insforge';
import { User, Mail, Target, Award } from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [dailyGoals, setDailyGoals] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setDailyGoals(user.daily_goals || '');
        }
    }, [user]);

    const [saving, setSaving] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // update existing profile row
            const { error } = await insforge.database
                .from('profiles')
                .update({
                    name: name.trim(),
                    daily_goals: dailyGoals.trim(),
                })
                .eq('id', user.id);

            if (error) throw error;

            // Update local context directly from form values (no .select() needed)
            setUser(prev => ({ ...prev, name: name.trim(), daily_goals: dailyGoals.trim() }));
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Profile update error:', err);
            setMessage(`Error: ${err?.message || 'Could not update profile. Please try again.'}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Profile Settings</h1>

            <div className="glass p-8 rounded-3xl relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400 dark:bg-primary-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10"></div>
                
                <div className="flex items-center space-x-6 mb-8 relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white/50 dark:border-slate-800">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">
                            {user?.name || 'Student'}
                        </h2>
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full mt-2 font-medium">
                            <Award size={14} />
                            <span>Pro Learner</span>
                        </span>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 mb-6 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                                <User size={16} className="mr-2" /> Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                                <Mail size={16} className="mr-2" /> Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                            <Target size={16} className="mr-2" /> Daily Study Goal (Optional)
                        </label>
                        <textarea
                            value={dailyGoals}
                            onChange={(e) => setDailyGoals(e.target.value)}
                            placeholder="E.g., I want to study for 2 hours every day."
                            className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white min-h-[100px]"
                        ></textarea>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 transition-transform transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
