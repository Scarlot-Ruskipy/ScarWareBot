import Database from "../../database";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sneakpeak")
    .setDescription("Create, update, or delete a sneakpeak.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a sneakpeak.")
        .addStringOption((option) =>
          option
            .setName("title")
            .setDescription("The title of the sneakpeak.")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("The description of the sneakpeak.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("update")
        .setDescription("Update a sneakpeak.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("The sneakpeak ID of the sneakpeak.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setDescription("Delete a sneakpeak.")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("The sneakpeak ID of the sneakpeak.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all sneakpeaks.")
    ),
  flags: {
    _dir: __filename,
    owner: true,
  },
  async execute(interaction: ChatInputCommandInteraction<"cached">) {
    const DatabaseClient = Database.retrieve();

    if (!DatabaseClient) {
      await interaction.editReply({
        content: "Database connection does not exist.",
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "create") {
      const title = interaction.options.getString("title", true);
      const description = interaction.options.getString("description", true);

      await DatabaseClient.ExecRaw(
        `INSERT INTO sneakpeaks (id, title, description) VALUES ('${Math.random()
          .toString(36)
          .substring(2, 15)}', '${title}', '${description}')`
      );

      await interaction.reply({
        content: "Sneakpeak has been created.",
      });
    } else if (subcommand === "update") {
      await interaction.reply({
        content: "This command is still in development.",
      });
    } else if (subcommand === "delete") {
      const id = interaction.options.getString("id", true);

      await DatabaseClient.ExecRaw(`DELETE FROM sneakpeaks WHERE id = '${id}'`);

      await interaction.reply({
        content: "Sneakpeak has been deleted.",
      });
    } else if (subcommand === "list") {
      const embed = new EmbedBuilder()
        .setTitle("Sneakpeaks")
        .setDescription("List of all sneakpeaks.")
        .setColor(0x2e3665);

      const Sneakpeaks = await DatabaseClient.ExecRaw(
        "SELECT * FROM sneakpeaks"
      );

      if (Sneakpeaks.length === 0) {
        embed.addFields([
          {
            name: "No sneakpeaks found.",
            value: "No sneakpeaks have been created.",
          },
        ]);
      } else {
        let peaks: any[] = [];
        for (const Sneakpeak of Sneakpeaks) {
          peaks.push({
            name: `Sneakpeak ID: ${Sneakpeak.id}`,
            value: `**Title:** ${Sneakpeak.title}\n**Description:** ${
              Sneakpeak.description
            }\n**Created At:** ${new Date(
              Sneakpeak.created_at
            ).toLocaleString()}`,
          });
        }

        embed.addFields(peaks);
      }

      await interaction.reply({
        embeds: [embed],
      });
    } else {
      return interaction.reply({
        content: "Please provide a valid subcommand.",
      });
    }
  },
};
