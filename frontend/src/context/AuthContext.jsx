import React, { createContext, useState, useEffect } from 'react';
import { insforge } from '../api/insforge';

export const AuthContext = createContext();

// ─── Shared streak calculator ─────────────────────────────────────────────────
const computeStreak = (profile) => {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile?.last_active_date
        ? (typeof profile.last_active_date === 'string'
            ? profile.last_active_date.split('T')[0]
            : profile.last_active_date)
        : null;

    if (lastActive === today) {
        // Already updated today — no change
        return { streakCount: profile?.streak_count || 1, needsUpdate: false };
    }

    let streakCount = 1;
    if (lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        streakCount = lastActive === yesterdayStr
            ? (profile?.streak_count || 0) + 1
            : 1;
    }
    return { streakCount, needsUpdate: true, today };
};

// ─── Shared profile + streak fetch ───────────────────────────────────────────
const fetchProfileWithStreak = async (userId) => {
    const { data: profile } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    const { streakCount, needsUpdate, today } = computeStreak(profile);

    if (needsUpdate) {
        // Fire-and-forget — don't block login/session load on this
        insforge.database.from('profiles')
            .upsert({
                id: userId,
                name: profile?.name || 'Student',
                streak_count: streakCount,
                last_active_date: today,
            }, { onConflict: 'id' })
            .then(({ error }) => {
                if (error) console.warn('Streak update failed:', error);
            });
    }

    return {
        ...(profile || {}),
        streak_count: streakCount,
        last_active_date: today || profile?.last_active_date,
    };
};

// ─── Provider ────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data, error } = await insforge.auth.getCurrentUser();
                if (error || !data?.user) throw new Error('No session');

                const profile = await fetchProfileWithStreak(data.user.id);
                setUser({ ...data.user, ...profile });
            } catch {
                // Not logged in — expected, don't log error
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        const { data, error } = await insforge.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data?.user) {
            const profile = await fetchProfileWithStreak(data.user.id);
            setUser({ ...data.user, ...profile });
        }
        return data;
    };

    const register = async (name, email, password) => {
        const { data, error } = await insforge.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        const { error } = await insforge.auth.signOut();
        if (error) throw error;
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
