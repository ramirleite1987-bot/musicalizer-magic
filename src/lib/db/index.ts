import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { getRequiredEnv } from "@/lib/env";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const sql = neon(getRequiredEnv("DATABASE_URL"));
    _db = drizzle(sql, { schema });
  }
  return _db;
}
