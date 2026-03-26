CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  title text NOT NULL,
  query text NOT NULL,
  abstract text,
  novelty_score numeric DEFAULT 0,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  author_name text DEFAULT 'Anonymous',
  paper_json jsonb
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard" ON public.leaderboard FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert to leaderboard" ON public.leaderboard FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON public.leaderboard FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);