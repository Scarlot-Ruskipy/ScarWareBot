import { fallbackSymbols } from "figures";

const ConsoleColour = {
  INFO: "\x1b[34m",
  SUCCESS: "\x1b[32m",
  WARN: "\x1b[33m",
  ERROR: "\x1b[31m",
  DEBUG: "\x1b[35m",
  RESET: "\x1b[0m",
};

const ConsoleEmojis = {
  INFO: fallbackSymbols.info,
  SUCCESS: fallbackSymbols.tick,
  WARN: fallbackSymbols.warning,
  ERROR: fallbackSymbols.cross,
  DEBUG: fallbackSymbols.nodejs,
};

let Consoles: Console[] = [];

interface ConsoleOptions {
  Prefix?: string;
  id?: string;
}

export default class Console {
  Prefix: string;
  id?: string;

  static GetInstances(): Console[] {
    return Consoles;
  }

  static GetByID(id: string): Console | undefined {
    return Consoles.find((console) => console.id === id);
  }

  constructor(Options: ConsoleOptions) {
    this.Prefix = Options.Prefix || "ScarWare";
    this.id =
      Options.id ||
      `${Options.Prefix}-${Math.random().toString(36).substring(7)}`;
    Consoles.push(this);
  }

  private formatMessage(
    colour: string,
    emoji: string,
    messages: string[]
  ): string {
    return `${colour}${emoji}  [${this.Prefix}]  ${
      ConsoleColour.RESET
    }${messages.join(" ")}${ConsoleColour.RESET}`;
  }

  Log(...messages: string[]): void {
    if (messages.length === 0) {
      console.log(
        `${ConsoleColour.ERROR}[ScarWare] No message was provided.${ConsoleColour.RESET}`
      );
      return;
    }
    console.log(
      this.formatMessage(ConsoleColour.INFO, ConsoleEmojis.INFO, messages)
    );
  }

  Error(...messages: string[]): void {
    if (messages.length === 0) {
      console.log(
        `${ConsoleColour.ERROR}[ScarWare] No message was provided.${ConsoleColour.RESET}`
      );
      return;
    }
    console.log(
      this.formatMessage(ConsoleColour.ERROR, ConsoleEmojis.ERROR, messages)
    );
  }

  Warn(...messages: string[]): void {
    if (messages.length === 0) {
      console.log(
        `${ConsoleColour.ERROR}[ScarWare] No message was provided.${ConsoleColour.RESET}`
      );
      return;
    }
    console.log(
      this.formatMessage(ConsoleColour.WARN, ConsoleEmojis.WARN, messages)
    );
  }

  Debug(...messages: string[]): void {
    if (messages.length === 0) {
      console.log(
        `${ConsoleColour.ERROR}[ScarWare] No message was provided.${ConsoleColour.RESET}`
      );
      return;
    }

    if (process.env.DEBUG == "1") {
      console.log(
        this.formatMessage(ConsoleColour.DEBUG, ConsoleEmojis.DEBUG, messages)
      );
    }
  }

  Success(...messages: string[]): void {
    if (messages.length === 0) {
      console.log(
        `${ConsoleColour.ERROR}[ScarWare] No message was provided.${ConsoleColour.RESET}`
      );
      return;
    }
    console.log(
      this.formatMessage(ConsoleColour.SUCCESS, ConsoleEmojis.SUCCESS, messages)
    );
  }

  Evaluate(code: string): any {
    try {
      return eval(`(${code})`);
    } catch (error: any) {
      this.Error(error);
    }
  }
}
