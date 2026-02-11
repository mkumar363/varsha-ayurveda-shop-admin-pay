const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "data", "db.json");

async function ensureDbFile() {
  await fsp.mkdir(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial = { meta: {}, products: [], orders: [], users: [] };
    await fsp.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fsp.readFile(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    // If db.json is corrupted, keep a backup and reset.
    const backup = DB_PATH.replace(/\.json$/i, `.${Date.now()}.bak.json`);
    await fsp.writeFile(backup, raw, "utf-8");
    const initial = { meta: {}, products: [], orders: [], users: [] };
    await fsp.writeFile(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

// Very small write lock to prevent concurrent writes in dev
let writing = Promise.resolve();

async function writeDb(nextDb) {
  await ensureDbFile();
  writing = writing.then(async () => {
    const tmp = DB_PATH + ".tmp";
    await fsp.writeFile(tmp, JSON.stringify(nextDb, null, 2), "utf-8");
    await fsp.rename(tmp, DB_PATH);
  });
  return writing;
}

module.exports = {
  DB_PATH,
  readDb,
  writeDb
};
