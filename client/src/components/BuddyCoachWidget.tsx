/**
 * BuddyCoachWidget — Widget del ecosistema BuddyOne
 * Muestra sesiones semanales, volumen y racha de BuddyCoach.
 */
import { trpc } from "@/lib/trpc";
import { Dumbbell, Flame, TrendingUp, Trophy, ArrowRight, ExternalLink } from "lucide-react";

const BUDDYCOACH_URL = "https://buddycoach.io";

function formatVolume(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${kg}kg`;
}

// Skeleton Loading Component
function BuddyCoachSkeleton() {
  return (
    <div
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
        boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
      }}
    >
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

      <div className="relative p-5">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">BuddyCoach</p>
              <p className="text-white/50 text-[10px]">Esta semana</p>
            </div>
          </div>
          <div className="text-white/60">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/10 rounded-2xl p-3 text-center animate-pulse">
              <div className="h-6 bg-white/20 rounded w-8 mx-auto mb-2" />
              <div className="h-3 bg-white/20 rounded w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* PR Skeleton */}
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 mb-3 animate-pulse">
          <Trophy className="h-4 w-4 text-yellow-300 shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-white/20 rounded w-24 mb-1" />
            <div className="h-4 bg-white/20 rounded w-32" />
          </div>
          <div className="h-5 bg-white/20 rounded w-12" />
        </div>

        {/* Calorías Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-orange-300" />
            <div className="h-3 bg-white/20 rounded w-32" />
          </div>
          <div className="h-4 bg-white/20 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function BuddyCoachWidget() {
  const { data: workout, isLoading } = trpc.ecosystem.getBuddyCoachSummary.useQuery(undefined, {
    staleTime: 3 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return <BuddyCoachSkeleton />;
  }

  if (!workout) {
    // Estado desconectado — CTA para visitar BuddyCoach
    return (
      <div
        className="rounded-3xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)",
          boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-12 translate-x-12" />
        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">BuddyCoach</p>
              <p className="text-white/50 text-[10px]">Tu entrenamiento personal</p>
            </div>
          </div>
          <p className="text-white/70 text-xs mb-4">
            Conecta BuddyCoach con la misma cuenta para ver tu progreso de entrenamiento aquí.
          </p>
          <a
            href={BUDDYCOACH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-2xl transition-colors"
          >
            Ir a BuddyCoach <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
        boxShadow: "0 8px 24px rgba(124,58,237,0.25)",
      }}
    >
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">BuddyCoach</p>
              <p className="text-white/50 text-[10px]">Esta semana</p>
            </div>
          </div>
          <a
            href={BUDDYCOACH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{workout.weeklySessionCount}</p>
            <p className="text-white/60 text-[10px] font-medium mt-0.5">sesiones</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{formatVolume(workout.weeklyVolumeKg)}</p>
            <p className="text-white/60 text-[10px] font-medium mt-0.5">volumen</p>
          </div>
          <div className="bg-orange-400/30 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-orange-300">{workout.streak}</p>
            <p className="text-orange-200/80 text-[10px] font-medium mt-0.5">racha 🔥</p>
          </div>
        </div>

        {/* Mejor PR */}
        {workout.bestPrExercise && (
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 mb-3">
            <Trophy className="h-4 w-4 text-yellow-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-[10px] font-medium">Mejor PR este mes</p>
              <p className="text-white font-bold text-xs truncate">{workout.bestPrExercise}</p>
            </div>
            <p className="text-yellow-300 font-black text-sm shrink-0">
              {workout.bestPrWeightKg}kg
            </p>
          </div>
        )}

        {/* Calorías quemadas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-orange-300" />
            <span className="text-white/60 text-[10px]">Calorías quemadas est.</span>
          </div>
          <span className="text-orange-300 font-black text-sm">~{workout.estimatedCaloriesBurned} kcal</span>
        </div>
      </div>
    </div>
  );
}
