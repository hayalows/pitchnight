-- Dedicated Offscript database. Run deliberately in a NEW Neon Postgres project.
-- Never apply to the English Chat Finder or production Pitch Night database.
BEGIN;
CREATE TABLE IF NOT EXISTS offscript_analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id UUID NOT NULL UNIQUE,
  visitor_id UUID NOT NULL,
  session_id UUID NOT NULL,
  event_name TEXT NOT NULL CHECK (event_name IN (
    'page_view','presence','engagement','event_open','signup_open',
    'signup_submit','signup_success','board_open','prop_open','venue_open',
    'nav_click','share_click'
  )),
  page_path TEXT NOT NULL CHECK (length(page_path) BETWEEN 1 AND 180),
  event_edition TEXT NOT NULL DEFAULT 'main',
  country TEXT NOT NULL DEFAULT 'Unknown',
  device TEXT NOT NULL DEFAULT 'Unknown',
  browser TEXT NOT NULL DEFAULT 'Unknown',
  source TEXT NOT NULL DEFAULT 'Direct / unknown',
  campaign TEXT NOT NULL DEFAULT 'None',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offscript_analytics_time_idx ON offscript_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS offscript_analytics_event_time_idx ON offscript_analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS offscript_analytics_path_time_idx ON offscript_analytics_events (page_path, created_at DESC);
CREATE INDEX IF NOT EXISTS offscript_analytics_visitor_time_idx ON offscript_analytics_events (visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS offscript_analytics_session_time_idx ON offscript_analytics_events (session_id, created_at DESC);
CREATE TABLE IF NOT EXISTS offscript_analytics_login_attempts (
  fingerprint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (fingerprint, window_start)
);
COMMIT;
