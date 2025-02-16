import { Socket } from "node:net";
import Console from "../environment/Console";
import { DatabaseType } from "@/typing/database";

const DatabaseConsoleInstance = new Console({
  Prefix: "Database Client",
});

let DatabaseConnection: Socket | null = null;
let isConnected = false;
const database = process.env.DATABASE_NAME ?? "defaultdb";

if (!DatabaseConnection) {
  DatabaseConnection = (globalThis as any).DatabaseConnection ?? null;
}

if (!isConnected) {
  isConnected = (globalThis as any).isConnected;
}

const Alert = (message: string, namespace: string) => {
  setTimeout(() => {
    fetch(
      process.env.WEBHOOK_URL ?? "",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              title: `Database Execution | ${namespace}`,
              description: `\`\`\`json\n${
                message.length > 2086
                  ? message.substring(0, 2086) + "..."
                  : message
              }\`\`\``,
              color: 0x00ae86,
              timestamp: new Date(),
              footer: {
                text: "Scarware | Database Client",
              },
            },
          ],
        }),
      }
    );
  }, 1500);
};

export default class Database {
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectInterval = 5000;

  public static async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!DatabaseConnection) {
        const socket = new Socket();
        const Url = process.env.DATABASE_URL ?? "localhost:4047";
        const [host, port] = Url.split(":");

        socket.connect({
          host: host ?? "localhost",
          port: parseInt(port) ?? 4047,
        });

        socket.on("connect", () => {
          DatabaseConsoleInstance.Success("Connected to the database.");

          DatabaseConnection = socket;
          (globalThis as any).DatabaseConnection = socket;

          DatabaseConnection.on("data", (data) => {
            if (isConnected) return;

            const response = data.toString();

            try {
              if (response) {
                if (!response.startsWith("{")) {
                  DatabaseConsoleInstance.Debug("Connect>> " + response);
                  Alert(response, "Connect");
                  return;
                }
                const JsonResponse = JSON.parse(response);

                Alert(JSON.stringify(JsonResponse, null, 2), "Connect");

                if (JsonResponse.connection == "error") {
                  DatabaseConsoleInstance.Error(
                    `${JsonResponse.message} | ${JsonResponse.error ?? ""}`
                  );
                } else {
                  if (!JsonResponse.auth) {
                    DatabaseConsoleInstance.Debug(
                      "Something went wrong, please check the database logs."
                    );
                  }

                  if (JsonResponse.auth == "required") {
                    DatabaseConsoleInstance.Debug(
                      "Authentication {required} | Sending credentials."
                    );

                    DatabaseConnection?.write(
                      JSON.stringify({
                        auth: {
                          user: process.env.DATABASE_USER ?? "",
                          password: process.env.DATABASE_PASSWORD ?? "",
                          database,
                        },
                      })
                    );
                  } else {
                    if (JsonResponse.auth == "complete") {
                      isConnected = true;
                      (globalThis as any).isConnected = true;

                      DatabaseConsoleInstance.Debug(
                        `States | Connection > ${isConnected}`
                      );

                      setTimeout(resolve, 200);
                    }
                  }
                }
              }
            } catch (error: any) {
              DatabaseConsoleInstance.Error(
                `Error: ${error.message} [${error.name} | ${error.stack}]`
              );
            }
          });
        });

        socket.on("error", (error) => {
          if ((error as any).code === "ECONNREFUSED") {
            DatabaseConsoleInstance.Error(
              "Error: Connection refused, please ensure the database is running."
            );

            reject(null);
            return;
          }

          if ((error as any).code === "ECONNRESET") {
            DatabaseConsoleInstance.Error(
              "Error: Connection reset, attempting to reconnect..."
            );

            if (Database.reconnectAttempts < Database.maxReconnectAttempts) {
              Database.reconnectAttempts++;
              setTimeout(() => {
                Database.connect().then(resolve).catch(reject);
              }, Database.reconnectInterval);
            } else {
              DatabaseConsoleInstance.Error(
                "Max reconnect attempts reached, unable to reconnect."
              );
              reject(null);
            }
            return;
          }

          DatabaseConsoleInstance.Error(
            `Error: ${error.message} [${error.name} | ${error.stack}]`
          );
          console.log((error as any)?.errors);
          reject(null);

          socket.destroy();
        });
      } else {
        resolve();
      }
    });
  }

  public static async ExecRaw(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (DatabaseConnection) {
        DatabaseConnection.write(
          JSON.stringify({
            database,
            query: query,
          })
        );

        DatabaseConnection.once("data", (data) => {
          const response = data.toString();
          if (!response.startsWith("{")) {
            DatabaseConsoleInstance.Debug("ExecRaw>> " + response);
            Alert(response, "ExecRaw");
            return;
          }

          const JsonResponse = JSON.parse(response);

          Alert(JSON.stringify(JsonResponse, null, 2), "ExecRaw");

          if (JsonResponse && JsonResponse.query) {
            if (JsonResponse.connection === "success") {
              DatabaseConsoleInstance.Success(
                `Query executed successfully: ${JsonResponse.data.message}`
              );

              if (JsonResponse.data.data) {
                resolve(JsonResponse.data.data);
              } else {
                resolve(JsonResponse.data.message);
              }
            } else {
              DatabaseConsoleInstance.Error(
                `Query execution failed: ${JsonResponse.message}`
              );

              reject(JsonResponse.message);
            }
          }
        });
      } else {
        DatabaseConsoleInstance.Error(
          "No database connection found, please connect first."
        );

        reject("No database connection found.");
      }
    });
  }

  public static ping(): Promise<number | string> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      if (DatabaseConnection) {
        DatabaseConnection.write("PING");

        DatabaseConnection.once("data", (data) => {
          const response = data.toString();
          Alert(response, "PING");

          if (response === "PONG") {
            const endTime = Date.now();
            const latency = endTime - startTime;

            resolve(latency);
          }
        });

        DatabaseConnection.once("error", (error) => {
          reject(error);
        });
      } else {
        reject("No database connection found.");
      }
    });
  }

  public static retrieve(): DatabaseType | null {
    return DatabaseConnection ? this : null;
  }
}
