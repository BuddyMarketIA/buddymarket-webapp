import { describe, it, expect } from "vitest";
import {
  detectRecommendationTriggers,
  generateBuddyCoachRecommendations,
  generateBuddyShopRecommendations,
  generateBuddyCareRecommendations,
  type UserNutritionalProfile,
} from "./recommendations-engine";

describe("Recommendations Engine", () => {
  // Mock user profile for testing
  const mockProfile: UserNutritionalProfile = {
    userId: 1,
    mainGoal: "ganancia_muscular",
    activityLevel: "very_active",
    proteinGoal: 150,
    currentProtein: 100,
    calorieGoal: 2500,
    currentCalories: 2000,
    allergies: [],
    restrictions: [],
    medicalConditions: [],
    activeTrainings: true,
    cookingFrequency: "15_30",
    preferredMealComplexity: "complex",
  };

  describe("Trigger Detection", () => {
    it("should detect muscle gain trigger", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      expect(triggers.some((t) => t.type === "muscle_gain")).toBe(true);
    });

    it("should detect active training trigger", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      expect(triggers.some((t) => t.type === "active_training")).toBe(true);
    });

    it("should detect frequent cooking trigger", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      expect(triggers.some((t) => t.type === "frequent_cooking")).toBe(true);
    });

    it("should detect complex recipes trigger", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      expect(triggers.some((t) => t.type === "complex_recipes")).toBe(true);
    });

    it("should detect macro deficit trigger", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      expect(triggers.some((t) => t.type === "macro_deficit")).toBe(true);
    });

    it("should detect weight loss trigger", () => {
      const weightLossProfile: UserNutritionalProfile = {
        ...mockProfile,
        mainGoal: "perdida_peso",
      };
      const triggers = detectRecommendationTriggers(weightLossProfile);
      expect(triggers.some((t) => t.type === "weight_loss")).toBe(true);
    });

    it("should return empty array for no triggers", () => {
      const noTriggerProfile: UserNutritionalProfile = {
        userId: 1,
        mainGoal: "maintain",
        activityLevel: "sedentary",
        allergies: [],
        restrictions: [],
        medicalConditions: [],
        activeTrainings: false,
        cookingFrequency: "over_60",
        preferredMealComplexity: "simple",
      };
      const triggers = detectRecommendationTriggers(noTriggerProfile);
      expect(triggers.length).toBe(0);
    });
  });

  describe("BuddyCoach Recommendations", () => {
    it("should generate protein recommendation for muscle gain", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyCoachRecommendations(1, triggers);

      expect(recs.length).toBeGreaterThan(0);
      expect(recs.some((r) => r.externalProductId === "buddycoach_protein_whey")).toBe(true);
    });

    it("should generate creatine recommendation for muscle gain", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyCoachRecommendations(1, triggers);

      expect(recs.some((r) => r.externalProductId === "buddycoach_creatina")).toBe(true);
    });

    it("should set correct source for all recommendations", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyCoachRecommendations(1, triggers);

      recs.forEach((rec) => {
        expect(rec.source).toBe("buddycoach");
      });
    });

    it("should set expiration date 7 days in future", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyCoachRecommendations(1, triggers);

      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      recs.forEach((rec) => {
        expect(rec.expiresAt).toBeDefined();
        expect(rec.expiresAt!.getTime()).toBeGreaterThan(now.getTime());
        expect(rec.expiresAt!.getTime()).toBeLessThanOrEqual(sevenDaysLater.getTime());
      });
    });
  });

  describe("BuddyShop Recommendations", () => {
    it("should generate mandoline recommendation for frequent cooking", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyShopRecommendations(1, triggers);

      expect(recs.some((r) => r.externalProductId === "buddyshop_mandoline")).toBe(true);
    });

    it("should generate scale recommendation for frequent cooking", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyShopRecommendations(1, triggers);

      expect(recs.some((r) => r.externalProductId === "buddyshop_bascula")).toBe(true);
    });

    it("should set correct source for all recommendations", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyShopRecommendations(1, triggers);

      recs.forEach((rec) => {
        expect(rec.source).toBe("buddyshop");
      });
    });

    it("should set expiration date 14 days in future", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyShopRecommendations(1, triggers);

      const now = new Date();
      const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      recs.forEach((rec) => {
        expect(rec.expiresAt).toBeDefined();
        expect(rec.expiresAt!.getTime()).toBeGreaterThan(now.getTime());
        expect(rec.expiresAt!.getTime()).toBeLessThanOrEqual(fourteenDaysLater.getTime());
      });
    });
  });

  describe("BuddyCare Recommendations", () => {
    it("should generate vitamin D recommendation for health goal", () => {
      const healthProfile: UserNutritionalProfile = {
        ...mockProfile,
        mainGoal: "bienestar",
      };
      const triggers = detectRecommendationTriggers(healthProfile);
      const recs = generateBuddyCareRecommendations(1, triggers, healthProfile);

      expect(recs.some((r) => r.externalProductId === "buddycare_vitamin_d")).toBe(true);
    });

    it("should set correct source for all recommendations", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyCareRecommendations(1, triggers, mockProfile);

      recs.forEach((rec) => {
        expect(rec.source).toBe("buddycare");
      });
    });

    it("should generate chromium for diabetes condition", () => {
      const diabetesProfile: UserNutritionalProfile = {
        ...mockProfile,
        medicalConditions: ["diabetes"],
      };
      const triggers = detectRecommendationTriggers(diabetesProfile);
      const recs = generateBuddyCareRecommendations(1, triggers, diabetesProfile);

      expect(recs.some((r) => r.externalProductId === "buddycare_chromium")).toBe(true);
    });

    it("should generate magnesium for hypertension condition", () => {
      const hypertensionProfile: UserNutritionalProfile = {
        ...mockProfile,
        medicalConditions: ["hypertension"],
      };
      const triggers = detectRecommendationTriggers(hypertensionProfile);
      const recs = generateBuddyCareRecommendations(1, triggers, hypertensionProfile);

      expect(recs.some((r) => r.externalProductId === "buddycare_magnesium")).toBe(true);
    });

    it("should set expiration date 30 days in future", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const recs = generateBuddyCareRecommendations(1, triggers, mockProfile);

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      recs.forEach((rec) => {
        expect(rec.expiresAt).toBeDefined();
        expect(rec.expiresAt!.getTime()).toBeGreaterThan(now.getTime());
        expect(rec.expiresAt!.getTime()).toBeLessThanOrEqual(thirtyDaysLater.getTime());
      });
    });
  });

  describe("Recommendation Properties", () => {
    it("should have required fields in all recommendations", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const allRecs = [
        ...generateBuddyCoachRecommendations(1, triggers),
        ...generateBuddyShopRecommendations(1, triggers),
        ...generateBuddyCareRecommendations(1, triggers, mockProfile),
      ];

      allRecs.forEach((rec) => {
        expect(rec.userId).toBe(1);
        expect(rec.externalProductId).toBeDefined();
        expect(rec.source).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.reason).toBeDefined();
        expect(rec.trigger).toBeDefined();
        expect(rec.productUrl).toBeDefined();
        expect(rec.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(rec.relevanceScore).toBeLessThanOrEqual(100);
        expect(rec.expiresAt).toBeDefined();
      });
    });

    it("should have valid relevance scores", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const allRecs = [
        ...generateBuddyCoachRecommendations(1, triggers),
        ...generateBuddyShopRecommendations(1, triggers),
        ...generateBuddyCareRecommendations(1, triggers, mockProfile),
      ];

      allRecs.forEach((rec) => {
        expect(rec.relevanceScore).toBeGreaterThanOrEqual(50);
        expect(rec.relevanceScore).toBeLessThanOrEqual(100);
      });
    });

    it("should have non-empty titles and descriptions", () => {
      const triggers = detectRecommendationTriggers(mockProfile);
      const allRecs = [
        ...generateBuddyCoachRecommendations(1, triggers),
        ...generateBuddyShopRecommendations(1, triggers),
        ...generateBuddyCareRecommendations(1, triggers, mockProfile),
      ];

      allRecs.forEach((rec) => {
        expect(rec.title.length).toBeGreaterThan(0);
        expect(rec.reason.length).toBeGreaterThan(0);
      });
    });
  });
});
