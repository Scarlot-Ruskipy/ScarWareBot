console.clear();

//=== Imports ===\\
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { Client, REST, Routes } from "discord.js";
import Console from "./environment/Console";
import { ScarWareClient } from "./typing";

//=== Variables ===\\
let Enviroment: CustomEnvironment = (process as any).env;

//=== Setup ===\\
config();
const client: ScarWareClient = new Client({
  intents: 3276799,
});
const BaseConsoleInstance = new Console({
  Prefix: "ScarWare",
  id: "BaseConsole",
});
client.commands = new Map();

console.log(`\x1b[31m

  ██████  ▄████▄   ▄▄▄       ██▀███   █     █░ ▄▄▄       ██▀███  ▓█████ 
▒██    ▒ ▒██▀ ▀█  ▒████▄    ▓██ ▒ ██▒▓█░ █ ░█░▒████▄    ▓██ ▒ ██▒▓█   ▀ 
░ ▓██▄   ▒▓█    ▄ ▒██  ▀█▄  ▓██ ░▄█ ▒▒█░ █ ░█ ▒██  ▀█▄  ▓██ ░▄█ ▒▒███   
  ▒   ██▒▒▓▓▄ ▄██▒░██▄▄▄▄██ ▒██▀▀█▄  ░█░ █ ░█ ░██▄▄▄▄██ ▒██▀▀█▄  ▒▓█  ▄ 
▒██████▒▒▒ ▓███▀ ░ ▓█   ▓██▒░██▓ ▒██▒░░██▒██▓  ▓█   ▓██▒░██▓ ▒██▒░▒████▒
▒ ▒▓▒ ▒ ░░ ░▒ ▒  ░ ▒▒   ▓▒█░░ ▒▓ ░▒▓░░ ▓░▒ ▒   ▒▒   ▓▒█░░ ▒▓ ░▒▓░░░ ▒░ ░
░ ░▒  ░ ░  ░  ▒     ▒   ▒▒ ░  ░▒ ░ ▒░  ▒ ░ ░    ▒   ▒▒ ░  ░▒ ░ ▒░ ░ ░  ░
░  ░  ░  ░          ░   ▒     ░░   ░   ░   ░    ░   ▒     ░░   ░    ░   
      ░  ░ ░            ░  ░   ░         ░          ░  ░   ░        ░  ░
         ░                                                              
    
\x1b[0m`);

//=== Events ===\\
function RegisterEvents(SubDir: string | undefined) {
  const EventItems = fs.readdirSync(path.join(__dirname, SubDir || "events"));

  for (const EventItem of EventItems) {
    if (
      fs
        .lstatSync(path.join(__dirname, SubDir || "events", EventItem))
        .isDirectory()
    ) {
      RegisterEvents(path.join(SubDir || "events", EventItem));
    } else {
      if (EventItem.endsWith(".js")) {
        const Event = require(path.join(
          __dirname,
          SubDir || "events",
          EventItem
        )).default;

        BaseConsoleInstance.Debug(
          `Loaded ${Event.name} as an event {${
            Event.once ? "once" : "repeating"
          }}`
        );

        if (Event.once) {
          client.once(Event.name, (...args) => Event.execute(client, ...args));
        } else {
          client.on(Event.name, (...args) => Event.execute(client, ...args));
        }
      }
    }
  }
}
RegisterEvents(undefined);

//=== Commands ===\\
const Commands: any[] = [];
let pushed: boolean = false;
let totalCommands: number = 0;
let loadedCommands: number = 0;

function RegisterCommands(SubDir: string | undefined) {
  const CommandItems = fs.readdirSync(
    path.join(__dirname, SubDir || "commands")
  );

  totalCommands += CommandItems.filter((x) => x.endsWith(".js")).length;

  for (const CommandItem of CommandItems) {
    if (
      fs
        .lstatSync(path.join(__dirname, SubDir || "commands", CommandItem))
        .isDirectory()
    ) {
      RegisterCommands(path.join(SubDir || "commands", CommandItem));
    } else {
      if (CommandItem.endsWith(".js")) {
        const Command = require(path.join(
          __dirname,
          SubDir || "commands",
          CommandItem
        )).default;

        if ("data" in Command && "execute" in Command) {
          BaseConsoleInstance.Debug(`Loaded ${Command.data.name} as a command`);

          Commands.push(Command.data.toJSON());
          client.commands!.set(Command.data.name, Command);
          loadedCommands++;
        } else {
          BaseConsoleInstance.Error(
            `Failed to load ${CommandItem} as a command`
          );
        }
      }
    }
  }
}
RegisterCommands(undefined);

//=== REST ===\\
let loop = setInterval(() => {
  if (loadedCommands === totalCommands && !pushed) {
    const rest = new REST({ version: "10" }).setToken(
      Enviroment.DISCORD_BOT_TOKEN
    );

    (async () => {
      pushed = true;
      clearInterval(loop);

      try {
        BaseConsoleInstance.Debug(
          "Started refreshing application (/) commands."
        );

        await rest.put(Routes.applicationCommands(Enviroment.DISCORD_BOT_ID), {
          body: Commands,
        });

        BaseConsoleInstance.Success(
          "Successfully reloaded application (/) commands."
        );
      } catch (error: any) {
        BaseConsoleInstance.Error(
          `Failed to reload application (/) commands with error: ${error.message}`
        );
      }
    })();
  }
}, 1200);

//=== Login ===\\
client.login(Enviroment.DISCORD_BOT_TOKEN).catch((error) => {
  BaseConsoleInstance.Error(`Failed to login with error: ${error.message}`);
});
