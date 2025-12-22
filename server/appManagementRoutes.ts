import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { 
  ecommerceCategories, 
  ecommerceProducts, 
  ecommerceProductCategories,
  ecommerceProductVariationGroups,
  ecommerceProductVariationOptions 
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";
import { blockCustomers } from "./middleware/auth";

const router = Router();

/**
 * GET /api/admin/app/categories
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
 * POST /api/admin/app/categories
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
 * PUT /api/admin/app/categories/:id
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
 * DELETE /api/admin/app/categories/:id
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
 * GET /api/admin/app/products
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
 * POST /api/admin/app/products
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
 * PUT /api/admin/app/products/:id
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
 * DELETE /api/admin/app/products/:id
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

// ==================== PRODUCT VARIATION GROUPS ====================

/**
 * GET /api/admin/app/products/:productId/variation-groups
 * Lista todos os grupos de variação de um produto
 */
router.get(
  "/products/:productId/variation-groups",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;

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
      console.error("Erro ao buscar grupos de variação:", error);
      res.status(500).json({ error: "Erro ao buscar grupos de variação" });
    }
  }
);

/**
 * POST /api/admin/app/products/:productId/variation-groups
 * Cria novo grupo de variação
 */
router.post(
  "/products/:productId/variation-groups",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { nome, tipoSelecao, obrigatorio, minSelecoes, maxSelecoes, ordem, ativo } = req.body;

      const [group] = await db
        .insert(ecommerceProductVariationGroups)
        .values({
          productId,
          nome,
          tipoSelecao: tipoSelecao || "radio",
          obrigatorio: obrigatorio !== undefined ? obrigatorio : true,
          minSelecoes: minSelecoes || 1,
          maxSelecoes: maxSelecoes || 1,
          ordem: ordem || 0,
          ativo: ativo !== undefined ? ativo : true,
        })
        .returning();

      res.json(group);
    } catch (error: any) {
      console.error("Erro ao criar grupo de variação:", error);
      res.status(500).json({ error: "Erro ao criar grupo de variação" });
    }
  }
);

/**
 * PUT /api/admin/app/products/:productId/variation-groups/:groupId
 * Atualiza grupo de variação
 */
router.put(
  "/products/:productId/variation-groups/:groupId",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { nome, tipoSelecao, obrigatorio, minSelecoes, maxSelecoes, ordem, ativo } = req.body;

      const [group] = await db
        .update(ecommerceProductVariationGroups)
        .set({
          nome,
          tipoSelecao,
          obrigatorio,
          minSelecoes,
          maxSelecoes,
          ordem,
          ativo,
          updatedAt: new Date(),
        })
        .where(eq(ecommerceProductVariationGroups.id, groupId))
        .returning();

      res.json(group);
    } catch (error: any) {
      console.error("Erro ao atualizar grupo de variação:", error);
      res.status(500).json({ error: "Erro ao atualizar grupo de variação" });
    }
  }
);

/**
 * DELETE /api/admin/app/products/:productId/variation-groups/:groupId
 * Deleta grupo de variação
 */
router.delete(
  "/products/:productId/variation-groups/:groupId",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;

      await db
        .delete(ecommerceProductVariationGroups)
        .where(eq(ecommerceProductVariationGroups.id, groupId));

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar grupo de variação:", error);
      res.status(500).json({ error: "Erro ao deletar grupo de variação" });
    }
  }
);

// ==================== PRODUCT VARIATION OPTIONS ====================

/**
 * POST /api/admin/app/products/:productId/variation-groups/:groupId/options
 * Cria nova opção de variação
 */
router.post(
  "/products/:productId/variation-groups/:groupId/options",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { nome, descricao, preco, valorTecnico, ordem, ativo } = req.body;

      const [option] = await db
        .insert(ecommerceProductVariationOptions)
        .values({
          groupId,
          nome,
          descricao,
          preco: preco || 0,
          valorTecnico,
          ordem: ordem || 0,
          ativo: ativo !== undefined ? ativo : true,
        })
        .returning();

      res.json(option);
    } catch (error: any) {
      console.error("Erro ao criar opção de variação:", error);
      res.status(500).json({ error: "Erro ao criar opção de variação" });
    }
  }
);

/**
 * PUT /api/admin/app/products/:productId/variation-groups/:groupId/options/:optionId
 * Atualiza opção de variação
 */
router.put(
  "/products/:productId/variation-groups/:groupId/options/:optionId",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { optionId } = req.params;
      const { nome, descricao, preco, valorTecnico, ordem, ativo } = req.body;

      const [option] = await db
        .update(ecommerceProductVariationOptions)
        .set({
          nome,
          descricao,
          preco,
          valorTecnico,
          ordem,
          ativo,
          updatedAt: new Date(),
        })
        .where(eq(ecommerceProductVariationOptions.id, optionId))
        .returning();

      res.json(option);
    } catch (error: any) {
      console.error("Erro ao atualizar opção de variação:", error);
      res.status(500).json({ error: "Erro ao atualizar opção de variação" });
    }
  }
);

/**
 * DELETE /api/admin/app/products/:productId/variation-groups/:groupId/options/:optionId
 * Deleta opção de variação
 */
router.delete(
  "/products/:productId/variation-groups/:groupId/options/:optionId",
  blockCustomers,
  async (req: Request, res: Response) => {
    try {
      const { optionId } = req.params;

      await db
        .delete(ecommerceProductVariationOptions)
        .where(eq(ecommerceProductVariationOptions.id, optionId));

      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao deletar opção de variação:", error);
      res.status(500).json({ error: "Erro ao deletar opção de variação" });
    }
  }
);

export default router;
