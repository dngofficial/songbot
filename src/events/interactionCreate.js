const { Events, MessageFlags } = require("discord.js");

const ERROR_MESSAGE = "There was an error while executing this command...";

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Error in /${interaction.commandName}:`, err);

      try {
        if (interaction.deferred && !interaction.replied) {
          await interaction.editReply({ content: ERROR_MESSAGE, embeds: [], components: [] });
        } else if (interaction.replied) {
          await interaction.followUp({ content: ERROR_MESSAGE, flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: ERROR_MESSAGE, flags: MessageFlags.Ephemeral });
        }
      } catch (replyErr) {
        console.error("Could not send error message:", replyErr);
      }
    }
  },
};
