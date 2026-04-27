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
