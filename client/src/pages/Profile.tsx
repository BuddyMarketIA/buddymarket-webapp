import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  UserIcon,
  HeartIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  FireIcon,
  SparklesIcon,
  BeakerIcon,
  CakeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { key: "personal", label: "Personal", icon: UserIcon },
  { key: "body", label: "Cuerpo", icon: FireIcon },
  { key: "lifestyle", label: "Estilo de vida", icon: SparklesIcon },
  { key: "culinary", label: "Cocina", icon: CakeIcon },
  { key: "medical", label: "Salud", icon: HeartIcon },
  { key: "allergies", label: "Alergias", icon: ExclamationCircleIcon },
  { key: "prefs", label: "Preferencias", icon: BeakerIcon },
  { key: "shopping", label: "Compras", icon: ShoppingBagIcon },
  { key: "account", label: "Cuenta", icon: TrashIcon },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </p>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", appearance: "none", boxSizing: "border-box" }}
    >
      <option value="">Selecciona una opción</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white", borderRadius: "12px", border: "1.5px solid #e5e7eb", marginBottom: "10px" }}>
      <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{ width: "44px", height: "24px", borderRadius: "12px", background: checked ? "#F97316" : "#e5e7eb", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
      >
        <div style={{ position: "absolute", top: "3px", left: checked ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
    </div>
  );
}

function ChipGroup({ options, selected, onChange }: { options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => toggle(o.value)}
          style={{ padding: "8px 14px", borderRadius: "20px", border: selected.includes(o.value) ? "2px solid #F97316" : "1.5px solid #e5e7eb", background: selected.includes(o.value) ? "rgba(249,115,22,0.1)" : "white", color: selected.includes(o.value) ? "#F97316" : "#374151", fontSize: "13px", fontWeight: selected.includes(o.value) ? 700 : 500, cursor: "pointer" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{ width: "100%", padding: "14px", borderRadius: "14px", background: loading ? "#e5e7eb" : "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "16px", fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}
    >
      {loading ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: allergiesCatalog } = trpc.catalogs.allergies.useQuery();
  const { data: restrictionsCatalog } = trpc.catalogs.dietRestrictions.useQuery();
  const utils = trpc.useUtils();

  // Personal
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Body
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [bodyFatPercentage, setBodyFatPercentage] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [weightChangeRate, setWeightChangeRate] = useState("");
  const [motivationLevel, setMotivationLevel] = useState("");
  const [fitnessGoalDetail, setFitnessGoalDetail] = useState("");
  const [previousDietExperience, setPreviousDietExperience] = useState<string[]>([]);

  // Lifestyle
  const [activityLevel, setActivityLevel] = useState("");
  const [practicesSports, setPracticesSports] = useState(false);
  const [sportsFrequency, setSportsFrequency] = useState("");
  const [sportsTypes, setSportsTypes] = useState<string[]>([]);
  const [workType, setWorkType] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [waterIntake, setWaterIntake] = useState("");
  const [alcoholConsumption, setAlcoholConsumption] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("");

  // Culinary
  const [cookingLevel, setCookingLevel] = useState("");
  const [mealPrepTime, setMealPrepTime] = useState("");
  const [dailyMeals, setDailyMeals] = useState("");
  const [snackingHabits, setSnackingHabits] = useState("");
  const [eatOutFrequency, setEatOutFrequency] = useState("");
  const [budgetPerWeek, setBudgetPerWeek] = useState("");
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState("");
  const [cookingEquipment, setCookingEquipment] = useState<string[]>([]);

  // Medical
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState("");
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>([]);
  const [hasSurgery, setHasSurgery] = useState(false);
  const [surgery, setSurgery] = useState("");
  const [useMetabolismMedication, setUseMetabolismMedication] = useState(false);
  const [metabolismMedication, setMetabolismMedication] = useState("");
  const [useNutritionalSupplements, setUseNutritionalSupplements] = useState(false);
  const [nutritionalSupplements, setNutritionalSupplements] = useState("");
  const [hasMedicalDiet, setHasMedicalDiet] = useState(false);
  const [medicalDiet, setMedicalDiet] = useState("");
  const [hasMedicalFamilyBackground, setHasMedicalFamilyBackground] = useState(false);
  const [medicalFamilyBackground, setMedicalFamilyBackground] = useState("");
  // New health profile fields
  const [dietaryPattern, setDietaryPattern] = useState("");
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);
  const [selectedSpecialNeeds, setSelectedSpecialNeeds] = useState<string[]>([]);
  const [pregnancyWeek, setPregnancyWeek] = useState("");

  // Allergies
  const [selectedAllergies, setSelectedAllergies] = useState<number[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>([]);

  // Preferences
  const [preferredMealComplexity, setPreferredMealComplexity] = useState("");
  const [portionSize, setPortionSize] = useState("");
  const [preferSeasonalIngredients, setPreferSeasonalIngredients] = useState(false);
  const [preferLocalProducts, setPreferLocalProducts] = useState(false);
  const [avoidProcessedFood, setAvoidProcessedFood] = useState(false);
  const [interestedInMealPrep, setInterestedInMealPrep] = useState(false);
  const [wantsShoppingListAutomation, setWantsShoppingListAutomation] = useState(false);
  const [wantsCalorieTracking, setWantsCalorieTracking] = useState(false);
  const [wantsMacroTracking, setWantsMacroTracking] = useState(false);
  const [interestedInNutritionalAdvices, setInterestedInNutritionalAdvices] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [newsletter, setNewsletter] = useState(false);

  // Shopping
  const [purchaseFrequency, setPurchaseFrequency] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [organicProducts, setOrganicProducts] = useState(false);
  const [suggestHealthier, setSuggestHealthier] = useState(false);
  const [suggestCheaper, setSuggestCheaper] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const u = profile.user;
    const p = profile.profile;
    const m = profile.medicalProfile;
    const pr = profile.preferences;

    setName(u.name || "");
    setPhone(u.phone || "");
    setDescription(u.description || "");

    if (p) {
      setHeight(p.height?.toString() || "");
      setWeight(p.weight?.toString() || "");
      setTargetWeight(p.targetWeight?.toString() || "");
      setGender(p.gender || "");
      setBirthYear(p.birthYear?.toString() || "");
      setHeightUnit(p.heightUnit || "cm");
      setWeightUnit(p.weightUnit || "kg");
      setBodyFatPercentage(p.bodyFatPercentage?.toString() || "");
      setMainGoal(p.mainGoal || "");
      setWeightChangeRate(p.weightChangeRate?.toString() || "");
      setMotivationLevel(p.motivationLevel || "");
      setFitnessGoalDetail(p.fitnessGoalDetail || "");
      setPreviousDietExperience(p.previousDietExperience ? JSON.parse(p.previousDietExperience) : []);
      setActivityLevel(p.activityLevel || "");
      setPracticesSports(p.practicesSports ?? false);
      setSportsFrequency(p.sportsFrequency || "");
      setSportsTypes(p.sportsTypes ? JSON.parse(p.sportsTypes) : []);
      setWorkType(p.workType || "");
      setSleepHours(p.sleepHours?.toString() || "");
      setStressLevel(p.stressLevel || "");
      setWaterIntake(p.waterIntake?.toString() || "");
      setAlcoholConsumption(p.alcoholConsumption || "");
      setSmokingStatus(p.smokingStatus || "");
      setCookingLevel(p.cookingLevel || "");
      setMealPrepTime(p.mealPrepTime || "");
      setDailyMeals(p.dailyMeals?.toString() || "");
      setSnackingHabits(p.snackingHabits || "");
      setEatOutFrequency(p.eatOutFrequency || "");
      setBudgetPerWeek(p.budgetPerWeek?.toString() || "");
      setFavoriteCuisines(p.favoriteCuisines ? JSON.parse(p.favoriteCuisines) : []);
      setDislikedIngredients(p.dislikedIngredients ? JSON.parse(p.dislikedIngredients).join(", ") : "");
      setCookingEquipment(p.cookingEquipment ? JSON.parse(p.cookingEquipment) : []);
    }

    if (m) {
      setHasMedicalConditions(m.hasMedicalConditions ?? false);
      setMedicalConditions(m.medicalConditions || "");
      setSelectedMedicalConditions(m.medicalConditions ? m.medicalConditions.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
      setHasSurgery(m.hasSurgery ?? false);
      setSurgery(m.surgery || "");
      setUseMetabolismMedication(m.useMetabolismMedication ?? false);
      setMetabolismMedication(m.metabolismMedication || "");
      setUseNutritionalSupplements(m.useNutritionalSupplements ?? false);
      setNutritionalSupplements(m.nutritionalSupplements || "");
      setHasMedicalDiet(m.hasMedicalDiet ?? false);
      setMedicalDiet(m.medicalDiet || "");
      setHasMedicalFamilyBackground(m.hasMedicalFamilyBackground ?? false);
      setMedicalFamilyBackground(m.medicalFamilyBackground || "");
      // New fields
      setDietaryPattern(m.dietaryPattern || "");
      setSelectedLifestyle(m.lifestyle ? JSON.parse(m.lifestyle) : []);
      setSelectedSpecialNeeds(m.specialNeeds ? JSON.parse(m.specialNeeds) : []);
      setPregnancyWeek(m.pregnancyWeek?.toString() || "");
    }

    if (pr) {
      setPreferredMealComplexity(pr.preferredMealComplexity || "");
      setPortionSize(pr.portionSize || "");
      setPreferSeasonalIngredients(pr.preferSeasonalIngredients ?? false);
      setPreferLocalProducts(pr.preferLocalProducts ?? false);
      setAvoidProcessedFood(pr.avoidProcessedFood ?? false);
      setInterestedInMealPrep(pr.interestedInMealPrep ?? false);
      setWantsShoppingListAutomation(pr.wantsShoppingListAutomation ?? false);
      setWantsCalorieTracking(pr.wantsCalorieTracking ?? false);
      setWantsMacroTracking(pr.wantsMacroTracking ?? false);
      setInterestedInNutritionalAdvices(pr.interestedInNutritionalAdvices ?? false);
      setNotifications(pr.notifications ?? false);
      setNewsletter(pr.newsletter ?? false);
      setPurchaseFrequency(pr.purchaseFrequency || "");
      setPurchaseLocation(pr.purchaseLocation || "");
      setOrganicProducts(pr.organicProducts ?? false);
      setSuggestHealthier(pr.suggestHealthierProducts ?? false);
      setSuggestCheaper(pr.suggestCheaperProducts ?? false);
    }

    setSelectedAllergies(profile.allergies.map((a) => a.id));
    setSelectedRestrictions(profile.dietRestrictions.map((r) => r.id));
  }, [profile]);

  const updateBasic = trpc.profile.updateBasic.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Datos personales guardados"); } });
  const updateProfile = trpc.profile.updateProfile.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Perfil actualizado"); } });
  const updateMedical = trpc.profile.updateMedical.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Datos de salud guardados"); } });
  const updatePreferences = trpc.profile.updatePreferences.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Preferencias guardadas"); } });
  const setAllergiesMut = trpc.profile.setAllergies.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Alergias actualizadas"); } });
  const setDietRestrictionsMut = trpc.profile.setDietRestrictions.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Restricciones actualizadas"); } });

  const handleSavePersonal = () => updateBasic.mutate({ name, phone, description });

  const handleSaveBody = () => updateProfile.mutate({
    height: height ? parseFloat(height) : undefined,
    weight: weight ? parseFloat(weight) : undefined,
    targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
    gender: (gender as any) || undefined,
    birthYear: birthYear ? parseInt(birthYear) : undefined,
    heightUnit: heightUnit as any,
    weightUnit: weightUnit as any,
    bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
    mainGoal: (mainGoal as any) || undefined,
    weightChangeRate: weightChangeRate ? parseFloat(weightChangeRate) : undefined,
    motivationLevel: (motivationLevel as any) || undefined,
    fitnessGoalDetail: fitnessGoalDetail || undefined,
    previousDietExperience: previousDietExperience.length ? JSON.stringify(previousDietExperience) : undefined,
  });

  const handleSaveLifestyle = () => updateProfile.mutate({
    activityLevel: (activityLevel as any) || undefined,
    practicesSports,
    sportsFrequency: (sportsFrequency as any) || undefined,
    sportsTypes: sportsTypes.length ? JSON.stringify(sportsTypes) : undefined,
    workType: (workType as any) || undefined,
    sleepHours: sleepHours ? parseInt(sleepHours) : undefined,
    stressLevel: (stressLevel as any) || undefined,
    waterIntake: waterIntake ? parseFloat(waterIntake) : undefined,
    alcoholConsumption: (alcoholConsumption as any) || undefined,
    smokingStatus: (smokingStatus as any) || undefined,
  });

  const handleSaveCulinary = () => updateProfile.mutate({
    cookingLevel: (cookingLevel as any) || undefined,
    mealPrepTime: (mealPrepTime as any) || undefined,
    dailyMeals: dailyMeals ? parseInt(dailyMeals) : undefined,
    snackingHabits: (snackingHabits as any) || undefined,
    eatOutFrequency: (eatOutFrequency as any) || undefined,
    budgetPerWeek: budgetPerWeek ? parseFloat(budgetPerWeek) : undefined,
    favoriteCuisines: favoriteCuisines.length ? JSON.stringify(favoriteCuisines) : undefined,
    dislikedIngredients: dislikedIngredients ? JSON.stringify(dislikedIngredients.split(",").map((s) => s.trim()).filter(Boolean)) : undefined,
    cookingEquipment: cookingEquipment.length ? JSON.stringify(cookingEquipment) : undefined,
  });

  const handleSaveMedical = () => updateMedical.mutate({
    hasMedicalConditions,
    medicalConditions: selectedMedicalConditions.length ? selectedMedicalConditions.join(", ") : (medicalConditions || undefined),
    hasSurgery, surgery: surgery || undefined,
    useMetabolismMedication, metabolismMedication: metabolismMedication || undefined,
    useNutritionalSupplements, nutritionalSupplements: nutritionalSupplements || undefined,
    hasMedicalDiet, medicalDiet: medicalDiet || undefined,
    hasMedicalFamilyBackground, medicalFamilyBackground: medicalFamilyBackground || undefined,
    dietaryPattern: dietaryPattern || undefined,
    lifestyle: selectedLifestyle.length ? JSON.stringify(selectedLifestyle) : undefined,
    specialNeeds: selectedSpecialNeeds.length ? JSON.stringify(selectedSpecialNeeds) : undefined,
    pregnancyWeek: pregnancyWeek ? parseInt(pregnancyWeek) : undefined,
  });

  const handleSaveAllergies = () => {
    setAllergiesMut.mutate({ allergyIds: selectedAllergies });
    setDietRestrictionsMut.mutate({ restrictionIds: selectedRestrictions });
  };

  const handleSavePreferences = () => updatePreferences.mutate({
    preferredMealComplexity: (preferredMealComplexity as any) || undefined,
    portionSize: (portionSize as any) || undefined,
    preferSeasonalIngredients, preferLocalProducts, avoidProcessedFood,
    interestedInMealPrep, wantsShoppingListAutomation, wantsCalorieTracking, wantsMacroTracking,
    interestedInNutritionalAdvices, notifications, newsletter,
  });

  const handleSaveShopping = () => updatePreferences.mutate({
    purchaseFrequency: purchaseFrequency || undefined,
    purchaseLocation: purchaseLocation || undefined,
    organicProducts, suggestHealthierProducts: suggestHealthier, suggestCheaperProducts: suggestCheaper,
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #F97316", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Calculate profile completion percentage by section
  const sectionFields = {
    personal: [name, birthYear, gender, description],
    body: [height, weight, mainGoal, targetWeight, weightChangeRate, motivationLevel, fitnessGoalDetail],
    lifestyle: [activityLevel, workType, sleepHours, stressLevel, waterIntake],
    culinary: [cookingLevel, dailyMeals, mealPrepTime, budgetPerWeek],
    medical: [medicalConditions, medicalFamilyBackground],
  };
  
  const sectionCompletion: Record<string, { filled: number; total: number; percent: number }> = {};
  Object.entries(sectionFields).forEach(([section, fields]) => {
    const filled = fields.filter(f => f && f.toString().trim() !== "").length;
    const total = fields.length;
    sectionCompletion[section] = { filled, total, percent: Math.round((filled / total) * 100) };
  });
  
  const totalFields = Object.values(sectionFields).flat();
  const totalFilled = totalFields.filter(f => f && f.toString().trim() !== "").length;
  const completionPercent = Math.round((totalFilled / totalFields.length) * 100);
  const incompleteSections = Object.entries(sectionCompletion).filter(([_, v]) => v.percent < 100).map(([k]) => TABS.find(t => t.key === k)?.label).filter(Boolean);

  const card: React.CSSProperties = { background: "white", borderRadius: "18px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "16px" };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      {/* Header */}
      <div style={{ ...card }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: completionPercent < 100 ? "14px" : "0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "white", flexShrink: 0 }}>
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1a1a1a" }}>{user?.name || "Mi perfil"}</p>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>{user?.email}</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#f3f4f6", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${completionPercent}%`, borderRadius: "3px", background: completionPercent === 100 ? "#22c55e" : "linear-gradient(90deg, #F97316, #FB923C)", transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: completionPercent === 100 ? "#22c55e" : "#F97316", flexShrink: 0 }}>{completionPercent}%</span>
            </div>
          </div>
          <button onClick={logout} style={{ padding: "8px 14px", borderRadius: "10px", border: "1.5px solid #fee2e2", background: "white", color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Salir
          </button>
        </div>
        {completionPercent < 100 && (
          <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#F97316", fontWeight: 700 }}>
              💡 Completa tu perfil para recibir recomendaciones personalizadas
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Object.entries(sectionCompletion).map(([key, val]) => {
                const tab = TABS.find(t => t.key === key);
                const done = val.percent === 100;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", border: done ? "1.5px solid #22c55e" : "1.5px solid rgba(249,115,22,0.3)", background: done ? "rgba(34,197,94,0.08)" : "rgba(249,115,22,0.08)", color: done ? "#16a34a" : "#F97316", fontSize: "11px", fontWeight: 700, cursor: done ? "default" : "pointer" }}
                  >
                    {done ? "✓" : "○"} {tab?.label} {done ? "" : `(${val.filled}/${val.total})`}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "20px", border: active ? "2px solid #F97316" : "1.5px solid #e5e7eb", background: active ? "rgba(249,115,22,0.1)" : "white", color: active ? "#F97316" : "#6b7280", fontSize: "13px", fontWeight: active ? 700 : 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              <Icon style={{ width: "14px", height: "14px" }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PERSONAL */}
      {activeTab === "personal" && (
        <div style={card}>
          <SectionTitle>Datos personales</SectionTitle>
          <Field label="Nombre completo">
            <Input value={name} onChange={setName} placeholder="Tu nombre" />
          </Field>
          <Field label="Teléfono" hint="Opcional. Usado para recordatorios y soporte.">
            <Input value={phone} onChange={setPhone} type="tel" placeholder="+34 600 000 000" />
          </Field>
          <Field label="Sobre mí" hint="Cuéntanos algo sobre ti, tus hábitos o motivaciones.">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Soy deportista aficionado, busco mejorar mi alimentación..." rows={4} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Field>
          <SaveButton onClick={handleSavePersonal} loading={updateBasic.isPending} />
        </div>
      )}

      {/* BODY */}
      {activeTab === "body" && (
        <div style={card}>
          <SectionTitle>Composición corporal y objetivos</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label="Género">
              <Select value={gender} onChange={setGender} options={[{ value: "male", label: "Hombre" }, { value: "female", label: "Mujer" }, { value: "other", label: "Otro" }]} />
            </Field>
            <Field label="Año de nacimiento">
              <Input value={birthYear} onChange={setBirthYear} type="number" placeholder="1990" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Field label={`Altura (${heightUnit})`}>
              <Input value={height} onChange={setHeight} type="number" placeholder={heightUnit === "cm" ? "170" : "5.7"} />
            </Field>
            <Field label="Unidad altura">
              <Select value={heightUnit} onChange={setHeightUnit} options={[{ value: "cm", label: "cm" }, { value: "ft", label: "ft/in" }]} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "12px" }}>
            <Field label={`Peso actual (${weightUnit})`}>
              <Input value={weight} onChange={setWeight} type="number" placeholder="70" />
            </Field>
            <Field label={`Peso objetivo (${weightUnit})`}>
              <Input value={targetWeight} onChange={setTargetWeight} type="number" placeholder="65" />
            </Field>
            <Field label="Unidad peso">
              <Select value={weightUnit} onChange={setWeightUnit} options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} />
            </Field>
          </div>
          <Field label="% Grasa corporal (si lo conoces)" hint="Puedes calcularlo con una báscula de bioimpedancia.">
            <Input value={bodyFatPercentage} onChange={setBodyFatPercentage} type="number" placeholder="20" />
          </Field>
          <Field label="Objetivo principal">
            <Select value={mainGoal} onChange={setMainGoal} options={[
              { value: "lose_weight", label: "Perder peso" }, { value: "gain_muscle", label: "Ganar músculo" },
              { value: "maintain", label: "Mantener peso" }, { value: "improve_health", label: "Mejorar salud general" },
              { value: "eat_healthier", label: "Comer más sano" },
            ]} />
          </Field>
          <Field label="Ritmo de cambio de peso" hint="¿Cuántos kg por semana quieres perder/ganar?">
            <Select value={weightChangeRate} onChange={setWeightChangeRate} options={[
              { value: "0.25", label: "Lento (0.25 kg/sem)" }, { value: "0.5", label: "Moderado (0.5 kg/sem)" },
              { value: "0.75", label: "Rápido (0.75 kg/sem)" }, { value: "1", label: "Muy rápido (1 kg/sem)" },
            ]} />
          </Field>
          <Field label="Nivel de motivación actual">
            <Select value={motivationLevel} onChange={setMotivationLevel} options={[
              { value: "low", label: "Bajo — necesito apoyo" }, { value: "medium", label: "Medio — voy bien" },
              { value: "high", label: "Alto — muy comprometido/a" }, { value: "very_high", label: "Muy alto — modo bestia 🔥" },
            ]} />
          </Field>
          <Field label="Describe tu objetivo con más detalle" hint="Cuanto más específico, mejores recomendaciones recibirás.">
            <textarea value={fitnessGoalDetail} onChange={(e) => setFitnessGoalDetail(e.target.value)} placeholder="Ej: Quiero perder 8 kg antes del verano manteniendo músculo..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </Field>
          <Field label="Dietas que has probado antes">
            <ChipGroup options={[
              { value: "keto", label: "Keto" }, { value: "paleo", label: "Paleo" },
              { value: "intermittent_fasting", label: "Ayuno intermitente" }, { value: "vegan", label: "Vegana" },
              { value: "mediterranean", label: "Mediterránea" }, { value: "low_carb", label: "Low carb" },
              { value: "calorie_counting", label: "Conteo de calorías" }, { value: "none", label: "Ninguna" },
            ]} selected={previousDietExperience} onChange={setPreviousDietExperience} />
          </Field>
          <SaveButton onClick={handleSaveBody} loading={updateProfile.isPending} />
        </div>
      )}

      {/* LIFESTYLE */}
      {activeTab === "lifestyle" && (
        <div style={card}>
          <SectionTitle>Actividad física y estilo de vida</SectionTitle>
          <Field label="Nivel de actividad general">
            <Select value={activityLevel} onChange={setActivityLevel} options={[
              { value: "sedentary", label: "Sedentario — poco o nada de ejercicio" },
              { value: "light", label: "Ligero — 1-3 días/semana" },
              { value: "moderate", label: "Moderado — 3-5 días/semana" },
              { value: "active", label: "Activo — 6-7 días/semana" },
              { value: "very_active", label: "Muy activo — trabajo físico + ejercicio" },
            ]} />
          </Field>
          <Toggle checked={practicesSports} onChange={setPracticesSports} label="¿Practicas deporte regularmente?" />
          {practicesSports && (
            <>
              <Field label="Frecuencia de entrenamiento">
                <Select value={sportsFrequency} onChange={setSportsFrequency} options={[
                  { value: "1_2_week", label: "1-2 veces por semana" }, { value: "3_4_week", label: "3-4 veces por semana" },
                  { value: "5_plus_week", label: "5 o más veces por semana" }, { value: "daily", label: "Todos los días" },
                ]} />
              </Field>
              <Field label="Tipos de deporte que practicas">
                <ChipGroup options={[
                  { value: "running", label: "Running" }, { value: "cycling", label: "Ciclismo" },
                  { value: "swimming", label: "Natación" }, { value: "gym", label: "Gimnasio/pesas" },
                  { value: "yoga", label: "Yoga/pilates" }, { value: "football", label: "Fútbol" },
                  { value: "tennis", label: "Tenis/pádel" }, { value: "crossfit", label: "CrossFit" },
                  { value: "hiking", label: "Senderismo" }, { value: "dance", label: "Baile" },
                  { value: "martial_arts", label: "Artes marciales" }, { value: "other", label: "Otro" },
                ]} selected={sportsTypes} onChange={setSportsTypes} />
              </Field>
            </>
          )}
          <Field label="Tipo de trabajo">
            <Select value={workType} onChange={setWorkType} options={[
              { value: "sedentary_desk", label: "Oficina / trabajo sentado" },
              { value: "light_standing", label: "De pie, movimiento ligero" },
              { value: "moderate_physical", label: "Trabajo físico moderado" },
              { value: "heavy_physical", label: "Trabajo físico intenso" },
            ]} />
          </Field>
          <Field label="Horas de sueño por noche" hint="El sueño afecta directamente al metabolismo y al apetito.">
            <Select value={sleepHours} onChange={setSleepHours} options={[
              { value: "5", label: "Menos de 6 horas" }, { value: "6", label: "6 horas" },
              { value: "7", label: "7 horas" }, { value: "8", label: "8 horas" }, { value: "9", label: "9 o más horas" },
            ]} />
          </Field>
          <Field label="Nivel de estrés habitual">
            <Select value={stressLevel} onChange={setStressLevel} options={[
              { value: "low", label: "Bajo — vivo tranquilo/a" }, { value: "moderate", label: "Moderado — algún estrés puntual" },
              { value: "high", label: "Alto — bastante estrés diario" }, { value: "very_high", label: "Muy alto — estrés crónico" },
            ]} />
          </Field>
          <Field label="Ingesta de agua diaria (litros)">
            <Select value={waterIntake} onChange={setWaterIntake} options={[
              { value: "0.5", label: "Menos de 1 litro" }, { value: "1", label: "1 litro" },
              { value: "1.5", label: "1.5 litros" }, { value: "2", label: "2 litros" },
              { value: "2.5", label: "2.5 litros" }, { value: "3", label: "3 o más litros" },
            ]} />
          </Field>
          <Field label="Consumo de alcohol">
            <Select value={alcoholConsumption} onChange={setAlcoholConsumption} options={[
              { value: "none", label: "No bebo alcohol" }, { value: "occasional", label: "Ocasional (fines de semana)" },
              { value: "moderate", label: "Moderado (varias veces/semana)" }, { value: "frequent", label: "Frecuente (casi a diario)" },
            ]} />
          </Field>
          <Field label="Tabaco">
            <Select value={smokingStatus} onChange={setSmokingStatus} options={[
              { value: "non_smoker", label: "No fumo" }, { value: "ex_smoker", label: "Ex fumador/a" }, { value: "smoker", label: "Fumo actualmente" },
            ]} />
          </Field>
          <SaveButton onClick={handleSaveLifestyle} loading={updateProfile.isPending} />
        </div>
      )}

      {/* CULINARY */}
      {activeTab === "culinary" && (
        <div style={card}>
          <SectionTitle>Hábitos culinarios y preferencias</SectionTitle>
          <Field label="Nivel de cocina">
            <Select value={cookingLevel} onChange={setCookingLevel} options={[
              { value: "beginner", label: "Principiante — recetas sencillas" },
              { value: "intermediate", label: "Intermedio — cocino con soltura" },
              { value: "advanced", label: "Avanzado — me gusta experimentar" },
            ]} />
          </Field>
          <Field label="Tiempo disponible para cocinar" hint="Tiempo aproximado por comida principal.">
            <Select value={mealPrepTime} onChange={setMealPrepTime} options={[
              { value: "under_15", label: "Menos de 15 minutos" }, { value: "15_30", label: "15-30 minutos" },
              { value: "30_60", label: "30-60 minutos" }, { value: "over_60", label: "Más de 1 hora" },
            ]} />
          </Field>
          <Field label="Número de comidas al día">
            <Select value={dailyMeals} onChange={setDailyMeals} options={[
              { value: "2", label: "2 comidas" }, { value: "3", label: "3 comidas" },
              { value: "4", label: "4 comidas" }, { value: "5", label: "5 comidas" }, { value: "6", label: "6 o más comidas" },
            ]} />
          </Field>
          <Field label="¿Con qué frecuencia picoteas entre horas?">
            <Select value={snackingHabits} onChange={setSnackingHabits} options={[
              { value: "never", label: "Nunca" }, { value: "rarely", label: "Raramente" },
              { value: "sometimes", label: "A veces" }, { value: "often", label: "Con frecuencia" },
            ]} />
          </Field>
          <Field label="¿Con qué frecuencia comes fuera de casa?">
            <Select value={eatOutFrequency} onChange={setEatOutFrequency} options={[
              { value: "never", label: "Nunca / casi nunca" }, { value: "1_2_month", label: "1-2 veces al mes" },
              { value: "1_2_week", label: "1-2 veces por semana" }, { value: "3_plus_week", label: "3 o más veces por semana" },
            ]} />
          </Field>
          <Field label="Presupuesto semanal para alimentación (€)">
            <Input value={budgetPerWeek} onChange={setBudgetPerWeek} type="number" placeholder="80" />
          </Field>
          <Field label="Tipos de cocina favoritos">
            <ChipGroup options={[
              { value: "spanish", label: "🇪🇸 Española" }, { value: "italian", label: "🇮🇹 Italiana" },
              { value: "asian", label: "🥢 Asiática" }, { value: "mexican", label: "🌮 Mexicana" },
              { value: "american", label: "🍔 Americana" }, { value: "arabic", label: "🥙 Árabe" },
              { value: "french", label: "🥐 Francesa" }, { value: "mediterranean", label: "🫒 Mediterránea" },
              { value: "latin", label: "🌶️ Latinoamericana" }, { value: "japanese", label: "🍣 Japonesa" },
              { value: "indian", label: "🍛 India" }, { value: "greek", label: "🫕 Griega" },
            ]} selected={favoriteCuisines} onChange={setFavoriteCuisines} />
          </Field>
          <Field label="Equipamiento de cocina disponible">
            <ChipGroup options={[
              { value: "airfryer", label: "Air Fryer" }, { value: "oven", label: "Horno" },
              { value: "microwave", label: "Microondas" }, { value: "grill", label: "Plancha/grill" },
              { value: "steamer", label: "Vaporera" }, { value: "wok", label: "Wok" },
              { value: "slow_cooker", label: "Olla lenta" }, { value: "thermomix", label: "Thermomix" },
              { value: "blender", label: "Batidora/licuadora" }, { value: "instant_pot", label: "Instant Pot" },
            ]} selected={cookingEquipment} onChange={setCookingEquipment} />
          </Field>
          <Field label="Ingredientes que no te gustan o evitas" hint="Escríbelos separados por comas.">
            <Input value={dislikedIngredients} onChange={setDislikedIngredients} placeholder="Ej: hígado, coliflor, remolacha" />
          </Field>
          <SaveButton onClick={handleSaveCulinary} loading={updateProfile.isPending} />
        </div>
      )}

      {/* MEDICAL */}
      {activeTab === "medical" && (
        <div style={card}>
          <SectionTitle>Historial de salud</SectionTitle>

          {/* Dietary Pattern */}
          <Field label="🌱 Patrón alimentario" hint="¿Cómo describes tu forma de comer habitualmente?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "omnivore", label: "🥩 Omnívoro" },
                { value: "flexitarian", label: "🥗 Flexitariano" },
                { value: "vegetarian", label: "🥦 Vegetariano" },
                { value: "vegan", label: "🌿 Vegano" },
                { value: "pescatarian", label: "🐟 Pescetariano" },
                { value: "keto", label: "🥑 Keto / Cetogénico" },
                { value: "paleo", label: "🦴 Paleo" },
                { value: "mediterranean", label: "🫒 Mediterráneo" },
                { value: "low_carb", label: "🍞 Bajo en carbos" },
                { value: "high_protein", label: "💪 Alto en proteína" },
                { value: "gluten_free", label: "🌾 Sin gluten" },
                { value: "lactose_free", label: "🥛 Sin lactosa" },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setDietaryPattern(dietaryPattern === opt.value ? "" : opt.value)}
                  style={{ padding: "8px 14px", borderRadius: "20px", border: dietaryPattern === opt.value ? "2px solid #10b981" : "1.5px solid #e5e7eb", background: dietaryPattern === opt.value ? "rgba(16,185,129,0.1)" : "white", color: dietaryPattern === opt.value ? "#059669" : "#374151", fontSize: "13px", fontWeight: dietaryPattern === opt.value ? 700 : 500, cursor: "pointer" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Lifestyle */}
          <Field label="👩‍👦 Situación vital" hint="Selecciona las que apliquen a tu situación actual.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "pregnant", label: "🤰 Embarazada" },
                { value: "breastfeeding", label: "🤱 Lactancia" },
                { value: "trying_to_conceive", label: "💚 Buscando embarazo" },
                { value: "menopause", label: "🌸 Menopausia" },
                { value: "athlete", label: "🏃 Deportista" },
                { value: "elderly", label: "👴 Adulto mayor (+65)" },
                { value: "child", label: "👶 Niño / Adolescente" },
                { value: "student", label: "📚 Estudiante" },
                { value: "shift_worker", label: "🌙 Trabajo a turnos" },
                { value: "high_stress", label: "🧠 Alto estrés" },
              ].map((opt) => {
                const sel = selectedLifestyle.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => setSelectedLifestyle(sel ? selectedLifestyle.filter((x) => x !== opt.value) : [...selectedLifestyle, opt.value])}
                    style={{ padding: "8px 14px", borderRadius: "20px", border: sel ? "2px solid #6366f1" : "1.5px solid #e5e7eb", background: sel ? "rgba(99,102,241,0.1)" : "white", color: sel ? "#6366f1" : "#374151", fontSize: "13px", fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Pregnancy week if pregnant */}
          {selectedLifestyle.includes("pregnant") && (
            <Field label="Semana de embarazo" hint="Opcional, para personalizar mejor las recomendaciones.">
              <Input value={pregnancyWeek} onChange={setPregnancyWeek} placeholder="Ej: 20" type="number" />
            </Field>
          )}

          {/* Medical Conditions — chips */}
          <Field label="🏥 Condiciones médicas" hint="Selecciona las condiciones diagnosticadas que tengas.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "diabetes_type1", label: "🩸 Diabetes tipo 1" },
                { value: "diabetes_type2", label: "🩸 Diabetes tipo 2" },
                { value: "prediabetes", label: "⚠️ Prediabetes" },
                { value: "hypertension", label: "❤️ Hipertensión" },
                { value: "hypotension", label: "🟦 Hipotensión" },
                { value: "celiac", label: "🌾 Celiaqía" },
                { value: "crohn", label: "🪴 Crohn" },
                { value: "ibs", label: "🟡 Colon irritable" },
                { value: "hypothyroidism", label: "🦋 Hipotiroidismo" },
                { value: "hyperthyroidism", label: "🦋 Hipertiroidismo" },
                { value: "pcos", label: "🌸 SOP (ovario policístico)" },
                { value: "anemia", label: "🩸 Anemia" },
                { value: "high_cholesterol", label: "🧠 Colesterol alto" },
                { value: "high_triglycerides", label: "🧠 Triglicéridos altos" },
                { value: "gout", label: "🦛 Gota" },
                { value: "kidney_disease", label: "🫘 Enfermedad renal" },
                { value: "liver_disease", label: "🫘 Enfermedad hepática" },
                { value: "heart_disease", label: "❤️ Enfermedad cardíaca" },
                { value: "osteoporosis", label: "🦴 Osteoporosis" },
                { value: "arthritis", label: "🦴 Artritis" },
                { value: "fibromyalgia", label: "💪 Fibromialgia" },
                { value: "eating_disorder", label: "💜 TCA (trastorno alimentario)" },
                { value: "depression", label: "🟣 Depresión" },
                { value: "anxiety", label: "🟡 Ansiedad" },
                { value: "cancer", label: "🎀 Cáncer (en tratamiento)" },
              ].map((opt) => {
                const sel = selectedMedicalConditions.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => { setSelectedMedicalConditions(sel ? selectedMedicalConditions.filter((x) => x !== opt.value) : [...selectedMedicalConditions, opt.value]); setHasMedicalConditions(true); }}
                    style={{ padding: "8px 14px", borderRadius: "20px", border: sel ? "2px solid #ef4444" : "1.5px solid #e5e7eb", background: sel ? "rgba(239,68,68,0.1)" : "white", color: sel ? "#ef4444" : "#374151", fontSize: "13px", fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Special Needs / Momentary State */}
          <Field label="🤧 Estado actual o necesidades especiales" hint="Situaciones temporales que afectan tu alimentación.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "cold_flu", label: "🤧 Resfriado / Gripe" },
                { value: "stomach_bug", label: "🤢 Gastroenteritis" },
                { value: "post_surgery", label: "🏥 Post-operatorio" },
                { value: "post_covid", label: "🤡 Post-COVID" },
                { value: "fatigue", label: "🛌 Fatiga crónica" },
                { value: "muscle_recovery", label: "💪 Recuperación muscular" },
                { value: "detox", label: "🍋 Depuración / Detox" },
                { value: "weight_loss_phase", label: "⬇️ Fase de pérdida de peso" },
                { value: "muscle_gain_phase", label: "⬆️ Fase de ganancia muscular" },
                { value: "competition_prep", label: "🏆 Preparación competición" },
                { value: "exam_period", label: "📚 Época de exámenes" },
                { value: "travel", label: "✈️ Viaje frecuente" },
              ].map((opt) => {
                const sel = selectedSpecialNeeds.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => setSelectedSpecialNeeds(sel ? selectedSpecialNeeds.filter((x) => x !== opt.value) : [...selectedSpecialNeeds, opt.value])}
                    style={{ padding: "8px 14px", borderRadius: "20px", border: sel ? "2px solid #f59e0b" : "1.5px solid #e5e7eb", background: sel ? "rgba(245,158,11,0.1)" : "white", color: sel ? "#d97706" : "#374151", fontSize: "13px", fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Medication & Supplements */}
          <Toggle checked={useMetabolismMedication} onChange={setUseMetabolismMedication} label="¿Tomas medicación que afecte al metabolismo o peso?" />
          {useMetabolismMedication && (
            <Field label="Medicación" hint="Ej: corticoides, antidepresivos, insulina...">
              <Input value={metabolismMedication} onChange={setMetabolismMedication} placeholder="Nombre del medicamento" />
            </Field>
          )}
          <Toggle checked={useNutritionalSupplements} onChange={setUseNutritionalSupplements} label="¿Tomas suplementos nutricionales?" />
          {useNutritionalSupplements && (
            <Field label="Suplementos que tomas" hint="Ej: proteína whey, creatina, omega-3, vitamina D...">
              <Input value={nutritionalSupplements} onChange={setNutritionalSupplements} placeholder="Lista de suplementos" />
            </Field>
          )}
          <Toggle checked={hasMedicalDiet} onChange={setHasMedicalDiet} label="¿Sigues alguna dieta prescrita por un médico o nutricionista?" />
          {hasMedicalDiet && (
            <Field label="Tipo de dieta médica">
              <Input value={medicalDiet} onChange={setMedicalDiet} placeholder="Ej: dieta para diabéticos, dieta baja en sodio..." />
            </Field>
          )}
          <Toggle checked={hasSurgery} onChange={setHasSurgery} label="¿Has tenido alguna cirugía relacionada con el peso o digestión?" />
          {hasSurgery && (
            <Field label="Tipo de cirugía">
              <Input value={surgery} onChange={setSurgery} placeholder="Ej: manga gástrica, bypass, vesícula..." />
            </Field>
          )}
          <Toggle checked={hasMedicalFamilyBackground} onChange={setHasMedicalFamilyBackground} label="¿Tienes antecedentes familiares relevantes?" />
          {hasMedicalFamilyBackground && (
            <Field label="Antecedentes familiares" hint="Ej: diabetes, enfermedades cardiovasculares, obesidad...">
              <textarea value={medicalFamilyBackground} onChange={(e) => setMedicalFamilyBackground(e.target.value)} rows={2} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </Field>
          )}
          <SaveButton onClick={handleSaveMedical} loading={updateMedical.isPending} />
        </div>
      )}

      {/* ALLERGIES */}
      {activeTab === "allergies" && (
        <div style={card}>
          <SectionTitle>Alergias e intolerancias</SectionTitle>
          <Field label="Alergias alimentarias" hint="Selecciona todas las que apliquen.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(allergiesCatalog || []).map((a) => {
                const sel = selectedAllergies.includes(a.id);
                return (
                  <button key={a.id} onClick={() => setSelectedAllergies(sel ? selectedAllergies.filter((x) => x !== a.id) : [...selectedAllergies, a.id])}
                    style={{ padding: "8px 14px", borderRadius: "20px", border: sel ? "2px solid #ef4444" : "1.5px solid #e5e7eb", background: sel ? "rgba(239,68,68,0.1)" : "white", color: sel ? "#ef4444" : "#374151", fontSize: "13px", fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                    {a.nameEs}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Restricciones dietéticas" hint="Selecciona las que apliquen a tu estilo de vida.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(restrictionsCatalog || []).map((r) => {
                const sel = selectedRestrictions.includes(r.id);
                return (
                  <button key={r.id} onClick={() => setSelectedRestrictions(sel ? selectedRestrictions.filter((x) => x !== r.id) : [...selectedRestrictions, r.id])}
                    style={{ padding: "8px 14px", borderRadius: "20px", border: sel ? "2px solid #6366f1" : "1.5px solid #e5e7eb", background: sel ? "rgba(99,102,241,0.1)" : "white", color: sel ? "#6366f1" : "#374151", fontSize: "13px", fontWeight: sel ? 700 : 500, cursor: "pointer" }}>
                    {r.nameEs}
                  </button>
                );
              })}
            </div>
          </Field>
          <SaveButton onClick={handleSaveAllergies} loading={setAllergiesMut.isPending || setDietRestrictionsMut.isPending} />
        </div>
      )}

      {/* PREFERENCES */}
      {activeTab === "prefs" && (
        <div style={card}>
          <SectionTitle>Preferencias de la app</SectionTitle>
          <Field label="Complejidad de recetas preferida">
            <Select value={preferredMealComplexity} onChange={setPreferredMealComplexity} options={[
              { value: "simple", label: "Simple — pocas instrucciones, rápido" },
              { value: "moderate", label: "Moderada — equilibrio entre facilidad y variedad" },
              { value: "complex", label: "Compleja — me gusta cocinar elaborado" },
            ]} />
          </Field>
          <Field label="Tamaño de porciones habitual">
            <Select value={portionSize} onChange={setPortionSize} options={[
              { value: "small", label: "Pequeño — como poco" }, { value: "medium", label: "Mediano — normal" }, { value: "large", label: "Grande — como bastante" },
            ]} />
          </Field>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>Seguimiento y objetivos</p>
            <Toggle checked={wantsCalorieTracking} onChange={setWantsCalorieTracking} label="Quiero llevar control de calorías" />
            <Toggle checked={wantsMacroTracking} onChange={setWantsMacroTracking} label="Quiero controlar mis macronutrientes" />
            <Toggle checked={interestedInMealPrep} onChange={setInterestedInMealPrep} label="Me interesa el meal prep (cocinar en batch)" />
            <Toggle checked={wantsShoppingListAutomation} onChange={setWantsShoppingListAutomation} label="Quiero listas de la compra automáticas" />
            <Toggle checked={interestedInNutritionalAdvices} onChange={setInterestedInNutritionalAdvices} label="Quiero recibir consejos nutricionales" />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>Valores en la alimentación</p>
            <Toggle checked={preferSeasonalIngredients} onChange={setPreferSeasonalIngredients} label="Prefiero ingredientes de temporada" />
            <Toggle checked={preferLocalProducts} onChange={setPreferLocalProducts} label="Prefiero productos locales / km 0" />
            <Toggle checked={avoidProcessedFood} onChange={setAvoidProcessedFood} label="Quiero evitar alimentos ultraprocesados" />
          </div>
          <div>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>Comunicaciones</p>
            <Toggle checked={notifications} onChange={setNotifications} label="Notificaciones push" />
            <Toggle checked={newsletter} onChange={setNewsletter} label="Newsletter con novedades y recetas" />
          </div>
          <SaveButton onClick={handleSavePreferences} loading={updatePreferences.isPending} />
        </div>
      )}

      {/* SHOPPING */}
      {activeTab === "shopping" && (
        <div style={card}>
          <SectionTitle>Hábitos de compra</SectionTitle>
          <Field label="¿Con qué frecuencia haces la compra?">
            <Select value={purchaseFrequency} onChange={setPurchaseFrequency} options={[
              { value: "daily", label: "Todos los días" }, { value: "2_3_week", label: "2-3 veces por semana" },
              { value: "weekly", label: "Una vez por semana" }, { value: "biweekly", label: "Cada dos semanas" }, { value: "monthly", label: "Una vez al mes" },
            ]} />
          </Field>
          <Field label="¿Dónde sueles comprar principalmente?">
            <Select value={purchaseLocation} onChange={setPurchaseLocation} options={[
              { value: "supermarket", label: "Supermercado grande (Mercadona, Carrefour...)" },
              { value: "local_market", label: "Mercado local / tiendas de barrio" },
              { value: "online", label: "Online (Amazon Fresh, Ulabox...)" },
              { value: "mixed", label: "Combinación de varios" },
            ]} />
          </Field>
          <Toggle checked={organicProducts} onChange={setOrganicProducts} label="Prefiero productos ecológicos / bio" />
          <Toggle checked={suggestHealthier} onChange={setSuggestHealthier} label="Sugerir alternativas más saludables" />
          <Toggle checked={suggestCheaper} onChange={setSuggestCheaper} label="Sugerir alternativas más económicas" />
          <SaveButton onClick={handleSaveShopping} loading={updatePreferences.isPending} />
        </div>
      )}

      {/* ACCOUNT TAB - Delete account */}
      {activeTab === "account" && (
        <DeleteAccountSection />
      )}
    </div>
  );
}

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteAccount = trpc.profile.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Cuenta eliminada correctamente");
      // Clear session and redirect
      setTimeout(() => { window.location.href = "/"; }, 1500);
    },
    onError: (e) => toast.error(e.message || "Error al eliminar la cuenta"),
  });

  const handleDelete = () => {
    if (confirmText !== "DELETE MY ACCOUNT") {
      toast.error("El texto de confirmación no es correcto");
      return;
    }
    deleteAccount.mutate({ confirmation: "DELETE MY ACCOUNT" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Privacy & Data section */}
      <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #f3f4f6" }}>
        <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Privacidad y datos
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "14px", background: "#f9fafb", borderRadius: "12px" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#111827" }}>📊 Exportar mis datos</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>Descarga una copia de todos tus datos personales y actividad.</p>
            <button
              onClick={() => toast.info("Función disponible próximamente")}
              style={{ marginTop: "10px", padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#374151" }}
            >
              Solicitar exportación
            </button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1.5px solid #fca5a5" }}>
        <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 800, color: "#ef4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ⚠️ Zona de peligro
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#111827" }}>Eliminar mi cuenta</p>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>
              Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos tus datos: perfil, recetas, métricas, listas de compra, diario nutricional y suscripciones.
            </p>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              style={{ padding: "10px 20px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#dc2626", alignSelf: "flex-start" }}
            >
              Eliminar mi cuenta
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", background: "#fff1f2", borderRadius: "12px", border: "1px solid #fca5a5" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151", fontWeight: 600 }}>
                Para confirmar, escribe exactamente: <code style={{ background: "#fee2e2", padding: "2px 6px", borderRadius: "4px", color: "#dc2626" }}>DELETE MY ACCOUNT</code>
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                style={{ padding: "10px 14px", border: "1.5px solid #fca5a5", borderRadius: "10px", fontSize: "14px", outline: "none", background: "white" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                  style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE MY ACCOUNT" || deleteAccount.isPending}
                  style={{ flex: 1, padding: "10px", background: confirmText === "DELETE MY ACCOUNT" ? "#dc2626" : "#fca5a5", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: confirmText === "DELETE MY ACCOUNT" ? "pointer" : "not-allowed", color: "white", transition: "background 0.2s" }}
                >
                  {deleteAccount.isPending ? "Eliminando..." : "Confirmar eliminación"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
