import Database from "../../database";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
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
        .addAttachmentOption((option) =>
          option
            .setName("image")
            .setDescription("The image of the sneakpeak.")
            .setRequired(false)
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
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("purge").setDescription("Purge all sneakpeaks.")
    )
    .setContexts(InteractionContextType.Guild),
  flags: {
    _dir: __filename,
    required_roles: ["1273615629097898025"],
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
      const image = interaction.options.getAttachment("image");
      const id = Math.random().toString(36).substring(2, 15);

      await DatabaseClient.ExecRaw(
        `INSERT INTO sneakpeaks (id, title, description) VALUES ('${id}', '${title}', '${description}')`
      );

      const SneakpeaksChannel = interaction?.guild.channels.cache.get(
        "1339274201994887292"
      );
      if (SneakpeaksChannel?.isTextBased()) {
        const now_in_unix = Math.floor(Date.now() / 1000);

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(
            `
            **\`Created At:\`** <t:${now_in_unix}:R>
            **\`Created By:\`** ${interaction.user}
            **\`Sneakpeak ID:\`** \`${id}\`\n
            **\`Description:\`**\n \`\`\`${description}\`\`\`
          `
          )
          .setColor(0x2e3665)
          .setTimestamp()
          .setFooter({
            text: "Scarware | Sneakpeaks",
          });

        if (image) {
          embed.setImage(image.url);
        }

        await SneakpeaksChannel.send({
          embeds: [embed],
        });
      }

      await interaction.reply({
        content: "Sneakpeak has been created.",
      });
    } else if (subcommand === "update") {
      await interaction.reply({
        content: "This command is still in development.",
      });
    } else if (subcommand === "delete") {
      const id = interaction.options.getString("id", true);

      await DatabaseClient.ExecRaw(`DROP id = '${id}' FROM sneakpeaks`);

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
        await interaction.reply({
          embeds: [embed],
        });
      } else {
        const itemsPerPage = 5;
        let currentPage = 0;
        const totalPages = Math.ceil(Sneakpeaks.length / itemsPerPage);

        const generateEmbed = (page) => {
          const start = page * itemsPerPage;
          const end = start + itemsPerPage;
          const currentSneakpeaks = Sneakpeaks.slice(start, end);

          const embed = new EmbedBuilder()
            .setTitle("Sneakpeaks")
            .setColor(0x2e3665)
            .setFooter({
              text: `Page ${page + 1} of ${totalPages}`,
            });

          let peaks: any[] = [];
          for (const Sneakpeak of currentSneakpeaks) {
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
          return embed;
        };

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages - 1),
          new ButtonBuilder()
            .setCustomId("end")
            .setLabel("End")
            .setStyle(ButtonStyle.Danger)
        );

        const message = await interaction.reply({
          embeds: [generateEmbed(currentPage)],
          components: [row],
          fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000,
        });

        collector.on("collect", async (i) => {
          if (i.user.id !== interaction.user.id) {
            await i.reply({
              content: "You cannot interact with this button.",
              ephemeral: true,
            });
            return;
          }

          if (i.customId === "prev") {
            currentPage--;
          } else if (i.customId === "next") {
            currentPage++;
          } else if (i.customId === "end") {
            return collector.stop();
          }

          await i.update({
            embeds: [generateEmbed(currentPage)],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId("prev")
                  .setLabel("Previous")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(currentPage === 0),
                new ButtonBuilder()
                  .setCustomId("next")
                  .setLabel("Next")
                  .setStyle(ButtonStyle.Primary)
                  .setDisabled(currentPage === totalPages - 1),
                new ButtonBuilder()
                  .setCustomId("end")
                  .setLabel("End")
                  .setStyle(ButtonStyle.Danger)
              ),
            ],
          });
        });

        collector.on("end", async () => {
          await message.edit({
            components: [],
          });
        });
      }
    } else if (subcommand === "purge") {
      await DatabaseClient.ExecRaw("DROP * FROM sneakpeaks");

      await interaction.reply({
        content: "All sneakpeaks have been purged.",
      });
    } else {
      return interaction.reply({
        content: "Please provide a valid subcommand.",
      });
    }
  },
};
