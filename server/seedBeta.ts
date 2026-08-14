import { drizzle } from "drizzle-orm/mysql2";
import { users, posts, stories, groups, groupMembers, groupMessages } from "../drizzle/schema";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    return;
  }
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seeding beta test accounts...");
  const testUsers = [
    { openId: "test-user-1", email: "user1@test.com", name: "Aria Sol", username: "ariasol", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&q=80", bio: "Visual designer & creator. Welcome to Tanryugram beta!" },
    { openId: "test-user-2", email: "user2@test.com", name: "Theo Makes", username: "theomakes", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&q=80", bio: "Building open source tools and photography." },
    { openId: "test-user-3", email: "user3@test.com", name: "Nadia Codes", username: "nadiacodes", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&q=80", bio: "Full stack engineer and writer." },
    { openId: "test-user-4", email: "user4@test.com", name: "Mika Studio", username: "mikastudio", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&q=80", bio: "Creative direction and editorial layouts." },
    { openId: "test-user-5", email: "user5@test.com", name: "Lena Ray", username: "lenaray", avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=96&q=80", bio: "Music producer and community builder." },
  ];

  for (const u of testUsers) {
    await db.insert(users).values(u).onDuplicateKeyUpdate({ set: { name: u.name, username: u.username } });
  }

  console.log("Seeding sample posts (5)...");
  const samplePosts = [
    { userId: 1, caption: "Welcome to the Tanryugram 200-person beta! Explore our calmer creator feed, rich stories, and instant messenger.", mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80", mediaType: "image" as const, location: "Global Beta", feeling: "excited" },
    { userId: 2, caption: "Just tested the new multi-image carousel post feature. Up to 10 photos with tags and smooth dot navigation work seamlessly.", mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80", mediaType: "image" as const, location: "Coastal Studio", feeling: "inspired" },
    { userId: 3, caption: "Voice notes with slide-to-cancel and WebRTC audio/video calls are fully live. Test it out with a friend today!", mediaUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80", mediaType: "image" as const, location: "Remote Lab", feeling: "productive" },
    { userId: 4, caption: "A clean, text-only wordmark and dual light/dark themes make every creator profile look polished and professional.", mediaUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80", mediaType: "image" as const, location: "Design HQ", feeling: "creative" },
    { userId: 5, caption: "Remember to use the Report a Bug button in account settings if you spot anything needing a tweak during our 200-user beta!", mediaUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80", mediaType: "image" as const, location: "Community Hub", feeling: "grateful" },
  ];

  for (const p of samplePosts) {
    await db.insert(posts).values(p);
  }

  console.log("Seeding sample stories (3)...");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const sampleStories = [
    { userId: 1, mediaUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80", mediaType: "image" as const, expiresAt },
    { userId: 2, mediaUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", mediaType: "image" as const, expiresAt },
    { userId: 3, mediaUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80", mediaType: "image" as const, expiresAt },
  ];

  for (const s of sampleStories) {
    await db.insert(stories).values(s);
  }

  console.log("Seeding sample group chat with welcome message...");
  const groupRes = await db.insert(groups).values({ name: "Tanryugram Beta Community", creatorId: 1, avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80" });
  const groupId = (groupRes[0] as any).insertId;

  await db.insert(groupMembers).values({ groupId, userId: 1, role: "admin" });
  await db.insert(groupMembers).values({ groupId, userId: 2, role: "member" });
  await db.insert(groupMembers).values({ groupId, userId: 3, role: "member" });

  await db.insert(groupMessages).values({ groupId, senderId: 1, content: "Welcome everyone to Tanryugram! Group chats, multi-image posts, stories, and calls are fully ready for our beta launch." });

  console.log("Beta seeding complete!");
  await connection.end();
}

seed().catch(console.error);
