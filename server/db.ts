import { createClient, Client } from "@libsql/client";

let db: Client | null = null;

export async function initDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.log("Turso not configured — game logging disabled");
    return;
  }

  db = createClient({ url, authToken });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      played_at TEXT DEFAULT (datetime('now')),
      ip TEXT,
      grid_size INTEGER,
      duration_seconds INTEGER,
      player_score INTEGER,
      possible_score INTEGER,
      words_found TEXT,
      words_total INTEGER,
      board TEXT,
      player_name TEXT
    )
  `);

  // Migration for existing tables missing the player_name column
  try {
    await db.execute(`ALTER TABLE games ADD COLUMN player_name TEXT`);
  } catch (_) {
    // Column already exists
  }

  console.log("Turso database connected — game logging enabled");
}

export async function logGame(data: {
  ip: string;
  gridSize: number;
  duration: number;
  playerScore: number;
  possibleScore: number;
  wordsFound: { word: string; score: number }[];
  wordsTotal: number;
  board: string[][];
  playerName?: string;
}) {
  if (!db) return;
  try {
    await db.execute({
      sql: `INSERT INTO games (ip, grid_size, duration_seconds, player_score, possible_score, words_found, words_total, board, player_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.ip,
        data.gridSize,
        data.duration,
        data.playerScore,
        data.possibleScore,
        JSON.stringify(data.wordsFound),
        data.wordsTotal,
        JSON.stringify(data.board),
        data.playerName || null,
      ],
    });
  } catch (err) {
    console.error("Failed to log game:", err);
  }
}

export async function getLeaderboard(): Promise<{ name: string; score: number }[]> {
  if (!db) return [];
  try {
    const result = await db.execute(
      `SELECT player_name, player_score FROM games WHERE player_name IS NOT NULL ORDER BY player_score DESC LIMIT 10`
    );
    return result.rows.map((row) => ({
      name: row.player_name as string,
      score: row.player_score as number,
    }));
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
    return [];
  }
}
