import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { insforge } from '../api/insforge';
import { ChevronLeft, Sparkles, CheckCircle, Bookmark, Loader2, Trash2, Plus } from 'lucide-react';

const SubjectDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [subject, setSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [topicInput, setTopicInput] = useState('');
    const [manualTopic, setManualTopic] = useState('');
    const [loadingParams, setLoadingParams] = useState(false);
    const [toast, setToast] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (!user) return;
            try {
                const { data: subData } = await insforge.database
                    .from('subjects')
                    .select('*')
                    .eq('id', id)
                    .single();
                setSubject(subData);

                const { data: qData } = await insforge.database
                    .from('questions')
                    .select('*')
                    .eq('subject_id', id)
                    .order('created_at', { ascending: false });
                setQuestions(qData || []);
            } catch (error) {
                console.error(error);
            }
        };
        fetchDetails();
    }, [id, user]);

    const syncProgressToDB = async (latestQuestions) => {
        if (!latestQuestions || latestQuestions.length === 0) return;
        const total = latestQuestions.length;
        const done = latestQuestions.filter(q => q.is_completed).length;
        const progress = Math.round((done / total) * 100);
        try {
            await insforge.database.from('subjects').update({ progress }).eq('id', id);
        } catch (e) {
            console.error('Failed to sync progress:', e);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topicInput.trim() || !user || !subject) return;
        setLoadingParams(true);

        try {
            const prompt = `Generate 3 important study questions with detailed answers for the topic "${topicInput}" in "${subject.name}". Return ONLY a valid JSON array. Each object must have exactly two string fields: "question_text" and "answer_summary". No markdown, no explanation outside the JSON.`;

            // ✅ AI returns completion directly — no { data, error } wrapper
            const completion = await insforge.ai.chat.completions.create({
                model: 'openai/gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6,
                maxTokens: 1200
            });

            let aiResponse;
            if (completion?.choices?.[0]?.message?.content) {
                aiResponse = completion.choices[0].message.content;
            } else if (completion?.data?.choices?.[0]?.message?.content) {
                aiResponse = completion.data.choices[0].message.content;
            } else {
                throw new Error('Unexpected AI response format');
            }

            let questionsData = [];
            try {
                const jsonStr = aiResponse.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                questionsData = JSON.parse(jsonStr);
                if (!Array.isArray(questionsData)) throw new Error('Not an array');
            } catch (parseError) {
                console.error('Failed to parse AI JSON', aiResponse);
                throw new Error('AI returned an unexpected format. Please try again.');
            }

            const insertPayload = questionsData.map(q => ({
                user_id: user.id,
                subject_id: id,
                question_text: q.question_text || q.questionText || '',
                answer_summary: q.answer_summary || q.answerSummary || ''
            })).filter(q => q.question_text);

            const { data: newQData, error: dbError } = await insforge.database
                .from('questions')
                .insert(insertPayload)
                .select();

            if (dbError) throw dbError;

            const updatedQuestions = [...(newQData || []), ...questions];
            setQuestions(updatedQuestions);
            syncProgressToDB(updatedQuestions);
            setTopicInput('');
            showToast(`✅ Generated ${insertPayload.length} questions for "${topicInput}"`);
        } catch (error) {
            console.error(error);
            showToast(`❌ ${error.message || 'Failed to generate questions'}`);
        } finally {
            setLoadingParams(false);
        }
    };

    const handleAddTopic = async (e) => {
        e.preventDefault();
        if (!manualTopic.trim() || !user || !subject) return;

        try {
            const { data: newQData, error: dbError } = await insforge.database
                .from('questions')
                .insert([{
                    user_id: user.id,
                    subject_id: id,
                    question_text: `Topic: ${manualTopic.trim()}`,
                    answer_summary: ''
                }])
                .select()
                .single();

            if (dbError) throw dbError;

            const updatedQuestions = [newQData, ...questions];
            setQuestions(updatedQuestions);
            syncProgressToDB(updatedQuestions);
            setManualTopic('');
            showToast(`✅ Added manually: "${manualTopic}"`);
        } catch (error) {
            console.error(error);
            showToast(`❌ Failed to add topic manually`);
        }
    };

    // Toggle bookmark / completed — update local state optimistically, no .select() needed
    const toggleStatus = async (qId, field, currentValue) => {
        // Optimistic update
        const updatedQs = questions.map(q => q.id === qId ? { ...q, [field]: !currentValue } : q);
        setQuestions(updatedQs);
        try {
            const { error } = await insforge.database
                .from('questions')
                .update({ [field]: !currentValue })
                .eq('id', qId);

            if (error) throw error;

            // Update progress on subject when marking complete
            if (field === 'is_completed') {
                syncProgressToDB(updatedQs);
            }
        } catch (error) {
            console.error(error);
            // Revert on failure
            setQuestions(questions);
        }
    };

    const handleDelete = async (qId) => {
        setDeletingId(qId);
        try {
            const { error } = await insforge.database
                .from('questions')
                .delete()
                .eq('id', qId)
                .eq('user_id', user.id);
            if (error) throw error;
            const updatedQs = questions.filter(q => q.id !== qId);
            setQuestions(updatedQs);
            if (questions.find(q => q.id === qId)?.is_completed !== undefined) {
                 syncProgressToDB(updatedQs);
            }
            showToast('Question deleted.');
        } catch (err) {
            console.error(err);
            showToast('❌ Failed to delete question.');
        } finally {
            setDeletingId(null);
        }
    };

    const completedCount = questions.filter(q => q.is_completed).length;
    const progressPct = questions.length > 0 ? Math.round((completedCount / questions.length) * 100) : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link to="/" className="p-2 glass rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                        {subject ? subject.name : 'Study Room'}
                    </h1>
                    {questions.length > 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {completedCount} / {questions.length} questions completed
                        </p>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {questions.length > 0 && (
                <div className="glass p-4 rounded-2xl">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Overall Progress</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-700"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* AI Generator Card */}
            <div className="glass p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-start space-x-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0">
                        <Sparkles size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">AI Content Generator</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                            Enter a topic and let AI generate important questions and answers to help you study.
                        </p>
                        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                placeholder="E.g., Sorting Algorithms, Deadlocks, Photosynthesis…"
                                className="flex-1 px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={loadingParams || !topicInput.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-md shadow-indigo-500/30 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                            >
                                {loadingParams ? (
                                    <><Loader2 size={18} className="animate-spin" /><span>Generating…</span></>
                                ) : (
                                    <><Plus size={18} /><span>Generate</span></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Manual Topic Adder */}
            <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex-shrink-0">
                    <Plus size={20} />
                </div>
                <form onSubmit={handleAddTopic} className="flex-1 flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={manualTopic}
                        onChange={(e) => setManualTopic(e.target.value)}
                        placeholder="Manually add a topic or task to your checklist..."
                        className="flex-1 px-4 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-slate-500 focus:outline-none text-slate-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!manualTopic.trim()}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        <span>Add Task</span>
                    </button>
                </form>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Study Materials
                    {questions.length > 0 && (
                        <span className="ml-3 text-base font-normal text-slate-500">({questions.length} total)</span>
                    )}
                </h3>
                {questions.length === 0 ? (
                    <div className="text-center p-12 glass rounded-2xl border-dashed border-2 border-slate-300 dark:border-slate-700">
                        <Sparkles size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">No content yet</h3>
                        <p className="text-slate-500 mt-2">Generate questions using the AI above, or ask the chatbot!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questions.map((q) => (
                            <div
                                key={q.id}
                                className={`glass p-6 rounded-2xl relative transition-all ${q.is_completed ? 'border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                            >
                                {/* Question text */}
                                <h4 className={`text-base font-semibold mb-3 pr-8 ${q.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                    {q.question_text}
                                </h4>

                                {/* Answer */}
                                {q.answer_summary && (
                                    <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                        {q.answer_summary}
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={() => toggleStatus(q.id, 'is_completed', q.is_completed)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            q.is_completed
                                                ? 'text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40'
                                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <CheckCircle size={15} />
                                        {q.is_completed ? 'Completed' : 'Mark Done'}
                                    </button>

                                    <button
                                        onClick={() => toggleStatus(q.id, 'is_bookmarked', q.is_bookmarked)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            q.is_bookmarked
                                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40'
                                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <Bookmark size={15} fill={q.is_bookmarked ? 'currentColor' : 'none'} />
                                        {q.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        disabled={deletingId === q.id}
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800/40 transition-colors disabled:opacity-40"
                                    >
                                        <Trash2 size={14} />
                                        {deletingId === q.id ? 'Deleting…' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-2xl shadow-xl animate-fade-in">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default SubjectDetails;
