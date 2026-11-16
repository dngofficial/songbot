const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require("discord.js");
const { createRequest, toSongId } = require("../../lib/songs");
const { isHttpUrl } = require("../../lib/validation");

const PG_UNIQUE_VIOLATION = "23505";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("request_song")
    .setDescription("Request a song to be added to the playlist")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((o) =>
      o.setName("name").setDescription("The name of the song").setRequired(true).setMaxLength(100)
    )
    .addIntegerOption((o) =>
      o.setName("bpm").setDescription("The bpm of the song").setRequired(true).setMinValue(1).setMaxValue(999)
    )
    .addStringOption((o) =>
      o.setName("sample_rate").setDescription("The sample rate of the song").setRequired(true).setMaxLength(30)
    )
    .addStringOption((o) =>
      o.setName("encoder").setDescription("The encoder used for the song").setRequired(true).setMaxLength(100)
    )
    .addStringOption((o) =>
      o.setName("url").setDescription("The URL of the song").setRequired(true).setMaxLength(500)
    )
    .addStringOption((o) =>
      o.setName("trivia").setDescription("Trivia about the song").setRequired(true).setMaxLength(1000)
    )
    .addStringOption((o) =>
      o.setName("image").setDescription("Image URL for the song").setRequired(true).setMaxLength(500)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const title = interaction.options.getString("name", true).trim();
    const sampleRate = interaction.options.getString("sample_rate", true).trim();
    const encoder = interaction.options.getString("encoder", true).trim();
    const trivia = interaction.options.getString("trivia", true).trim();
    const url = interaction.options.getString("url", true).trim();
    const image = interaction.options.getString("image", true).trim();

    if (!title || !sampleRate || !encoder || !trivia) {
      return interaction.editReply("Name, sample rate, encoder, and trivia must contain text.");
    }
    if (!isHttpUrl(url)) {
      return interaction.editReply("The song URL must be a valid http(s) link.");
    }
    if (!isHttpUrl(image)) {
      return interaction.editReply("The image must be a valid http(s) link.");
    }

    try {
      const submitted = await createRequest({
        id: toSongId(title),
        title,
        bpm: interaction.options.getInteger("bpm", true),
        sample_rate: sampleRate,
        encoder,
        url,
        trivia,
        image,
        requested_by: interaction.user.id,
      });
      if (!submitted) return interaction.editReply("That song is already in the playlist.");
    } catch (err) {
      if (err.code === PG_UNIQUE_VIOLATION) {
        return interaction.editReply("That song has already been requested.");
      }
      throw err;
    }

    await interaction.editReply("Song request registered!");
  },
};
