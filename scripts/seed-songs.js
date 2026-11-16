const songs = require("../data/songs.seed.json");
const { getSupabase } = require("../src/lib/supabase");

async function main() {
  const rows = Object.entries(songs).map(([id, song]) => ({ id, ...song }));
  const { error } = await getSupabase().from("songs").upsert(rows);
  if (error) throw error;
  console.log(`Seeded ${rows.length} song(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
