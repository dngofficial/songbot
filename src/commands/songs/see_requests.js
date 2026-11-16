const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  MessageFlags,
} = require("discord.js");

const config = require("../../config");
const { getNextRequest, reviewRequest } = require("../../lib/songs");
const { buildSongEmbed } = require("../../lib/embeds");

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const requestEmbed = (request, remaining) =>
  buildSongEmbed(request, {
    showRequester: true,
    footer: `${remaining} request${remaining === 1 ? "" : "s"} remaining`,
  });

function buildButtons(request, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve:${request.review_version}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`deny:${request.review_version}`)
      .setLabel("Deny")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

function hasReviewerRole(interaction) {
  return interaction.member?.roles?.cache?.some((role) => role.name === config.reviewerRole);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("see_requests")
    .setDescription("Review pending song requests")
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    if (!hasReviewerRole(interaction)) {
      return interaction.reply({
        content: "You do not have the required role!",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const { request: firstRequest, remaining } = await getNextRequest();
    let request = firstRequest;
    if (!request) {
      return interaction.editReply("There are no pending song requests.");
    }

    const message = await interaction.editReply({
      embeds: [requestEmbed(request, remaining)],
      components: [buildButtons(request)],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      idle: IDLE_TIMEOUT_MS,
    });

    let busy = false;
    let replyInteraction = interaction;
    const disableButtons = () => replyInteraction
      .editReply({ components: [buildButtons(request, true)] })
      .catch(() => {});

    collector.on("collect", async (i) => {
      const [action, version] = i.customId.split(":");
      if (busy || version !== request.review_version || !["approve", "deny"].includes(action)) {
        await i.deferUpdate().catch(() => {});
        return;
      }
      busy = true;

      try {
        await i.deferUpdate();
        replyInteraction = i;
        if (!hasReviewerRole(i)) {
          await i.followUp({
            content: "You do not have the required role!",
            flags: MessageFlags.Ephemeral,
          });
          return collector.stop("role");
        }

        const approved = action === "approve";
        const applied = await reviewRequest(request, approved);
        let verdict = "That request was already reviewed.";
        if (applied) verdict = approved ? "Song approved! ✅" : "Request denied. ❌";
        const next = await getNextRequest();

        if (!next.request) {
          await i.editReply({ content: `${verdict} No requests left.`, embeds: [], components: [] });
          return collector.stop("empty");
        }

        await i.editReply({
          content: verdict,
          embeds: [requestEmbed(next.request, next.remaining)],
          components: [buildButtons(next.request)],
        });
        request = next.request;
      } catch (err) {
        console.error("Failed to process request decision:", err);
        collector.stop("error");
        await i.followUp({
          content: "Could not finish the review. Run /see_requests to see the current queue.",
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      } finally {
        busy = false;
        if (collector.ended && collector.endReason !== "empty") await disableButtons();
      }
    });

    collector.on("end", async (_collected, reason) => {
      if (!busy && reason !== "empty") await disableButtons();
    });
  },
};
