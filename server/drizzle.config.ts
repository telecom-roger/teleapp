import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../shared/schema.ts", // caminho para o schema correto
  out: "../migrations", // pasta para gerar migrações
  dialect: "postgresql", // <-- use 'dialect' em vez de 'driver'
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
