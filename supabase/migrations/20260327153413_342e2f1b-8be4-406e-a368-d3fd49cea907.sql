CREATE TABLE public.idea_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  idea_text text NOT NULL,
  review_json jsonb,
  similar_papers jsonb,
  overall_score numeric,
  novelty_score numeric,
  clarity_score numeric,
  title text
);

ALTER TABLE public.idea_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert idea reviews"
ON public.idea_reviews FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read idea reviews"
ON public.idea_reviews FOR SELECT TO anon, authenticated
USING (true);