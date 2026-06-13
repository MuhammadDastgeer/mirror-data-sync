// Browser-only SQLite via sql.js, persisted to localStorage.
// Do NOT import this in server-side code.
import initSqlJs, { type Database } from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const STORAGE_KEY = "hospital_admin_sqlite_v3";

let dbPromise: Promise<Database> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  specialty TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  on_duty INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  gender TEXT,
  age INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER,
  doctor_id INTEGER,
  patient_name TEXT,
  patient_phone TEXT,
  doctor_name TEXT,
  department TEXT,
  type TEXT,
  reason TEXT,
  scheduled_at TEXT NOT NULL,
  scheduled_time TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled|confirmed|completed|cancelled|pending
  is_follow_up INTEGER NOT NULL DEFAULT 0,
  follow_up_date TEXT,
  follow_up_status TEXT, -- pending|overdue|completed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|paid
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS treatment_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active|done
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function persist(db: Database) {
  const data = db.export();
  const bin = btoa(String.fromCharCode(...data));
  localStorage.setItem(STORAGE_KEY, bin);
}

export function getDb(): Promise<Database> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SQLite is browser-only"));
  }
  if (!dbPromise) {
    dbPromise = initSqlJs({ locateFile: () => sqlWasmUrl }).then((SQL) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      let db: Database;
      if (stored) {
        const bin = atob(stored);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        db = new SQL.Database(bytes);
      } else {
        db = new SQL.Database();
      }
      db.run(SCHEMA);
      persist(db);
      return db;
    });
  }
  return dbPromise;
}

export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params as never);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as T);
  stmt.free();
  return rows;
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows[0] ?? null;
}

export async function exec(sql: string, params: unknown[] = []): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params as never);
  stmt.step();
  stmt.free();
  persist(db);
}
