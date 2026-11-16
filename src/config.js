const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function requireEnv(...keys) {
  const missing = keys.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill them in."
    );
  }
}

module.exports = {
  requireEnv,
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  reviewerRole: process.env.REVIEWER_ROLE || "yellow",
};
