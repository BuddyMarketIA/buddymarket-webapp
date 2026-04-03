import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function MealLog() {
  const [dateOffset, setDateOffset] = useState(0);
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
    foods: Array<{ name: string; quantity: string; calories: number; proteins: number; carbs: number; fats: number }>;
    totalCalories: number;
    totalProteins: number;
    totalCarbs: number;
    totalFats: number;
    confidence: string;
    notes: string;
    photoUrl: string;
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
      setAiResult({ ...data.analysis, photoUrl: data.photoUrl });
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
  const targetCals = 2000;
  const calPct = Math.min(100, Math.round((totalCals / targetCals) * 100));

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", background: "white", borderRadius: "16px", padding: "12px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <button
          onClick={() => setDateOffset(o => o - 1)}
          style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", textTransform: "capitalize" }}>{dateLabel}</span>
        <button
          onClick={() => setDateOffset(o => Math.min(0, o + 1))}
          disabled={isToday}
          style={{ width: "32px", height: "32px", borderRadius: "10px", background: isToday ? "#f9fafb" : "#f3f4f6", border: "none", cursor: isToday ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isToday ? 0.3 : 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      {/* Calorie summary card */}
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 60%, #FDBA74 100%)", borderRadius: "20px", padding: "18px", marginBottom: "16px", boxShadow: "0 6px 24px rgba(249,115,22,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Calorías del día</span>
          <span style={{ fontSize: "20px", fontWeight: 900, color: "white" }}>{Math.round(totalCals)} kcal</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: "999px", height: "8px", overflow: "hidden", marginBottom: "6px" }}>
          <div style={{ background: "white", borderRadius: "999px", height: "100%", width: `${calPct}%`, transition: "width 0.6s ease" }} />
        </div>
        <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.7)", textAlign: "right" }}>Objetivo: {targetCals} kcal</p>
        {(summary as any)?.proteins !== undefined && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "12px" }}>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "8px 4px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "white" }}>{Math.round((summary as any).proteins ?? 0)}g</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>Proteína</p>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "8px 4px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "white" }}>{Math.round((summary as any).carbohydrates ?? 0)}g</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>Carbos</p>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "8px 4px" }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "white" }}>{Math.round((summary as any).fats ?? 0)}g</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>Grasas</p>
            </div>
          </div>
        )}
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
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setAddMode("manual")}
                style={{ flex: 1, padding: "10px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, background: addMode === "manual" ? "#F97316" : "#f3f4f6", color: addMode === "manual" ? "white" : "#6b7280", transition: "all 0.2s" }}
              >
                ✏️ Manual
              </button>
              <button
                onClick={() => setAddMode("photo")}
                style={{ flex: 1, padding: "10px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, background: addMode === "photo" ? "#F97316" : "#f3f4f6", color: addMode === "photo" ? "white" : "#6b7280", transition: "all 0.2s" }}
              >
                📸 Foto IA
              </button>
              <button
                onClick={() => { setAddMode("barcode"); setShowBarcodeScanner(true); }}
                style={{ flex: 1, padding: "10px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, background: addMode === "barcode" ? "#F97316" : "#f3f4f6", color: addMode === "barcode" ? "white" : "#6b7280", transition: "all 0.2s" }}
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
                      <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", borderRadius: "14px", padding: "14px", marginBottom: "12px", border: "1px solid #FED7AA" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <span style={{ fontSize: "18px" }}>🤖</span>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#9a3412" }}>Análisis IA completado</p>
                          <span style={{ fontSize: "14px", color: "#ea580c", background: "rgba(249,115,22,0.15)", borderRadius: "6px", padding: "2px 6px", fontWeight: 700, marginLeft: "auto" }}>
                            Confianza: {aiResult.confidence}
                          </span>
                        </div>
                        {aiResult.foods.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                            {aiResult.foods.map((food, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                                <span style={{ color: "#374151", fontWeight: 600 }}>{food.name} ({food.quantity})</span>
                                <span style={{ color: "#F97316", fontWeight: 700 }}>{food.calories} kcal</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginTop: "8px" }}>
                          <div style={{ textAlign: "center", background: "white", borderRadius: "8px", padding: "6px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 900, color: "#F97316" }}>{aiResult.totalCalories}</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>kcal</p>
                          </div>
                          <div style={{ textAlign: "center", background: "white", borderRadius: "8px", padding: "6px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 900, color: "#3b82f6" }}>{aiResult.totalProteins}g</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>prot</p>
                          </div>
                          <div style={{ textAlign: "center", background: "white", borderRadius: "8px", padding: "6px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 900, color: "#f59e0b" }}>{aiResult.totalCarbs}g</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>carbs</p>
                          </div>
                          <div style={{ textAlign: "center", background: "white", borderRadius: "8px", padding: "6px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 900, color: "#eab308" }}>{aiResult.totalFats}g</p>
                            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>grasas</p>
                          </div>
                        </div>
                        {aiResult.notes && <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#6b7280", fontStyle: "italic" }}>{aiResult.notes}</p>}
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
            toast.success(`✓ Producto encontrado: ${product.name}`);
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
