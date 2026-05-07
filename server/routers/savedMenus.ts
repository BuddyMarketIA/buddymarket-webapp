import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { specialMenus, eventMenus } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const savedMenusRouter = router({
  // ─── SPECIAL MENUS ─────────────────────────────────────────────────────────
  
  specialMenus: router({
    // Obtener todos los menús especiales del usuario
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const result = await db.getDb()
          .select()
          .from(specialMenus)
          .where(eq(specialMenus.userId, ctx.user.id))
          .orderBy(specialMenus.createdAt);
        return result;
      }),

    // Obtener un menú especial por ID
    get: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await db.getDb()
          .select()
          .from(specialMenus)
          .where(and(
            eq(specialMenus.id, input.menuId),
            eq(specialMenus.userId, ctx.user.id)
          ));
        return result[0] || null;
      }),

    // Crear un nuevo menú especial
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        menuType: z.enum(["dieta_especial", "alergia", "restriccion_religiosa", "preferencia_cultural", "condicion_medica", "otro"]),
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string().optional(),
        dailyCalories: z.number().optional(),
        persons: z.number().default(1),
        difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
        coverImage: z.string().optional(),
        menuJson: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.getDb()
          .insert(specialMenus)
          .values({
            userId: ctx.user.id,
            ...input,
          })
          .returning();
        return result[0];
      }),

    // Actualizar un menú especial
    update: protectedProcedure
      .input(z.object({
        menuId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        menuType: z.enum(["dieta_especial", "alergia", "restriccion_religiosa", "preferencia_cultural", "condicion_medica", "otro"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        dailyCalories: z.number().optional(),
        persons: z.number().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        coverImage: z.string().optional(),
        menuJson: z.string().optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { menuId, ...updateData } = input;
        const result = await db.getDb()
          .update(specialMenus)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(and(
            eq(specialMenus.id, menuId),
            eq(specialMenus.userId, ctx.user.id)
          ))
          .returning();
        return result[0];
      }),

    // Duplicar un menú especial
    duplicate: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const original = await db.getDb()
          .select()
          .from(specialMenus)
          .where(and(
            eq(specialMenus.id, input.menuId),
            eq(specialMenus.userId, ctx.user.id)
          ));
        
        if (!original[0]) throw new Error("Menú no encontrado");
        
        const { id, createdAt, updatedAt, ...data } = original[0];
        const result = await db.getDb()
          .insert(specialMenus)
          .values({
            ...data,
            name: `${data.name} (Copia)`,
          })
          .returning();
        return result[0];
      }),

    // Eliminar un menú especial
    delete: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.getDb()
          .delete(specialMenus)
          .where(and(
            eq(specialMenus.id, input.menuId),
            eq(specialMenus.userId, ctx.user.id)
          ));
        return { success: true };
      }),
  }),

  // ─── EVENT MENUS ───────────────────────────────────────────────────────────

  eventMenus: router({
    // Obtener todos los menús de eventos del usuario
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const result = await db.getDb()
          .select()
          .from(eventMenus)
          .where(eq(eventMenus.userId, ctx.user.id))
          .orderBy(eventMenus.eventDate);
        return result;
      }),

    // Obtener un menú de evento por ID
    get: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .query(async ({ ctx, input }) => {
        const result = await db.getDb()
          .select()
          .from(eventMenus)
          .where(and(
            eq(eventMenus.id, input.menuId),
            eq(eventMenus.userId, ctx.user.id)
          ));
        return result[0] || null;
      }),

    // Crear un nuevo menú de evento
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        eventType: z.enum(["cumpleanos", "boda", "aniversario", "reunion_familiar", "comida_negocios", "picnic", "cena_romantica", "fiesta", "otro"]),
        eventDate: z.string(), // YYYY-MM-DD
        guestCount: z.number().default(1),
        budget: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
        cuisineType: z.string().optional(),
        coverImage: z.string().optional(),
        menuJson: z.string().optional(),
        shoppingListJson: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.getDb()
          .insert(eventMenus)
          .values({
            userId: ctx.user.id,
            ...input,
          })
          .returning();
        return result[0];
      }),

    // Actualizar un menú de evento
    update: protectedProcedure
      .input(z.object({
        menuId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        eventType: z.enum(["cumpleanos", "boda", "aniversario", "reunion_familiar", "comida_negocios", "picnic", "cena_romantica", "fiesta", "otro"]).optional(),
        eventDate: z.string().optional(),
        guestCount: z.number().optional(),
        budget: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        cuisineType: z.string().optional(),
        coverImage: z.string().optional(),
        menuJson: z.string().optional(),
        shoppingListJson: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { menuId, ...updateData } = input;
        const result = await db.getDb()
          .update(eventMenus)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(and(
            eq(eventMenus.id, menuId),
            eq(eventMenus.userId, ctx.user.id)
          ))
          .returning();
        return result[0];
      }),

    // Duplicar un menú de evento
    duplicate: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const original = await db.getDb()
          .select()
          .from(eventMenus)
          .where(and(
            eq(eventMenus.id, input.menuId),
            eq(eventMenus.userId, ctx.user.id)
          ));
        
        if (!original[0]) throw new Error("Menú no encontrado");
        
        const { id, createdAt, updatedAt, ...data } = original[0];
        const result = await db.getDb()
          .insert(eventMenus)
          .values({
            ...data,
            name: `${data.name} (Copia)`,
          })
          .returning();
        return result[0];
      }),

    // Eliminar un menú de evento
    delete: protectedProcedure
      .input(z.object({ menuId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.getDb()
          .delete(eventMenus)
          .where(and(
            eq(eventMenus.id, input.menuId),
            eq(eventMenus.userId, ctx.user.id)
          ));
        return { success: true };
      }),
  }),
});
