import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeGate } from "@/components/UpgradeGate";
import BarcodeScanner from "@/components/BarcodeScanner";
import NutritionCalendar from "@/components/NutritionCalendar";
import ProductNutritionCard from "@/components/ProductNutritionCard";

// ─── AI Loading Animation ───────────────────────────────────────────────────
const AI_STEPS = [
  { icon: "📷", label: "Procesando imagen", detail: "Preparando la foto para el análisis..." },
  { icon: "🔍", label: "Identificando alimentos", detail: "Reconociendo ingredientes y platos..." },
  { icon: "🧮", label: "Calculando macronutrientes", detail: "Estimando proteínas, hidratos y grasas..." },
  { icon: "✨", label: "Generando análisis completo", detail: "Preparando tu informe nutricional..." },
];

function AILoadingAnimation({ onTimeout }: { onTimeout?: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Advance steps every ~3 seconds
    const stepInterval = setInterval(() => {
      setStep(prev => Math.min(prev + 1, AI_STEPS.length - 1));
    }, 3000);

    // Smooth progress bar — holds at 88% until result arrives
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 88) return prev;
        return prev + 1;
      });
    }, 200);

    // Timeout after 90 seconds
    const timeoutId = setTimeout(() => {
      setTimedOut(true);
      onTimeout?.();
    }, 90000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    };
  }, [onTimeout]);

  if (timedOut) {
    return (
      <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 18, padding: "20px 18px", marginBottom: 12, textAlign: "center" }}>
        <p style={{ fontSize: 24, margin: "0 0 8px" }}>⏱️</p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#991B1B" }}>El análisis está tardando demasiado</p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#B91C1C" }}>Introduce los valores manualmente o intenta con una foto más pequeña.</p>
      </div>
    );
  }

  const currentStep = AI_STEPS[step];

  return (
    <div style={{
      background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
      border: "1.5px solid #FED7AA",
      borderRadius: 18,
      padding: "20px 18px",
      marginBottom: 12,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {/* Spinner + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Pulsing ring + spinner */}
        <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
          {/* Outer pulse ring */}
          <div className="ai-pulse-ring" style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid #F97316",
          }} />
          {/* Spinning circle */}
          <div className="ai-spin" style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            border: "3px solid #FED7AA",
            borderTopColor: "#F97316",
          }} />
          {/* Center icon */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>
            {currentStep.icon}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#9a3412" }} className="ai-step-in" key={step}>
            {currentStep.label}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#C2410C", lineHeight: 1.4 }} className="ai-step-in" key={`d-${step}`}>
            {currentStep.detail}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.05em" }}>Progreso del análisis</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316" }}>{progress}%</span>
        </div>
        <div style={{ height: 8, background: "#FEF3C7", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #F97316, #FB923C)",
            borderRadius: 99,
            transition: "width 0.12s linear",
          }} />
        </div>
      </div>

      {/* Steps list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {AI_STEPS.map((s, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: i > step ? 0.35 : 1,
            transition: "opacity 0.4s ease",
          }}>
            {/* Status icon */}
            <div style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: i < step ? "#10B981" : i === step ? "#F97316" : "#E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.3s ease",
            }}>
              {i < step ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : i === step ? (
                <div className="ai-spin" style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white" }} />
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#9CA3AF" }} />
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: i === step ? 700 : 500, color: i === step ? "#9a3412" : i < step ? "#374151" : "#9CA3AF" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <p style={{ margin: 0, fontSize: 11, color: "#C2410C", textAlign: "center", fontStyle: "italic" }}>
        El análisis puede tardar entre 10 y 60 segundos
      </p>
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

export default function MealLog() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { can } = usePlan();
  const [dateOffset, setDateOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "photo" | "barcode" | "voice">("manual");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const transcribeAndEstimate = trpc.mealLogs.transcribeVoice.useMutation({
    onSuccess: (data) => {
      if (data.transcript) {
        setVoiceTranscript(data.transcript);
        setMealName(data.mealName || data.transcript);
        setCalories(String(data.calories || ""));
        setProteins(String(data.proteins || ""));
        setCarbs(String(data.carbs || ""));
        setFats(String(data.fats || ""));
        setEstimateApplied(true);
        setAddMode("manual");
        toast.success(`🎙️ Voz reconocida: ${data.transcript}`);
      }
    },
    onError: () => {
      toast.error("No se pudo transcribir el audio. Inténtalo de nuevo.");
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          transcribeAndEstimate.mutate({ audioBase64: base64 });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("No se pudo acceder al micrófono. Comprueba los permisos.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Manual form state
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [selectedDayPart, setSelectedDayPart] = useState("1");

  // AI text estimation state
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateApplied, setEstimateApplied] = useState(false);
  const estimateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const estimateFromText = trpc.mealLogs.estimateFromText.useMutation({
    onSuccess: (data) => {
      setCalories(String(data.calories));
      setProteins(String(data.proteins));
      setCarbs(String(data.carbs));
      setFats(String(data.fats));
      setMealName(data.mealName);
      setEstimateApplied(true);
      setIsEstimating(false);
    },
    onError: () => {
      setIsEstimating(false);
    },
  });

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

  const [showDailyAnalysis, setShowDailyAnalysis] = useState(false);
  const [analysisRequested, setAnalysisRequested] = useState(false);

  const { data: logs, isLoading } = trpc.mealLogs.list.useQuery({
    startDate: selectedDate,
    endDate: selectedDate,
  });
  const { data: summary } = trpc.mealLogs.dailySummary.useQuery({ date: selectedDate });
  const { data: dayParts } = trpc.catalogs.dayParts.useQuery();
  const { data: profileData } = trpc.profile.get.useQuery();
  const { data: dailyAnalysis, isLoading: analysisLoading } = trpc.mealLogs.getDailyAnalysis.useQuery(
    { date: selectedDate },
    { enabled: analysisRequested, staleTime: 5 * 60 * 1000 }
  );
  const utils = trpc.useUtils();

  const evaluateAchievements = trpc.achievements.evaluate.useMutation({
    onSuccess: (data) => {
      if (data.newlyUnlocked.length > 0) {
        // Small delay so the meal success toast shows first
        setTimeout(() => {
          toast.success(`🏆 ¡Logro desbloqueado! +${data.newlyUnlocked.length} nuevo${data.newlyUnlocked.length > 1 ? "s" : ""} logro${data.newlyUnlocked.length > 1 ? "s" : ""}`, {
            duration: 5000,
            action: { label: "Ver logros", onClick: () => navigate("/app/achievements") },
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

  // AI Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackAccurate, setFeedbackAccurate] = useState<boolean | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [savedMealLogId, setSavedMealLogId] = useState<number | null>(null);

  const submitAIFeedback = trpc.mealLogs.submitAIFeedback.useMutation({
    onSuccess: () => {
      setFeedbackSubmitted(true);
      toast.success("¡Gracias por tu feedback! Nos ayuda a mejorar 🙏");
    },
    onError: () => toast.error("No se pudo enviar el feedback"),
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
    setIsEstimating(false);
    setEstimateApplied(false);
    if (estimateDebounceRef.current) clearTimeout(estimateDebounceRef.current);
    setFeedbackRating(0);
    setFeedbackAccurate(null);
    setFeedbackComment("");
    setFeedbackSubmitted(false);
    setSavedMealLogId(null);
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
    : "¡Has superado tu objetivo calórico hoy.";

  // Macro exceeded warnings
  const protExceeded = totalProteins > targetProteins * 1.1;
  const carbExceeded = totalCarbs > targetCarbs * 1.1;
  const fatExceeded = totalFats > targetFats * 1.1;
  const anyMacroExceeded = protExceeded || carbExceeded || fatExceeded;

  // Day status badge (estado del día)
  const dayStatus = (() => {
    if (totalCals === 0) return null;
    if (calPct > 110) return { icon: '⚠️', label: 'Exceso calórico', color: '#ef4444', bg: '#fef2f2' };
    if (fatExceeded && !carbExceeded) return { icon: '⚠️', label: 'Alto en grasas', color: '#f97316', bg: '#fff7ed' };
    if (carbExceeded && !fatExceeded) return { icon: '⚠️', label: 'Alto en carbos', color: '#f59e0b', bg: '#fffbeb' };
    if (anyMacroExceeded) return { icon: '⚠️', label: 'Macros elevados', color: '#f97316', bg: '#fff7ed' };
    if (calPct >= 90 && calPct <= 110) return { icon: '⚖️', label: 'Día equilibrado', color: '#22c55e', bg: '#f0fdf4' };
    if (calPct >= 60) return { icon: '🔥', label: 'Buen progreso', color: '#3b82f6', bg: '#eff6ff' };
    return { icon: '🌱', label: 'Empezando el día', color: '#9ca3af', bg: '#f9fafb' };
  })();

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
      setAiResult(null);
      // Compress image to max 800px before sending to AI (reduces latency)
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) { setPhotoBase64(dataUrl.split(",")[1]); return; }
        ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.75);
        setPhotoBase64(compressed.split(",")[1]);
      };
      img.src = dataUrl;
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

  // El diario es gratis para todos los usuarios — no bloquear

  return (
    <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto", paddingBottom: "100px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>{t("mealLog.title", "Diary")}</h1>
          <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#9ca3af" }}>{t("mealLog.subtitle", "Nutritional tracking")}</p>
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
              <span style={{ fontSize: "16px", fontWeight: 900, color: calPct > 100 ? "#ef4444" : "#1a1a1a", lineHeight: 1 }}>{calPct}%</span>
              <span style={{ fontSize: "8px", color: "#9ca3af", fontWeight: 600, marginTop: "1px", textAlign: "center", lineHeight: 1.2 }}>kcal<br/>diarias</span>
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
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: protExceeded ? "#ef4444" : "#3b82f6", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: protExceeded ? "#ef4444" : "#374151", width: "60px", flexShrink: 0 }}>Proteína{protExceeded ? " ⚠️" : ""}</span>
            <div style={{ flex: 1, background: "#eff6ff", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: protExceeded ? "#ef4444" : "#3b82f6", borderRadius: "999px", height: "100%", width: `${Math.min(100, protPct)}%`, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: protExceeded ? "#ef4444" : "#6b7280", width: "70px", textAlign: "right", flexShrink: 0, fontWeight: protExceeded ? 700 : 400 }}>{totalProteins}g / {targetProteins}g</span>
          </div>
          {/* Carbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: carbExceeded ? "#ef4444" : "#f59e0b", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: carbExceeded ? "#ef4444" : "#374151", width: "60px", flexShrink: 0 }}>Carbos{carbExceeded ? " ⚠️" : ""}</span>
            <div style={{ flex: 1, background: "#fffbeb", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: carbExceeded ? "#ef4444" : "#f59e0b", borderRadius: "999px", height: "100%", width: `${Math.min(100, carbPct)}%`, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: carbExceeded ? "#ef4444" : "#6b7280", width: "70px", textAlign: "right", flexShrink: 0, fontWeight: carbExceeded ? 700 : 400 }}>{totalCarbs}g / {targetCarbs}g</span>
          </div>
          {/* Fats */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: fatExceeded ? "#ef4444" : "#f43f5e", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: fatExceeded ? "#ef4444" : "#374151", width: "60px", flexShrink: 0 }}>Grasas{fatExceeded ? " ⚠️" : ""}</span>
            <div style={{ flex: 1, background: "#fff1f2", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
              <div style={{ background: fatExceeded ? "#ef4444" : "#f43f5e", borderRadius: "999px", height: "100%", width: `${Math.min(100, fatPct)}%`, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: fatExceeded ? "#ef4444" : "#6b7280", width: "70px", textAlign: "right", flexShrink: 0, fontWeight: fatExceeded ? 700 : 400 }}>{totalFats}g / {targetFats}g</span>
          </div>
          {/* Macro warning messages */}
          {anyMacroExceeded && (
            <div style={{ marginTop: "6px", padding: "8px 10px", background: "#fff7ed", borderRadius: "10px", border: "1px solid #fed7aa" }}>
              {fatExceeded && <p style={{ margin: 0, fontSize: "11px", color: "#9a3412", fontWeight: 600, lineHeight: 1.5 }}>• Has superado las grasas hoy. Intenta equilibrar con más proteína.</p>}
              {carbExceeded && <p style={{ margin: 0, fontSize: "11px", color: "#92400e", fontWeight: 600, lineHeight: 1.5 }}>• Has superado los carbohidratos. Considera reducir azúcares en la próxima comida.</p>}
              {protExceeded && <p style={{ margin: 0, fontSize: "11px", color: "#1e3a5f", fontWeight: 600, lineHeight: 1.5 }}>• Proteína por encima del objetivo. Asegúrate de hidratarte bien.</p>}
            </div>
          )}
        </div>

        {/* Day status badge */}
        {dayStatus && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "10px", padding: "6px 14px", background: dayStatus.bg, borderRadius: "999px", border: `1px solid ${dayStatus.color}22`, alignSelf: "center", width: "fit-content", margin: "10px auto 0" }}>
            <span style={{ fontSize: "14px" }}>{dayStatus.icon}</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: dayStatus.color }}>{dayStatus.label}</span>
          </div>
        )}
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

      {/* ─── Calorie Deficit Panel ─── */}
      {totalCals > 0 && (() => {
        const deficit = targetCals - Math.round(totalCals);
        const isDeficit = deficit > 0;
        const isSurplus = deficit < 0;
        const goalType = (profileData?.profile as any)?.goal ?? 'maintenance';
        const goalLabels: Record<string, string> = { weight_loss: 'pérdida de peso', muscle_gain: 'ganancia muscular', maintenance: 'mantenimiento', toning: 'tonificación', fat_loss: 'pérdida de grasa' };
        const goalLabel = goalLabels[goalType] ?? 'tu objetivo';
        return (
          <div style={{ background: isDeficit ? 'linear-gradient(135deg,#fff7ed,#fff)' : isSurplus ? 'linear-gradient(135deg,#fef2f2,#fff)' : 'linear-gradient(135deg,#f0fdf4,#fff)', borderRadius: "20px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${isDeficit ? '#fed7aa' : isSurplus ? '#fecaca' : '#bbf7d0'}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>{isDeficit ? '📉' : isSurplus ? '📈' : '✅'}</span>
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#1a1a1a" }}>
                    {isDeficit
                    ? goalType === 'maintenance'
                      ? `Te quedan ${deficit} kcal para tu objetivo`
                      : `Déficit: ${deficit} kcal restantes`
                    : isSurplus
                    ? `Superávit: +${Math.abs(deficit)} kcal`
                    : '¡Objetivo alcanzado!'}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>Objetivo: {goalLabel}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: isDeficit ? '#f97316' : isSurplus ? '#ef4444' : '#22c55e' }}>{Math.round(totalCals)}</p>
                <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>/ {targetCals} kcal</p>
              </div>
            </div>
            {/* Deficit bar */}
            <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ background: isDeficit ? 'linear-gradient(90deg,#f97316,#fb923c)' : isSurplus ? '#ef4444' : '#22c55e', borderRadius: '999px', height: '100%', width: `${Math.min(100, calPct)}%`, transition: 'width 0.6s ease' }} />
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>
              {isDeficit
                ? `Llevas ${Math.round(totalCals)} kcal de ${targetCals}. Con ${deficit} kcal más completarás tu objetivo de ${goalLabel}.`
                : isSurplus
                ? `Has superado tu objetivo en ${Math.abs(deficit)} kcal. Esto puede ralentizar ${goalType === 'weight_loss' ? 'la pérdida de peso' : 'tu progreso'}.`
                : '¡Perfecto! Has alcanzado exactamente tu objetivo calórico.'}
            </p>
            {/* AI Analysis button */}
            <button
              onClick={() => { setAnalysisRequested(true); setShowDailyAnalysis(true); }}
              style={{ width: '100%', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#374151', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
            >
              <span style={{ fontSize: '16px' }}>🤖</span>
              <span>Optimiza tu día con IA →</span>
            </button>
          </div>
        );
      })()}

      {/* ─── AI Daily Analysis Modal ─── */}
      {showDailyAnalysis && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDailyAnalysis(false); }}>
          <div style={{ width: '100%', maxWidth: '480px', background: 'white', borderRadius: '28px 28px 0 0', padding: '24px', maxHeight: '85dvh', overflowY: 'auto', boxShadow: '0 -4px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>🤖 Análisis del día</h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>Evaluación nutricional personalizada</p>
              </div>
              <button onClick={() => setShowDailyAnalysis(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {analysisLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧠</div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Analizando tu día...</p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>La IA está evaluando tus comidas y preparando recomendaciones personalizadas</p>
              </div>
            ) : dailyAnalysis?.hasData && dailyAnalysis.analysis ? (
              <>
                {/* Headline */}
                {(dailyAnalysis.analysis as any).headline && (
                  <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius: '16px', padding: '14px 16px', marginBottom: '14px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff', lineHeight: 1.4 }}>{(dailyAnalysis.analysis as any).headline}</p>
                  </div>
                )}

                {/* Trend alert */}
                {(dailyAnalysis.analysis as any).trend_alert && (
                  <div style={{ background: '#fef3c7', borderRadius: '14px', padding: '12px 14px', marginBottom: '14px', border: '1px solid #fcd34d', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>📈</span>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tendencia detectada</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#78350f', lineHeight: 1.5 }}>{(dailyAnalysis.analysis as any).trend_alert}</p>
                    </div>
                  </div>
                )}

                {/* Score */}
                <div style={{ background: 'linear-gradient(135deg,#fff7ed,#fff)', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'center', border: '1px solid #fed7aa' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puntuación del día</p>
                  <div style={{ fontSize: '48px', fontWeight: 900, color: (dailyAnalysis.analysis as any).score >= 7 ? '#22c55e' : (dailyAnalysis.analysis as any).score >= 5 ? '#f97316' : '#ef4444', lineHeight: 1 }}>{(dailyAnalysis.analysis as any).score}<span style={{ fontSize: '20px', color: '#9ca3af' }}>/10</span></div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>{(dailyAnalysis.analysis as any).evaluation}</p>
                </div>

                {/* Deficit explanation */}
                <div style={{ background: '#f9fafb', borderRadius: '14px', padding: '14px', marginBottom: '14px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#374151' }}>📊 Tu balance calórico</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{dailyAnalysis.deficitExplanation}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>TMB</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1a1a1a' }}>{dailyAnalysis.tmb}</p>
                      <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af' }}>kcal/día</p>
                    </div>
                    <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '8px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>TDEE</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1a1a1a' }}>{dailyAnalysis.tdee}</p>
                      <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af' }}>kcal/día</p>
                    </div>
                    <div style={{ flex: 1, background: 'white', borderRadius: '10px', padding: '8px', textAlign: 'center', border: `1px solid ${dailyAnalysis.deficit > 0 ? '#fed7aa' : '#fecaca'}` }}>
                      <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{dailyAnalysis.deficit > 0 ? 'Déficit' : 'Superávit'}</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: dailyAnalysis.deficit > 0 ? '#f97316' : '#ef4444' }}>{Math.abs(dailyAnalysis.deficit)}</p>
                      <p style={{ margin: 0, fontSize: '9px', color: '#9ca3af' }}>kcal</p>
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                {(dailyAnalysis.analysis as any).strengths?.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#374151' }}>✅ Lo que estás haciendo bien</p>
                    {(dailyAnalysis.analysis as any).strengths.map((s: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', background: '#f0fdf4', borderRadius: '10px', padding: '8px 10px' }}>
                        <span style={{ color: '#22c55e', fontSize: '14px', flexShrink: 0 }}>●</span>
                        <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements */}
                {(dailyAnalysis.analysis as any).improvements?.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#374151' }}>💡 Áreas de mejora</p>
                    {(dailyAnalysis.analysis as any).improvements.map((s: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', background: '#fffbeb', borderRadius: '10px', padding: '8px 10px' }}>
                        <span style={{ color: '#f59e0b', fontSize: '14px', flexShrink: 0 }}>●</span>
                        <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {(dailyAnalysis.analysis as any).recommendations?.length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#374151' }}>🍽️ Recomendaciones para completar el día</p>
                    {(dailyAnalysis.analysis as any).recommendations.map((r: any, i: number) => (
                      <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '12px', marginBottom: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>{r.name}</p>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f97316', background: '#fff7ed', borderRadius: '8px', padding: '2px 8px' }}>{r.calories} kcal</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: 1.4 }}>{r.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Impact */}
                {(dailyAnalysis.analysis as any).impact && (
                  <div style={{ marginTop: '14px', background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderRadius: '14px', padding: '12px 14px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>🚀</span>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impacto si aplicas esto</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#15803d', lineHeight: 1.5 }}>{(dailyAnalysis.analysis as any).impact}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <p style={{ fontSize: '36px', margin: '0 0 8px' }}>📋</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>Sin datos suficientes</p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Registra al menos una comida para obtener el análisis del día</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick add photo button */}
      <button
        onClick={() => { setShowAdd(true); setAddMode("photo"); }}
        style={{ width: "100%", background: "white", border: "2px dashed #FED7AA", borderRadius: "16px", padding: "14px", marginBottom: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#F97316", fontWeight: 700, fontSize: "14px", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,115,22,0.04)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
      >
        <span style={{ fontSize: "22px" }}>📸</span>
        <span>{t("mealLog.photoAnalysis", "Photo your food → AI Analysis")}</span>
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
                        {log.recipe?.name ?? log.log.customMealName ?? t("mealLog.meal", "Meal")}
                      </p>
                      <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                        {log.log.calories && <span style={{ fontSize: "14px", color: "#F97316", fontWeight: 700 }}>{Math.round(log.log.calories)} kcal</span>}
                        {log.log.proteins && <span style={{ fontSize: "14px", color: "#6b7280" }}>💪 {Math.round(log.log.proteins)}g</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLog(log.log.id, log.recipe?.name ?? log.log.customMealName ?? t("mealLog.meal", "Meal"))}
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
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#1a1a1a" }}>{t("mealLog.logMeal", "Log meal")}</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Mode selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "16px", width: "100%" }}>
              <button
                onClick={() => setAddMode("manual")}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: addMode === "manual" ? "#F97316" : "#f3f4f6", color: addMode === "manual" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                ✏️ Manual
              </button>
              <button
                onClick={() => setAddMode("voice")}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: addMode === "voice" ? "#8B5CF6" : "#f3f4f6", color: addMode === "voice" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                🎙️ Voz
              </button>
              <button
                onClick={() => setAddMode("photo")}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: addMode === "photo" ? "#F97316" : "#f3f4f6", color: addMode === "photo" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                📸 Foto IA
              </button>
              <button
                onClick={() => { setAddMode("barcode"); setShowBarcodeScanner(true); }}
                style={{ padding: "10px 4px", borderRadius: "14px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, background: addMode === "barcode" ? "#F97316" : "#f3f4f6", color: addMode === "barcode" ? "white" : "#6b7280", transition: "all 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                🔍 Código
              </button>
            </div>

            {/* Voice mode */}
            {addMode === "voice" && (
              <div style={{ marginBottom: "16px", textAlign: "center" }}>
                <div style={{ background: isRecording ? "#FEF2F2" : "#F5F3FF", borderRadius: 20, padding: "28px 20px", border: `2px solid ${isRecording ? "#FECACA" : "#DDD6FE"}` }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>{isRecording ? "🔴" : "🎙️"}</div>
                  <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 16, color: isRecording ? "#DC2626" : "#7C3AED" }}>
                    {isRecording ? "Grabando... habla ahora" : "Pulsa para hablar"}
                  </p>
                  <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>
                    {isRecording ? "Di lo que has comido, ej: \"dos huevos revueltos con tostadas\"" : "La IA transcribirá y calculará las calorías automáticamente"}
                  </p>
                  {transcribeAndEstimate.isPending ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#7C3AED", fontWeight: 700 }}>
                      <div style={{ width: 20, height: 20, border: "2px solid #7C3AED", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Analizando audio...
                    </div>
                  ) : (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      style={{ background: isRecording ? "#DC2626" : "#7C3AED", color: "white", border: "none", borderRadius: 16, padding: "14px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${isRecording ? "rgba(220,38,38,0.4)" : "rgba(124,58,237,0.4)"}` }}
                    >
                      {isRecording ? "⏹️ Detener y analizar" : "🎙️ Iniciar grabación"}
                    </button>
                  )}
                  {voiceTranscript && (
                    <p style={{ marginTop: 16, fontSize: 13, color: "#374151", background: "white", borderRadius: 10, padding: "8px 12px", fontStyle: "italic" }}>
                      "{voiceTranscript}"
                    </p>
                  )}
                </div>
              </div>
            )}

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
                      <span>{t("mealLog.takePhoto", "Take photo")}</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ width: "100%", background: "white", border: "2px dashed #FED7AA", borderRadius: "16px", padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#F97316", fontWeight: 700, fontSize: "14px" }}
                    >
                      <span style={{ fontSize: "20px" }}>🖼️</span>
                      <span>{t("mealLog.chooseGallery", "Choose from gallery")}</span>
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

                    {/* Analyze button / AI loading animation */}
                    {!aiResult && (
                      analyzeFood.isPending ? (
                        <AILoadingAnimation onTimeout={() => analyzeFood.reset()} />
                      ) : (
                        <button
                          onClick={handleAnalyze}
                          style={{ width: "100%", background: "linear-gradient(135deg, #F97316, #FB923C)", border: "none", borderRadius: "14px", padding: "14px", cursor: "pointer", color: "white", fontWeight: 700, fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        >
                          <span>🤖</span>
                          <span>Analizar con IA</span>
                        </button>
                      )
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
                                {t("mealLog.allergensDetected", "Allergens detected in your profile")}
                              </p>
                            </div>
                            <p style={{ margin: 0, fontSize: "13px", color: "#B91C1C", lineHeight: 1.4 }}>
                              {t("mealLog.allergensWarning", "This dish may contain allergens you indicated in your profile. Check ingredients before consuming.")}
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
                                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{t("mealLog.protein", "Protein")}</span>
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

                              {/* AI Feedback block */}
                              <div style={{
                                background: feedbackSubmitted ? "linear-gradient(135deg, #F0FDF4, #DCFCE7)" : "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
                                border: feedbackSubmitted ? "1.5px solid #86EFAC" : "1.5px solid #E2E8F0",
                                borderRadius: 14,
                                padding: "14px 16px",
                                marginTop: 4,
                              }}>
                                {feedbackSubmitted ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 22 }}>✅</span>
                                    <div>
                                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#166534" }}>¡Gracias por tu feedback!</p>
                                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#15803D" }}>Nos ayuda a mejorar el análisis de platos.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ fontSize: 16 }}>🤔</span>
                                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#374151" }}>¿Ha sido preciso el análisis?</p>
                                    </div>

                                    {/* Thumbs up/down */}
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <button
                                        onClick={() => setFeedbackAccurate(true)}
                                        style={{
                                          flex: 1, padding: "9px 12px", borderRadius: 10, border: "2px solid",
                                          borderColor: feedbackAccurate === true ? "#22C55E" : "#E2E8F0",
                                          background: feedbackAccurate === true ? "#F0FDF4" : "white",
                                          fontSize: 13, fontWeight: 700,
                                          color: feedbackAccurate === true ? "#166534" : "#6B7280",
                                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        }}
                                      >
                                        👍 Sí, preciso
                                      </button>
                                      <button
                                        onClick={() => setFeedbackAccurate(false)}
                                        style={{
                                          flex: 1, padding: "9px 12px", borderRadius: 10, border: "2px solid",
                                          borderColor: feedbackAccurate === false ? "#EF4444" : "#E2E8F0",
                                          background: feedbackAccurate === false ? "#FEF2F2" : "white",
                                          fontSize: 13, fontWeight: 700,
                                          color: feedbackAccurate === false ? "#991B1B" : "#6B7280",
                                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                        }}
                                      >
                                        👎 No del todo
                                      </button>
                                    </div>

                                    {/* Star rating */}
                                    <div>
                                      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Valoración general</p>
                                      <div style={{ display: "flex", gap: 6 }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <button
                                            key={star}
                                            onClick={() => setFeedbackRating(star)}
                                            style={{
                                              background: "none", border: "none", cursor: "pointer", padding: "2px",
                                              fontSize: 24, lineHeight: 1,
                                              filter: feedbackRating >= star ? "none" : "grayscale(1) opacity(0.35)",
                                              transform: feedbackRating >= star ? "scale(1.1)" : "scale(1)",
                                              transition: "all 0.15s ease",
                                            }}
                                          >
                                            ⭐
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Optional comment */}
                                    <textarea
                                      value={feedbackComment}
                                      onChange={e => setFeedbackComment(e.target.value)}
                                      placeholder={t("mealLog.feedbackPlaceholder", "Optional comment (e.g.: missed identifying the rice)")}
                                      rows={2}
                                      style={{
                                        width: "100%", padding: "9px 12px", borderRadius: 10,
                                        border: "1.5px solid #E2E8F0", fontSize: 12, resize: "none",
                                        outline: "none", boxSizing: "border-box", color: "#374151",
                                        fontFamily: "inherit",
                                      }}
                                    />

                                    {/* Submit button */}
                                    <button
                                      onClick={() => {
                                        if (feedbackAccurate === null || feedbackRating === 0) {
                                          toast.error(t("mealLog.selectRating", "Select whether it was accurate and a rating"));
                                          return;
                                        }
                                        submitAIFeedback.mutate({
                                          mealLogId: savedMealLogId ?? undefined,
                                          rating: feedbackRating,
                                          accurate: feedbackAccurate,
                                          comment: feedbackComment || undefined,
                                          detectedDishName: aiResult.mealName,
                                          detectedCalories: aiResult.totalCalories,
                                        });
                                      }}
                                      disabled={submitAIFeedback.isPending || feedbackAccurate === null || feedbackRating === 0}
                                      style={{
                                        width: "100%", padding: "10px", borderRadius: 10,
                                        background: feedbackAccurate === null || feedbackRating === 0
                                          ? "#F3F4F6" : "linear-gradient(135deg, #F97316, #FB923C)",
                                        border: "none",
                                        color: feedbackAccurate === null || feedbackRating === 0 ? "#9CA3AF" : "white",
                                        fontSize: 13, fontWeight: 800, cursor: "pointer",
                                        transition: "all 0.2s ease",
                                      }}
                                    >
                                      {submitAIFeedback.isPending ? t("common.sending", "Sending...") : t("mealLog.sendFeedback", "Send feedback")}
                                    </button>
                                  </div>
                                )}
                              </div>
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
                <div style={{ position: "relative" }}>
                  <input
                    value={mealName}
                    onChange={e => {
                      const val = e.target.value;
                      setMealName(val);
                      setEstimateApplied(false);
                      if (estimateDebounceRef.current) clearTimeout(estimateDebounceRef.current);
                      if (val.trim().length >= 3) {
                        setIsEstimating(true);
                        estimateDebounceRef.current = setTimeout(() => {
                          estimateFromText.mutate({ text: val.trim() });
                        }, 1200);
                      } else {
                        setIsEstimating(false);
                      }
                    }}
                    placeholder="¿Qué has comido? (ej: 2 huevos revueltos, pizza margarita...)"
                    style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: "14px", border: `2px solid ${estimateApplied ? '#10B981' : '#f3f4f6'}`, fontSize: "14px", outline: "none", boxSizing: "border-box", fontWeight: 600, transition: "border-color 0.2s" }}
                  />
                  <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                    {isEstimating ? (
                      <div style={{ width: 20, height: 20, border: "2px solid #F97316", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    ) : estimateApplied ? (
                      <span style={{ fontSize: 18 }}>✅</span>
                    ) : mealName.trim().length >= 3 ? (
                      <span style={{ fontSize: 16 }}>🤖</span>
                    ) : null}
                  </div>
                </div>
                {estimateApplied && (
                  <div style={{ background: "#F0FDF4", border: "1.5px solid #86EFAC", borderRadius: 12, padding: "8px 12px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
                    ✨ Calorías estimadas por IA — puedes ajustar los valores si lo necesitas
                  </div>
                )}
                <select
                  value={selectedDayPart}
                  onChange={e => setSelectedDayPart(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "14px", border: "2px solid #f3f4f6", fontSize: "14px", outline: "none", background: "white", boxSizing: "border-box" }}
                >
                  {dayParts?.map(dp => (
                    <option key={dp.id} value={String(dp.id)}>{dp.nameEs}</option>
                  )) ?? (
                    <>
                      <option value="1">{t("mealLog.breakfast", "Desayuno")}</option>
                      <option value="2">{t("mealLog.lunch", "Almuerzo")}</option>
                      <option value="3">{t("mealLog.snack", "Merienda")}</option>
                      <option value="4">{t("mealLog.dinner", "Cena")}</option>
                    </>
                  )}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#F97316", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "2px" }}>🔥 Calorías (kcal)</span>
                    <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="ej. 350" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #FED7AA", fontSize: "14px", outline: "none", fontWeight: 600, width: "100%", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "2px" }}>💪 Proteínas (g)</span>
                    <input type="number" value={proteins} onChange={e => setProteins(e.target.value)} placeholder="ej. 25" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #BFDBFE", fontSize: "14px", outline: "none", fontWeight: 600, width: "100%", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "2px" }}>🌾 Carbohidratos (g)</span>
                    <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="ej. 40" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #A7F3D0", fontSize: "14px", outline: "none", fontWeight: 600, width: "100%", boxSizing: "border-box" }} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#F43F5E", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "2px" }}>🥑 Grasas (g)</span>
                    <input type="number" value={fats} onChange={e => setFats(e.target.value)} placeholder="ej. 12" style={{ padding: "10px 12px", borderRadius: "12px", border: "2px solid #FECDD3", fontSize: "14px", outline: "none", fontWeight: 600, width: "100%", boxSizing: "border-box" }} />
                  </label>
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
                  {addLog.isPending ? t("common.saving", "Saving...") : (aiResult ? `✓ ${t("mealLog.confirmSave", "Confirm and save")}` : t("mealLog.register", "Register"))}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: "13px", color: "#d1d5db", textAlign: "center", margin: "24px 0 0", lineHeight: 1.5 }}>
        {t("mealLog.disclaimer", "BuddyMarket does not constitute professional nutritional recommendations. Consult a dietitian.")}
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
