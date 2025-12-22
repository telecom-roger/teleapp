import { Router, type Request, type Response } from "express";
import { db } from "./db";
import {
  ecommerceCategories,
  ecommerceProducts,
  ecommerceProductCategories,
  ecommerceAdicionais,
  ecommerceBanners,
  ecommerceProductVariationGroups,
  ecommerceProductVariationOptions,
} from "@shared/schema";
import { eq, and, asc, lte, gte, or, isNull, sql } from "drizzle-orm";

const router = Router();

/**
 * GET /api/app/public/categories
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
 * GET /api/app/public/products
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

    // Buscar categorias para cada produto
    const productsWithCategories = await Promise.all(
      products.map(async (product) => {
        const categories = await db
          .select({
            slug: ecommerceProductCategories.categorySlug,
          })
          .from(ecommerceProductCategories)
          .where(eq(ecommerceProductCategories.productId, product.id));

        return {
          ...product,
          categorias: categories.map((c) => c.slug),
        };
      })
    );

    res.json(productsWithCategories);
  } catch (error: any) {
    console.error("Erro ao buscar produtos públicos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

/**
 * GET /api/app/public/categories/:slug
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
 * GET /api/app/public/adicionais
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

/**
 * GET /api/app/public/banners
 * Lista banners ativos para a página especificada
 * Query params: ?pagina=home
 */
router.get("/banners", async (req: Request, res: Response) => {
  try {
    const { pagina } = req.query;

    if (!pagina || typeof pagina !== "string") {
      return res
        .status(400)
        .json({ error: "Parâmetro 'pagina' é obrigatório" });
    }

    const now = new Date();

    // Busca banners ativos, da página especificada e dentro do período de validade
    const banners = await db
      .select()
      .from(ecommerceBanners)
      .where(
        and(
          eq(ecommerceBanners.ativo, true),
          eq(ecommerceBanners.pagina, pagina),
          // Data início: null OU no passado
          or(
            isNull(ecommerceBanners.dataInicio),
            lte(ecommerceBanners.dataInicio, now)
          ),
          // Data fim: null OU no futuro
          or(
            isNull(ecommerceBanners.dataFim),
            gte(ecommerceBanners.dataFim, now)
          )
        )
      )
      .orderBy(asc(ecommerceBanners.ordem), asc(ecommerceBanners.createdAt));

    res.json(banners);
  } catch (error: any) {
    console.error("Erro ao buscar banners públicos:", error);
    res.status(500).json({ error: "Erro ao buscar banners" });
  }
});

/**
 * GET /api/app/public/banners/:pagina
 * Lista banners ativos para a página especificada (alternativa com path param)
 */
router.get("/banners/:pagina", async (req: Request, res: Response) => {
  try {
    const { pagina } = req.params;

    const now = new Date();

    // Busca banners ativos, da página especificada e dentro do período de validade
    const banners = await db
      .select()
      .from(ecommerceBanners)
      .where(
        and(
          eq(ecommerceBanners.ativo, true),
          eq(ecommerceBanners.pagina, pagina),
          // Data início: null OU no passado
          or(
            isNull(ecommerceBanners.dataInicio),
            lte(ecommerceBanners.dataInicio, now)
          ),
          // Data fim: null OU no futuro
          or(
            isNull(ecommerceBanners.dataFim),
            gte(ecommerceBanners.dataFim, now)
          )
        )
      )
      .orderBy(asc(ecommerceBanners.ordem), asc(ecommerceBanners.createdAt));

    res.json(banners);
  } catch (error: any) {
    console.error("Erro ao buscar banners públicos:", error);
    res.status(500).json({ error: "Erro ao buscar banners" });
  }
});

/**
 * GET /api/app/public/products/:id/variations
 * Busca grupos de variação e opções de um produto específico
 */
router.get("/products/:id/variations", async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;

    // Buscar grupos de variação do produto (UUID ou número)
    const groups = await db
      .select()
      .from(ecommerceProductVariationGroups)
      .where(eq(ecommerceProductVariationGroups.productId, productId))
      .orderBy(asc(ecommerceProductVariationGroups.ordem));

    // Para cada grupo, buscar suas opções
    const groupsWithOptions = await Promise.all(
      groups.map(async (group) => {
        const options = await db
          .select()
          .from(ecommerceProductVariationOptions)
          .where(eq(ecommerceProductVariationOptions.groupId, group.id))
          .orderBy(asc(ecommerceProductVariationOptions.ordem));

        return {
          ...group,
          options,
        };
      })
    );

    res.json(groupsWithOptions);
  } catch (error: any) {
    console.error("Erro ao buscar variações do produto:", error);
    res.status(500).json({ error: "Erro ao buscar variações" });
  }
});

export default router;
