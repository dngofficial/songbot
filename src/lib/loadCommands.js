const fs = require("node:fs");
const path = require("node:path");

const commandsDir = path.join(__dirname, "..", "commands");

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else if (entry.name.endsWith(".js")) yield fullPath;
  }
}

function loadCommands() {
  const commands = new Map();

  for (const file of walk(commandsDir)) {
    const command = require(file);
    if (!command?.data || typeof command.execute !== "function") {
      console.warn(`[commands] Skipping ${path.relative(commandsDir, file)}: missing "data" or "execute".`);
      continue;
    }
    commands.set(command.data.name, command);
  }

  return commands;
}

module.exports = { loadCommands };
