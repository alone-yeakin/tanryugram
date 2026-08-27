import { getDb } from "./server/db.ts";
import { platformSettings } from "./drizzle/schema.ts";

async function run() {
  const db = await getDb();
  if (!db) return;
  const res = await db.select().from(platformSettings);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}

run();
