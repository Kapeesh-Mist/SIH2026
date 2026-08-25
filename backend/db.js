/* =========================================================
   FinTrack — tiny file-backed JSON database.
   Good enough to run the whole app end to end without setting
   up a real database server. Swap this module for a real
   Postgres/MySQL layer when you move past a prototype — every
   route only talks to the functions exported here.
   ========================================================= */
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'data', 'uploads');

function ensureDirs(){
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function defaultData(){
  return { users: [], schemes: [] };
}

function load(){
  ensureDirs();
  if (!fs.existsSync(DB_FILE)){
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData(), null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function save(data){
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { load, save, UPLOADS_DIR, DB_FILE };
