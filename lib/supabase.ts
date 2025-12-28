import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxqkuinyvrlyvaakhbfg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4cWt1aW55dnJseXZhYWtoYmZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDI1NDksImV4cCI6MjA4MDExODU0OX0.9622jL07zogfK6wj5FzgAZ13LVpPtLkYPMgMAI6jeAY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
