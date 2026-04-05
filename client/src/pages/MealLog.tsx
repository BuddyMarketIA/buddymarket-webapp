import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";
import NutritionCalendar from "@/components/NutritionCalendar";
import ProductNutritionCard from "@/components/ProductNutritionCard";

export default function MealLog() {
  const [dateOffset, setDateOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "photo" | "barcode">("manual");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Manual form state
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [selectedDayPart, setSelectedDayPart] = useState("1");

  // Photo/AI state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    mealName: string;
    foods: Array<{ name: string; quantity: string; calories: number; proteins: number; carbs: number; fats: number; allergens?: string[] }>;
    totalCalories: number;
    totalProteins: number;
    totalCarbs: number;
    totalFats: number;
    confidence: string;
    notes: string;
    photoUrl: string | null;
    detectedUserAllergens?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);
    return d.toISOString().split("T")[0];
  }, [dateOffset]);

  const { data: logs, isLoading } = trpc.mealLogs.list.useQuery({
    startDate: selectedDate,
    endDate: selectedDate,
  });
  const { data: summary } = trpc.mealLogs.dailySummary.useQuery({ date: selectedDate });
  const { data: dayParts } = trpc.catalogs.dayParts.useQuery();
  const { data: profileData } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const evaluateAchievements = trpc.achievements.evaluate.useMutation({
    onSuccess: (data) => {
      if (data.newlyUnlocked.length > 0) {
        // Small delay so the meal success toast shows first
        setTimeout(() => {
          toast.success(`🏆 ¡Logro desbloqueado! +${data.newlyUnlocked.length} nuevo${data.newlyUnlocked.length > 1 ? "s" : ""} logro${data.newlyUnlocked.length > 1 ? "s" : ""}`, {
            duration: 5000,
            action: { label: "Ver logros", onClick: () => window.location.href = "/app/achievements" },
          });
        }, 800);
      }
    },
  });

  const addLog = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      utils.mealLogs.list.invalidate({ startDate: selectedDate, endDate: selectedDate });
      utils.mealLogs.dailySummary.invalidate({ date: selectedDate });
      setShowAdd(false);
      resetForm();
      toast.success("Comida registrada ✓");
      // Evaluate achievements after logging a meal
      evaluateAchievements.mutate({ trigger: "meal_logged" });
    },
    onError: (err) => toast.error(err.message),
  });

  const analyzeFood = trpc.mealLogs.analyzeFood.useMutation({
    onSuccess: (data) => {
      setAiResult({ ...data.analysis, photoUrl: data.photoUrl, detectedUserAllergens: data.analysis.detectedUserAllergens ?? [] });
      setMealName(data.analysis.mealName || "");
      setCalories(String(data.analysis.totalCalories || ""));
      setProteins(String(data.analysis.totalProteins || ""));
      setCarbs(String(data.analysis.totalCarbs || ""));
      setFats(String(data.analysis.totalFats || ""));
    },
    onError: (err) => toast.error("Error al analizar la imagen: " + err.message),
  });

  const removeLog = trpc.mealLogs.remove.useMutation({
    onSuccess: () => {
      utils.mealLogs.list.invalidate({ startDate: selectedDate, endDate: selectedDate });
      utils.mealLogs.dailySummary.invalidate({ date: selectedDate });
      toast.success("Registro eliminado");
    },
  });

  const handleRemoveLog = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}" del diario?`)) return;
    removeLog.mutate({ id });
  };

  const resetForm = () => {
    setMealName("");
    setCalories("");
    setProteins("");
    setCarbs("");
    setFats("");
    setSelectedDayPart("1");
    setPhotoPreview(null);
    setPhotoBase64(null);
    setAiResult(null);
    setAddMode("manual");
  };

  const isToday = dateOffset === 0;
  const dateLabel = isToday
    ? "Hoy"
    : dateOffset === -1
    ? "Ayer"
    : new Date(selectedDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  const totalCals = (summary as any)?.calories ?? 0;
  const targetCals = (profileData?.profile as any)?.dailyCalorieGoal ?? 2000;
  const goalType = (profileData?.profile as any)?.goal ?? undefined;
  const calPct = Math.min(100, Math.round((totalCals / targetCals) * 100));

  // Macro totals
  const totalProteins = Math.round((summary as any)?.proteins ?? 0);
  const totalCarbs = Math.round((summary as any)?.carbohydrates ?? 0);
  const totalFats = Math.round((summary as any)?.fats ?? 0);

  // Macro targets derived from calorie goal using standard ratios
  // Protein: 30%, Carbs: 45%, Fat: 25%
  const targetProteins = Math.round((targetCals * 0.30) / 4);
  const targetCarbs = Math.round((targetCals * 0.45) / 4);
  const targetFats = Math.round((targetCals * 0.25) / 9);

  const protPct = Math.min(100, targetProteins > 0 ? Math.round((totalProteins / targetProteins) * 100) : 0);
  const carbPct = Math.min(100, targetCarbs > 0 ? Math.round((totalCarbs / targetCarbs) * 100) : 0);
  const fatPct = Math.min(100, targetFats > 0 ? Math.round((totalFats / targetFats) * 100) : 0);

  // SVG donut chart data
  const macroTotal = totalProteins * 4 + totalCarbs * 4 + totalFats * 9;
  const protKcal = totalProteins * 4;
  const carbKcal = totalCarbs * 4;
  const fatKcal = totalFats * 9;
  const donutR = 36;
  const donutCirc = 2 * Math.PI * donutR;
  const protArc = macroTotal > 0 ? (protKcal / macroTotal) * donutCirc : 0;
  const carbArc = macroTotal > 0 ? (carbKcal / macroTotal) * donutCirc : 0;
  const fatArc = macroTotal > 0 ? (fatKcal / macroTotal) * donutCirc : 0;

  // Motivational message
  const motivMsg = calPct === 0
    ? "¡Empieza a registrar tus comidas!"
    : calPct < 50
    ? "¡Buen comienzo! Sigue añadiendo comidas."
    : calPct < 80
    ? "¡Vas muy bien! Casi en tu objetivo."
    : calPct <= 100
    ? "¡Objetivo alcanzado! Excelente día."
    : "¡Has superado tu objetivo calrico hoy.";

  // Group by day part
  const grouped: Record<string, any[]> = {};
  (logs ?? []).forEach((log: any) => {
    const part = log.dayPart?.nameEs ?? "Comida";
    if (!grouped[part]) grouped[part] = [];
    grouped[part].push(log);
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen es demasiado grande (máx 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      // Extract base64 without data URL prefix
      const base64 = dataUrl.split(",")[1];
      setPhotoBase64(base64);
      setAiResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (!photoBase64) return;
    analyzeFood.mutate({ imageBase64: photoBase64, mimeType: "image/jpeg" });
  };

  const handleConfirmAndSave = () => {
    const name = mealName.trim();
    if (!name) { toast.error("El nombre es obligatorio"); return; }
    addLog.mutate({
      customMealName: name,
      logDate: selectedDate,
      dayPartId: Number(selectedDayPart) || 1,
      servings: 1,
      calories: calories ? Number(calories) : undefined,
      proteins: proteins ? Number(proteins) : undefined,
      carbohydrates: carbs ? Number(carbs) : undefined,
      fats: fats ? Number(fats) : undefined,
      photoUrl: aiResult?.photoUrl || undefined,
    });
  };

  return (
    <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>Diario</h1>
          <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#9ca3af" }}>Seguimiento nutricional</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href="/app/complements"
            style={{ width: "42px", height: "42px", borderRadius: "14px", background: "#FFF7ED", border: "1.5px solid #FED7AA", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: "20px", flexShrink: 0 }}
            title="Complementos (café, té, snacks...)"
          >☕</a>
          <button
            onClick={() => { setShowAdd(true); setAddMode("manual"); }}
            style={{ width: "42px", height: "42px", borderRadius: "14px", background: "#F97316", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Date navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        {/* Calendar overview button */}
        <button
          onClick={() => setShowCalendar(true)}
          style={{ height: "48px", borderRadius: "14px", background: "#1a1a2e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 14px", gap: "6px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          title="Ver resumen mensual"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: "0.05em" }}>MES</span>
        </button>
        {/* Day navigator */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", borderRadius: "14px", padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => setDateOffset(o => o - 1)}
            style={{ width: "30px", height: "30px", borderRadius: "10px", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", textTransform: "capitalize" }}>{dateLabel}</span>
          <button
            onClick={() => setDateOffset(o => Math.min(0, o + 1))}
            disabled={isToday}
            style={{ width: "30px", height: "30px", borderRadius: "10px", background: isToday ? "#f9fafb" : "#f3f4f6", border: "none", cursor: isToday ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isToday ? 0.3 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      </div>
      {/* Nutrition Calendar Modal */}
      {showCalendar && (
        <NutritionCalendar
          onClose={() => setShowCalendar(false)}
          calorieGoal={targetCals}
          goalType={goalType}
          onDayPress={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(date);
            target.setHours(0, 0, 0, 0);
            const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
            setDateOffset(diff);
            setShowCalendar(false);
          }}
        />
      )}

      {/* Nutrition summary card */}
      <div style={{ background: "white", borderRadius: "24px", padding: "18px", marginBottom: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6" }}>
        {/* Top: calorie progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Calorías del día</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "2px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: calPct > 100 ? "#ef4444" : "#1a1a1a", lineHeight: 1 }}>{Math.round(totalCals)}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#9ca3af" }}>/ {targetCals} kcal</span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: calPct > 100 ? "#ef4444" : calPct >= 80 ? "#22c55e" : "#f97316", fontWeight: 600 }}>{motivMsg}</p>
          </div>
          {/* Donut chart */}
          <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 90 90">
              {/* Background ring */}
              <circle cx="45" cy="45" r={donutR} fill="none" stroke="#f3f4f6" strokeWidth="10" />
              {macroTotal === 0 ? (
                <circle cx="45" cy="45" r={donutR} fill="none" stroke="#e5e7eb" strokeWidth="10" />
              ) : (
                <>
                  {/* Proteins - blue */}
                  <circle cx="45" cy="45" r={donutR} fill="none" stroke="#3b82f6" strokeWidth="10"
                    strokeDasharray={`${protArc} ${donutCirc - protArc}`}
                    strokeDashoffset={donutCirc * 0.25}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                  {/* Carbs - amber */}
                  <circle cx="45" cy="45" r={donutR} fill="none" stroke="#f59e0b" strokeWidth="10"
                    strokeDasharray={`${carbArc} ${donutCirc - carbArc}`}
                    strokeDashoffset={donutCirc * 0.25 - protArc}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                  {/* Fats - rose */}
                  <circle cx="45" cy="45" r={donutR} fill="none" stroke="#f43f5e" strokeWidth="10"
                    strokeDasharray={`${fatArc} ${donutCirc - fatArc}`}
                    strokeDashoffset={donutCirc * 0.25 - protArc - carbArc}
                    strokeLinecap="butt"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                </>
              )}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>{calPct}%</span>
              <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 600, marginTop: "1px" }}>objetivo</span>
            </div>
          </div>
        </div>

        {/* Calorie progress bar */}
        <div style={{ background: "#f3f4f6", borderRadius: "999px", height: "6px", overflow: "hidden", marginBottom: "14px" }}>
          <div style={{
            background: calPct > 100 ? "#ef4444" : calPct >= 80 ? "linear-gradient(90deg,#22c55e,#16a34a)" : "linear-gradient(90deg,#F97316,#FB923C)",
            borderRadius: "999px", height: "100%", width: `${calPct}%`, transition: "width 0.6s ease"
          }} />
        </div>

        {/* Macro bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Proteins */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#3b82f6", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", width: "60px", flexShrink: 0 }}>Proteína</span>
            <div style={{ flex: 1, background: "#eff6ff", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: "#3b82f6", borderRadius: "999px", height: "100%", width: `${protPct}%`, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: "#6b7280", width: "70px", textAlign: "right", flexShrink: 0 }}>{totalProteins}g / {targetProteins}g</span>
          </div>
          {/* Carbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#f59e0b", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", width: "60px", flexShrink: 0 }}>Carbos</span>
            <div style={{ flex: 1, background: "#fffbeb", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: "#f59e0b", borderRadius: "999px", height: "100%", width: `${carbPct}%`, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: "#6b7280", width: "70px", textAlign: "right", flexShrink: 0 }}>{totalCarbs}g / {targetCarbs}g</span>
          </div>
          {/* Fats */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#f43f5e", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151", width: "60px", flexShrink: 0 }}>Grasas</span>
            <div style={{ flex: 1, background: "#fff1f2", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: "#f43f5e", borderRadius: "999px", height: "100%", width: `${fatPct}%`, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: "#6b7280", width: "70px", textAlign: "right", flexShrink: 0 }}>{totalFats}g / {targetFats}g</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "12px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f3f4f6", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6" }} />
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Proteína</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Carbos</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f43f5e" }} />
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>Grasas</span>
          </div>
        </div>
      </div>

      {/* Quick add photo button */}
      <button
        onClick={() => { setShowAdd(true); setAddMode("photo"); }}
        style={{ width: "100%", background: "white", border: "2px dashed #FED7AA", borderRadius: "16px", padding: "14px", marginBottom: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#F97316", fontWeight: 700, fontSize: "14px", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,115,22,0.04)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
      >
        <span style={{ fontSize: "22px" }}>📸</span>
        <span>Fotografía tu comida → Análisis IA</span>
      </button>

      {/* Meal logs by type */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1, 2, 3].map(i => <div key={i} style={{ borderRadius: "16px", background: "#f3f4f6", height: "80px" }} />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ background: "white", borderRadius: "20px", padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p style={{ margin: "0 0 8px", fontSize: "36px" }}>📋</p>
          <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#1a1a1a" }}>Sin registros para hoy</p>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#9ca3af" }}>Registra tus comidas para hacer seguimiento nutricional</p>
          <button onClick={() => { setShowAdd(true); setAddMode("manual"); }} style={{ background: "#F97316", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer" }}>
            Registrar comida
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {Object.entries(grouped).map(([part, partLogs]) => (
            <div key={part} style={{ background: "white", borderRadius: "18px", padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#374151" }}>{part}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {partLogs.map((log: any) => (
                  <div key={log.log.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f9fafb", borderRadius: "12px", padding: "10px 12px" }}>
                    {/* Photo thumbnail if available */}
                    {log.log.photoUrl && (
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
                        <img src={log.log.photoUrl} alt="food" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.recipe?.name ?? log.log.customMealName ?? "Comida"}
                      </p>
                      <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                        {log.log.calories && <span style={{ fontSize: "14px", color: "#F97316", fontWeight: 700 }}>{Math.round(log.log.calories)} kcal</span>}
                        {log.log.proteins && <span style={{ fontSize: "14px", color: "#6b7280" }}>💪 {Math.round(log.log.proteins)}g</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLog(log.log.id, log.recipe?.name ?? log.log.customMealName ?? "Comida")}
                      style={{ width: "30px", height: "30px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#d1d5db"; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add log modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowAdd(false); resetForm(); } }}>
          <div style={{ width: "100%", maxWidth: "480px", borderRadius: "28px", background: "white", padding: "24px", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", maxHeight: "calc(100dvh - 90px - 48px)", overflowY: "auto" }}>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#1a1a1a" }}>Registrar comida</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Mode selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px", width: "100%" }}>
              <button
                onClick={() => setAddMode("manual")}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: addMode === "manual" ? "#F97316" : "#f3f4f6", color: addMode === "manual" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                ✏️ Manual
              </button>
              <button
                onClick={() => setAddMode("photo")}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: addMode === "photo" ? "#F97316" : "#f3f4f6", color: addMode === "photo" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                📸 Foto IA
              </button>
              <button
                onClick={() => { setAddMode("barcode"); setShowBarcodeScanner(true); }}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, background: addMode === "barcode" ? "#F97316" : "#f3f4f6", color: addMode === "barcode" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                🔍 Código
              </button>
            </div>

            {/* Photo mode */}
            {addMode === "photo" && (
              <div style={{ marginBottom: "16px" }}>
                {/* Hidden file inputs */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />

                {!photoPreview ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      style={{ width: "100%", background: "linear-gradient(135deg, #F97316, #FB923C)", border: "none", borderRadius: "16px", padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "white", fontWeight: 700, fontSize: "15px" }}
                    >
                      <span style={{ fontSize: "24px" }}>📷</span>
                      <span>Tomar foto</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ width: "100%", background: "white", border: "2px dashed #FED7AA", borderRadius: "16px", padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#F97316", fontWeight: 700, fontSize: "14px" }}
                    >
                      <span style={{ fontSize: "20px" }}>🖼️</span>
                      <span>Elegir de galería</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Photo preview */}
                    <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", marginBottom: "12px" }}>
                      <img src={photoPreview} alt="preview" style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                      <button
                        onClick={() => { setPhotoPreview(null); setPhotoBase64(null); setAiResult(null); }}
                        style={{ position: "absolute", top: "8px", right: "8px", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px" }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Analyze button */}
                    {!aiResult && (
                      <button
                        onClick={handleAnalyze}
                        disabled={analyzeFood.isPending}
                        style={{ width: "100%", background: analyzeFood.isPending ? "#f3f4f6" : "linear-gradient(135deg, #F97316, #FB923C)", border: "none", borderRadius: "14px", padding: "14px", cursor: analyzeFood.isPending ? "not-allowed" : "pointer", color: analyzeFood.isPending ? "#9ca3af" : "white", fontWeight: 700, fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        {analyzeFood.isPending ? (
                          <>
                            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                            <span>Analizando con IA...</span>
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            <span>Analizar con IA</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* AI Result */}
                    {aiResult && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {/* Allergen warning banner — shown FIRST so user sees it immediately */}
                        {aiResult.detectedUserAllergens && aiResult.detectedUserAllergens.length > 0 && (
                          <div style={{
                            background: "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
                            border: "2px solid #F87171",
                            borderRadius: "14px",
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "22px" }}>⚠️</span>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#991B1B" }}>
                                Alérgenos detectados en tu perfil
                              </p>
                            </div>
                            <p style={{ margin: 0, fontSize: "13px", color: "#B91C1C", lineHeight: 1.4 }}>
                              Este plato puede contener alérgenos que has indicado en tu perfil. Revisa los ingredientes antes de consumirlo.
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                              {aiResult.detectedUserAllergens.map((allergen, i) => (
                                <span key={i} style={{
                                  background: "#FCA5A5",
                                  color: "#7F1D1D",
                                  borderRadius: "20px",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  textTransform: "capitalize",
                                }}>
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Header: meal name + confidence */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "18px" }}>🤖</span>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1a1a", flex: 1 }}>{aiResult.mealName}</p>
                          <span style={{
                            fontSize: "11px",
                            color: aiResult.confidence === "alta" ? "#059669" : aiResult.confidence === "media" ? "#D97706" : "#DC2626",
                            background: aiResult.confidence === "alta" ? "#D1FAE5" : aiResult.confidence === "media" ? "#FEF3C7" : "#FEE2E2",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            fontWeight: 700,
                          }}>
                            Confianza {aiResult.confidence}
                          </span>
                        </div>

                        {/* Calorie hero */}
                        {(() => {
                          const totalKcal = aiResult.totalCalories || 0;
                          const prot = aiResult.totalProteins || 0;
                          const carbs = aiResult.totalCarbs || 0;
                          const fats = aiResult.totalFats || 0;
                          const totalMacroKcal = prot * 4 + carbs * 4 + fats * 9;
                          const protPct = totalMacroKcal > 0 ? Math.round((prot * 4 / totalMacroKcal) * 100) : 0;
                          const carbPct = totalMacroKcal > 0 ? Math.round((carbs * 4 / totalMacroKcal) * 100) : 0;
                          const fatPct = totalMacroKcal > 0 ? Math.round((fats * 9 / totalMacroKcal) * 100) : 0;
                          const maxProt = 60, maxCarbs = 150, maxFats = 80;
                          return (
                            <>
                              {/* Calorie hero card */}
                              <div style={{
                                background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)",
                                border: "1.5px solid #FED7AA",
                                borderRadius: 14,
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}>
                                <div>
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em" }}>Energía total</p>
                                  <p style={{ margin: "2px 0 0", fontSize: 32, fontWeight: 900, color: "#C2410C", lineHeight: 1 }}>
                                    {totalKcal}<span style={{ fontSize: 13, fontWeight: 700, marginLeft: 3 }}>kcal</span>
                                  </p>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <span style={{ fontSize: 11, background: "#10B981", color: "#fff", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>P {protPct}%</span>
                                    <span style={{ fontSize: 11, background: "#F97316", color: "#fff", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>HC {carbPct}%</span>
                                    <span style={{ fontSize: 11, background: "#3B82F6", color: "#fff", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>G {fatPct}%</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: 10, color: "#92400E", fontWeight: 600 }}>% de calorías totales</p>
                                </div>
                              </div>

                              {/* Macro bars */}
                              <div style={{ background: "#FAFAFA", border: "1px solid #F3F4F6", borderRadius: 14, padding: "14px 16px" }}>
                                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Macronutrientes</p>
                                {/* Proteins */}
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 14 }}>💪</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Proteínas</span>
                                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>(músculo)</span>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>{prot}g</span>
                                  </div>
                                  <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(100, Math.round((prot / maxProt) * 100))}%`, background: "#10B981", borderRadius: 99, transition: "width 0.6s ease" }} />
                                  </div>
                                </div>
                                {/* Carbs */}
                                <div style={{ marginBottom: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 14 }}>🌾</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Hidratos</span>
                                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>(energía)</span>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "#F97316" }}>{carbs}g</span>
                                  </div>
                                  <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(100, Math.round((carbs / maxCarbs) * 100))}%`, background: "#F97316", borderRadius: 99, transition: "width 0.6s ease" }} />
                                  </div>
                                </div>
                                {/* Fats */}
                                <div style={{ marginBottom: 0 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 14 }}>🥑</span>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Grasas</span>
                                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>(hormonas)</span>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6" }}>{fats}g</span>
                                  </div>
                                  <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(100, Math.round((fats / maxFats) * 100))}%`, background: "#3B82F6", borderRadius: 99, transition: "width 0.6s ease" }} />
                                  </div>
                                </div>
                              </div>

                              {/* Food list */}
                              {aiResult.foods.length > 0 && (
                                <div style={{ background: "white", border: "1px solid #F3F4F6", borderRadius: 14, padding: "12px 14px" }}>
                                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Alimentos detectados</p>
                                  {aiResult.foods.map((food, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < aiResult.foods.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                                      <div>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{food.name}</span>
                                        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 6 }}>{food.quantity}</span>
                                      </div>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "#F97316" }}>{food.calories} kcal</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Notes */}
                              {aiResult.notes && (
                                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontStyle: "italic", padding: "0 4px" }}>{aiResult.notes}</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Common form fields (shown in both modes, or after AI analysis) */}
            {(addMode === "manual" || aiResult) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder="¿Qué comiste? (ej: Ensalada de pollo)"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "2px solid #f3f4f6", fontSize: "14px", outline: "none", boxSizing: "border-box", fontWeight: 600 }}
                />
                <select
                  value={selectedDayPart}
                  onChange={e => setSelectedDayPart(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "2px solid #f3f4f6", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box" }}
                >
                  {dayParts?.map(dp => (
                    <option key={dp.id} value={String(dp.id)}>{dp.nameEs}</option>
                  )) ?? (
                    <>
                      <option value="1">Desayuno</option>
                      <option value="2">Almuerzo</option>
                      <option value="3">Merienda</option>
                      <option value="4">Cena</option>
                    </>
                  )}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Calorías (kcal)" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #f3f4f6", fontSize: "13px", outline: "none" }} />
                  <input type="number" value={proteins} onChange={e => setProteins(e.target.value)} placeholder="Proteínas (g)" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #f3f4f6", fontSize: "13px", outline: "none" }} />
                  <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="Carbohidratos (g)" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #f3f4f6", fontSize: "13px", outline: "none" }} />
                  <input type="number" value={fats} onChange={e => setFats(e.target.value)} placeholder="Grasas (g)" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #f3f4f6", fontSize: "13px", outline: "none" }} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            {(addMode === "manual" || aiResult) && (
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  onClick={() => { setShowAdd(false); resetForm(); }}
                  style={{ flex: 1, padding: "13px", borderRadius: "14px", border: "2px solid #f3f4f6", background: "white", fontSize: "14px", fontWeight: 700, color: "#6b7280", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAndSave}
                  disabled={addLog.isPending}
                  style={{ flex: 2, padding: "13px", borderRadius: "14px", border: "none", background: addLog.isPending ? "#f3f4f6" : "#F97316", color: addLog.isPending ? "#9ca3af" : "white", fontSize: "14px", fontWeight: 700, cursor: addLog.isPending ? "not-allowed" : "pointer", boxShadow: addLog.isPending ? "none" : "0 4px 12px rgba(249,115,22,0.35)" }}
                >
                  {addLog.isPending ? "Guardando..." : (aiResult ? "✓ Confirmar y guardar" : "Registrar")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: "13px", color: "#d1d5db", textAlign: "center", margin: "24px 0 0", lineHeight: 1.5 }}>
        BuddyMarket no constituye recomendaciones profesionales de nutrición. Consulta a un dietista.
      </p>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onProductFound={(product) => {
            // Pre-fill the manual form with the scanned product data
            setMealName(product.name + (product.brand ? ` (${product.brand})` : ""));
            setCalories(String(product.per100g.calories));
            setProteins(String(product.per100g.proteins));
            setCarbs(String(product.per100g.carbohydrates));
            setFats(String(product.per100g.fats));
            setAddMode("manual");
            setShowBarcodeScanner(false);
            // Show a brief toast with the product name
            toast.success(`✓ ${product.name} — ${product.per100g.calories} kcal/100g`);
          }}
          onClose={() => {
            setShowBarcodeScanner(false);
            setAddMode("manual");
          }}
        />
      )}
    </div>
  );
}
