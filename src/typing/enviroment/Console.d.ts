type ConsoleType = "ERROR" | "WARN" | "INFO" | "DEBUG" | "SUCCESS";

type ConsoleOptions = {
    Prefix: string | undefined;
    id?: string;
}