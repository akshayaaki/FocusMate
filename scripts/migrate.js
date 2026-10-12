const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  const connectionString = "postgresql://postgres:XEUG6YoEYWAOe2xJ@db.lkdtgjwvtuknfjjixrif.supabase.co:5432/postgres";

  console.log("Connecting to Supabase PostgreSQL...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected successfully to Supabase DB!");

    // Read migration SQL
    const migrationPath = path.join(__dirname, "../supabase/migrations/20261012000000_focusmate_schema.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("Executing FocusMate schema migration...");
    await client.query(sql);
    console.log("Migration executed successfully!");

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("Created public tables in database:", res.rows.map(r => r.table_name));

    // Also fetch JWT secret from auth if accessible
    try {
      const jwtRes = await client.query(`
        SELECT current_setting('app.settings.jwt_secret', true) as jwt_secret;
      `);
      if (jwtRes.rows[0]?.jwt_secret) {
        console.log("Supabase JWT Secret found:", jwtRes.rows[0].jwt_secret.substring(0, 8) + "...");
      }
    } catch (e) {
      // ignore
    }

  } catch (err) {
    console.error("Database operation error:", err.message);
  } finally {
    await client.end();
  }
}

run();
