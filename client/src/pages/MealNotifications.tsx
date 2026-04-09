import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type MealType = "desayuno" | "almuerzo" | "merienda" | "cena" | "snack" | "actividad";

interface ReminderConfig {
  mealType: MealType;
  label: string;
  emoji: string;
  defaultTime: string;
  description: string;
}

const MEAL_CONFIGS: ReminderConfig[] = [
  { mealType: "desayuno", label: "Desayuno", emoji: "🌅", defaultTime: "08:00", description: "Empieza el día registrando tu desayuno" },
  { mealType: "almuerzo", label: "Almuerzo", emoji: "☀️", defaultTime: "14:00", description: "Recuerda registrar tu comida del mediodía" },
  { mealType: "merienda", label: "Merienda", emoji: "🍎", defaultTime: "17:00", description: "No olvides tu merienda de la tarde" },
  { mealType: "cena", label: "Cena", emoji: "🌙", defaultTime: "21:00", description: "Cierra el día registrando tu cena" },
  { mealType: "snack", label: "Snack", emoji: "🥜", defaultTime: "11:00", description: "Registra tus tentempiés entre comidas" },
  { mealType: "actividad", label: "Actividad Física", emoji: "🏃", defaultTime: "18:00", description: "Recuerda registrar tu ejercicio diario" },
];

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskToArray(mask: number): boolean[] {
  return Array.from({ length: 7 }, (_, i) => Boolean(mask & (1 << i)));
}

function arrayToMask(days: boolean[]): number {
  return days.reduce((acc, val, i) => acc | (val ? 1 << i : 0), 0);
}

// ─── Push Notification Helpers ────────────────────────────────────────────────
async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

// Schedule local notifications for today based on reminders (with caloric summary)
function scheduleLocalRemindersWithSummary(
  reminders: Array<{ mealType: string; time: string; enabled: boolean; daysMask: number }>,
  summary?: { consumed: number; goal: number; percentage: number; remaining: number; proteins: number; carbohydrates: number; fats: number } | null
) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    const now = new Date();
    const todayBit = (now.getDay() + 6) % 7; // Convert Sun=0 to Mon=0

    for (const reminder of reminders) {
      if (!reminder.enabled) continue;
      const days = maskToArray(reminder.daysMask);
      if (!days[todayBit]) continue;

      const [hStr, mStr] = reminder.time.split(":");
      const targetTime = new Date();
      targetTime.setHours(parseInt(hStr!, 10), parseInt(mStr!, 10), 0, 0);

      const delay = targetTime.getTime() - now.getTime();
      if (delay <= 0) continue; // Already passed today

      const config = MEAL_CONFIGS.find((c) => c.mealType === reminder.mealType);
      reg.active?.postMessage({
        type: "SCHEDULE_REMINDER",
        title: `BuddyMarket — ${config?.label || reminder.mealType}`,
        mealType: reminder.mealType,
        summary: summary ?? null,
        delay,
      });
    }
  }).catch(() => {});
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MealNotifications() {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [localStates, setLocalStates] = useState<Record<MealType, { time: string; enabled: boolean; days: boolean[]; dirty: boolean }>>({
    desayuno: { time: "08:00", enabled: false, days: Array(7).fill(true), dirty: false },
    almuerzo: { time: "14:00", enabled: false, days: Array(7).fill(true), dirty: false },
    merienda: { time: "17:00", enabled: false, days: Array(7).fill(true), dirty: false },
    cena:     { time: "21:00", enabled: false, days: Array(7).fill(true), dirty: false },
    snack:     { time: "11:00", enabled: false, days: Array(7).fill(true), dirty: false },
    actividad: { time: "18:00", enabled: false, days: Array(7).fill(true), dirty: false },
  });

  // tRPC
  const { data: reminders, isLoading, refetch } = trpc.notifications.getReminders.useQuery();
  const { data: dailySummary } = trpc.notifications.getDailySummary.useQuery();
  const upsertReminder = trpc.notifications.upsertReminder.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error("Error al guardar: " + e.message),
  });
  const deleteReminder = trpc.notifications.deleteReminder.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error("Error al eliminar: " + e.message),
  });

  // Sync server data → local state
  useEffect(() => {
    if (!reminders) return;
    setLocalStates((prev) => {
      const next = { ...prev };
      for (const r of reminders) {
        const mt = r.mealType as MealType;
        next[mt] = {
          time: r.time,
          enabled: r.enabled,
          days: maskToArray(r.daysMask),
          dirty: false,
        };
      }
      return next;
    });
  }, [reminders]);

  // Check notification permission
  useEffect(() => {
    if (!("Notification" in window)) {
      setNotifPermission("unsupported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Schedule local reminders whenever data changes (pass caloric summary to SW)
  useEffect(() => {
    if (!reminders || notifPermission !== "granted") return;
    scheduleLocalRemindersWithSummary(reminders, dailySummary);
  }, [reminders, notifPermission, dailySummary]);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
    if (granted) {
      toast.success("✅ Notificaciones activadas correctamente");
      // Show a test notification
      const reg = await getServiceWorkerRegistration();
      if (reg) {
        reg.showNotification("BuddyMarket — Notificaciones activadas", {
          body: "¡Perfecto! Recibirás recordatorios para registrar tus comidas.",
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: "test-notification",
        });
      }
    } else {
      toast.error("Permiso denegado. Actívalo desde la configuración del navegador.");
    }
  }, []);

  const handleToggleEnabled = (mealType: MealType, enabled: boolean) => {
    setLocalStates((prev) => ({
      ...prev,
      [mealType]: { ...prev[mealType], enabled, dirty: true },
    }));
  };

  const handleTimeChange = (mealType: MealType, time: string) => {
    setLocalStates((prev) => ({
      ...prev,
      [mealType]: { ...prev[mealType], time, dirty: true },
    }));
  };

  const handleDayToggle = (mealType: MealType, dayIndex: number) => {
    setLocalStates((prev) => {
      const days = [...prev[mealType].days];
      days[dayIndex] = !days[dayIndex];
      return { ...prev, [mealType]: { ...prev[mealType], days, dirty: true } };
    });
  };

  const handleSave = async (mealType: MealType) => {
    const s = localStates[mealType];
    await upsertReminder.mutateAsync({
      mealType,
      time: s.time,
      enabled: s.enabled,
      daysMask: arrayToMask(s.days),
    });
    setLocalStates((prev) => ({ ...prev, [mealType]: { ...prev[mealType], dirty: false } }));
    toast.success(`Recordatorio de ${MEAL_CONFIGS.find((c) => c.mealType === mealType)?.label} guardado`);
  };

  const handleDelete = async (mealType: MealType) => {
    await deleteReminder.mutateAsync({ mealType });
    const config = MEAL_CONFIGS.find((c) => c.mealType === mealType)!;
    setLocalStates((prev) => ({
      ...prev,
      [mealType]: { time: config.defaultTime, enabled: false, days: Array(7).fill(true), dirty: false },
    }));
    toast.success("Recordatorio eliminado");
  };

  const isReminderSaved = (mealType: MealType) =>
    reminders?.some((r) => r.mealType === mealType) ?? false;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px", fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>
          🔔 Recordatorios de Comidas
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
          Configura notificaciones para recordarte registrar cada comida del día.
        </p>
      </div>

      {/* Push Permission Banner */}
      {notifPermission === "unsupported" && (
        <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
            Tu navegador no soporta notificaciones push. Los recordatorios solo funcionarán mientras la app esté abierta.
          </p>
        </div>
      )}
      {notifPermission === "default" && (
        <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", border: "1px solid #fed7aa", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🔔</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#92400e", margin: "0 0 4px", fontSize: 14 }}>
                Activa las notificaciones del navegador
              </p>
              <p style={{ fontSize: 13, color: "#b45309", margin: "0 0 12px" }}>
                Para recibir recordatorios aunque tengas la app cerrada, necesitamos tu permiso.
              </p>
              <button
                onClick={handleRequestPermission}
                style={{ background: "#F97316", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}
              >
                Activar notificaciones
              </button>
            </div>
          </div>
        </div>
      )}
      {notifPermission === "granted" && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <p style={{ fontSize: 13, color: "#166534", margin: 0, fontWeight: 600 }}>
            Notificaciones del navegador activadas. Recibirás recordatorios aunque la app esté cerrada.
          </p>
        </div>
      )}
      {notifPermission === "denied" && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🚫</span>
          <p style={{ fontSize: 13, color: "#991b1b", margin: 0 }}>
            Notificaciones bloqueadas. Ve a la configuración de tu navegador para activarlas.
          </p>
        </div>
      )}

      {/* Caloric Summary Widget */}
      {dailySummary && (
        <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef9f5)", border: "1.5px solid #fed7aa", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
          <p style={{ fontWeight: 700, color: "#92400e", margin: "0 0 10px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔥</span> Resumen calórico de hoy
          </p>
          {/* Progress bar */}
          <div style={{ background: "#fed7aa", borderRadius: 99, height: 10, marginBottom: 10, overflow: "hidden" }}>
            <div
              style={{
                background: dailySummary.percentage >= 100 ? "#22c55e" : "#F97316",
                width: `${Math.min(dailySummary.percentage, 100)}%`,
                height: "100%",
                borderRadius: 99,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#ea580c" }}>{dailySummary.consumed} kcal</span>
            <span style={{ fontSize: 13, color: "#9a3412", fontWeight: 600 }}>{dailySummary.percentage}% de {dailySummary.goal} kcal</span>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#b45309" }}>
            <span>🥩 Prot: <strong>{dailySummary.proteins}g</strong></span>
            <span>🌾 Carb: <strong>{dailySummary.carbohydrates}g</strong></span>
            <span>🫒 Grasas: <strong>{dailySummary.fats}g</strong></span>
          </div>
          {dailySummary.remaining > 0 ? (
            <p style={{ fontSize: 12, color: "#b45309", margin: "8px 0 0", fontStyle: "italic" }}>
              ⚡ Te quedan <strong>{dailySummary.remaining} kcal</strong> para alcanzar tu objetivo diario.
            </p>
          ) : (
            <p style={{ fontSize: 12, color: "#166534", margin: "8px 0 0", fontWeight: 600 }}>
              ✅ ¡Has alcanzado tu objetivo calórico de hoy!
            </p>
          )}
          <p style={{ fontSize: 11, color: "#d97706", margin: "8px 0 0", fontStyle: "italic" }}>
            Este resumen se incluirá automáticamente en tus notificaciones de recordatorio.
          </p>
        </div>
      )}

      {/* Reminder Cards */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Cargando recordatorios...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MEAL_CONFIGS.map((config) => {
            const state = localStates[config.mealType];
            const saved = isReminderSaved(config.mealType);

            return (
              <div
                key={config.mealType}
                style={{
                  background: "white",
                  borderRadius: 16,
                  border: state.enabled ? "2px solid #fed7aa" : "1.5px solid #f3f4f6",
                  padding: "18px 20px",
                  boxShadow: state.enabled ? "0 4px 16px rgba(249,115,22,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "all 0.2s",
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: state.enabled ? 16 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{config.emoji}</span>
                    <div>
                      <p style={{ fontWeight: 700, color: "#111827", margin: 0, fontSize: 15 }}>{config.label}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{config.description}</p>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleEnabled(config.mealType, !state.enabled)}
                    style={{
                      width: 48,
                      height: 26,
                      borderRadius: 13,
                      border: "none",
                      background: state.enabled ? "#F97316" : "#e5e7eb",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                      flexShrink: 0,
                    }}
                    aria-label={state.enabled ? "Desactivar recordatorio" : "Activar recordatorio"}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: state.enabled ? 25 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "white",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                </div>

                {/* Expanded Config (when enabled) */}
                {state.enabled && (
                  <div>
                    {/* Time Picker */}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>
                        HORA DEL RECORDATORIO
                      </label>
                      <input
                        type="time"
                        value={state.time}
                        onChange={(e) => handleTimeChange(config.mealType, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1.5px solid #e5e7eb",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#111827",
                          background: "#f9fafb",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    {/* Days Selector */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 8 }}>
                        DÍAS DE LA SEMANA
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {DAY_LABELS.map((day, i) => (
                          <button
                            key={i}
                            onClick={() => handleDayToggle(config.mealType, i)}
                            title={DAY_FULL[i]}
                            style={{
                              flex: 1,
                              padding: "8px 0",
                              borderRadius: 8,
                              border: "none",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              background: state.days[i] ? "#F97316" : "#f3f4f6",
                              color: state.days[i] ? "white" : "#9ca3af",
                              transition: "all 0.15s",
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {saved && (
                        <button
                          onClick={() => handleDelete(config.mealType)}
                          disabled={deleteReminder.isPending}
                          style={{
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "1.5px solid #fecaca",
                            background: "white",
                            color: "#ef4444",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                      <button
                        onClick={() => handleSave(config.mealType)}
                        disabled={upsertReminder.isPending || !state.dirty}
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: state.dirty ? "#F97316" : "#f3f4f6",
                          color: state.dirty ? "white" : "#9ca3af",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: state.dirty ? "pointer" : "default",
                          boxShadow: state.dirty ? "0 4px 12px rgba(249,115,22,0.3)" : "none",
                          transition: "all 0.2s",
                        }}
                      >
                        {upsertReminder.isPending ? "Guardando..." : saved && !state.dirty ? "✓ Guardado" : "Guardar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Presets */}
      <div style={{ marginTop: 24, background: "#f9fafb", borderRadius: 16, padding: "16px 20px" }}>
        <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 12px", fontSize: 14 }}>⚡ Configuración rápida</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "Activar todas", action: () => {
              MEAL_CONFIGS.forEach((c) => {
                setLocalStates((prev) => ({ ...prev, [c.mealType]: { ...prev[c.mealType], enabled: true, dirty: true } }));
              });
            }},
            { label: "Solo laborables", action: () => {
              MEAL_CONFIGS.forEach((c) => {
                setLocalStates((prev) => ({ ...prev, [c.mealType]: { ...prev[c.mealType], days: [true,true,true,true,true,false,false], dirty: true } }));
              });
            }},
            { label: "Todos los días", action: () => {
              MEAL_CONFIGS.forEach((c) => {
                setLocalStates((prev) => ({ ...prev, [c.mealType]: { ...prev[c.mealType], days: Array(7).fill(true), dirty: true } }));
              });
            }},
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={preset.action}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border: "1.5px solid #e5e7eb",
                background: "white",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={{ fontSize: 10, color: "#d1d5db", textAlign: "center", margin: "24px 0 0", lineHeight: 1.5 }}>
        BuddyMarket no constituye recomendaciones profesionales de nutrición. Consulta a un dietista.
      </p>
    </div>
  );
}
