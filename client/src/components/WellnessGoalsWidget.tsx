import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface WellnessGoal {
  id: string;
  title: string;
  category: "sleep" | "recovery" | "activity" | "stress" | "nutrition" | "hydration";
  currentValue: number;
  targetValue: number;
  unit: string;
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "abandoned";
  daysRemaining: number;
}

interface WellnessGoalsWidgetProps {
  goals?: WellnessGoal[];
  isLoading?: boolean;
}

const categoryColors: Record<string, string> = {
  sleep: "bg-blue-100 text-blue-800",
  recovery: "bg-purple-100 text-purple-800",
  activity: "bg-green-100 text-green-800",
  stress: "bg-orange-100 text-orange-800",
  nutrition: "bg-yellow-100 text-yellow-800",
  hydration: "bg-cyan-100 text-cyan-800",
};

const categoryIcons: Record<string, React.ReactNode> = {
  sleep: "😴",
  recovery: "💪",
  activity: "🏃",
  stress: "🧘",
  nutrition: "🥗",
  hydration: "💧",
};

export function WellnessGoalsWidget({ goals: propGoals, isLoading: propLoading }: WellnessGoalsWidgetProps) {
  const { data: fetchedGoals, isLoading: fetchLoading } = trpc.wellnessGoals.list.useQuery();
  const goals = propGoals ?? fetchedGoals ?? [];
  const isLoading = propLoading ?? fetchLoading;
  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === "completed"), [goals]);
  const avgProgress = useMemo(() => {
    if (activeGoals.length === 0) return 0;
    const totalProgress = activeGoals.reduce((sum, goal) => {
      const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
      return sum + progress;
    }, 0);
    return Math.round(totalProgress / activeGoals.length);
  }, [activeGoals]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas de Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas de Bienestar
          </CardTitle>
          <CardDescription>Establece tus primeras metas de bienestar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 mb-4">No tienes metas activas aún</p>
            <Link href="/app/wellness-goals">
              <Button className="w-full">Crear Primera Meta</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <div>
              <CardTitle>Metas de Bienestar</CardTitle>
              <CardDescription>
                {activeGoals.length} activa{activeGoals.length !== 1 ? "s" : ""} • {completedGoals.length} completada{completedGoals.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
          <Link href="/app/wellness-goals">
            <Button variant="ghost" size="sm">
              Ver todas
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progreso General */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progreso General</span>
            <span className="text-sm text-gray-600">{avgProgress}%</span>
          </div>
          <Progress value={avgProgress} className="h-2" />
        </div>

        {/* Metas Activas */}
        <div className="space-y-3">
          {activeGoals.slice(0, 3).map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            const isHighPriority = goal.priority === "high";
            const isNearCompletion = progress >= 80;

            return (
              <div
                key={goal.id}
                className={`p-3 rounded-lg border ${
                  isHighPriority ? "border-orange-200 bg-orange-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[goal.category]}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                      <p className="text-xs text-gray-600">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </p>
                    </div>
                  </div>
                  {isNearCompletion && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {isHighPriority && goal.daysRemaining <= 3 && (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium text-gray-600 min-w-fit">{Math.round(progress)}%</span>
                </div>
                {goal.daysRemaining > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {goal.daysRemaining} día{goal.daysRemaining !== 1 ? "s" : ""} restante{goal.daysRemaining !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Enlace a todas las metas */}
        {activeGoals.length > 3 && (
          <Link href="/app/wellness-goals">
            <Button variant="outline" className="w-full" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver {activeGoals.length - 3} meta{activeGoals.length - 3 !== 1 ? "s" : ""} más
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
