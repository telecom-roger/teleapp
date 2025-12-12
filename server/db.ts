import "dotenv/config";
import pg from "pg"; // importa o módulo inteiro
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Cria pool de conexão com PostgreSQL local
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Opcional: teste rápido da conexão
pool
  .query("SELECT NOW()")
  .then((res) => console.log("Postgres conectado:", res.rows[0]));
