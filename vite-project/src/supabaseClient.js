import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://pkhncnnkjxzdscapboum.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBraG5jbm5ranh6ZHNjYXBib3VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzA1ODYsImV4cCI6MjA3NzQwNjU4Nn0.LUCAvMmUpIGCxusBN5vdbdSE8hWhxWKYWlpDKblGcDQ';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);