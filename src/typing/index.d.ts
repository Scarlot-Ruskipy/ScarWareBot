import { Client } from "discord.js"

interface ScarWareClient extends Client {
    commands?: Map<string, any>;
}