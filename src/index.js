const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits } = require("discord.js");

const config = require("./config");
const { loadCommands } = require("./lib/loadCommands");
const { getSupabase } = require("./lib/supabase");

config.requireEnv("DISCORD_TOKEN");
getSupabase();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = loadCommands();

const eventsPath = path.join(__dirname, "events");
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"))) {
  const event = require(path.join(eventsPath, file));
  const handler = (...args) => event.execute(...args);
  if (event.once) client.once(event.name, handler);
  else client.on(event.name, handler);
}

client.on("error", (err) => console.error("Client error:", err));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));

client.login(config.token).catch((err) => {
  console.error("Login failed:", err);
  process.exitCode = 1;
});
