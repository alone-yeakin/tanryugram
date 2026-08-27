import { getDb } from "./server/db.ts";
import { sql } from "drizzle-orm";

async function run() {
  const db = await getDb();
  if (!db) {
    console.error("No DB connection");
    process.exit(1);
  }

  try {
    console.log("Testing posts query...");
    const postsRes = await db.execute(sql`select id, userId, caption, mediaUrl, mediaType, isPremium, location, feeling, taggedUsers, likesCount, commentsCount, isHidden, createdAt from posts order by createdAt desc`);
    console.log(`Posts query success: ${postsRes[0].length} rows`);
  } catch (err) {
    console.error("Posts query failed:", err);
  }

  try {
    console.log("Testing marketplace query...");
    const marketplaceRes = await db.execute(sql`select id, badgeType, isPaid, price, updatedBy, updatedAt from badgeMarketplaceSettings`);
    console.log(`Marketplace query success: ${marketplaceRes[0].length} rows`);
  } catch (err) {
    console.error("Marketplace query failed:", err);
  }

  process.exit(0);
}

run();
