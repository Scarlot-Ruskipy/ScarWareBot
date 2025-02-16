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
      Database.connect()
        .then(() => {
          Database.ExecRaw(`
            CREATE TABLE IF NOT EXISTS sneakpeaks (
              id TEXT PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
          `)
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
