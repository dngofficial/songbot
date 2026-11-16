const { getSupabase } = require("./supabase");

const SONGS_TABLE = "songs";
const REQUESTS_TABLE = "song_requests";

/** "Black Knife" -> "black-knife". Used as the primary key in both tables. */
function toSongId(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

async function getSong(id) {
  const { data, error } = await getSupabase()
    .from(SONGS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createRequest(request) {
  const { data, error } = await getSupabase().rpc("submit_song_request", { p_request: request });
  if (error) throw error;
  return data;
}

async function getNextRequest() {
  const { data, error, count } = await getSupabase()
    .from(REQUESTS_TABLE)
    .select("*", { count: "exact" })
    .limit(1);
  if (error) throw error;
  const request = data[0] ?? null;
  if (request && !request.review_version) {
    throw new Error("Apply sql/song_request_workflow.sql in Supabase before reviewing requests.");
  }
  return { request, remaining: count ?? 0 };
}

async function reviewRequest(request, approve) {
  const { data, error } = await getSupabase().rpc("review_song_request", {
    p_request_id: request.id,
    p_review_version: request.review_version,
    p_song_id: toSongId(request.title?.trim() || request.id),
    p_approve: approve,
  });
  if (error) throw error;
  return data;
}

module.exports = {
  toSongId,
  getSong,
  createRequest,
  getNextRequest,
  reviewRequest,
};
