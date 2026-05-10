import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Heart, TrendingUp, Users, DollarSign, Edit2, Trash2, Plus, Eye, Download, Share2, Copy, Check } from "lucide-react";

type Tab = "overview" | "recipes" | "analytics" | "earnings" | "followers" | "profile" | "referrals";

const MEAL_TIMES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "media_manana", label: "Media mañana" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "cualquiera", label: "Cualquiera" },
];

const COOKING_METHODS = ["Horno", "Plancha", "Olla", "Microondas", "Airfryer", "Wok", "Sin cocción", "Vaporizador"];
const CUISINE_TYPES = ["Mediterránea", "Española", "Italiana", "Asiática", "Mexicana", "Americana", "Vegana", "Internacional"];

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  step: number;
  text: string;
}

const emptyIngredient = (): Ingredient => ({ name: "", amount: "", unit: "" });
const emptyStep = (n: number): Step => ({ step: n, text: "" });

export default function BuddyMakerPanel() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    specialty: "",
    avatarUrl: "",
    coverUrl: "",
    instagramHandle: "",
    youtubeHandle: "",
    tiktokHandle: "",
  });

  // Recipe form
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    prepTime: "",
    cookTime: "",
    servings: "2",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    mealTime: "cualquiera",
    cookingMethod: "",
    cuisineType: "",
    difficulty: "medium",
    allergens: "",
    tags: "",
    isPublic: true,
    ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
    steps: [emptyStep(1), emptyStep(2), emptyStep(3)],
  });

  // Queries
  const { data: myProfile, refetch: refetchProfile } = trpc.buddyMakers.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: myStats } = trpc.buddyMakers.getMyStats.useQuery(undefined, {
    enabled: !!user && !!myProfile,
  });

  const { data: myRecipes, refetch: refetchRecipes } = trpc.buddyMakers.getMyRecipes.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: analytics } = trpc.makerAnalytics.getMakerAnalytics.useQuery(
    { period: "30d" },
    { enabled: !!user && !!myProfile }
  );

  const { data: followers } = trpc.buddyMakers.getMyFollowers.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user && !!myProfile }
  );

  // Stripe Connect
  const { data: connectStatus, refetch: refetchConnect } = trpc.stripeConnect.getConnectStatus.useQuery(
    { creatorType: "buddymaker" },
    { enabled: !!user && !!myProfile }
  );

  const startOnboarding = trpc.stripeConnect.getOnboardingLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (e: any) => {
      toast.error("Error: " + e.message);
    },
  });

  const getDashboardLink = trpc.stripeConnect.getStripeDashboardLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
    onError: (e) => {
      toast.error("Error: " + e.message);
    },
  });

  // Populate form when profile loads
  useEffect(() => {
    if (myProfile) {
      setProfileForm({
        displayName: myProfile.displayName ?? "",
        bio: myProfile.bio ?? "",
        specialty: myProfile.specialty ?? "",
        avatarUrl: myProfile.avatarUrl ?? "",
        coverUrl: myProfile.coverUrl ?? "",
        instagramHandle: myProfile.instagramHandle ?? "",
        youtubeHandle: myProfile.youtubeHandle ?? "",
        tiktokHandle: myProfile.tiktokHandle ?? "",
      });
    }
  }, [myProfile]);

  if (authLoading) {
    return <AppLayout><div className="text-center py-12">Cargando...</div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="text-center py-12">Por favor inicia sesión</div></AppLayout>;
  }

  // Color scheme
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6"];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Panel de BuddyMaker</h1>
          <p className="text-slate-600">Gestiona tu perfil, recetas, ganancias y comunidad</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Resumen", icon: "📊" },
            { id: "recipes", label: "Recetas", icon: "🍳" },
            { id: "analytics", label: "Analytics", icon: "📈" },
            { id: "earnings", label: "Ganancias", icon: "💰" },
            { id: "followers", label: "Seguidores", icon: "👥" },
            { id: "referrals", label: "Referidos", icon: "🔗" },
            { id: "profile", label: "Perfil", icon: "👤" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Eye className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{analytics?.totals.views ?? 0}</div>
                    <div className="text-sm text-slate-600">Vistas totales</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{analytics?.totals.likes ?? 0}</div>
                    <div className="text-sm text-slate-600">Likes</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold">{myStats?.followersCount ?? 0}</div>
                    <div className="text-sm text-slate-600">Seguidores</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <DollarSign className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-3xl font-bold">${myStats?.totalPaid ?? 0}</div>
                    <div className="text-sm text-slate-600">Ganancias</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <Button onClick={() => { setActiveTab("recipes"); setShowRecipeForm(true); }} className="bg-red-500 hover:bg-red-600">
                  <Plus className="w-4 h-4 mr-2" /> Nueva Receta
                </Button>
                <Button onClick={() => setActiveTab("profile")} variant="outline">
                  <Edit2 className="w-4 h-4 mr-2" /> Editar Perfil
                </Button>
                <Button onClick={() => setActiveTab("earnings")} variant="outline">
                  <DollarSign className="w-4 h-4 mr-2" /> Ver Ganancias
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recetas Principales (Últimos 30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.topRecipes && analytics.topRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.topRecipes.slice(0, 5).map((recipe: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{recipe.recipe.title}</div>
                          <div className="text-sm text-slate-600">{recipe.totalViews} vistas</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{recipe.totalLikes} ❤️</div>
                          <div className="text-sm text-slate-600">{recipe.totalSaves} 💾</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-600 py-8">Sin datos aún</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === "recipes" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mis Recetas</h2>
              <Button onClick={() => { setShowRecipeForm(true); setEditingRecipe(null); }} className="bg-red-500 hover:bg-red-600">
                <Plus className="w-4 h-4 mr-2" /> Nueva Receta
              </Button>
            </div>

            {/* Recipe Form */}
            {showRecipeForm && (
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle>{editingRecipe ? "Editar Receta" : "Nueva Receta"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Nombre de la receta" value={recipeForm.name} onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })} />
                    <Input placeholder="Tiempo de preparación (min)" value={recipeForm.prepTime} onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })} />
                    <Input placeholder="Tiempo de cocción (min)" value={recipeForm.cookTime} onChange={(e) => setRecipeForm({ ...recipeForm, cookTime: e.target.value })} />
                    <Input placeholder="Porciones" value={recipeForm.servings} onChange={(e) => setRecipeForm({ ...recipeForm, servings: e.target.value })} />
                    <Input placeholder="Calorías" value={recipeForm.calories} onChange={(e) => setRecipeForm({ ...recipeForm, calories: e.target.value })} />
                    <Input placeholder="Proteínas (g)" value={recipeForm.protein} onChange={(e) => setRecipeForm({ ...recipeForm, protein: e.target.value })} />
                    <Input placeholder="Carbohidratos (g)" value={recipeForm.carbs} onChange={(e) => setRecipeForm({ ...recipeForm, carbs: e.target.value })} />
                    <Input placeholder="Grasas (g)" value={recipeForm.fat} onChange={(e) => setRecipeForm({ ...recipeForm, fat: e.target.value })} />
                  </div>

                  <Textarea placeholder="Descripción" value={recipeForm.description} onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })} />

                  <div className="grid md:grid-cols-2 gap-4">
                    <Select value={recipeForm.mealTime} onValueChange={(v) => setRecipeForm({ ...recipeForm, mealTime: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de comida" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TIMES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={recipeForm.difficulty} onValueChange={(v) => setRecipeForm({ ...recipeForm, difficulty: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Dificultad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={recipeForm.cookingMethod} onValueChange={(v) => setRecipeForm({ ...recipeForm, cookingMethod: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Método de cocción" />
                      </SelectTrigger>
                      <SelectContent>
                        {COOKING_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={recipeForm.cuisineType} onValueChange={(v) => setRecipeForm({ ...recipeForm, cuisineType: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de cocina" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUISINE_TYPES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => { setShowRecipeForm(false); setEditingRecipe(null); }} variant="outline">Cancelar</Button>
                    <Button className="bg-red-500 hover:bg-red-600">Guardar Receta</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recipes List */}
            <div className="grid gap-4">
              {myRecipes && myRecipes.length > 0 ? (
                myRecipes.map((recipe: any) => (
                  <Card key={recipe.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold">{recipe.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{recipe.description}</p>
                          <div className="flex gap-2 text-xs text-slate-500">
                            <span>⏱️ {recipe.prepTime}min</span>
                            <span>🍽️ {recipe.servings} porciones</span>
                            <span>🔥 {recipe.calories} cal</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingRecipe(recipe)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <p>No tienes recetas aún</p>
                  <Button onClick={() => setShowRecipeForm(true)} className="mt-4 bg-red-500 hover:bg-red-600">
                    Crear tu primera receta
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>

            {analytics && (
              <>
                {/* Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.totals.views}</div>
                        <div className="text-sm text-slate-600">Vistas totales</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.totals.uniqueViews}</div>
                        <div className="text-sm text-slate-600">Vistas únicas</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.totals.conversionRate}%</div>
                        <div className="text-sm text-slate-600">Tasa de conversión</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia de Vistas (Últimos 30 días)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="views" stroke="#ef4444" />
                        <Line type="monotone" dataKey="likes" stroke="#ec4899" />
                        <Line type="monotone" dataKey="saves" stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Interactions Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Interacciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Likes", value: analytics.totals.likes },
                            { name: "Saves", value: analytics.totals.saves },
                            { name: "Shares", value: analytics.totals.shares },
                            { name: "Comments", value: analytics.totals.comments },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {colors.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === "earnings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gestión de Ganancias</h2>

            {/* Stripe Connect Status */}
            <Card className={connectStatus?.connected ? "border-green-200" : "border-yellow-200"}>
              <CardHeader>
                <CardTitle>Estado de Stripe Connect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Estado de conexión</div>
                    <div className="text-lg font-bold">{connectStatus?.connected ? "✅ Conectado" : "❌ No conectado"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Pagos habilitados</div>
                    <div className="text-lg font-bold">{connectStatus?.payoutsEnabled ? "✅ Sí" : "❌ No"}</div>
                  </div>
                </div>

                {!connectStatus?.connected ? (
                  <Button
                    onClick={() => startOnboarding.mutate({ creatorType: "buddymaker" })}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={startOnboarding.isPending}
                  >
                    {startOnboarding.isPending ? "Cargando..." : "Conectar Stripe"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => getDashboardLink.mutate({ creatorType: "buddymaker" })}
                    variant="outline"
                    className="w-full"
                  >
                    Abrir Dashboard de Stripe
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Earnings Summary */}
            {myStats && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">${myStats.totalPaid}</div>
                      <div className="text-sm text-slate-600">Ganancias pagadas</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">${myStats.totalPending}</div>
                      <div className="text-sm text-slate-600">Ganancias pendientes</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Ganancias Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {myStats?.recentEarnings && myStats.recentEarnings.length > 0 ? (
                  <div className="space-y-2">
                    {myStats.recentEarnings.map((earning: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{earning.description}</div>
                          <div className="text-xs text-slate-600">{new Date(earning.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${earning.commissionAmount}</div>
                          <div className={`text-xs ${earning.status === "active" ? "text-green-600" : "text-yellow-600"}`}>
                            {earning.status === "active" ? "Pagado" : "Pendiente"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-600 py-8">Sin ganancias aún</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* FOLLOWERS TAB */}
        {activeTab === "followers" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Mis Seguidores</h2>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-blue-600">{followers?.total ?? 0}</div>
                  <div className="text-slate-600">Seguidores totales</div>
                </div>

                {followers?.followers && followers.followers.length > 0 ? (
                  <div className="space-y-3">
                    {followers.followers.map((follower: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {follower.user?.imageUrl && (
                            <img src={follower.user.imageUrl} alt={follower.user.name} className="w-10 h-10 rounded-full" />
                          )}
                          <div>
                            <div className="font-medium">{follower.user?.name}</div>
                            <div className="text-xs text-slate-600">{follower.user?.email}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-600">
                          Desde {new Date(follower.followedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-600 py-8">Sin seguidores aún</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* REFERRALS TAB */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Programa de Referidos</h2>

            <Card>
              <CardHeader>
                <CardTitle>Tu Código de Referencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600">Código</div>
                    <div className="text-2xl font-bold font-mono">BUDDY{user?.id}MAKER</div>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`BUDDY${user?.id}MAKER`);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    variant="outline"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-slate-600">Amigos invitados</div>
                    <div className="text-2xl font-bold">0</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-slate-600">Conversiones</div>
                    <div className="text-2xl font-bold">0</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-slate-600">Ganancias por referidos</div>
                    <div className="text-2xl font-bold">$0</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Comparte tu código en:</div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline">WhatsApp</Button>
                    <Button size="sm" variant="outline">Twitter</Button>
                    <Button size="sm" variant="outline">Facebook</Button>
                    <Button size="sm" variant="outline">Instagram</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Mi Perfil</h2>

            <Card>
              <CardHeader>
                <CardTitle>Información del Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Nombre de usuario"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  />
                  <Input
                    placeholder="Especialidad"
                    value={profileForm.specialty}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  />
                </div>

                <Textarea
                  placeholder="Biografía"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Instagram handle"
                    value={profileForm.instagramHandle}
                    onChange={(e) => setProfileForm({ ...profileForm, instagramHandle: e.target.value })}
                  />
                  <Input
                    placeholder="YouTube handle"
                    value={profileForm.youtubeHandle}
                    onChange={(e) => setProfileForm({ ...profileForm, youtubeHandle: e.target.value })}
                  />
                  <Input
                    placeholder="TikTok handle"
                    value={profileForm.tiktokHandle}
                    onChange={(e) => setProfileForm({ ...profileForm, tiktokHandle: e.target.value })}
                  />
                </div>

                <Button className="w-full bg-red-500 hover:bg-red-600">Guardar Cambios</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
