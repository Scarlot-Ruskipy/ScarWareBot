import { ScarWareClient } from "../../typing";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reload a command")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to reload")
        .setRequired(true)
    ),
  flags: {
    owner: true,
    _dir: __filename
  },
  async execute(interaction: ChatInputCommandInteraction<"cached">) {
    const commandName = interaction.options.getString("command")!;
    const command = (interaction.client as ScarWareClient).commands!.get(
      commandName
    );

    if (!command) {
      return interaction.reply({
        content: `There is no command with the name \`${commandName}\``,
        flags: MessageFlags.Ephemeral,
      });
    }

    const commandPath = require.resolve(command.flags._dir);
    delete require.cache[commandPath];

    const newCommand = (await import(commandPath)).default;
    
    (interaction.client as ScarWareClient).commands!.set(
      commandName,
      newCommand
    );

    interaction.reply({
      content: `Command \`${commandName}\` was reloaded!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
