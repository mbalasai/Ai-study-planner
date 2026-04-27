import React, { useState, useEffect, useContext } from 'react';
import { insforge } from '../api/insforge';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Trash2 } from 'lucide-react';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchSubjects = async () => {
        try {
            const { data, error } = await insforge.database
                .from('subjects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSubjects(data || []);
        } catch (error) {
            console.error('Failed to fetch subjects', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchSubjects();
    }, [user]);

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.trim()) return;
        try {
            const { error } = await insforge.database
                .from('subjects')
                .insert([{ name: newSubject, user_id: user.id }]);
            
            if (error) throw error;
            setNewSubject('');
            fetchSubjects();
        } catch (error) {
            console.error('Failed to add subject', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await insforge.database
                .from('subjects')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);
                
            if (error) throw error;
            fetchSubjects();
        } catch (error) {
            console.error('Failed to delete subject', error);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Your Dashboard</h1>
            </div>

            {/* Add Subject Card */}
            <div className="glass p-6 rounded-2xl max-w-xl">
                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Start a New Subject</h3>
                <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
                    <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="e.g. Data Structures & Algorithms"
                        className="flex-1 px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white w-full"
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 w-full sm:w-auto justify-center bg-gradient-to-r from-primary-500 to-indigo-600 hover:from-primary-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-md flex items-center space-x-2 transition-transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        <span>Add</span>
                    </button>
                </form>
            </div>

            {/* Subjects Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">Enrolled Subjects</h2>
                {loading ? (
                    <div className="text-slate-500">Loading subjects...</div>
                ) : subjects.length === 0 ? (
                    <div className="text-center p-12 glass rounded-2xl border-dashed border-2 border-slate-300 dark:border-slate-700">
                        <BookOpen size={48} className="mx-auto text-slate-400 mb-4" />
                        <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">No subjects yet</h3>
                        <p className="text-slate-500 mt-2">Add a subject above to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject) => (
                            <div key={subject.id} className="glass p-6 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all group relative">
                                <button 
                                    onClick={() => handleDelete(subject.id)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-4">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{subject.name}</h3>
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                                        <span className="font-medium text-primary-600 dark:text-primary-400">{subject.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-primary-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${subject.progress || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <Link 
                                    to={`/subject/${subject.id}`}
                                    className="block text-center w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Go to Study Room
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
