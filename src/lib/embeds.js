const { EmbedBuilder } = require("discord.js");
const { isHttpUrl } = require("./validation");

const hasValue = (v) => v !== null && v !== undefined && String(v).trim() !== "";

function buildSongEmbed(song, { showRequester = false, footer } = {}) {
  const title = String(song.title ?? "").trim() || String(song.id ?? "").trim() || "Untitled song";
  const embed = new EmbedBuilder()
    .setTitle(title.slice(0, 256))
    .setColor("#00b0f4")
    .setTimestamp();

  if (isHttpUrl(song.url)) embed.setURL(song.url.trim());
  if (isHttpUrl(song.image)) embed.setImage(song.image.trim());
  if (footer) embed.setFooter({ text: footer });

  const stats = [
    ["BPM", song.bpm],
    ["Sample Rate", song.sample_rate],
    ["Encoder", song.encoder],
  ];
  for (const [name, value] of stats) {
    if (hasValue(value)) embed.addFields({ name, value: String(value).slice(0, 1024), inline: true });
  }

  if (hasValue(song.trivia)) {
    embed.addFields({ name: "Trivia", value: String(song.trivia).slice(0, 1024) });
  }

  if (showRequester) {
    const requester = String(song.requested_by ?? "").trim();
    embed.addFields({
      name: "Requested By",
      value: /^\d{1,20}$/.test(requester) ? `<@${requester}>` : "Unknown",
    });
  }

  return embed;
}

module.exports = { buildSongEmbed };
