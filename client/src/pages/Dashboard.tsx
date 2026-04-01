import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Apple,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

function NutritionRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
          <circle
            cx="32" cy="32" r="26" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 26}`}
            strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground">{pct}%</span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">{label}</p>
      <p className="text-xs font-semibold text-foreground">{value}g</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data: profileData } = trpc.profile.get.useQuery();
  const { data: dailySummary } = trpc.mealLogs.dailySummary.useQuery({ date: today });
  const { data: shoppingLists } = trpc.shoppingLists.list.useQuery();
  const { data: inventoryItems } = trpc.inventory.list.useQuery();
  const { data: menus } = trpc.menus.list.useQuery();
  const { data: recentRecipes } = trpc.recipes.list.useQuery({ limit: 4, isPublic: true });

  const profile = profileData?.profile;
  const calorieGoal = profile?.dailyCalorieGoal || 2000;
  const proteinGoal = profile?.dailyProteinGoal || 150;
  const carbsGoal = profile?.dailyCarbsGoal || 250;
  const fatGoal = profile?.dailyFatGoal || 65;

  const calories = dailySummary?.calories || 0;
  const proteins = dailySummary?.proteins || 0;
  const carbs = dailySummary?.carbohydrates || 0;
  const fats = dailySummary?.fats || 0;

  // Expiring items (within 3 days)
  const expiringItems = inventoryItems?.filter((item) => {
    if (!item.item.expirationDate) return false;
    const expDate = new Date(item.item.expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }) || [];

  const pendingShoppingItems = shoppingLists?.reduce((acc, list) => acc, 0) || 0;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {greeting()}, {user?.name?.split(" ")[0] || "Usuario"} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/menus">
                <Calendar className="w-4 h-4 mr-1.5" />
                Planificar menú
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/meal-log">
                <Utensils className="w-4 h-4 mr-1.5" />
                Registrar comida
              </Link>
            </Button>
          </div>
        </div>

        {/* Nutrition Summary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-primary" />
                Nutrición de hoy
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href="/nutrition">
                  Ver historial <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Calories bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-foreground">Calorías</span>
                  <span className="text-sm text-muted-foreground">
                    <span className="text-lg font-bold text-foreground">{calories}</span> / {calorieGoal} kcal
                  </span>
                </div>
                <Progress value={Math.min(100, (calories / calorieGoal) * 100)} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.max(0, calorieGoal - calories)} kcal restantes</span>
                  <span>{Math.round((calories / calorieGoal) * 100)}% del objetivo</span>
                </div>
              </div>

              {/* Macros rings */}
              <div className="flex justify-around">
                <NutritionRing value={proteins} max={proteinGoal} color="oklch(0.52 0.17 145)" label="Proteínas" />
                <NutritionRing value={carbs} max={carbsGoal} color="oklch(0.65 0.15 175)" label="Carbos" />
                <NutritionRing value={fats} max={fatGoal} color="oklch(0.60 0.18 50)" label="Grasas" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Recetas guardadas",
              value: "—",
              icon: BookOpen,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              href: "/recipes",
            },
            {
              label: "Menús activos",
              value: menus?.length || 0,
              icon: Calendar,
              color: "text-blue-600",
              bg: "bg-blue-50",
              href: "/menus",
            },
            {
              label: "Listas de compra",
              value: shoppingLists?.length || 0,
              icon: ShoppingCart,
              color: "text-orange-600",
              bg: "bg-orange-50",
              href: "/shopping-lists",
            },
            {
              label: "Items en inventario",
              value: inventoryItems?.length || 0,
              icon: Package,
              color: "text-purple-600",
              bg: "bg-purple-50",
              href: "/inventory",
            },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="border-border hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent recipes */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-primary" />
                    Recetas recientes
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link href="/recipes">
                      Ver todas <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentRecipes && recentRecipes.length > 0 ? (
                  recentRecipes.map((recipe) => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Utensils className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{recipe.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {recipe.preparationTime && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {recipe.preparationTime} min
                              </span>
                            )}
                            {recipe.difficulty && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {recipe.difficulty === "easy" ? "Fácil" : recipe.difficulty === "medium" ? "Media" : "Difícil"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No hay recetas todavía</p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link href="/recipes/new">Crear primera receta</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Quick actions */}
          <div className="space-y-4">
            {/* Expiring items alert */}
            {expiringItems.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-800">Productos por vencer</p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        {expiringItems.length} producto{expiringItems.length > 1 ? "s" : ""} próximo{expiringItems.length > 1 ? "s" : ""} a vencer
                      </p>
                      <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-100" asChild>
                        <Link href="/inventory">Ver inventario</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI suggestion */}
            <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Genera un menú con IA</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Crea un plan semanal personalizado basado en tus preferencias
                    </p>
                    <Button size="sm" className="mt-2 h-7 text-xs" asChild>
                      <Link href="/menus/new">Generar menú</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Accesos rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {[
                  { href: "/recipes/new", icon: BookOpen, label: "Nueva receta" },
                  { href: "/shopping-lists", icon: ShoppingCart, label: "Nueva lista de compra" },
                  { href: "/inventory", icon: Package, label: "Añadir al inventario" },
                  { href: "/meal-log", icon: TrendingUp, label: "Ver progreso nutricional" },
                ].map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <link.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{link.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
