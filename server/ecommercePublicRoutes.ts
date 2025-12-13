import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { ecommerceCategories, ecommerceProducts, ecommerceAdicionais } from "@shared/schema";
import { eq, and, asc } from "drizzle-orm";

const router = Router();

/**
 * GET /api/ecommerce/public/categories
 * Lista categorias ativas para o público
 */
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await db
      .select()
      .from(ecommerceCategories)
      .where(eq(ecommerceCategories.ativo, true))
      .orderBy(asc(ecommerceCategories.ordem), asc(ecommerceCategories.nome));

    res.json(categories);
  } catch (error: any) {
    console.error("Erro ao buscar categorias públicas:", error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

/**
 * GET /api/ecommerce/public/products
 * Lista produtos ativos para o público
 * Query params: ?categoria=slug
 */
router.get("/products", async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query;
    
    let conditions = [eq(ecommerceProducts.ativo, true)];

    if (categoria && typeof categoria === "string") {
      conditions.push(eq(ecommerceProducts.categoria, categoria));
    }

    const products = await db
      .select()
      .from(ecommerceProducts)
      .where(and(...conditions))
      .orderBy(asc(ecommerceProducts.ordem), asc(ecommerceProducts.nome));

    res.json(products);
  } catch (error: any) {
    console.error("Erro ao buscar produtos públicos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

/**
 * GET /api/ecommerce/public/categories/:slug
 * Busca categoria específica por slug
 */
router.get("/categories/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const category = await db
      .select()
      .from(ecommerceCategories)
      .where(
        and(
          eq(ecommerceCategories.slug, slug),
          eq(ecommerceCategories.ativo, true)
        )
      )
      .limit(1);

    if (category.length === 0) {
      return res.status(404).json({ error: "Categoria não encontrada" });
    }

    res.json(category[0]);
  } catch (error: any) {
    console.error("Erro ao buscar categoria:", error);
    res.status(500).json({ error: "Erro ao buscar categoria" });
  }
});

/**
 * GET /api/ecommerce/public/adicionais
 * Lista todos os adicionais disponíveis
 */
router.get("/adicionais", async (req: Request, res: Response) => {
  try {
    const adicionais = await db
      .select()
      .from(ecommerceAdicionais)
      .orderBy(asc(ecommerceAdicionais.tipo), asc(ecommerceAdicionais.nome));

    res.json(adicionais);
  } catch (error: any) {
    console.error("Erro ao buscar adicionais:", error);
    res.status(500).json({ error: "Erro ao buscar adicionais" });
  }
});

export default router;
