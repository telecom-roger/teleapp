import type { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

export function setupMigrationRoute(app: Express) {
  // Rota temporária para executar migration
  app.post("/api/admin/run-migration-endereco", async (req: Request, res: Response) => {
    try {
      console.log("🚀 Executando migration: adicionar campo precisa_endereco_instalacao...");

      // Adicionar coluna
      await db.execute(sql`
        ALTER TABLE ecommerce_products 
        ADD COLUMN IF NOT EXISTS precisa_endereco_instalacao BOOLEAN DEFAULT false
      `);
      console.log("✅ Coluna precisa_endereco_instalacao adicionada");

      // Atualizar produtos existentes
      const result = await db.execute(sql`
        UPDATE ecommerce_products 
        SET precisa_endereco_instalacao = true 
        WHERE categoria IN ('fibra', 'banda larga', 'link dedicado', 'internet-dedicada')
          OR LOWER(categoria) LIKE '%fibra%'
          OR LOWER(categoria) LIKE '%banda larga%'
          OR LOWER(categoria) LIKE '%link dedicado%'
      `);
      console.log("✅ Produtos de instalação atualizados");

      res.json({ 
        success: true, 
        message: "Migration executada com sucesso!",
        rowsUpdated: result.rowCount 
      });
    } catch (error: any) {
      console.error("❌ Erro ao executar migration:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
}
