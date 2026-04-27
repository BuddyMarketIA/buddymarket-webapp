import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n";
import CookiePreferencesPanel from "@/components/CookiePreferencesPanel";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ImageCropModal from "@/components/ImageCropModal";
import { toast } from "@/components/sonner-a11y-shim";
import { BuddyScore } from "@/components/BuddyScore";
import {
  UserIcon,
  HeartIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  FireIcon,
  SparklesIcon,
  CakeIcon,
  TrashIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

// ─── 5 tabs consolidados ────────────────────────────────────────────────────
const TABS = [
  { key: "account",    label: "Cuenta",             icon: UserIcon },
  { key: "health",     label: "Salud y objetivos",  icon: HeartIcon },
  { key: "food",       label: "Alimentación",        icon: CakeIcon },
  { key: "allergies",  label: "Alergias",            icon: ExclamationCircleIcon },
  { key: "prefs",      label: "Preferencias",        icon: SparklesIcon },
  { key: "buddyia",    label: "BuddyIA aprende",     icon: CpuChipIcon },
];

// ─── Helpers de UI ───────────────────────────────────────────────────────────
function LanguageSelectorInProfile() {
  const { i18n } = useTranslation();
  const updateBasic = trpc.profile.updateBasic.useMutation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.locale && user.locale !== i18n.language) {
      i18n.changeLanguage(user.locale);
    }
  }, [user?.locale]);

  const handleChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem("buddymarket_language", code);
    if (user) updateBasic.mutate({ locale: code });
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code as LanguageCode)}
          style={{
            padding: "10px 18px", borderRadius: "20px",
            border: i18n.language === lang.code ? "2px solid #F97316" : "1.5px solid #e5e7eb",
            background: i18n.language === lang.code ? "rgba(249,115,22,0.1)" : "white",
            color: i18n.language === lang.code ? "#F97316" : "#374151",
            fontSize: "14px", fontWeight: i18n.language === lang.code ? 700 : 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          <span style={{ fontSize: "18px" }}>{lang.flag}</span>
          <span>{lang.name}</span>
          {i18n.language === lang.code && <span style={{ color: "#F97316" }}>✓</span>}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </p>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "24px 0 16px" }}>
      <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
      <span style={{ fontSize: "12px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{label}</label>
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#9ca3af" }}>{hint}</p>}
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

// ─── Componente principal ────────────────────────────────────────────────────
export default function Profile() {
  const [activeTab, setActiveTab] = useState("account");
  const [, setLocation] = useLocation();
  const { user, logout: logoutFn } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const handleLogoutConfirmed = async () => {
    setLogoutPending(true);
    await logoutFn();
  };
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: allergiesCatalog } = trpc.catalogs.allergies.useQuery();
  const { data: restrictionsCatalog } = trpc.catalogs.dietRestrictions.useQuery();
  const utils = trpc.useUtils();

  // ── Personal / Cuenta ──
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // ── Salud y objetivos (body) ──
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
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState("");
  const [motivationLevel, setMotivationLevel] = useState("");
  const [fitnessGoalDetail, setFitnessGoalDetail] = useState("");
  const [previousDietExperience, setPreviousDietExperience] = useState<string[]>([]);

  // ── Salud y objetivos (lifestyle health fields) ──
  const [sleepHours, setSleepHours] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [waterIntake, setWaterIntake] = useState("");

  // ── Salud y objetivos (medical) ──
  const [dietaryPattern, setDietaryPattern] = useState("");
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);
  const [selectedSpecialNeeds, setSelectedSpecialNeeds] = useState<string[]>([]);
  const [pregnancyWeek, setPregnancyWeek] = useState("");
  const [selectedMedicalConditions, setSelectedMedicalConditions] = useState<string[]>([]);
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState("");
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

  // ── Ciclo menstrual ──
  const [trackMenstrualCycle, setTrackMenstrualCycle] = useState(false);
  const [menstrualCycleLength, setMenstrualCycleLength] = useState("28");
  const [menstrualPeriodLength, setMenstrualPeriodLength] = useState("5");
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  // ── Alimentación y cocina ──
  const [activityLevel, setActivityLevel] = useState("");
  const [practicesSports, setPracticesSports] = useState(false);
  const [sportsFrequency, setSportsFrequency] = useState("");
  const [sportsTypes, setSportsTypes] = useState<string[]>([]);
  const [workType, setWorkType] = useState("");
  const [alcoholConsumption, setAlcoholConsumption] = useState("");
  const [smokingStatus, setSmokingStatus] = useState("");
  const [cookingLevel, setCookingLevel] = useState("");
  const [mealPrepTime, setMealPrepTime] = useState("");
  const [dailyMeals, setDailyMeals] = useState("");
  const [snackingHabits, setSnackingHabits] = useState("");
  const [eatOutFrequency, setEatOutFrequency] = useState("");
  const [budgetPerWeek, setBudgetPerWeek] = useState("");
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState("");
  const [cookingEquipment, setCookingEquipment] = useState<string[]>([]);

  // ── Alergias ──
  const [selectedAllergies, setSelectedAllergies] = useState<number[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>([]);

  // ── Preferencias de app ──
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

  // ── Hábitos de compra ──
  const [purchaseFrequency, setPurchaseFrequency] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [organicProducts, setOrganicProducts] = useState(false);
  const [suggestHealthier, setSuggestHealthier] = useState(false);
  const [suggestCheaper, setSuggestCheaper] = useState(false);

  // ── Preferencias Menú IA ──
  const { data: menuPrefs } = trpc.profile.getMenuPreferences.useQuery();
  const [mpDietType, setMpDietType] = useState("");
  const [mpProteinSource, setMpProteinSource] = useState("");
  const [mpDislikedFoods, setMpDislikedFoods] = useState("");
  const [mpSupplements, setMpSupplements] = useState("");
  const [mpSpecialNotes, setMpSpecialNotes] = useState("");
  const [mpPersons, setMpPersons] = useState(1);
  const [mpMealsPerDay, setMpMealsPerDay] = useState(3);

  const saveMenuPrefs = trpc.profile.saveMenuPreferences.useMutation({
    onSuccess: () => { utils.profile.getMenuPreferences.invalidate(); toast.success("✅ Preferencias de menú guardadas"); },
    onError: () => toast.error("Error al guardar las preferencias"),
  });

  // ── safeJsonParse ──
  function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
    if (!str) return fallback;
    try { const p = JSON.parse(str); return p ?? fallback; } catch { return fallback; }
  }

  // ── Cargar datos ──
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
      setDailyCalorieGoal(p.dailyCalorieGoal?.toString() || "");
      setMotivationLevel(p.motivationLevel || "");
      setFitnessGoalDetail(p.fitnessGoalDetail || "");
      setPreviousDietExperience(safeJsonParse(p.previousDietExperience, []));
      setActivityLevel(p.activityLevel || "");
      setPracticesSports(p.practicesSports ?? false);
      setSportsFrequency(p.sportsFrequency || "");
      setSportsTypes(safeJsonParse(p.sportsTypes, []));
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
      setFavoriteCuisines(safeJsonParse(p.favoriteCuisines, []));
      setDislikedIngredients(safeJsonParse<string[]>(p.dislikedIngredients, []).join(", "));
      setCookingEquipment(safeJsonParse(p.cookingEquipment, []));
    }

    if (m) {
      setDietaryPattern(m.dietaryPattern || "");
      setSelectedLifestyle(safeJsonParse(m.lifestyle, []));
      setSelectedSpecialNeeds(safeJsonParse(m.specialNeeds, []));
      setPregnancyWeek(m.pregnancyWeek?.toString() || "");
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
    // Menstrual cycle
    if (p) {
      setTrackMenstrualCycle(p.trackMenstrualCycle ?? false);
      setMenstrualCycleLength(p.menstrualCycleLength?.toString() || "28");
      setMenstrualPeriodLength(p.menstrualPeriodLength?.toString() || "5");
      setLastPeriodDate(p.lastPeriodDate ? new Date(p.lastPeriodDate).toISOString().split("T")[0] : "");
    }
  }, [profile]);

  useEffect(() => {
    if (!menuPrefs) return;
    setMpDietType(menuPrefs.dietType || "");
    setMpProteinSource(menuPrefs.proteinSource || "");
    setMpDislikedFoods(menuPrefs.dislikedFoods || "");
    setMpSupplements(menuPrefs.supplementsUsed || "");
    setMpSpecialNotes(menuPrefs.specialNotes || "");
    setMpPersons(menuPrefs.persons ?? 1);
    setMpMealsPerDay(menuPrefs.mealsPerDay ?? 3);
  }, [menuPrefs]);

  // ── Foto de perfil ──
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const uploadProfilePhoto = trpc.profile.uploadProfilePhoto.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Foto de perfil actualizada"); setPhotoPreview(null); },
    onError: () => toast.error("Error al subir la foto. Inténtalo de nuevo."),
  });
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > 10 * 1024 * 1024) { toast.error("La foto no puede superar 10 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { const dataUrl = ev.target?.result as string; setCropImageSrc(dataUrl); };
    reader.readAsDataURL(file);
  };
  const handleCropComplete = (blob: Blob) => {
    setCropImageSrc(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      uploadProfilePhoto.mutate({ imageBase64: base64, mimeType: "image/jpeg" });
    };
    reader.readAsDataURL(blob);
  };
  const handleCropCancel = () => setCropImageSrc(null);

  // ── Mutaciones ──
  const updateBasic = trpc.profile.updateBasic.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Datos personales guardados"); } });
  const updateProfile = trpc.profile.updateProfile.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Perfil actualizado"); } });
  const updateMedical = trpc.profile.updateMedical.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Datos de salud guardados"); } });
  const updatePreferences = trpc.profile.updatePreferences.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Preferencias guardadas"); } });
  const setAllergiesMut = trpc.profile.setAllergies.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Alergias actualizadas"); } });
  const setDietRestrictionsMut = trpc.profile.setDietRestrictions.useMutation({ onSuccess: () => { utils.profile.get.invalidate(); toast.success("Restricciones actualizadas"); } });

  // ── Guardar Salud y objetivos (body + health lifestyle + medical) ──
  const saveCycleMut = trpc.menstrualCycle.save.useMutation({
    onSuccess: () => toast.success("Ciclo menstrual guardado"),
    onError: () => toast.error("Error al guardar el ciclo menstrual"),
  });
  const handleSaveCycle = () => {
    saveCycleMut.mutate({
      trackMenstrualCycle,
      cycleLength: menstrualCycleLength ? parseInt(menstrualCycleLength) : 28,
      periodLength: menstrualPeriodLength ? parseInt(menstrualPeriodLength) : 5,
      lastPeriodDate: lastPeriodDate || undefined,
    });
  };
  const handleSaveHealth = () => {
    // Body + lifestyle health fields
    updateProfile.mutate({
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
      dailyCalorieGoal: dailyCalorieGoal ? parseInt(dailyCalorieGoal) : undefined,
      motivationLevel: (motivationLevel as any) || undefined,
      fitnessGoalDetail: fitnessGoalDetail || undefined,
      previousDietExperience: previousDietExperience.length ? JSON.stringify(previousDietExperience) : undefined,
      sleepHours: sleepHours ? parseInt(sleepHours) : undefined,
      stressLevel: (stressLevel as any) || undefined,
      waterIntake: waterIntake ? parseFloat(waterIntake) : undefined,
    });
    // Medical
    updateMedical.mutate({
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
  };

  // ── Guardar Alimentación y cocina ──
  const handleSaveFood = () => updateProfile.mutate({
    activityLevel: (activityLevel as any) || undefined,
    practicesSports,
    sportsFrequency: (sportsFrequency as any) || undefined,
    sportsTypes: sportsTypes.length ? JSON.stringify(sportsTypes) : undefined,
    workType: (workType as any) || undefined,
    alcoholConsumption: (alcoholConsumption as any) || undefined,
    smokingStatus: (smokingStatus as any) || undefined,
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

  // ── Alergias con confirmación grave ──
  const SEVERE_ALLERGY_KEYWORDS = ["cacahuete", "frutos secos", "nuez", "almendra", "avellana",
    "marisco", "pescado", "leche", "huevo", "soja", "trigo", "gluten", "sésamo", "moluscos", "altramuces"];
  const [showAllergyConfirm, setShowAllergyConfirm] = useState(false);
  const [pendingAllergyIds, setPendingAllergyIds] = useState<number[]>([]);
  const [newSevereAllergyNames, setNewSevereAllergyNames] = useState<string[]>([]);

  const handleSaveAllergies = () => {
    const currentIds = new Set((profile?.allergies ?? []).map((a: any) => a.allergy?.id ?? a.id));
    const newlyAdded = selectedAllergies.filter((id) => !currentIds.has(id));
    const newSevere = newlyAdded.reduce<{ id: number; name: string }[]>((acc, id) => {
      const allergy = allergiesCatalog?.find((a: any) => a.id === id);
      const name = (allergy?.nameEs ?? "").toLowerCase();
      if (SEVERE_ALLERGY_KEYWORDS.some((s) => name.includes(s))) acc.push({ id, name: allergy?.nameEs ?? String(id) });
      return acc;
    }, []);
    if (newSevere.length > 0) {
      setPendingAllergyIds(selectedAllergies);
      setNewSevereAllergyNames(newSevere.map((a) => a.name));
      setShowAllergyConfirm(true);
      return;
    }
    setAllergiesMut.mutate({ allergyIds: selectedAllergies });
    setDietRestrictionsMut.mutate({ restrictionIds: selectedRestrictions });
  };

  const confirmSaveAllergies = () => {
    setShowAllergyConfirm(false);
    setAllergiesMut.mutate({
      allergyIds: pendingAllergyIds,
      severities: Object.fromEntries(pendingAllergyIds.map((id) => [String(id), "medical" as const])),
    });
    setDietRestrictionsMut.mutate({ restrictionIds: selectedRestrictions });
  };

  // ── Guardar Preferencias (app + compras + menú IA) ──
  const handleSavePreferences = () => {
    updatePreferences.mutate({
      preferredMealComplexity: (preferredMealComplexity as any) || undefined,
      portionSize: (portionSize as any) || undefined,
      preferSeasonalIngredients, preferLocalProducts, avoidProcessedFood,
      interestedInMealPrep, wantsShoppingListAutomation, wantsCalorieTracking, wantsMacroTracking,
      interestedInNutritionalAdvices, notifications, newsletter,
      purchaseFrequency: purchaseFrequency || undefined,
      purchaseLocation: purchaseLocation || undefined,
      organicProducts, suggestHealthierProducts: suggestHealthier, suggestCheaperProducts: suggestCheaper,
    });
    saveMenuPrefs.mutate({
      dietType: mpDietType || undefined,
      allergies: selectedAllergies.map(String),
      restrictions: selectedRestrictions.map(String),
      dislikedFoods: mpDislikedFoods,
      proteinSource: mpProteinSource || undefined,
      cookingTime: mealPrepTime || undefined,
      cookingSkill: cookingLevel || undefined,
      kitchenEquipment: cookingEquipment,
      supplementsUsed: mpSupplements,
      specialNotes: mpSpecialNotes,
      persons: mpPersons,
      mealsPerDay: dailyMeals ? parseInt(dailyMeals) : mpMealsPerDay,
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #F97316", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const card: React.CSSProperties = { background: "white", borderRadius: "18px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "16px" };

  return (
    <>
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      {/* Image Crop Modal */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* Header con foto y nombre */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <label htmlFor="profile-photo-input" style={{ position: "relative", width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0, cursor: "pointer", display: "block" }}>
            {(photoPreview || user?.imageUrl) ? (
              <img src={photoPreview || user?.imageUrl!} alt="Foto de perfil" style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid #F97316" }} />
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800, color: "white" }}>
                {(user?.name || user?.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
              {uploadProfilePhoto.isPending ? (
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid white", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
              )}
            </div>
            <input id="profile-photo-input" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </label>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#1a1a1a" }}>{user?.name || "Mi perfil"}</p>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>{user?.email}</p>
            {/* Barra de progreso de completitud del perfil */}
            {(() => {
              const fields = [
                !!user?.name,
                !!user?.imageUrl,
                !!height,
                !!weight,
                !!mainGoal,
                !!activityLevel,
                !!gender,
                !!birthYear,
                selectedAllergies.length > 0 || selectedRestrictions.length > 0 || true, // always count as filled if user has seen it
                !!cookingLevel,
              ];
              const filled = fields.filter(Boolean).length;
              const pct = Math.round((filled / fields.length) * 100);
              const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#F97316";
              return (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>Perfil completado</span>
                    <span style={{ fontSize: "11px", color, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })()}
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} style={{ padding: "8px 14px", borderRadius: "10px", border: "1.5px solid #fee2e2", background: "white", color: "#ef4444", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
            Salir
          </button>
        </div>
      </div>

      {/* Tab bar — 5 tabs */}
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

      {/* ── TAB: CUENTA ── */}
      {activeTab === "account" && (
        <div>
          <div style={card}>
            <SectionTitle>Datos personales</SectionTitle>
            <Field label="Nombre completo">
              <Input value={name} onChange={setName} placeholder="Tu nombre" />
            </Field>
            <Field label="Teléfono" hint="Opcional. Usado para recordatorios y soporte.">
              <Input value={phone} onChange={setPhone} type="tel" placeholder="+34 600 000 000" />
            </Field>
            <Field label="Sobre mí" hint="Cuéntanos algo sobre ti, tus hábitos o motivaciones.">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Soy deportista aficionado, busco mejorar mi alimentación..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </Field>
            <SaveButton onClick={() => updateBasic.mutate({ name, phone, description })} loading={updateBasic.isPending} />
          </div>

          <div style={card}>
            <SectionTitle>Idioma de la app</SectionTitle>
            <LanguageSelectorInProfile />
          </div>

          <div style={card}>
            <SectionTitle>Suscripción y pagos</SectionTitle>
            <button
              onClick={() => setLocation("/app/subscription")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 0", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontSize: "15px", color: "#374151" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>⭐</span>
                <span>Mi plan y suscripción</span>
              </span>
              <span style={{ color: "#9ca3af", fontSize: "18px" }}>›</span>
            </button>
            <button
              onClick={() => setLocation("/app/payment-history")}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "12px 0", background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "#374151" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>🧾</span>
                <span>Historial de pagos y facturas</span>
              </span>
              <span style={{ color: "#9ca3af", fontSize: "18px" }}>›</span>
            </button>
          </div>

          <DeleteAccountSection />
        </div>
      )}

      {/* ── TAB: SALUD Y OBJETIVOS ── */}
      {activeTab === "health" && (
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
          <Field label="% Grasa corporal (si lo conoces)">
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
          <Field label="Calorías diarias objetivo (kcal)" hint="Ajusta manualmente si quieres un déficit o supéravit mayor al calculado automáticamente.">
            <input
              type="number"
              value={dailyCalorieGoal}
              onChange={(e) => setDailyCalorieGoal(e.target.value)}
              placeholder="Ej: 1600"
              min={800}
              max={6000}
              step={50}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #F97316", fontSize: "15px", background: "#fff7ed", outline: "none", boxSizing: "border-box", fontWeight: 600, color: "#ea580c" }}
            />
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9ca3af" }}>Rango recomendado: 1200–3500 kcal/día. Valor actual calculado automáticamente: {dailyCalorieGoal ? `${dailyCalorieGoal} kcal` : "no establecido"}</p>
          </Field>
          <Field label="Nivel de motivación actual">
            <Select value={motivationLevel} onChange={setMotivationLevel} options={[
              { value: "low", label: "Bajo — necesito apoyo" }, { value: "medium", label: "Medio — voy bien" },
              { value: "high", label: "Alto — muy comprometido/a" }, { value: "very_high", label: "Muy alto — modo bestia 🔥" },
            ]} />
          </Field>
          <Field label="Describe tu objetivo con más detalle">
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

          <SectionDivider label="Sueño, estrés y agua" />

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

          <SectionDivider label="Historial de salud" />

          <Field label="🌱 Patrón alimentario" hint="¿Cómo describes tu forma de comer habitualmente?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "omnivore", label: "🥩 Omnívoro" }, { value: "flexitarian", label: "🥗 Flexitariano" },
                { value: "vegetarian", label: "🥦 Vegetariano" }, { value: "vegan", label: "🌿 Vegano" },
                { value: "pescatarian", label: "🐟 Pescetariano" }, { value: "keto", label: "🥑 Keto" },
                { value: "paleo", label: "🦴 Paleo" }, { value: "mediterranean", label: "🫒 Mediterráneo" },
                { value: "low_carb", label: "🍞 Bajo en carbos" }, { value: "high_protein", label: "💪 Alto en proteína" },
                { value: "gluten_free", label: "🌾 Sin gluten" }, { value: "lactose_free", label: "🥛 Sin lactosa" },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setDietaryPattern(dietaryPattern === opt.value ? "" : opt.value)}
                  style={{ padding: "8px 14px", borderRadius: "20px", border: dietaryPattern === opt.value ? "2px solid #10b981" : "1.5px solid #e5e7eb", background: dietaryPattern === opt.value ? "rgba(16,185,129,0.1)" : "white", color: dietaryPattern === opt.value ? "#059669" : "#374151", fontSize: "13px", fontWeight: dietaryPattern === opt.value ? 700 : 500, cursor: "pointer" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="👩‍👦 Situación vital" hint="Selecciona las que apliquen a tu situación actual.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "pregnant", label: "🤰 Embarazada" }, { value: "breastfeeding", label: "🤱 Lactancia" },
                { value: "trying_to_conceive", label: "💚 Buscando embarazo" }, { value: "menopause", label: "🌸 Menopausia" },
                { value: "athlete", label: "🏃 Deportista" }, { value: "elderly", label: "👴 Adulto mayor (+65)" },
                { value: "child", label: "👶 Niño / Adolescente" }, { value: "student", label: "📚 Estudiante" },
                { value: "shift_worker", label: "🌙 Trabajo a turnos" }, { value: "high_stress", label: "🧠 Alto estrés" },
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
          {selectedLifestyle.includes("pregnant") && (
            <Field label="Semana de embarazo">
              <Input value={pregnancyWeek} onChange={setPregnancyWeek} placeholder="Ej: 20" type="number" />
            </Field>
          )}

          <Field label="🏥 Condiciones médicas" hint="Selecciona las condiciones diagnosticadas que tengas.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "diabetes_type1", label: "🩸 Diabetes tipo 1" }, { value: "diabetes_type2", label: "🩸 Diabetes tipo 2" },
                { value: "prediabetes", label: "⚠️ Prediabetes" }, { value: "hypertension", label: "❤️ Hipertensión" },
                { value: "hypotension", label: "🟦 Hipotensión" }, { value: "celiac", label: "🌾 Celiaqía" },
                { value: "crohn", label: "🪴 Crohn" }, { value: "ibs", label: "🟡 Colon irritable" },
                { value: "hypothyroidism", label: "🦋 Hipotiroidismo" }, { value: "hyperthyroidism", label: "🦋 Hipertiroidismo" },
                { value: "pcos", label: "🌸 SOP" }, { value: "anemia", label: "🩸 Anemia" },
                { value: "high_cholesterol", label: "🧠 Colesterol alto" }, { value: "high_triglycerides", label: "🧠 Triglicéridos altos" },
                { value: "gout", label: "🦛 Gota" }, { value: "kidney_disease", label: "🫘 Enfermedad renal" },
                { value: "liver_disease", label: "🫘 Enfermedad hepática" }, { value: "heart_disease", label: "❤️ Enfermedad cardíaca" },
                { value: "osteoporosis", label: "🦴 Osteoporosis" }, { value: "arthritis", label: "🦴 Artritis" },
                { value: "fibromyalgia", label: "💪 Fibromialgia" }, { value: "eating_disorder", label: "💜 TCA" },
                { value: "depression", label: "🟣 Depresión" }, { value: "anxiety", label: "🟡 Ansiedad" },
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

          <Field label="🤧 Estado actual o necesidades especiales">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { value: "cold_flu", label: "🤧 Resfriado / Gripe" }, { value: "stomach_bug", label: "🤢 Gastroenteritis" },
                { value: "post_surgery", label: "🏥 Post-operatorio" }, { value: "fatigue", label: "🛌 Fatiga crónica" },
                { value: "muscle_recovery", label: "💪 Recuperación muscular" }, { value: "detox", label: "🍋 Depuración / Detox" },
                { value: "weight_loss_phase", label: "⬇️ Fase pérdida de peso" }, { value: "muscle_gain_phase", label: "⬆️ Fase ganancia muscular" },
                { value: "competition_prep", label: "🏆 Preparación competición" }, { value: "exam_period", label: "📚 Época de exámenes" },
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

          <Toggle checked={useMetabolismMedication} onChange={setUseMetabolismMedication} label="¿Tomas medicación que afecte al metabolismo o peso?" />
          {useMetabolismMedication && (
            <Field label="Medicación" hint="Ej: corticoides, antidepresivos, insulina...">
              <Input value={metabolismMedication} onChange={setMetabolismMedication} placeholder="Lista de medicamentos" />
            </Field>
          )}
          <Toggle checked={useNutritionalSupplements} onChange={setUseNutritionalSupplements} label="¿Tomas suplementos nutricionales?" />
          {useNutritionalSupplements && (
            <Field label="Suplementos" hint="Ej: proteína whey, creatina, omega-3, vitamina D...">
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

          <SectionDivider label="Actividad física" />

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
                  { value: "basketball", label: "Baloncesto" }, { value: "tennis", label: "Tenis/pádel" },
                  { value: "crossfit", label: "CrossFit" }, { value: "hiking", label: "Senderismo" },
                  { value: "dance", label: "Baile" }, { value: "martial_arts", label: "Artes marciales" },
                  { value: "other", label: "Otro" },
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

          <SaveButton onClick={handleSaveHealth} loading={updateProfile.isPending || updateMedical.isPending} />
        </div>
      )}

      {/* ── CICLO MENSTRUAL (solo visible si género = female y tab = health) ── */}
      {activeTab === "health" && gender === "female" && (
        <div style={{ marginTop: "16px", padding: "24px", borderRadius: "20px", background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)", border: "1.5px solid #f9a8d4" }}>
          <SectionTitle>🌸 Ciclo menstrual y nutrición hormonal</SectionTitle>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px", lineHeight: "1.5" }}>
            Activa el seguimiento del ciclo para que la IA adapte tus menús y recomendaciones nutricionales a cada fase: menstruación, folicular, ovulación y lútea.
          </p>
          <Toggle checked={trackMenstrualCycle} onChange={setTrackMenstrualCycle} label="Activar seguimiento del ciclo menstrual" />
          {trackMenstrualCycle && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <Field label="Duración del ciclo (días)" hint="Típico: 21-35 días. Media: 28 días.">
                  <Select value={menstrualCycleLength} onChange={setMenstrualCycleLength} options={[
                    { value: "21", label: "21 días" }, { value: "22", label: "22 días" }, { value: "23", label: "23 días" },
                    { value: "24", label: "24 días" }, { value: "25", label: "25 días" }, { value: "26", label: "26 días" },
                    { value: "27", label: "27 días" }, { value: "28", label: "28 días (media)" }, { value: "29", label: "29 días" },
                    { value: "30", label: "30 días" }, { value: "31", label: "31 días" }, { value: "32", label: "32 días" },
                    { value: "33", label: "33 días" }, { value: "34", label: "34 días" }, { value: "35", label: "35 días" },
                  ]} />
                </Field>
                <Field label="Duración de la menstruación (días)" hint="Típico: 3-7 días.">
                  <Select value={menstrualPeriodLength} onChange={setMenstrualPeriodLength} options={[
                    { value: "2", label: "2 días" }, { value: "3", label: "3 días" }, { value: "4", label: "4 días" },
                    { value: "5", label: "5 días (media)" }, { value: "6", label: "6 días" }, { value: "7", label: "7 días" },
                    { value: "8", label: "8 días" },
                  ]} />
                </Field>
              </div>
              <Field label="Fecha de inicio de tu último período" hint="Esto permite calcular en qué fase del ciclo estás hoy.">
                <input type="date" value={lastPeriodDate} onChange={(e) => setLastPeriodDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #f9a8d4", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }} />
              </Field>
              <div style={{ background: "rgba(249,168,212,0.2)", borderRadius: "12px", padding: "14px 16px", marginTop: "4px", marginBottom: "12px" }}>
                <p style={{ fontSize: "13px", color: "#9d174d", fontWeight: 600, marginBottom: "10px" }}>¿Cómo adapta la IA tu nutrición según la fase?</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { phase: "🔴 Menstruación", days: "Días 1-5", tip: "Hierro, magnesio, antiinflamatorios (jengibre, cúrcuma)" },
                    { phase: "🌱 Folicular", days: "Días 6-13", tip: "Proteína, zinc, carbohidratos complejos para energía" },
                    { phase: "✨ Ovulación", days: "Días 14-16", tip: "Fibra, antioxidantes, alimentos ligeros y frescos" },
                    { phase: "🌙 Lútea", days: "Días 17-28", tip: "Calcio, B6, magnesio, reducir sal y azúcar" },
                  ].map((item) => (
                    <div key={item.phase} style={{ background: "white", borderRadius: "8px", padding: "10px 12px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "#be185d", marginBottom: "2px" }}>{item.phase}</p>
                      <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>{item.days}</p>
                      <p style={{ fontSize: "11px", color: "#374151", lineHeight: "1.4" }}>{item.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <SaveButton onClick={handleSaveCycle} loading={saveCycleMut.isPending} />
        </div>
      )}

      {/* ── TAB: ALIMENTACIÓN Y COCINA ── */}
      {activeTab === "food" && (
        <div style={card}>
          <SectionDivider label="Hábitos culinarios" />

          <Field label="Número de comidas al día">
            <Select value={dailyMeals} onChange={setDailyMeals} options={[
              { value: "2", label: "2 comidas" }, { value: "3", label: "3 comidas" },
              { value: "4", label: "4 comidas" }, { value: "5", label: "5 comidas" }, { value: "6", label: "6 o más comidas" },
            ]} />
          </Field>
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

          <SectionDivider label="Cocinas y equipamiento" />

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

          <SaveButton onClick={handleSaveFood} loading={updateProfile.isPending} />
        </div>
      )}

      {/* ── TAB: ALERGIAS Y RESTRICCIONES ── */}
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

      {/* ── TAB: PREFERENCIAS ── */}
      {activeTab === "prefs" && (
        <div>
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
            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 600, color: "#374151" }}>Comunicaciones</p>
              <Toggle checked={notifications} onChange={setNotifications} label="Notificaciones push" />
              <Toggle checked={newsletter} onChange={setNewsletter} label="Newsletter con novedades y recetas" />
            </div>
          </div>

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
          </div>

          <div style={card}>
            <div style={{ marginBottom: "16px", padding: "14px 16px", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontWeight: 600 }}>💡 Estas preferencias se cargarán automáticamente cada vez que generes un menú con IA.</p>
            </div>
            <SectionTitle>Preferencias para menús IA</SectionTitle>
            <Field label="Tipo de dieta preferida">
              <Select value={mpDietType} onChange={setMpDietType} options={[
                { value: "", label: "Sin preferencia" },
                { value: "omnivore", label: "🥩 Omnívoro — como de todo" },
                { value: "mediterranean", label: "🫔 Mediterráneo" },
                { value: "vegetarian", label: "🥦 Vegetariano" },
                { value: "vegan", label: "🌱 Vegano" },
                { value: "pescatarian", label: "🐟 Pescetariano" },
                { value: "flexitarian", label: "🌿 Flexitariano" },
                { value: "keto", label: "🥑 Cetogénico (Keto)" },
                { value: "paleo", label: "🦴 Paleo" },
                { value: "dash", label: "❤️ DASH (hipertensión)" },
                { value: "gluten_free", label: "🌾 Sin gluten" },
                { value: "lactose_free", label: "🥛 Sin lácteos" },
              ]} />
            </Field>
            <Field label="Fuente de proteína preferida">
              <Select value={mpProteinSource} onChange={setMpProteinSource} options={[
                { value: "", label: "Sin preferencia" },
                { value: "meat", label: "🥩 Carne (ternera, pollo, cerdo...)" },
                { value: "fish", label: "🐟 Pescado y mariscos" },
                { value: "eggs", label: "🥚 Huevos" },
                { value: "legumes", label: "🫘 Legumbres (lentejas, garbanzos...)" },
                { value: "plant", label: "🌿 Vegetal (tofu, tempeh, seitán)" },
                { value: "mixed", label: "🔄 Mixto — combino varias fuentes" },
              ]} />
            </Field>
            <Field label="Alimentos que no te gustan (para el menú IA)" hint="Escribe ingredientes o platos separados por comas.">
              <input value={mpDislikedFoods} onChange={(e) => setMpDislikedFoods(e.target.value)}
                placeholder="ej: hígado, col, pimiento verde..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box" }} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
              <Field label="Número de personas">
                <input type="number" min={1} max={20} value={mpPersons} onChange={(e) => setMpPersons(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box" }} />
              </Field>
              <Field label="Comidas al día (menú IA)">
                <input type="number" min={1} max={8} value={mpMealsPerDay} onChange={(e) => setMpMealsPerDay(Number(e.target.value))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box" }} />
              </Field>
            </div>
            <Field label="Suplementos que tomas" hint="Opcional. Se incluirán en las notas del menú.">
              <input value={mpSupplements} onChange={(e) => setMpSupplements(e.target.value)}
                placeholder="ej: proteína whey, creatina, omega-3..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box" }} />
            </Field>
            <Field label="Notas especiales para la IA" hint="Cualquier información adicional que quieras que tenga en cuenta.">
              <textarea value={mpSpecialNotes} onChange={(e) => setMpSpecialNotes(e.target.value)}
                placeholder="ej: soy deportista y entreno por las mañanas, prefiero desayunos abundantes..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e5e7eb", fontSize: "14px", boxSizing: "border-box", resize: "vertical" }} />
            </Field>
            {menuPrefs?.updatedAt && (
              <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "12px" }}>
                Última actualización: {new Date(menuPrefs.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>

          <SaveButton onClick={handleSavePreferences} loading={updatePreferences.isPending || saveMenuPrefs.isPending} />
        </div>
      )}
    </div>

    {/* Modal confirmación alergias graves */}
    {showAllergyConfirm && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "28px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>⚠️</div>
          <h3 style={{ textAlign: "center", fontSize: "18px", fontWeight: 800, color: "#dc2626", margin: "0 0 12px" }}>Alergia grave detectada</h3>
          <p style={{ textAlign: "center", fontSize: "14px", color: "#374151", margin: "0 0 16px", lineHeight: 1.6 }}>
            Estás añadiendo una alergia que puede causar <strong>reacciones graves</strong>:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginBottom: "16px" }}>
            {newSevereAllergyNames.map((n) => (
              <span key={n} style={{ padding: "4px 10px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", fontSize: "13px", fontWeight: 600 }}>{n}</span>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
            Esta app no sustituye el consejo médico. Consulta a tu médico o alergista ante cualquier duda.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setShowAllergyConfirm(false)} style={{ flex: 1, padding: "12px", background: "#f3f4f6", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              Cancelar
            </button>
            <button onClick={confirmSaveAllergies} style={{ flex: 1, padding: "12px", background: "#dc2626", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", color: "white" }}>
              Sí, confirmar alergia grave
            </button>
          </div>
        </div>
      </div>
    )}
      {/* BuddyIA aprende tab */}
      {activeTab === "buddyia" && (
        <div style={{ paddingBottom: "24px" }}>
          <BuddyScore />
        </div>
      )}

      {/* Logout confirmation dialog */}
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setShowLogoutConfirm(false)}
        isPending={logoutPending}
      />
    </>
  );
}

function DeleteAccountSection() {
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteAccount = trpc.profile.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Cuenta eliminada correctamente");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    },
    onError: (e) => toast.error(e.message || "Error al eliminar la cuenta"),
  });

  const handleDelete = () => {
    if (confirmText !== "DELETE MY ACCOUNT") { toast.error("El texto de confirmación no es correcto"); return; }
    deleteAccount.mutate({ confirmation: "DELETE MY ACCOUNT" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <CookiePreferencesPanel />

      <div style={{ background: "white", borderRadius: "16px", padding: "24px", border: "1px solid #f3f4f6" }}>
        <p style={{ margin: "0 0 16px", fontSize: "13px", fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Privacidad y datos
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "14px", background: "#f9fafb", borderRadius: "12px" }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#111827" }}>📊 Exportar mis datos</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#6b7280" }}>Descarga una copia de todos tus datos personales y actividad.</p>
            <button onClick={() => toast.info("Función disponible próximamente")} style={{ marginTop: "10px", padding: "8px 16px", background: "#f3f4f6", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
              Solicitar exportación
            </button>
          </div>
        </div>
      </div>

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
            <button onClick={() => setShowConfirm(true)} style={{ padding: "10px 20px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#dc2626", alignSelf: "flex-start" }}>
              Eliminar mi cuenta
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", background: "#fff1f2", borderRadius: "12px", border: "1px solid #fca5a5" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#374151", fontWeight: 600 }}>
                Para confirmar, escribe exactamente: <code style={{ background: "#fee2e2", padding: "2px 6px", borderRadius: "4px", color: "#dc2626" }}>DELETE MY ACCOUNT</code>
              </p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE MY ACCOUNT"
                style={{ padding: "10px 14px", border: "1.5px solid #fca5a5", borderRadius: "10px", fontSize: "14px", outline: "none", background: "white" }} />
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setShowConfirm(false); setConfirmText(""); }} style={{ flex: 1, padding: "10px", background: "#f3f4f6", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={confirmText !== "DELETE MY ACCOUNT" || deleteAccount.isPending}
                  style={{ flex: 1, padding: "10px", background: confirmText === "DELETE MY ACCOUNT" ? "#dc2626" : "#fca5a5", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: confirmText === "DELETE MY ACCOUNT" ? "pointer" : "not-allowed", color: "white", transition: "background 0.2s" }}>
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
