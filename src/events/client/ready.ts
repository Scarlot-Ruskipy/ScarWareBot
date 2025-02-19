import { ScarWareClient } from "../../typing";
import { ActivityType, Events } from "discord.js";
import Console from "../../environment/Console";
import Database from "../../database";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: ScarWareClient) {
    Console.GetByID("BaseConsole")?.Log(
      `Successfully started bot as "${client.user?.username}"`
    );

    if (!Database.retrieve()) {
      const channel = client.channels.cache.get("1312337842550210602");
      if (channel?.isTextBased()) {
        channel.messages
          .fetch()
          .then((messages) => {
            messages.forEach((message) => {
              setTimeout(function () {
                message.delete().catch((error) => {
                  Console.GetByID("BaseConsole")?.Log(
                    `Failed to delete message: ${error}`
                  );
                });
              }, 2500);
            });
          })
          .catch((error) => {
            Console.GetByID("BaseConsole")?.Log(
              `Failed to fetch messages: ${error}`
            );
          });
      }

      Database.connect()
        .then(() => {
          Database.ExecRaw(`
            NEW TABLE sneakpeaks (
              id TEXT PRIMARY,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              updated_at DATETIME DEFAULT UPDATE_TIMESTAMP,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `);
        })
        .catch((error) => {});
    } else {
      Console.GetByID("DatabaseClient")?.Log(
        "Database connection already exists."
      );
    }

    client.user?.setActivity({
      name: "FiveM",
      type: ActivityType.Competing,
    });
  },
};
