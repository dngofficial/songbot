const { createClient } = require("@supabase/supabase-js");
const { requireEnv, supabaseUrl, supabaseKey } = require("../config");

let client;

function getSupabase() {
  if (!client) {
    requireEnv("SUPABASE_URL", "SUPABASE_KEY");
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

module.exports = { getSupabase };
