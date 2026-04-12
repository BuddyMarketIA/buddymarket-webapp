import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Camera, Upload, RefreshCw, CheckCircle, AlertTriangle, Plus, Zap } from "lucide-react";

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  allergens?: string[];
}

interface FoodAnalysis {
  mealName: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProteins: number;
  totalCarbs: number;
  totalFats: number;
  confidence: string;
  notes: string;
  detectedUserAllergens?: string[];
}

export default function BuddyScan() {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loggedMeal, setLoggedMeal] = useState(false);

  const utils = trpc.useUtils();

  const analyzeMutation = trpc.mealLogs.analyzeFood.useMutation({
    onSuccess: (data) => {
      setAnalysis(data.analysis as FoodAnalysis);
      setPhotoUrl(data.photoUrl ?? null);
    },
    onError: () => toast.error("No se pudo analizar la imagen. Inténtalo de nuevo."),
  });

  const logMutation = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      setLoggedMeal(true);
      utils.mealLogs.list.invalidate();
      toast.success("✅ Comida registrada en el diario");
    },
    onError: () => toast.error("Error al registrar la comida."),
  });

  const processImage = useCallback((file: File) => {
    const mime = file.type || "image/jpeg";
    setMimeType(mime);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
      // Extract base64 part
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setAnalysis(null);
      setLoggedMeal(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleAnalyze = () => {
    if (!imageBase64) return;
    analyzeMutation.mutate({ imageBase64, mimeType });
  };

  const handleLogMeal = () => {
    if (!analysis) return;
    const today = new Date().toISOString().split("T")[0];
    logMutation.mutate({
      customMealName: analysis.mealName,
      logDate: today,
      calories: Math.round(analysis.totalCalories),
      proteins: analysis.totalProteins,
      carbohydrates: analysis.totalCarbs,
      fats: analysis.totalFats,
      photoUrl: photoUrl ?? undefined,
      notes: `Escaneado con BuddyScan IA. ${analysis.notes || ""}`.trim(),
    } as any);
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setImageBase64(null);
    setAnalysis(null);
    setLoggedMeal(false);
    setPhotoUrl(null);
  };

  const confidenceColor = (c: string) => {
    if (c === "alta") return "#16a34a";
    if (c === "media") return "#d97706";
    return "#dc2626";
  };

  const confidenceLabel = (c: string) => {
    if (c === "alta") return "Alta precisión";
    if (c === "media") return "Precisión media";
    return "Baja precisión";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--background)", borderBottom: "1px solid var(--border)",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button onClick={() => navigate("/app/buddy-ia")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>BuddyScan IA</h1>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted-foreground)" }}>Escanea tu comida y obtén su información nutricional</p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          borderRadius: 8, padding: "4px 10px",
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Zap size={12} color="white" />
          <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>IA</span>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 480, margin: "0 auto" }}>

        {/* Image capture area */}
        {!previewUrl ? (
          <div style={{ marginBottom: 20 }}>
            <div
              onClick={() => cameraInputRef.current?.click()}
              style={{
                border: "2px dashed #f97316",
                borderRadius: 16,
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: "rgba(249,115,22,0.04)",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <Camera size={32} color="white" />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "var(--foreground)" }}>
                Toca para fotografiar tu comida
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)" }}>
                La IA analizará los alimentos y calculará los nutrientes automáticamente
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>o</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%", padding: "12px", borderRadius: 12,
                border: "1px solid var(--border)", background: "var(--card)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                color: "var(--foreground)", fontSize: 14, fontWeight: 600,
              }}
            >
              <Upload size={16} />
              Subir imagen de la galería
            </button>

            {/* Tips */}
            <div style={{ marginTop: 20, padding: 16, background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>💡 Consejos para mejores resultados</p>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.8 }}>
                <li>Fotografía el plato desde arriba con buena iluminación</li>
                <li>Asegúrate de que todos los alimentos sean visibles</li>
                <li>Evita sombras o reflejos sobre la comida</li>
                <li>Cuanto más cerca, más preciso será el análisis</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            {/* Preview */}
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              <img src={previewUrl} alt="Comida a analizar" style={{ width: "100%", maxHeight: 300, objectFit: "cover", display: "block" }} />
              <button
                onClick={handleReset}
                style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
                  width: 36, height: 36, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <RefreshCw size={16} color="white" />
              </button>
            </div>

            {!analysis && (
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                style={{ width: "100%", background: "linear-gradient(135deg, #f97316, #ea580c)", color: "white", fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 12, border: "none" }}
              >
                {analyzeMutation.isPending ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚡</span>
                    Analizando con IA...
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={18} />
                    Analizar con IA
                  </span>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div>
            {/* Allergen warning */}
            {analysis.detectedUserAllergens && analysis.detectedUserAllergens.length > 0 && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12,
                padding: "12px 16px", marginBottom: 16,
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#dc2626" }}>⚠️ Alérgenos detectados</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#7f1d1d" }}>
                    Este plato puede contener: <strong>{analysis.detectedUserAllergens.join(", ")}</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Meal name + confidence */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>{analysis.mealName}</h2>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                  background: confidenceColor(analysis.confidence) + "20",
                  color: confidenceColor(analysis.confidence),
                }}>
                  {confidenceLabel(analysis.confidence)}
                </span>
              </div>
              {analysis.notes && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{analysis.notes}</p>
              )}
            </div>

            {/* Macro summary */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16,
            }}>
              {[
                { label: "Calorías", value: Math.round(analysis.totalCalories), unit: "kcal", color: "#f97316" },
                { label: "Proteínas", value: Math.round(analysis.totalProteins), unit: "g", color: "#3b82f6" },
                { label: "Carbos", value: Math.round(analysis.totalCarbs), unit: "g", color: "#f59e0b" },
                { label: "Grasas", value: Math.round(analysis.totalFats), unit: "g", color: "#10b981" },
              ].map(({ label, value, unit, color }) => (
                <div key={label} style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: "10px 8px", textAlign: "center",
                }}>
                  <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 800, color }}>{value}</p>
                  <p style={{ margin: "0 0 2px", fontSize: 9, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: 0.5 }}>{unit}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "var(--muted-foreground)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Food items */}
            {analysis.foods.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "var(--foreground)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Alimentos detectados
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {analysis.foods.map((food, i) => (
                    <div key={i} style={{
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: "12px 14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{food.name}</span>
                          <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: 6 }}>{food.quantity}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#f97316" }}>{food.calories} kcal</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8" }}>P: {food.proteins}g</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#fffbeb", color: "#92400e" }}>C: {food.carbs}g</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#f0fdf4", color: "#166534" }}>G: {food.fats}g</span>
                        {food.allergens && food.allergens.length > 0 && food.allergens.map(a => (
                          <span key={a} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#fef2f2", color: "#dc2626" }}>⚠️ {a}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {!loggedMeal ? (
                <Button
                  onClick={handleLogMeal}
                  disabled={logMutation.isPending}
                  style={{
                    width: "100%", background: "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "white", fontWeight: 700, fontSize: 15, padding: "14px",
                    borderRadius: 12, border: "none",
                  }}
                >
                  {logMutation.isPending ? "Registrando..." : (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Plus size={18} />
                      Añadir al diario de hoy
                    </span>
                  )}
                </Button>
              ) : (
                <div style={{
                  background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12,
                  padding: "14px", textAlign: "center",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>Añadido al diario</span>
                </div>
              )}

              <button
                onClick={handleReset}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--card)",
                  cursor: "pointer", fontSize: 14, fontWeight: 600, color: "var(--foreground)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Camera size={16} />
                Escanear otra comida
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
