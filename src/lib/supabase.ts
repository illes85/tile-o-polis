import { createClient } from '@supabase/supabase-js';

// Átmeneti fix: behelyettesített értékek
const supabaseUrl = "https://kkjkcbplhouxnvqkucaa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtramtjYnBsaG91eG52cWt1Y2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDAyOTMsImV4cCI6MjA4MjAxNjI5M30.UAMHq-2qHX2KaqUhkRdAqXbw079sX-HFeCPBbs-E8Wo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);