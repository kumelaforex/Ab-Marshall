const SUPABASE_URL = "https://avpckfywuyuxwrrkgihc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2cGNrZnl3dXl1eHdycmtnaWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MjcxNjIsImV4cCI6MjEwNTMwMzE2Mn0.3zJSQhZB7nqX3Pz9dSR0Gbz8T_rIW0d-oLNhsYDaK5A";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);