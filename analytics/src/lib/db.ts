import "server-only";
import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;
let client: ReturnType<typeof neon> | null = null;
let connection: string | null = null;

export function databaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.startsWith("postgres"));
}
export async function query<T extends Row = Row>(statement: string, values: unknown[] = []): Promise<T[]> {
  const url = process.env.DATABASE_URL;
  if (!url || !databaseConfigured()) throw new Error("Offscript analytics database is not configured.");
  if (!client || connection !== url) {
    client = neon(url);
    connection = url;
  }
  return await client.query(statement, values) as T[];
}
export function number(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
