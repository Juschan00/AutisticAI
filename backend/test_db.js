import "dotenv/config";
import prisma from "./src/lib/prisma.js";

async function main() {
  try {
    console.log("Testing database connection...");
    await prisma.$connect();
    console.log("Connection successful!");
    const count = await prisma.user.count();
    console.log("User count:", count);
  } catch (e) {
    console.error("Connection failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
