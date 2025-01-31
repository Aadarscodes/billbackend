require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = "https://mpqnptkuqoyisgjygbmv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcW5wdGt1cW95aXNnanlnYm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODAyODEsImV4cCI6MjA1Mzc1NjI4MX0.9cWUWi7TPsV1_huuUcAhGr_KfPYd8XTQeFxn7LLmaMc";

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;
