-- CineWorld Clips v4 — D1 Database Schema
-- Run with: wrangler d1 execute cwc-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  displayName TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  isActive INTEGER DEFAULT 1,
  isBanned INTEGER DEFAULT 0,
  banReason TEXT DEFAULT '',
  bannedUntil TEXT DEFAULT NULL,
  authProvider TEXT DEFAULT 'local',
  googleId TEXT DEFAULT '',
  emailVerified INTEGER DEFAULT 0,
  totpSecret TEXT DEFAULT '',
  totpEnabled INTEGER DEFAULT 0,
  lastLoginAt TEXT DEFAULT NULL,
  lastLoginIp TEXT DEFAULT '',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  token TEXT NOT NULL,
  family TEXT NOT NULL,
  isRevoked INTEGER DEFAULT 0,
  revokedReason TEXT DEFAULT '',
  replacedBy TEXT DEFAULT '',
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  videoUrl TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  region TEXT DEFAULT 'hollywood',
  category TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  rating REAL DEFAULT 0,
  views INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  trending INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT DEFAULT 'hollywood',
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS download_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  movieId INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  used INTEGER DEFAULT 0,
  expiresAt TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (movieId) REFERENCES movies(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  stripeSessionId TEXT UNIQUE,
  amount REAL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  plan TEXT DEFAULT '',
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE INDEX idx_movies_region ON movies(region);
CREATE INDEX idx_movies_created ON movies(createdAt);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
