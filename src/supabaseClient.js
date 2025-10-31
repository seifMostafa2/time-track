import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ovazsnblvbvefsmhxwhw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92YXpzbmJsdmJ2ZWZzbWh4d2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NDk4MTEsImV4cCI6MjA3NjAyNTgxMX0.sfDhYu7QwrgJfdc_ztqO5zlQ46nyE-OSLZY6jP675oo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)