import "dotenv/config";
import pg from "pg";

const { Client } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log("Testing connection with pg client...");
  console.log("Connection string (masked):", connectionString.replace(/:.*@/, ":****@"));

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connection successful!");
    const res = await client.query("SELECT NOW()");
    console.log("Query result:", res.rows[0]);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

main();
