-- ============================================================
-- FULL SCHEMA — Smart AI Study Planner
-- Run this in InsForge Dashboard > SQL Editor to (re)create
-- ============================================================

-- ── Profiles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name            TEXT NOT NULL DEFAULT 'Student',
    email           TEXT,
    daily_goals     TEXT DEFAULT '',
    streak_count    INTEGER DEFAULT 0,
    last_active_date DATE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Add missing columns to existing profiles table if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='streak_count') THEN
    ALTER TABLE public.profiles ADD COLUMN streak_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_active_date') THEN
    ALTER TABLE public.profiles ADD COLUMN last_active_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='daily_goals') THEN
    ALTER TABLE public.profiles ADD COLUMN daily_goals TEXT DEFAULT '';
  END IF;
END $$;

-- ── Subjects ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name        TEXT NOT NULL,
    progress    INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='Users can view own subjects') THEN
    CREATE POLICY "Users can view own subjects"   ON public.subjects FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='Users can insert own subjects') THEN
    CREATE POLICY "Users can insert own subjects" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='Users can update own subjects') THEN
    CREATE POLICY "Users can update own subjects" ON public.subjects FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='Users can delete own subjects') THEN
    CREATE POLICY "Users can delete own subjects" ON public.subjects FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Questions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.questions (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id      UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    question_text   TEXT NOT NULL,
    answer_summary  TEXT NOT NULL DEFAULT '',
    is_completed    BOOLEAN DEFAULT false,
    is_bookmarked   BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Users can view own questions') THEN
    CREATE POLICY "Users can view own questions"   ON public.questions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Users can insert own questions') THEN
    CREATE POLICY "Users can insert own questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Users can update own questions') THEN
    CREATE POLICY "Users can update own questions" ON public.questions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Users can delete own questions') THEN
    CREATE POLICY "Users can delete own questions" ON public.questions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Chat History ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_history (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_history' AND policyname='Users can view own chats') THEN
    CREATE POLICY "Users can view own chats"   ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_history' AND policyname='Users can insert own chats') THEN
    CREATE POLICY "Users can insert own chats" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_history' AND policyname='Users can delete own chats') THEN
    CREATE POLICY "Users can delete own chats" ON public.chat_history FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, streak_count, last_active_date)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.metadata->>'name', 'Student'),
    1,
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
