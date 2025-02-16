import Database from "../database";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  flags: {
    _dir: __filename,
  },
  async execute(interaction: ChatInputCommandInteraction<"cached">) {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });

    const DatabaseClient = Database.retrieve();

    if (!DatabaseClient) {
      await interaction.editReply({
        content: "Database connection does not exist.",
      });
      return;
    }

    const DatabasePing = await DatabaseClient.ping();

    const embed = new EmbedBuilder()
      .setTitle(":ping_pong: Pong!")
      .addFields(
        {
          name: ":stopwatch: Uptime",
          value: `${Math.round(interaction.client.uptime / 60000)} minute(s)`,
          inline: false,
        },
        {
          name: ":sparkling_heart: Websocket heartbeat",
          value: `${interaction.client.ws.ping}ms`,
          inline: false,
        },
        {
          name: ":bar_chart: Database latency",
          value: `${DatabasePing}ms`,
          inline: false,
        },
        {
          name: ":round_pushpin: Roundtrip Latency",
          value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`,
          inline: false,
        }
      )
      .setColor(0x00ae86);

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
