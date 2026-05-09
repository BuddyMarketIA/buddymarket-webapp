import { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/sonner-a11y-shim";
import { Trophy, Flame, Target, CheckCircle2, Calendar, Zap, Star } from "lucide-react";

const CHALLENGE_TYPE_CONFIG = {
  weight_loss: { label: "Pérdida de Peso", emoji: "⚖️", color: "#16A34A", bg: "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)" },
  muscle_gain: { label: "Ganancia Muscular", emoji: "💪", color: "#2563EB", bg: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)" },
  wellness: { label: "Bienestar General", emoji: "🌿", color: "#7C3AED", bg: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)" },
};

function WeeklyChallengeCard({ challenge }: { challenge: any }) {
  const utils = trpc.useUtils();
  const updateProgress = trpc.retention.updateChallengeProgress.useMutation({
    onSuccess: (data) => {
      utils.retention.getWeeklyChallenges.invalidate();
      if (data.newlyCompleted) {
        toast.success(`🎉 ¡Reto completado! Has ganado ${challenge.pointsReward} puntos. ¡Increíble!`);
      }
    },
  });

  return (
    <Card className={`border-2 transition-all duration-200 ${challenge.completed ? "border-green-400 bg-green-50/50 dark:bg-green-950/20" : "border-border hover:border-orange-300"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{challenge.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-sm text-foreground">{challenge.titleEs}</h3>
              {challenge.completed && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{challenge.descriptionEs}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{challenge.currentValue} / {challenge.targetValue}</span>
                <span className="font-semibold text-orange-500">+{challenge.pointsReward} pts</span>
              </div>
              <Progress value={challenge.progressPct} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ThirtyDayCard({ challenge }: { challenge: any }) {
  const utils = trpc.useUtils();
  const checkIn = trpc.retention.checkInThirtyDay.useMutation({
    onSuccess: (data) => {
      utils.retention.getActiveThirtyDayChallenge.invalidate();
      if (data.alreadyCheckedIn) {
        toast.info("Ya has hecho check-in hoy. ¡Vuelve mañana para continuar tu racha!");
      } else if (data.isComplete) {
        toast.success("🏆 ¡Reto de 30 días completado! ¡Eres una leyenda Buddy One! Has ganado el badge exclusivo.");
      } else {
        toast.success(`✅ Día ${data.currentDay} completado. +20 puntos. ¡${30 - (data.currentDay ?? 0)} días más para completar el reto!`);
      }
    },
  });

  const config = CHALLENGE_TYPE_CONFIG[challenge.challengeType as keyof typeof CHALLENGE_TYPE_CONFIG];
  const completedDays: number[] = challenge.completedDays ?? [];
  const todayCheckedIn = completedDays.includes(challenge.currentDay);

  return (
    <Card className="border-2 border-orange-200 overflow-hidden">
      <div style={{ background: config.bg, padding: "20px" }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{config.emoji}</span>
          <div>
            <h3 className="font-black text-white text-lg">Reto 30 Días</h3>
            <p className="text-white/80 text-sm font-medium">{config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${challenge.progressPct}%` }} />
          </div>
          <span className="text-white font-bold text-sm">{completedDays.length}/30</span>
        </div>
      </div>
      <CardContent className="p-4">
        {/* Calendar grid */}
        <div className="grid grid-cols-10 gap-1 mb-4">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const done = completedDays.includes(day);
            const isToday = day === challenge.currentDay;
            return (
              <div key={day} className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                done ? "bg-green-500 text-white" : isToday ? "bg-orange-100 border-2 border-orange-400 text-orange-600" : day < challenge.currentDay ? "bg-red-100 text-red-400" : "bg-muted text-muted-foreground"
              }`}>
                {done ? "✓" : day}
              </div>
            );
          })}
        </div>
        {/* Today's task */}
        {challenge.todayTask && (
          <div className="bg-muted/50 rounded-xl p-3 mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Tarea de hoy · Día {challenge.currentDay}</p>
            <p className="text-sm font-semibold text-foreground">{challenge.todayTask.task}</p>
            <p className="text-xs text-muted-foreground mt-1">💡 Hábito: {challenge.todayTask.habit}</p>
            <p className="text-xs text-blue-500 mt-1">💧 Objetivo agua: {challenge.todayTask.waterGoal}ml</p>
          </div>
        )}
        <Button
          className="w-full"
          disabled={todayCheckedIn || checkIn.isPending}
          onClick={() => checkIn.mutate()}
          style={{ background: todayCheckedIn ? undefined : config.bg }}
        >
          {todayCheckedIn ? "✅ Check-in hecho hoy" : checkIn.isPending ? t("common.saving") : `✅ Marcar día ${challenge.currentDay} como completado`}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Challenges() {
  const [tab, setTab] = useState<"weekly" | "thirty">("weekly");
  const [startingChallenge, setStartingChallenge] = useState(false);
  const utils = trpc.useUtils();

  const weeklyChallenges = trpc.retention.getWeeklyChallenges.useQuery();
  const thirtyDayChallenge = trpc.retention.getActiveThirtyDayChallenge.useQuery();

  const startThirtyDay = trpc.retention.startThirtyDayChallenge.useMutation({
    onSuccess: () => {
      utils.retention.getActiveThirtyDayChallenge.invalidate();
      setStartingChallenge(false);
      toast.success("🚀 ¡Reto iniciado! Tu reto de 30 días ha comenzado. ¡Haz check-in cada día!");
    },
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Retos Buddy One</h1>
            <p className="text-sm text-muted-foreground">Supera desafíos y gana puntos</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-muted rounded-xl p-1">
          {[
            { id: "weekly", label: "Semanales", icon: "📅" },
            { id: "thirty", label: "30 Días", icon: "🔥" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Weekly Challenges */}
        {tab === "weekly" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground">Esta semana</h2>
              <Badge variant="outline" className="text-orange-500 border-orange-300">
                <Flame className="w-3 h-3 mr-1" />
                {weeklyChallenges.data?.filter(c => c.completed).length ?? 0}/{weeklyChallenges.data?.length ?? 3} completados
              </Badge>
            </div>
            {weeklyChallenges.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyChallenges.data?.map(c => <WeeklyChallengeCard key={c.id} challenge={c} />)}
              </div>
            )}
            <Card className="border-dashed border-2 border-muted-foreground/30">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Los retos se renuevan cada lunes</p>
                <p className="text-xs text-muted-foreground mt-1">Completa todos para ganar un badge exclusivo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 30-Day Challenge */}
        {tab === "thirty" && (
          <div className="space-y-4">
            {thirtyDayChallenge.isLoading ? (
              <div className="h-64 bg-muted animate-pulse rounded-xl" />
            ) : thirtyDayChallenge.data ? (
              <ThirtyDayCard challenge={thirtyDayChallenge.data} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Elige tu reto de transformación de 30 días:</p>
                {Object.entries(CHALLENGE_TYPE_CONFIG).map(([type, config]) => (
                  <Card key={type} className="border-2 border-border hover:border-orange-300 cursor-pointer transition-all"
                    onClick={() => !startThirtyDay.isPending && startThirtyDay.mutate({ challengeType: type as any })}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: config.bg }}>
                          {config.emoji}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{config.label}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">30 días de hábitos diarios + tareas personalizadas</p>
                          <p className="text-xs text-orange-500 font-semibold mt-1">+600 puntos al completarlo · Badge exclusivo</p>
                        </div>
                        <Zap className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
