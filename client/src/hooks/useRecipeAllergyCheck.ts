/**
 * useRecipeAllergyCheck
 *
 * Hook that checks if a recipe contains ingredients that the current user
 * is allergic to or has dietary restrictions against.
 *
 * Returns:
 * - `hasViolation`: true if the recipe contains forbidden ingredients
 * - `violatingIngredients`: list of forbidden ingredient names found in the recipe
 * - `userForbiddenList`: the full list of forbidden ingredient names for the user
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface RecipeForCheck {
  allergens?: string | null;
  name?: string | null;
  // Can be a JSON string, an array of ingredient objects, or null
  ingredients?: string | Array<{ ingredient?: { nameEs?: string | null } | null; customName?: string | null }> | null;
  ingredientsJson?: string | null;
}

interface AllergyCheckResult {
  hasViolation: boolean;
  violatingIngredients: string[];
  userForbiddenList: string[];
}

export function useUserForbiddenIngredients(): string[] {
  const { user } = useAuth();
  const { data: profileData } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    if (!profileData) return [];

    const allergyNames: string[] = (profileData.allergies || []).map((a) =>
      ((a.nameEs || a.nameEn || "") as string).toLowerCase().trim()
    ).filter(Boolean);

    const restrictionNames: string[] = (profileData.dietRestrictions || []).map((r) =>
      ((r.nameEs || r.nameEn || "") as string).toLowerCase().trim()
    ).filter(Boolean);

    // Also parse dislikedIngredients from profile
    let dislikedList: string[] = [];
    const disliked = (profileData.profile as { dislikedIngredients?: string | null } | null)?.dislikedIngredients;
    if (disliked) {
      try {
        const parsed = JSON.parse(disliked);
        dislikedList = Array.isArray(parsed)
          ? parsed.map((s: string) => s.toLowerCase().trim()).filter(Boolean)
          : [disliked.toLowerCase().trim()];
      } catch {
        dislikedList = disliked.split(",").map((s) => s.toLowerCase().trim()).filter(Boolean);
      }
    }

    const combined = [...allergyNames, ...restrictionNames, ...dislikedList];
    // Deduplicate without using Set iterator
    return combined.filter((item, index) => combined.indexOf(item) === index);
  }, [profileData]);
}

export function useRecipeAllergyCheck(recipe: RecipeForCheck | null | undefined): AllergyCheckResult {
  const userForbiddenList = useUserForbiddenIngredients();

  return useMemo(() => {
    if (!recipe || userForbiddenList.length === 0) {
      return { hasViolation: false, violatingIngredients: [], userForbiddenList };
    }

    // Build a searchable text from all recipe fields
    let ingredientsText = "";
    if (typeof recipe.ingredients === "string") {
      ingredientsText = recipe.ingredients;
    } else if (Array.isArray(recipe.ingredients)) {
      ingredientsText = recipe.ingredients
        .map((ing) => ing.ingredient?.nameEs || ing.customName || "")
        .join(" ");
    }
    const searchableText = [
      recipe.name || "",
      recipe.allergens || "",
      ingredientsText,
      recipe.ingredientsJson || "",
    ].join(" ").toLowerCase();

    const found: string[] = [];

    for (const forbidden of userForbiddenList) {
      if (forbidden.length > 2 && searchableText.includes(forbidden)) {
        const display = forbidden.charAt(0).toUpperCase() + forbidden.slice(1);
        if (found.indexOf(display) === -1) {
          found.push(display);
        }
      }
    }

    return {
      hasViolation: found.length > 0,
      violatingIngredients: found,
      userForbiddenList,
    };
  }, [recipe, userForbiddenList]);
}
