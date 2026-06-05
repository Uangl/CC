const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'cuoti.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    phone       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    nickname    TEXT    NOT NULL DEFAULT '',
    role        TEXT    NOT NULL DEFAULT 'user',
    grade       INTEGER NOT NULL DEFAULT 3,
    avatar_url  TEXT    DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mistakes (
    id                   TEXT    PRIMARY KEY,
    user_id              INTEGER NOT NULL,
    image_uri            TEXT    DEFAULT '',
    grade                INTEGER NOT NULL DEFAULT 3,
    question_text        TEXT    NOT NULL,
    student_answer       TEXT    NOT NULL DEFAULT '',
    correct_answer       TEXT    NOT NULL DEFAULT '',
    explanation          TEXT    DEFAULT '',
    knowledge_point_id   TEXT    NOT NULL,
    knowledge_point_name TEXT    NOT NULL,
    mistake_reason       TEXT    NOT NULL DEFAULT 'knowledge_gap',
    difficulty           INTEGER NOT NULL DEFAULT 1,
    status               TEXT    NOT NULL DEFAULT 'captured',
    review_stage         TEXT    NOT NULL DEFAULT 'D0',
    next_review_at       TEXT,
    feynman_explanation  TEXT,
    feynman_score        REAL,
    created_at           TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at           TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS variant_questions (
    id                   TEXT    PRIMARY KEY,
    mistake_id           TEXT    NOT NULL,
    question_text        TEXT    NOT NULL,
    answer               TEXT    NOT NULL,
    explanation          TEXT    DEFAULT '',
    knowledge_point_id   TEXT    NOT NULL,
    difficulty           INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (mistake_id) REFERENCES mistakes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS review_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    mistake_id TEXT    NOT NULL,
    date       TEXT    NOT NULL DEFAULT (datetime('now')),
    stage      TEXT    NOT NULL,
    passed     INTEGER NOT NULL DEFAULT 0,
    score      REAL,
    FOREIGN KEY (mistake_id) REFERENCES mistakes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_mistakes_user ON mistakes(user_id);
  CREATE INDEX IF NOT EXISTS idx_mistakes_status ON mistakes(status);
  CREATE INDEX IF NOT EXISTS idx_variants_mistake ON variant_questions(mistake_id);
  CREATE INDEX IF NOT EXISTS idx_review_mistake ON review_history(mistake_id);
`);

// ── Seed admin + test accounts ──────────────────────────
function seedAccounts() {
  const upsert = db.prepare(`
    INSERT INTO users (phone, password, nickname, role, grade)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(phone) DO UPDATE SET
      password = excluded.password,
      role     = excluded.role
  `);

  const adminPwd = bcrypt.hashSync('admin123', 10);
  const testPwd  = bcrypt.hashSync('test123', 10);

  upsert.run('admin',    adminPwd, '管理员',   'admin', 3);
  upsert.run('test',     testPwd,  '测试同学', 'user',  4);
  upsert.run('xiaoming', testPwd,  '小明',     'user',  5);
}

seedAccounts();

module.exports = db;
