import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "sign.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    signature_data TEXT NOT NULL,
    signed_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    UNIQUE(meeting_id, teacher_id)
  );
`);

// Seed default departments and teachers if empty
const deptCount = (db.prepare("SELECT COUNT(*) as c FROM departments").get() as { c: number }).c;
if (deptCount === 0) {
  const depts = ["국어과", "수학과", "영어과", "과학과", "사회과", "예체능과", "담임교사"];
  const insertDept = db.prepare("INSERT INTO departments (name) VALUES (?)");
  const insertTeacher = db.prepare("INSERT INTO teachers (department_id, name) VALUES (?, ?)");

  for (const dept of depts) {
    const result = insertDept.run(dept);
    insertTeacher.run(result.lastInsertRowid, "선생님1");
    insertTeacher.run(result.lastInsertRowid, "선생님2");
  }
}

export default db;
