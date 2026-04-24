import React, { useState, useEffect, useContext } from 'react';
import { insforge } from '../api/insforge';
import { AuthContext } from '../context/AuthContext';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { Target, TrendingUp, BookOpen, CheckCircle, Bookmark, HelpCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const StatCard = ({ icon, label, value, color, sub }) => (
    <div className={`glass p-6 rounded-2xl flex items-center space-x-4 border-l-4 ${color}`}>
        <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('500', '100')} dark:bg-opacity-20`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
            {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const Progress = () => {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [subRes, qRes] = await Promise.all([
                    insforge.database.from('subjects').select('*').eq('user_id', user.id),
                    insforge.database.from('questions').select('*').eq('user_id', user.id)
                ]);
                if (subRes.error) throw subRes.error;
                if (qRes.error) throw qRes.error;
                setSubjects(subRes.data || []);
                setQuestions(qRes.data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
            </div>
        </div>
    );

    // Compute stats
    const totalSubjects = subjects.length;
    const totalQuestions = questions.length;
    const completedQuestions = questions.filter(q => q.is_completed).length;
    const bookmarkedQuestions = questions.filter(q => q.is_bookmarked).length;
    const avgProgress = totalSubjects > 0
        ? Math.round(subjects.reduce((acc, s) => acc + (s.progress || 0), 0) / totalSubjects)
        : 0;

    // Build per-subject question counts for charts
    const barData = subjects.map((s, idx) => {
        const subQs = questions.filter(q => q.subject_id === s.id);
        const done = subQs.filter(q => q.is_completed).length;
        return {
            name: s.name.length > 14 ? s.name.substring(0, 14) + '…' : s.name,
            fullName: s.name,
            progress: s.progress || 0,
            total: subQs.length,
            completed: done,
            color: COLORS[idx % COLORS.length]
        };
    });

    const pieData = barData.filter(d => d.total > 0).map(d => ({
        name: d.fullName,
        value: d.total,
        color: d.color
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload?.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm shadow-xl">
                    <p className="font-semibold">{d.fullName || d.name}</p>
                    {d.progress !== undefined && <p>Progress: {d.progress}%</p>}
                    {d.total !== undefined && <p>Questions: {d.completed}/{d.total}</p>}
                    {d.value !== undefined && d.progress === undefined && <p>Questions: {d.value}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Learning Analytics</h1>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={<BookOpen size={26} className="text-indigo-600 dark:text-indigo-400" />}
                    label="Subjects Enrolled"
                    value={totalSubjects}
                    color="border-indigo-500"
                />
                <StatCard
                    icon={<Target size={26} className="text-purple-600 dark:text-purple-400" />}
                    label="Average Progress"
                    value={`${avgProgress}%`}
                    color="border-purple-500"
                    sub={avgProgress > 75 ? '🏆 Excellent!' : avgProgress > 50 ? '👍 Good' : '💪 Keep going!'}
                />
                <StatCard
                    icon={<CheckCircle size={26} className="text-green-600 dark:text-green-400" />}
                    label="Questions Done"
                    value={`${completedQuestions}/${totalQuestions}`}
                    color="border-green-500"
                    sub={totalQuestions > 0 ? `${Math.round((completedQuestions / totalQuestions) * 100)}% completion rate` : 'No questions yet'}
                />
                <StatCard
                    icon={<Bookmark size={26} className="text-amber-600 dark:text-amber-400" />}
                    label="Bookmarked"
                    value={bookmarkedQuestions}
                    color="border-amber-500"
                    sub="questions saved for review"
                />
            </div>

            {totalSubjects > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart - Subject Progress */}
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Subject Progress</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Completion % per subject</p>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={barData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.15} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                                    <Bar dataKey="progress" radius={[6, 6, 0, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart - Questions per Subject */}
                    <div className="glass p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Questions per Subject</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Total vs completed</p>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={barData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.15} />
                                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                                    <Legend formatter={(value) => <span className="text-slate-500 text-xs capitalize">{value}</span>} />
                                    <Bar dataKey="total" name="total" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.4} />
                                    <Bar dataKey="completed" name="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    {pieData.length > 0 && (
                        <div className="glass p-6 rounded-2xl lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Question Distribution</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">How your study material is spread across subjects</p>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip content={<CustomTooltip />} />
                                        <Legend formatter={(value) => <span className="text-slate-600 dark:text-slate-300 text-xs">{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center p-16 glass rounded-2xl mt-4">
                    <HelpCircle size={52} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No data yet</h3>
                    <p className="text-slate-500 mt-2">Add some subjects and start studying to see your analytics!</p>
                </div>
            )}
        </div>
    );
};

export default Progress;
