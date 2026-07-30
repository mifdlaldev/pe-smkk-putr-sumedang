import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema/index";

export type Db = ReturnType<typeof createDb>;

/** Bind Cloudflare D1 database to Drizzle. */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
