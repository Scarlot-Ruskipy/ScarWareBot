export type DatabaseType = {
  connect(): Promise<void>;
  ExecRaw(query: string): Promise<any[]>;
  retrieve(): Database | null;
  ping(): Promise<number | string>;
};
