// Reads supabase/schema.sql and outputs JSON body for management API
const fs = require("fs");
const path = require("path");

const sql = fs.readFileSync(
  path.join(__dirname, "..", "supabase", "schema.sql"),
  "utf8",
);
process.stdout.write(JSON.stringify({ query: sql }));
