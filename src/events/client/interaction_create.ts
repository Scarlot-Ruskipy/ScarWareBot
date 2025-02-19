import { ScarWareClient } from "../../typing";
import { Events, GuildMemberRoleManager, Interaction, MessageFlags } from "discord.js";

export default {
  name: Events.InteractionCreate,
  once: false,
  execute(client: ScarWareClient, interaction: Interaction) {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    const command = client.commands!.get(commandName);

    if (!command) return;

    const { flags } = command;

    if (
      flags?.owner &&
      interaction.user.id !== process.env.DISCORD_BOT_OWNER_ID
    ) {
      return interaction.reply({
        content: "You do not have permission to run this command!",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (flags?.required_roles) {
      let hasRole = false;
      for (const role of flags.required_roles) {
        if ((interaction.member?.roles as GuildMemberRoleManager).cache.has(role)) {
          hasRole = true;

          break;
        }
      }

      if (!hasRole) {
        return interaction.reply({
          content: "You do not have permission to run this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    try {
      command.execute(interaction);
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
