const { Client } = require("pg");

async function check() {
  const client = new Client({
    connectionString: "postgresql://postgres:XEUG6YoEYWAOe2xJ@db.lkdtgjwvtuknfjjixrif.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const res = await client.query("SELECT name, secret FROM vault.decrypted_secrets");
    console.log("Vault secrets:", res.rows);
  } catch (e) {
    console.log("Vault query error:", e.message);
  }

  try {
    const res2 = await client.query("SHOW app.settings.jwt_secret");
    console.log("app.settings.jwt_secret:", res2.rows);
  } catch (e) {
    console.log("SHOW jwt_secret error:", e.message);
  }

  await client.end();
}

check();
