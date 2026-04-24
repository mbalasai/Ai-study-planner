import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { insforge } from '../api/insforge';
import {
    Bot, Send, User, Sparkles, Trash2, Copy, CheckCheck,
    BookOpen, Brain, Lightbulb, Clock, ChevronDown, Zap,
    RotateCcw, Mic, MicOff, X
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tiny Markdown renderer (no external dep needed)
// ---------------------------------------------------------------------------
const renderMarkdown = (text) => {
    if (!text) return '';

    // Bold **text**
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline `code`
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    // Code block ```...```
    html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-slate-900 text-green-400 rounded-xl p-4 text-sm font-mono overflow-x-auto my-3 border border-slate-700">$1</pre>');
    // Numbered list
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');
    // Bullet list
    html = html.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
    // Headings ## and ###
    html = html.replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1 text-indigo-600 dark:text-indigo-400">$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-1 text-indigo-700 dark:text-indigo-300">$1</h2>');
    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
};

// ---------------------------------------------------------------------------
// Suggestion chips
// ---------------------------------------------------------------------------
const SUGGESTION_CATEGORIES = [
    {
        label: '📚 Study Questions',
        icon: <BookOpen size={16} />,
        color: 'from-blue-500 to-indigo-500',
        suggestions: [
            'What are the most important questions for Operating Systems?',
            'Give me 10 key questions for Database Management Systems.',
            'Important questions for Computer Networks exam preparation.',
        ]
    },
    {
        label: '🧠 Explain Concepts',
        icon: <Brain size={16} />,
        color: 'from-purple-500 to-pink-500',
        suggestions: [
            'Explain Quantum Computing in simple terms.',
            'What is the difference between TCP and UDP?',
            'Explain Big O notation with examples.',
        ]
    },
    {
        label: '💡 Study Plans',
        icon: <Lightbulb size={16} />,
        color: 'from-amber-500 to-orange-500',
        suggestions: [
            'Help me plan a 30-day study schedule for DSA.',
            'Create a week-long revision plan for Machine Learning.',
            'What is the best way to prepare for a coding interview?',
        ]
    },
    {
        label: '⏱️ Quick Help',
        icon: <Clock size={16} />,
        color: 'from-teal-500 to-cyan-500',
        suggestions: [
            'Summarize the key concepts of Object Oriented Programming.',
            'What are design patterns? Give top 5 examples.',
            'Explain recursion with a simple real-world analogy.',
        ]
    },
];

// ---------------------------------------------------------------------------
// Typing animation dots
// ---------------------------------------------------------------------------
const TypingDots = () => (
    <div className="flex items-center space-x-1 py-1">
        {[0, 1, 2].map(i => (
            <span
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
            />
        ))}
    </div>
);

// ---------------------------------------------------------------------------
// Single chat bubble
// ---------------------------------------------------------------------------
const ChatBubble = ({ msg, onCopy, copied }) => {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
            {!isUser && (
                <div className="w-8 h-8 mr-2 flex-shrink-0 mt-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <Bot size={16} className="text-white" />
                </div>
            )}
            <div className={`max-w-[78%] relative ${isUser ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed
                    ${isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-white/50 dark:border-slate-700/50 backdrop-blur-sm'}
                `}>
                    {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                        <div
                            className="prose-custom"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                    )}
                </div>
                {/* Copy button */}
                {!isUser && (
                    <button
                        onClick={() => onCopy(msg.content)}
                        className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1"
                    >
                        {copied === msg.id ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
                        {copied === msg.id ? 'Copied!' : 'Copy'}
                    </button>
                )}
            </div>
            {isUser && (
                <div className="w-8 h-8 ml-2 flex-shrink-0 mt-1 bg-gradient-to-br from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 rounded-full flex items-center justify-center shadow-md">
                    <User size={16} className="text-white" />
                </div>
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main Chatbot component
// ---------------------------------------------------------------------------
const Chatbot = () => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [copied, setCopied] = useState(null);
    const [activeCategory, setActiveCategory] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [aiError, setAiError] = useState('');

    const chatEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    // ── Toast helper ────────────────────────────────────────────────────────
    const showToast = useCallback((msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
    }, []);

    // ── Scroll to bottom ─────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // ── Show scroll-up button ─────────────────────────────────────────────────
    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 150);
    };

    // ── Load chat history ─────────────────────────────────────────────────────
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                const { data, error } = await insforge.database
                    .from('chat_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });
                if (error) throw error;
                setMessages(
                    (data || []).map((m, i) => ({ ...m, id: m.id || `hist-${i}` }))
                );
            } catch (err) {
                console.error('Failed to fetch chat history', err);
            }
        };
        fetchHistory();
    }, [user]);

    // ── Voice Input (Web Speech API) ─────────────────────────────────────────
    const toggleVoice = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showToast('Voice input not supported in this browser.', 'error');
            return;
        }
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.lang = 'en-US';
        rec.continuous = false;
        rec.interimResults = false;
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        rec.onend = () => setIsListening(false);
        rec.onerror = () => { setIsListening(false); showToast('Voice recognition error.', 'error'); };
        recognitionRef.current = rec;
        rec.start();
        setIsListening(true);
    };

    // ── Copy helper ───────────────────────────────────────────────────────────
    const handleCopy = (content) => {
        navigator.clipboard.writeText(content);
        const id = messages.find(m => m.content === content)?.id;
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // ── Clear chat ────────────────────────────────────────────────────────────
    const handleClearChat = async () => {
        if (!user || messages.length === 0) return;
        try {
            await insforge.database
                .from('chat_history')
                .delete()
                .eq('user_id', user.id);
            setMessages([]);
            showToast('Chat cleared!');
        } catch (err) {
            console.error('Failed to clear chat', err);
            showToast('Failed to clear chat.', 'error');
        }
    };

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const msg = input.trim();
        if (!msg || !user || loading) return;

        setInput('');
        setAiError('');
        const tempId = `temp-${Date.now()}`;
        const userMsg = { id: tempId, role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        inputRef.current?.focus();

        try {
            // Save user message to DB
            await insforge.database.from('chat_history').insert([{
                user_id: user.id,
                role: 'user',
                content: msg
            }]);

            // Build context (last 10 messages)
            const recentMsgs = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
            const promptMsgs = [
                {
                    role: 'system',
                    content: `You are StudyAI — a brilliant, friendly AI study companion. You help students understand concepts, create study plans, and prepare for exams. You speak in an encouraging, peer-like tone. Format your responses with clear headings (##), bullet points (-), and **bold** for key terms. Use code blocks (\`\`\`) for code or technical content.

IMPORTANT INSTRUCTION — AUTO-SAVE TO SUBJECTS:
For EVERY response you give, you MUST append a JSON block at the very end (after all your text), with absolutely no text after it. Infer the subject/topic. The JSON block MUST be an array of objects.

\`\`\`json
[{"__action__": "AUTO_SAVE_QUESTION", "subject_name": "<InferredSubjectName>", "question_text": "<the user's question or the generated question>", "answer_summary": "<summary or answer>"}]
\`\`\`

Rules:
- If the user asks for multiple questions (e.g. "give me 5 questions"), create an object in the JSON array for EACH generated question individually!
- subject_name: Infer the academic/technical subject. Use title case. Uses "General" for non-study chat.
- question_text: Re-state the user's question, OR if you generated a question, put the generated question here.
- answer_summary: A brief 1-2 sentence summary of key takeaways from your answer, OR the answer to the generated question.
- This JSON block must ALWAYS be present at the very end. Never skip it.`
                },
                ...recentMsgs,
                { role: 'user', content: msg }
            ];

            // ✅ Correct SDK call — AI returns data directly (not { data, error })
            const completion = await insforge.ai.chat.completions.create({
                model: 'openai/gpt-4o-mini',
                messages: promptMsgs,
                temperature: 0.7,
                maxTokens: 2000
            });

            // Handle possible error object wrapping
            let reply;
            if (completion?.choices?.[0]?.message?.content) {
                reply = completion.choices[0].message.content;
            } else if (completion?.data?.choices?.[0]?.message?.content) {
                reply = completion.data.choices[0].message.content;
            } else {
                throw new Error('Unexpected AI response format');
            }

            // ── Auto-save every Q&A to the detected subject ───────────────
            if (reply.includes('"__action__": "AUTO_SAVE_QUESTION"')) {
                try {
                    const blocks = Array.from(reply.matchAll(/```json([\s\S]*?)```/g));
                    let jsonStr = '';
                    let fullBlock = '';
                    
                    for (const match of blocks) {
                        if (match[1].includes('AUTO_SAVE_QUESTION')) {
                            jsonStr = match[1].trim();
                            fullBlock = match[0];
                            break;
                        }
                    }

                    // Fallback if AI didn't wrap in ```json
                    if (!jsonStr) {
                        const rawMatch = reply.match(/\[\s*{\s*"__action__":\s*"AUTO_SAVE_QUESTION"[\s\S]*}\s*\]/);
                        if (rawMatch) {
                            jsonStr = rawMatch[0];
                            fullBlock = rawMatch[0];
                        }
                    }

                    if (jsonStr) {
                        const parsed = JSON.parse(jsonStr);
                        const dataArray = Array.isArray(parsed) ? parsed : [parsed];

                        // Strip JSON block from displayed reply once
                        reply = reply.replace(fullBlock, '').trim();

                        // Cache subject to avoid multiple creations
                        let cachedSubjectName = null;
                        let cachedSubjectId = null;
                        let questionsToInsert = [];

                        for (const saveData of dataArray) {
                            if (saveData?.__action__ === 'AUTO_SAVE_QUESTION' && saveData.subject_name) {
                                const subjectName = saveData.subject_name;
                                const isGeneral = subjectName.toLowerCase() === 'general' || subjectName.toLowerCase() === 'general knowledge';

                                if (isGeneral) continue; // Don't save general chit-chat questions

                                let subjectId = cachedSubjectId;
                                if (subjectName !== cachedSubjectName || !subjectId) {
                                    // Find or create the subject silently
                                    const { data: subData } = await insforge.database
                                        .from('subjects')
                                        .select('id')
                                        .ilike('name', subjectName)
                                        .eq('user_id', user.id)
                                        .maybeSingle();

                                    if (subData?.id) {
                                        subjectId = subData.id;
                                    } else {
                                        // Auto-create subject
                                        const { data: newSub, error: newSubErr } = await insforge.database
                                            .from('subjects')
                                            .insert([{ name: subjectName, user_id: user.id }])
                                            .select()
                                            .single();
                                        
                                        if (newSubErr) console.warn('Sub create err:', newSubErr);
                                        if (newSub) subjectId = newSub.id;
                                    }
                                    cachedSubjectName = subjectName;
                                    cachedSubjectId = subjectId;
                                }

                                if (subjectId && saveData.question_text) {
                                    questionsToInsert.push({
                                        user_id: user.id,
                                        subject_id: subjectId,
                                        question_text: saveData.question_text,
                                        answer_summary: saveData.answer_summary || ''
                                    });
                                }
                            }
                        }

                        if (questionsToInsert.length > 0) {
                            await insforge.database.from('questions').insert(questionsToInsert);
                            // Show toast with proper count
                            showToast(`📚 Saved ${questionsToInsert.length} item(s) to "${cachedSubjectName}"`);
                        }
                    }
                } catch (parseErr) {
                    console.warn('Auto-save parse error:', parseErr);
                }
            }

            // Save assistant reply to DB
            await insforge.database.from('chat_history').insert([{
                user_id: user.id,
                role: 'assistant',
                content: reply
            }]);

            const botMsg = { id: `bot-${Date.now()}`, role: 'assistant', content: reply };
            setMessages(prev => [...prev, botMsg]);

        } catch (err) {
            console.error('AI Error:', err);
            const errorMsg = 'Oops! I had trouble connecting to the AI. Please try again.';
            setAiError(errorMsg);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } finally {
            setLoading(false);
        }
    };

    // ── Keyboard shortcut: Enter to send, Shift+Enter for newline ─────────────
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        inputRef.current?.focus();
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] rounded-3xl overflow-hidden relative"
            style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(238,242,255,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 25px 50px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.06)',
            }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/40 dark:border-slate-700/40"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))' }}
            >
                <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 relative">
                        <Bot size={22} className="text-white" />
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            StudyAI Assistant
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Zap size={11} className="text-amber-400" />
                            Powered by GPT-4o-mini
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-red-200 dark:border-red-800/40"
                        >
                            <Trash2 size={13} />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Chat Area ───────────────────────────────────────────────── */}
            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scroll-smooth"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}
            >
                {messages.length === 0 ? (
                    /* ── Empty state / suggestions ── */
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-6">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mx-auto">
                                <Sparkles size={36} className="text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs font-bold text-white shadow">✨</div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                Hey {user?.name?.split(' ')[0] || 'there'}! 👋
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                                I'm your AI study buddy. Ask me anything — from exam prep to concept explanations!
                            </p>
                        </div>

                        {/* Category tabs */}
                        <div className="w-full max-w-2xl">
                            <div className="flex gap-2 mb-4 flex-wrap justify-center">
                                {SUGGESTION_CATEGORIES.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveCategory(idx)}
                                        className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all border ${activeCategory === idx
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30'
                                            : 'bg-white/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                            }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                                {SUGGESTION_CATEGORIES[activeCategory].suggestions.map((s, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(s)}
                                        className="group text-left px-5 py-3.5 rounded-2xl text-sm text-slate-700 dark:text-slate-300 transition-all flex items-start gap-3 hover:-translate-y-0.5"
                                        style={{
                                            background: 'rgba(255,255,255,0.8)',
                                            border: '1px solid rgba(99,102,241,0.15)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                    >
                                        <span className="mt-0.5 flex-shrink-0 text-indigo-500 group-hover:scale-110 transition-transform">
                                            {SUGGESTION_CATEGORIES[activeCategory].icon}
                                        </span>
                                        <span>{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Messages ── */
                    <>
                        {/* Welcome message if first message is present */}
                        <div className="flex justify-center">
                            <div className="px-3 py-1 rounded-full text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40">
                                Chat started • Today
                            </div>
                        </div>
                        {messages.map((msg) => (
                            <ChatBubble key={msg.id} msg={msg} onCopy={handleCopy} copied={copied} />
                        ))}
                    </>
                )}

                {/* Typing indicator */}
                {loading && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 mr-2 flex-shrink-0 mt-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-tl-none text-sm"
                            style={{
                                background: 'rgba(255,255,255,0.85)',
                                border: '1px solid rgba(99,102,241,0.15)',
                                backdropFilter: 'blur(8px)'
                            }}>
                            <TypingDots />
                        </div>
                    </div>
                )}

                {/* Error message */}
                {aiError && (
                    <div className="flex justify-start">
                        <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-tl-none bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                            <X size={14} />
                            {aiError}
                            <button onClick={() => { setAiError(''); handleSendMessage(); }} className="ml-2 underline text-xs">Retry</button>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-6 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-110 z-10"
                >
                    <ChevronDown size={18} />
                </button>
            )}

            {/* ── Input Area ──────────────────────────────────────────────── */}
            <div className="px-5 py-4 border-t border-white/40 dark:border-slate-700/40"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(238,242,255,0.8))' }}
            >
                {/* Quick suggestion chips above input (when chat has messages) */}
                {messages.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {[
                            '📝 Give me practice questions',
                            '🔍 Explain this further',
                            '📊 Create a summary',
                            '💡 Give me tips',
                        ].map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(chip.replace(/^[^\s]+ /, ''))}
                                className="flex-shrink-0 px-3 py-1.5 text-xs rounded-full bg-white/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-all whitespace-nowrap"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px';
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                            className="w-full pl-5 pr-12 py-3.5 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                            style={{
                                background: 'rgba(255,255,255,0.9)',
                                border: '1.5px solid rgba(99,102,241,0.25)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 3px rgba(0,0,0,0.04)',
                                minHeight: '52px',
                                maxHeight: '130px',
                                lineHeight: '1.5',
                            }}
                        />
                        {/* Voice button inside input */}
                        <button
                            type="button"
                            onClick={toggleVoice}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                                : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                }`}
                            title={isListening ? 'Stop listening' : 'Voice input'}
                        >
                            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="h-[52px] w-[52px] flex-shrink-0 flex items-center justify-center rounded-2xl text-white font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-indigo-500/30"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        {loading ? <RotateCcw size={19} className="animate-spin" /> : <Send size={19} />}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
                    StudyAI may make mistakes. Always verify critical information.
                </p>
            </div>

            {/* ── Toast notification ──────────────────────────────────────── */}
            {toast.msg && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-xl flex items-center gap-2 transition-all animate-fade-in ${toast.type === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-indigo-600 text-white shadow-indigo-500/40'
                    }`}>
                    <Sparkles size={15} />
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default Chatbot;
