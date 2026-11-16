const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getSong, toSongId } = require("../../lib/songs");
const { buildSongEmbed } = require("../../lib/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("songinfo")
    .setDescription("Pull song data")
    .addStringOption((option) =>
      option.setName("song").setDescription("The name of the song").setRequired(true)
    ),

  async execute(interaction) {
    const id = toSongId(interaction.options.getString("song", true));
    if (!id) {
      return interaction.reply({ content: "Enter a song name.", flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const song = await getSong(id);
    if (!song) {
      return interaction.editReply("Song not found!");
    }

    await interaction.editReply({ embeds: [buildSongEmbed(song)] });
  },
};
