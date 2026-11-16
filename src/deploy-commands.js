const { REST, Routes } = require("discord.js");
const config = require("./config");
const { loadCommands } = require("./lib/loadCommands");

config.requireEnv("DISCORD_TOKEN", "CLIENT_ID");

const body = [...loadCommands().values()].map((command) => {
  const data = command.data.toJSON();
  if (config.guildId) delete data.contexts;
  return data;
});
const rest = new REST({ version: "10" }).setToken(config.token);

const route = config.guildId
  ? Routes.applicationGuildCommands(config.clientId, config.guildId)
  : Routes.applicationCommands(config.clientId);

rest
  .put(route, { body })
  .then((registered) => {
    const scope = config.guildId ? `guild ${config.guildId}` : "globally";
    console.log(`Registered ${registered.length} command(s) ${scope}.`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
