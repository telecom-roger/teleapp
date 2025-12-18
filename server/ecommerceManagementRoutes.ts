import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { ecommerceCategories, ecommerceProducts, ecommerceProductCategories } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { blockCustomers } from "./middleware/auth";

const router = Router();

/**
 * GET /api/admin/ecommerce/categories
 * Lista todas as categorias
 */
router.get(
  "/categories",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const categories = await db
        .select()
        .from(ecommerceCategories)
        .orderBy(asc(ecommerceCategories.ordem), asc(ecommerceCategories.nome));

      res.json(categories);
    } catch (error: any) {
      console.error("Erro ao buscar categorias:", error);
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  }
);

/**
 * POST /api/admin/ecommerce/categories
 * Cria nova categoria
 */
router.post(
  "/categories",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { nome, slug, descricao, icone, cor, ativo, ordem } = req.body;

      const [category] = await db
        .insert(ecommerceCategories)
        .values({
          nome,
          slug: slug || nome.toLowerCase().replace(/\s+/g, "-"),
          descricao,
          icone,
          cor: cor || "blue",
          ativo: ativo !== undefined ? ativo : true,
          ordem: ordem || 0,
        })
        .returning();

      res.json(category);
    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
      res.status(500).json({ error: "Erro ao criar categoria" });
    }
  }
);

/**
 * PUT /api/admin/ecommerce/categories/:id
 * Atualiza categoria
 */
router.put(
  "/categories/:id",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nome, slug, descricao, icone, cor, ativo, ordem } = req.body;

      const [category] = await db
        .update(ecommerceCategories)
        .set({
          nome,
          slug,
          descricao,
          icone,
          cor,
          ativo,
          ordem,
          updatedAt: new Date(),
        })
        .where(eq(ecommerceCategories.id, id))
        .returning();

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      res.json(category);
    } catch (error: any) {
      console.error("Erro ao atualizar categoria:", error);
      res.status(500).json({ error: "Erro ao atualizar categoria" });
    }
  }
);

/**
 * DELETE /api/admin/ecommerce/categories/:id
 * Deleta categoria
 */
router.delete(
  "/categories/:id",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar se existem produtos usando esta categoria
      const products = await db
        .select()
        .from(ecommerceProducts)
        .where(eq(ecommerceProducts.categoria, id))
        .limit(1);

      if (products.length > 0) {
        return res.status(400).json({
          error: "Não é possível excluir categoria com produtos associados",
        });
      }

      await db
        .delete(ecommerceCategories)
        .where(eq(ecommerceCategories.id, id));

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar categoria:", error);
      res.status(500).json({ error: "Erro ao deletar categoria" });
    }
  }
);

/**
 * GET /api/admin/ecommerce/products
 * Lista todos os produtos/planos
 */
router.get("/products", blockCustomers, async (req: Request, res: Response) => {
  try {
    const { categoria, ativo } = req.query;

    let query = db.select().from(ecommerceProducts).$dynamic();

    if (categoria) {
      query = query.where(eq(ecommerceProducts.categoria, categoria as string));
    }

    if (ativo !== undefined) {
      query = query.where(eq(ecommerceProducts.ativo, ativo === "true"));
    }

    const products = await query.orderBy(
      asc(ecommerceProducts.ordem),
      asc(ecommerceProducts.nome)
    );

    // Buscar categorias para cada produto
    const productsWithCategories = await Promise.all(
      products.map(async (product) => {
        const categorias = await db
          .select({
            slug: ecommerceProductCategories.categorySlug,
          })
          .from(ecommerceProductCategories)
          .where(eq(ecommerceProductCategories.productId, product.id));

        return {
          ...product,
          categorias: categorias.map((c) => c.slug),
        };
      })
    );

    res.json(productsWithCategories);
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

/**
 * POST /api/admin/ecommerce/products
 * Cria novo produto/plano
 */
router.post(
  "/products",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { categorias, ...productData } = req.body;

      console.log("📝 CREATE produto recebido:", {
        nome: productData.nome,
        categorias,
        categoriasLength: categorias?.length,
        beneficios: productData.beneficios,
        diferenciais: productData.diferenciais,
        temBeneficios: Array.isArray(productData.beneficios),
        temDiferenciais: Array.isArray(productData.diferenciais),
      });

      const [product] = await db
        .insert(ecommerceProducts)
        .values(productData)
        .returning();

      // Salvar categorias na tabela de relacionamento
      if (categorias && Array.isArray(categorias) && categorias.length > 0) {
        console.log("💾 Salvando categorias:", categorias);
        await db.insert(ecommerceProductCategories).values(
          categorias.map((categorySlug: string) => ({
            productId: product.id,
            categorySlug,
          }))
        );
      }

      console.log("✅ Produto criado:", {
        nome: product.nome,
        categorias,
        beneficios: product.beneficios,
        diferenciais: product.diferenciais,
      });

      res.json(product);
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      res.status(500).json({ error: "Erro ao criar produto" });
    }
  }
);

/**
 * PUT /api/admin/ecommerce/products/:id
 * Atualiza produto/plano
 */
router.put(
  "/products/:id",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { categorias, ...productData } = req.body;

      console.log("📝 UPDATE produto recebido:", {
        id,
        categorias,
        categoriasLength: categorias?.length,
        beneficios: productData.beneficios,
        diferenciais: productData.diferenciais,
        temBeneficios: Array.isArray(productData.beneficios),
        temDiferenciais: Array.isArray(productData.diferenciais),
      });

      const [product] = await db
        .update(ecommerceProducts)
        .set({
          ...productData,
          updatedAt: new Date(),
        })
        .where(eq(ecommerceProducts.id, id))
        .returning();

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Atualizar categorias: deletar antigas e inserir novas
      if (categorias && Array.isArray(categorias)) {
        console.log("🗑️ Deletando categorias antigas do produto:", id);
        // Deletar categorias antigas
        await db
          .delete(ecommerceProductCategories)
          .where(eq(ecommerceProductCategories.productId, id));

        // Inserir novas categorias
        if (categorias.length > 0) {
          console.log("💾 Salvando novas categorias:", categorias);
          await db.insert(ecommerceProductCategories).values(
            categorias.map((categorySlug: string) => ({
              productId: id,
              categorySlug,
            }))
          );
        }
      }

      console.log("✅ Produto atualizado:", {
        nome: product.nome,
        categorias,
        beneficios: product.beneficios,
        diferenciais: product.diferenciais,
      });

      res.json(product);
    } catch (error: any) {
      console.error("Erro ao atualizar produto:", error);
      res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  }
);

/**
 * DELETE /api/admin/ecommerce/products/:id
 * Deleta produto/plano
 */
router.delete(
  "/products/:id",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await db.delete(ecommerceProducts).where(eq(ecommerceProducts.id, id));

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar produto:", error);
      res.status(500).json({ error: "Erro ao deletar produto" });
    }
  }
);

export default router;
