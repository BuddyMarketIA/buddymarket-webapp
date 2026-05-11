/**
 * Wellness Goals Page
 * Allows users to set and track personalized wellness goals based on their metrics
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  Moon,
  Heart,
  Activity,
} from "lucide-react";

interface WellnessGoal {
  id: string;
  category: "sleep" | "recovery" | "activity" | "stress" | "nutrition" | "hydration";
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: Date;
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "abandoned";
  progress: number; // 0-100
  createdAt: Date;
  tips: string[];
}

const categoryConfig = {
  sleep: {
    icon: Moon,
    color: "bg-blue-100 text-blue-700",
    label: "Sueño",
    defaultTarget: 8,
    unit: "horas",
    tips: [
      "Mantén un horario consistente de sueño",
      "Evita pantallas 1 hora antes de dormir",
      "Crea un ambiente oscuro y fresco",
      "Practica técnicas de relajación",
    ],
  },
  recovery: {
    icon: Heart,
    color: "bg-red-100 text-red-700",
    label: "Recuperación",
    defaultTarget: 80,
    unit: "puntos",
    tips: [
      "Aumenta tu ingesta de proteína",
      "Duerme lo suficiente",
      "Reduce el estrés",
      "Realiza estiramientos diarios",
    ],
  },
  activity: {
    icon: Activity,
    color: "bg-green-100 text-green-700",
    label: "Actividad",
    defaultTarget: 10000,
    unit: "pasos",
    tips: [
      "Camina 30 minutos diarios",
      "Sube escaleras cuando sea posible",
      "Realiza ejercicio de intensidad moderada",
      "Toma descansos activos cada hora",
    ],
  },
  stress: {
    icon: Zap,
    color: "bg-yellow-100 text-yellow-700",
    label: "Estrés",
    defaultTarget: 3,
    unit: "nivel (1-10)",
    tips: [
      "Practica meditación diaria",
      "Realiza ejercicio regularmente",
      "Mantén conexiones sociales",
      "Establece límites de trabajo",
    ],
  },
  nutrition: {
    icon: Activity,
    color: "bg-orange-100 text-orange-700",
    label: "Nutrición",
    defaultTarget: 5,
    unit: "porciones",
    tips: [
      "Come más frutas y verduras",
      "Reduce alimentos procesados",
      "Mantente hidratado",
      "Come a horas regulares",
    ],
  },
  hydration: {
    icon: Activity,
    color: "bg-cyan-100 text-cyan-700",
    label: "Hidratación",
    defaultTarget: 8,
    unit: "vasos",
    tips: [
      "Bebe agua al despertar",
      "Lleva una botella contigo",
      "Bebe antes de sentir sed",
      "Limita bebidas azucaradas",
    ],
  },
};

export default function WellnessGoals() {
  const [goals, setGoals] = useState<WellnessGoal[]>([
    {
      id: "1",
      category: "sleep",
      title: "Dormir 8 horas diarias",
      description: "Mejorar la calidad del sueño para mejor recuperación",
      targetValue: 8,
      currentValue: 6.5,
      unit: "horas",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: "high",
      status: "active",
      progress: 81,
      createdAt: new Date(),
      tips: [
        "Mantén un horario consistente",
        "Evita pantallas antes de dormir",
        "Crea un ambiente oscuro",
      ],
    },
    {
      id: "2",
      category: "activity",
      title: "10,000 pasos diarios",
      description: "Aumentar la actividad física diaria",
      targetValue: 10000,
      currentValue: 7500,
      unit: "pasos",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      priority: "medium",
      status: "active",
      progress: 75,
      createdAt: new Date(),
      tips: [
        "Camina 30 minutos diarios",
        "Sube escaleras",
        "Toma descansos activos",
      ],
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    category: "sleep" as const,
    title: "",
    targetValue: 0,
  });

  const filteredGoals =
    selectedCategory === "all"
      ? goals
      : goals.filter((g) => g.category === selectedCategory);

  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const averageProgress =
    goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.targetValue > 0) {
      const goal: WellnessGoal = {
        id: Date.now().toString(),
        category: newGoal.category,
        title: newGoal.title,
        description: `Meta de ${newGoal.category}`,
        targetValue: newGoal.targetValue,
        currentValue: 0,
        unit: categoryConfig[newGoal.category].unit,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        priority: "medium",
        status: "active",
        progress: 0,
        createdAt: new Date(),
        tips: categoryConfig[newGoal.category].tips,
      };

      setGoals([...goals, goal]);
      setNewGoal({ category: "sleep", title: "", targetValue: 0 });
      setShowNewGoalForm(false);
    }
  };

  const handleUpdateProgress = (goalId: string, newProgress: number) => {
    setGoals(
      goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              progress: Math.min(100, Math.max(0, newProgress)),
              status: newProgress >= 100 ? "completed" : "active",
            }
          : g
      )
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter((g) => g.id !== goalId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-900">Metas de Bienestar</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Establece y monitorea tus objetivos personalizados de salud y bienestar
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{goals.length}</div>
                <p className="text-gray-600 text-sm">Metas Totales</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{activeGoals}</div>
                <p className="text-gray-600 text-sm">Metas Activas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{completedGoals}</div>
                <p className="text-gray-600 text-sm">Completadas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">{averageProgress}%</div>
                <p className="text-gray-600 text-sm">Progreso Promedio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Goal Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowNewGoalForm(!showNewGoalForm)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            <Target className="w-4 h-4 mr-2" />
            Agregar Nueva Meta
          </Button>
        </div>

        {/* New Goal Form */}
        {showNewGoalForm && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle>Crear Nueva Meta</CardTitle>
              <CardDescription>
                Define una meta personalizada basada en tus métricas actuales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        category: e.target.value as typeof newGoal.category,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la Meta
                  </label>
                  <Input
                    placeholder="Ej: Dormir 8 horas diarias"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Objetivo ({categoryConfig[newGoal.category].unit})
                  </label>
                  <Input
                    type="number"
                    placeholder={`Ej: ${categoryConfig[newGoal.category].defaultTarget}`}
                    value={newGoal.targetValue || ""}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddGoal}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Crear Meta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewGoalForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">Todas</TabsTrigger>
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key}>
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory === "all" ? "all" : selectedCategory}>
            <div className="space-y-4">
              {filteredGoals.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">
                        No hay metas en esta categoría
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Crea una nueva meta para comenzar
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredGoals.map((goal) => (
                  <Card key={goal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className={`p-3 rounded-lg ${
                              categoryConfig[goal.category].color
                            }`}
                          >
                            {React.createElement(categoryConfig[goal.category].icon, {
                              className: "w-6 h-6",
                            })}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {goal.title}
                              </h3>
                              <Badge
                                variant={
                                  goal.status === "completed"
                                    ? "default"
                                    : goal.status === "active"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {goal.status === "completed"
                                  ? "Completada"
                                  : goal.status === "active"
                                    ? "Activa"
                                    : "Abandonada"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={
                                  goal.priority === "high"
                                    ? "border-red-300 text-red-700"
                                    : goal.priority === "medium"
                                      ? "border-yellow-300 text-yellow-700"
                                      : "border-green-300 text-green-700"
                                }
                              >
                                {goal.priority === "high"
                                  ? "Alta"
                                  : goal.priority === "medium"
                                    ? "Media"
                                    : "Baja"}{" "}
                                Prioridad
                              </Badge>
                            </div>

                            <p className="text-gray-600 text-sm mb-4">
                              {goal.description}
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                  Progreso
                                </span>
                                <span className="text-sm font-semibold text-orange-600">
                                  {goal.progress}%
                                </span>
                              </div>
                              <Progress value={goal.progress} className="h-2" />
                            </div>

                            {/* Current vs Target */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Valor Actual</p>
                                <p className="text-lg font-bold text-gray-900">
                                  {goal.currentValue} {goal.unit}
                                </p>
                              </div>
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Objetivo</p>
                                <p className="text-lg font-bold text-orange-600">
                                  {goal.targetValue} {goal.unit}
                                </p>
                              </div>
                            </div>

                            {/* Tips */}
                            {goal.tips.length > 0 && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-semibold text-blue-900 mb-2">
                                  💡 Consejos para lograr esta meta:
                                </p>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  {goal.tips.map((tip, idx) => (
                                    <li key={idx}>• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Deadline */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Plazo: {goal.deadline.toLocaleDateString("es-ES")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleUpdateProgress(goal.id, goal.progress + 10)
                            }
                            className="text-green-600 hover:text-green-700"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Motivational Section */}
        <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-12 h-12" />
              <div>
                <h3 className="text-xl font-bold mb-2">
                  ¡Vas muy bien! 🎉
                </h3>
                <p className="text-orange-50">
                  Has completado {completedGoals} meta{completedGoals !== 1 ? "s" : ""} y estás en camino de lograr {activeGoals} más.
                  Recuerda que la consistencia es la clave del bienestar duradero.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
