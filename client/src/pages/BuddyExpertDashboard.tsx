import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";

type Tab = "/app/profile" | "plans" | "/app/menus" | "blog";

const CATEGORIES = [
  { value: "perdida_peso", label: "Pérdida de peso" },
  { value: "ganancia_muscular", label: "Ganancia muscular" },
  { value: "definicion", label: "Definición" },
  { value: "dieta_equilibrada", label: "Dieta equilibrada" },
  { value: "rendimiento", label: "Rendimiento deportivo" },
  { value: "bienestar", label: "Bienestar" },
  { value: "vegano", label: "Vegano / Plant-based" },
] as const;

type Category = typeof CATEGORIES[number]["value"];

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MEALS = ["Desayuno", "Media mañana", "Comida", "Merienda", "Cena"];

export default function BuddyExpertDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("/app/profile");
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  // Plan form state
  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
    coverUrl: "",
    category: "dieta_equilibrada" as Category,
    durationWeeks: "4",
    dailyCalories: "",
    dailyMeals: "3",
    level: "principiante" as "principiante" | "intermedio" | "avanzado",
    price: "0",
    isPublic: true,
    tags: "",
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    specialty: "",
    avatarUrl: "",
    coverUrl: "",
    category: "dieta_equilibrada" as Category,
    instagramHandle: "",
    websiteUrl: "",
  });

  // Menu form state
  const [menuForm, setMenuForm] = useState({
    title: "",
    description: "",
    coverUrl: "",
    category: "dieta_equilibrada" as Category,
    dailyCalories: "",
    isPublic: true,
    days: DAYS.map((day) => ({
      day,
      meals: MEALS.map((name) => ({ name, food: "" })),
    })),
  });

  const { data: myProfile, refetch: refetchProfile } = trpc.buddyExperts.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: myApplication, isLoading: appLoading } = trpc.buddyApplications.getMyApplication.useQuery(
    { type: "expert" },
    { enabled: !!user }
  );

  // Populate form when profile loads
  const [profileLoaded, setProfileLoaded] = useState(false);
  if (myProfile && !profileLoaded) {
    setProfileLoaded(true);
    setProfileForm({
      displayName: myProfile.displayName ?? "",
      bio: myProfile.bio ?? "",
      specialty: myProfile.specialty ?? "",
      avatarUrl: myProfile.avatarUrl ?? "",
      coverUrl: myProfile.coverUrl ?? "",
      category: (myProfile.category as Category) ?? "dieta_equilibrada",
      instagramHandle: myProfile.instagramHandle ?? "",
      websiteUrl: myProfile.websiteUrl ?? "",
    });
  }

  const { data: myMenus, refetch: refetchMenus } = trpc.buddyExperts.getMyMenus.useQuery(undefined, {
    enabled: !!user && !!myProfile,
  });

  const { data: myPlans, refetch: refetchPlans } = trpc.buddyExperts.getMyPlans.useQuery(undefined, {
    enabled: !!user && !!myProfile,
  });

  const createProfileMutation = trpc.buddyExperts.createProfile.useMutation({
    onSuccess: () => { toast.success("Perfil de experto creado"); refetchProfile(); },
    onError: (e) => toast.error(e.message),
  });

  const updateProfileMutation = trpc.buddyExperts.updateProfile.useMutation({
    onSuccess: () => { toast.success("Perfil actualizado"); refetchProfile(); },
    onError: (e) => toast.error(e.message),
  });

  const createMenuMutation = trpc.buddyExperts.createMenu.useMutation({
    onSuccess: () => { toast.success("Menú publicado"); setShowMenuForm(false); refetchMenus(); resetMenuForm(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMenuMutation = trpc.buddyExperts.updateMenu.useMutation({
    onSuccess: () => { toast.success("Menú actualizado"); setShowMenuForm(false); setEditingMenu(null); refetchMenus(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMenuMutation = trpc.buddyExperts.deleteMenu.useMutation({
    onSuccess: () => { toast.success("Menú eliminado"); refetchMenus(); },
    onError: (e) => toast.error(e.message),
  });

  const createPlanMutation = trpc.buddyExperts.createPlan.useMutation({
    onSuccess: () => { toast.success("Plan publicado"); setShowPlanForm(false); refetchPlans(); resetPlanForm(); },
    onError: (e) => toast.error(e.message),
  });

  const updatePlanMutation = trpc.buddyExperts.updatePlan.useMutation({
    onSuccess: () => { toast.success("Plan actualizado"); setShowPlanForm(false); setEditingPlan(null); refetchPlans(); },
    onError: (e) => toast.error(e.message),
  });

  const deletePlanMutation = trpc.buddyExperts.deletePlan.useMutation({
    onSuccess: () => { toast.success("Plan eliminado"); refetchPlans(); },
    onError: (e) => toast.error(e.message),
  });

  function resetPlanForm() {
    setPlanForm({ title: "", description: "", coverUrl: "", category: "dieta_equilibrada", durationWeeks: "4", dailyCalories: "", dailyMeals: "3", level: "principiante", price: "0", isPublic: true, tags: "" });
  }

  function openEditPlan(plan: any) {
    setPlanForm({
      title: plan.title ?? "",
      description: plan.description ?? "",
      coverUrl: plan.coverUrl ?? "",
      category: (plan.category as Category) ?? "dieta_equilibrada",
      durationWeeks: plan.durationWeeks?.toString() ?? "4",
      dailyCalories: plan.dailyCalories?.toString() ?? "",
      dailyMeals: plan.dailyMeals?.toString() ?? "3",
      level: plan.level ?? "principiante",
      price: plan.price?.toString() ?? "0",
      isPublic: plan.isPublic ?? true,
      tags: plan.tags ?? "",
    });
    setEditingPlan(plan);
    setShowPlanForm(true);
  }

  function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: planForm.title,
      description: planForm.description || undefined,
      coverUrl: planForm.coverUrl || undefined,
      category: planForm.category,
      durationWeeks: planForm.durationWeeks ? parseInt(planForm.durationWeeks) : undefined,
      dailyCalories: planForm.dailyCalories ? parseInt(planForm.dailyCalories) : undefined,
      dailyMeals: planForm.dailyMeals ? parseInt(planForm.dailyMeals) : undefined,
      level: planForm.level,
      price: planForm.price ? parseFloat(planForm.price) : 0,
      isPublic: planForm.isPublic,
      tags: planForm.tags || undefined,
    };
    if (editingPlan) {
      updatePlanMutation.mutate({ planId: editingPlan.id, ...payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  }

  function resetMenuForm() {
    setMenuForm({
      title: "", description: "", coverUrl: "", category: "dieta_equilibrada", dailyCalories: "", isPublic: true,
      days: DAYS.map((day) => ({ day, meals: MEALS.map((name) => ({ name, food: "" })) })),
    });
  }

  function openEditMenu(menu: any) {
    let parsedDays = DAYS.map((day) => ({ day, meals: MEALS.map((name) => ({ name, food: "" })) }));
    try {
      const parsed = JSON.parse(menu.menuData ?? "{}");
      if (parsed.days) parsedDays = parsed.days;
    } catch {}
    setMenuForm({
      title: menu.title ?? "",
      description: menu.description ?? "",
      coverUrl: menu.coverUrl ?? "",
      category: (menu.category as Category) ?? "dieta_equilibrada",
      dailyCalories: menu.dailyCalories?.toString() ?? "",
      isPublic: menu.isPublic ?? true,
      days: parsedDays,
    });
    setEditingMenu(menu);
    setShowMenuForm(true);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      displayName: profileForm.displayName,
      bio: profileForm.bio || undefined,
      specialty: profileForm.specialty || undefined,
      avatarUrl: profileForm.avatarUrl || undefined,
      coverUrl: profileForm.coverUrl || undefined,
      category: profileForm.category,
      instagramHandle: profileForm.instagramHandle || undefined,
      websiteUrl: profileForm.websiteUrl || undefined,
    };
    if (myProfile) {
      updateProfileMutation.mutate(payload);
    } else {
      createProfileMutation.mutate(payload);
    }
  }

  function handleSaveMenu(e: React.FormEvent) {
    e.preventDefault();
    const menuData = JSON.stringify({ days: menuForm.days });
    const payload = {
      title: menuForm.title,
      description: menuForm.description || undefined,
      coverUrl: menuForm.coverUrl || undefined,
      category: menuForm.category,
      dailyCalories: menuForm.dailyCalories ? parseInt(menuForm.dailyCalories) : undefined,
      isPublic: menuForm.isPublic,
      menuData,
    };
    if (editingMenu) {
      updateMenuMutation.mutate({ menuId: editingMenu.id, ...payload });
    } else {
      createMenuMutation.mutate(payload);
    }
  }

  function updateMealFood(dayIdx: number, mealIdx: number, food: string) {
    setMenuForm((prev) => {
      const days = prev.days.map((d, di) =>
        di === dayIdx ? { ...d, meals: d.meals.map((m, mi) => mi === mealIdx ? { ...m, food } : m) } : d
      );
      return { ...prev, days };
    });
  }

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-800">Inicia sesión para acceder a tu panel de experto</h2>
        </div>
      </AppLayout>
    );
  }

  // Gate: only approved experts can access the dashboard
  // Allow access if: (a) application is approved OR (b) user has buddyexpert role (assigned by admin)
  const hasAccess = myApplication?.status === "approved" || (user as any)?.role === "buddyexpert" || (user as any)?.accountType === "buddyexpert";
  if (!appLoading && !hasAccess) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
          <div className="text-6xl">🎓</div>
          <h2 className="text-xl font-bold">Acceso restringido a BuddyExperts</h2>
          <p className="text-muted-foreground">
            {myApplication?.status === "pending"
              ? "Tu solicitud está siendo revisada. Te notificaremos cuando sea aprobada."
              : "Para acceder a este panel necesitas solicitar y obtener el rol de BuddyExpert."}
          </p>
          <a href="/app/buddy-application?type=expert" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-6 text-sm font-medium hover:bg-primary/90 transition-colors">
            {myApplication?.status === "pending" ? "Ver estado de mi solicitud" : "Solicitar acceso"}
          </a>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
            🎓
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">Panel BuddyExpert</h1>
            <p className="text-xs text-gray-500">Gestiona tu perfil y tus menús semanales</p>
          </div>
          <a href="/app/buddy-expert-stats" className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
            <span>📊</span> Estadísticas
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
          {(["/app/profile", "plans", "/app/menus", "blog"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? "bg-white text-orange-600 shadow-sm" : "text-gray-500"}`}
            >
              {tab === "/app/profile" ? "👤 Perfil" : tab === "plans" ? "📊 Planes" : tab === "/app/menus" ? "📋 Menús" : "✍️ Blog"}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "/app/profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-black text-gray-900 mb-2">
              {myProfile ? "Editar perfil de experto" : "Crear perfil de experto"}
            </h2>
            {!myProfile && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800">
                <strong>¿Eres nutricionista, dietista o experto en nutrición?</strong> Crea tu perfil para aparecer en la sección BuddyExperts y compartir menús con la comunidad.
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre público *</label>
                <input
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Ej: Ana García, Nutricionista"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Especialidad</label>
                <input
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="Ej: Nutricionista deportiva, Dietista clínica..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Categoría principal</label>
                <select
                  value={profileForm.category}
                  onChange={(e) => setProfileForm((p) => ({ ...p, category: e.target.value as Category }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Bio / Presentación</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Cuéntanos sobre tu experiencia y metodología..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">URL foto de perfil</label>
                <input
                  value={profileForm.avatarUrl}
                  onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">URL imagen de portada</label>
                <input
                  value={profileForm.coverUrl}
                  onChange={(e) => setProfileForm((p) => ({ ...p, coverUrl: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Instagram</label>
                  <input
                    value={profileForm.instagramHandle}
                    onChange={(e) => setProfileForm((p) => ({ ...p, instagramHandle: e.target.value }))}
                    placeholder="@usuario"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Web / LinkedIn</label>
                  <input
                    value={profileForm.websiteUrl}
                    onChange={(e) => setProfileForm((p) => ({ ...p, websiteUrl: e.target.value }))}
                    placeholder="https://..."
                    type="url"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
            >
              {(createProfileMutation.isPending || updateProfileMutation.isPending)
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                : myProfile ? "✓ Guardar cambios" : "✓ Crear perfil de experto"}
            </button>
          </form>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div className="space-y-4">
            {!myProfile && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800 text-center">
                Primero debes crear tu perfil de experto en la pestaña "Perfil".
              </div>
            )}
            {myProfile && !showPlanForm && (
              <>
                <button
                  onClick={() => { resetPlanForm(); setEditingPlan(null); setShowPlanForm(true); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                >
                  + Crear nuevo plan nutricional
                </button>
                {(!myPlans || myPlans.length === 0) ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">📊</div>
                    <p className="font-semibold">Aún no has creado ningún plan</p>
                    <p className="text-sm mt-1">Crea planes nutricionales para compartir con la comunidad</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myPlans.map((plan) => (
                      <div key={plan.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3">
                          {plan.coverUrl && (
                            <img src={plan.coverUrl} alt={plan.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{plan.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{plan.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
                                {CATEGORIES.find((c) => c.value === plan.category)?.label ?? plan.category}
                              </span>
                              <span className="text-xs text-gray-400">{plan.durationWeeks} semanas</span>
                              {plan.dailyCalories && <span className="text-xs text-gray-400">{plan.dailyCalories} kcal</span>}
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                                plan.price && plan.price > 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                              }`}>
                                {plan.price && plan.price > 0 ? `${plan.price}€` : "Gratis"}
                              </span>
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${plan.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {plan.isPublic ? "Público" : "Privado"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{plan.copiesCount} copias</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => openEditPlan(plan)}
                              className="text-xs font-bold text-orange-600 bg-orange-50 rounded-xl px-3 py-1.5"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => { if (confirm("¿Eliminar este plan?")) deletePlanMutation.mutate({ planId: plan.id }); }}
                              className="text-xs font-bold text-red-500 bg-red-50 rounded-xl px-3 py-1.5"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Plan Form */}
            {showPlanForm && (
              <form onSubmit={handleSavePlan} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-gray-900">
                    {editingPlan ? "Editar plan" : "Nuevo plan nutricional"}
                  </h2>
                  <button type="button" onClick={() => { setShowPlanForm(false); setEditingPlan(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Título del plan *</label>
                    <input
                      required
                      value={planForm.title}
                      onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Plan de pérdida de peso en 4 semanas"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Descripción</label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe el objetivo y características del plan..."
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Categoría</label>
                      <select
                        value={planForm.category}
                        onChange={(e) => setPlanForm((p) => ({ ...p, category: e.target.value as Category }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Nivel</label>
                      <select
                        value={planForm.level}
                        onChange={(e) => setPlanForm((p) => ({ ...p, level: e.target.value as any }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Semanas</label>
                      <input
                        value={planForm.durationWeeks}
                        onChange={(e) => setPlanForm((p) => ({ ...p, durationWeeks: e.target.value }))}
                        type="number" min="1" max="52"
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Kcal/día</label>
                      <input
                        value={planForm.dailyCalories}
                        onChange={(e) => setPlanForm((p) => ({ ...p, dailyCalories: e.target.value }))}
                        type="number" min="500" max="5000" placeholder="Ej: 1800"
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Precio (€)</label>
                      <input
                        value={planForm.price}
                        onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))}
                        type="number" min="0" step="0.01" placeholder="0 = gratis"
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">URL imagen de portada</label>
                    <input
                      value={planForm.coverUrl}
                      onChange={(e) => setPlanForm((p) => ({ ...p, coverUrl: e.target.value }))}
                      placeholder="https://..."
                      type="url"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="planIsPublic"
                      checked={planForm.isPublic}
                      onChange={(e) => setPlanForm((p) => ({ ...p, isPublic: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <label htmlFor="planIsPublic" className="text-sm text-gray-700">Visible públicamente en BuddyExperts</label>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                >
                  {(createPlanMutation.isPending || updatePlanMutation.isPending)
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                    : editingPlan ? "✓ Guardar cambios" : "✓ Publicar plan"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Menus Tab */}
        {activeTab === "/app/menus" && (
          <div className="space-y-4">
            {!myProfile && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800 text-center">
                Primero debes crear tu perfil de experto en la pestaña "Mi Perfil".
              </div>
            )}
            {myProfile && !showMenuForm && (
              <>
                <button
                  onClick={() => { resetMenuForm(); setEditingMenu(null); setShowMenuForm(true); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                >
                  + Publicar nuevo menú semanal
                </button>
                {(!myMenus || myMenus.length === 0) ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="font-semibold">Aún no has publicado ningún menú</p>
                    <p className="text-sm mt-1">Comparte menús semanales gratuitos para ganar seguidores</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myMenus.map((menu) => (
                      <div key={menu.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3">
                          {menu.coverUrl && (
                            <img src={menu.coverUrl} alt={menu.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{menu.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{menu.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
                                {CATEGORIES.find((c) => c.value === menu.category)?.label ?? menu.category}
                              </span>
                              {menu.dailyCalories && (
                                <span className="text-xs text-gray-400">{menu.dailyCalories} kcal/día</span>
                              )}
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${menu.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {menu.isPublic ? "Público" : "Privado"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => openEditMenu(menu)}
                              className="text-xs font-bold text-orange-600 bg-orange-50 rounded-xl px-3 py-1.5"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => { if (confirm("¿Eliminar este menú?")) deleteMenuMutation.mutate({ menuId: menu.id }); }}
                              className="text-xs font-bold text-red-500 bg-red-50 rounded-xl px-3 py-1.5"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Menu Form */}
            {showMenuForm && (
              <form onSubmit={handleSaveMenu} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-gray-900">
                    {editingMenu ? "Editar menú" : "Nuevo menú semanal"}
                  </h2>
                  <button type="button" onClick={() => { setShowMenuForm(false); setEditingMenu(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Título del menú *</label>
                    <input
                      required
                      value={menuForm.title}
                      onChange={(e) => setMenuForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Menú semanal para pérdida de peso"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Descripción</label>
                    <textarea
                      value={menuForm.description}
                      onChange={(e) => setMenuForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe el objetivo y características del menú..."
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Categoría</label>
                      <select
                        value={menuForm.category}
                        onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value as Category }))}
                        className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Calorías/día</label>
                      <input
                        value={menuForm.dailyCalories}
                        onChange={(e) => setMenuForm((p) => ({ ...p, dailyCalories: e.target.value }))}
                        placeholder="Ej: 1800"
                        type="number"
                        min="500"
                        max="5000"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">URL imagen de portada</label>
                    <input
                      value={menuForm.coverUrl}
                      onChange={(e) => setMenuForm((p) => ({ ...p, coverUrl: e.target.value }))}
                      placeholder="https://..."
                      type="url"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={menuForm.isPublic}
                      onChange={(e) => setMenuForm((p) => ({ ...p, isPublic: e.target.checked }))}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <label htmlFor="isPublic" className="text-sm font-semibold text-gray-700">Publicar como menú público (visible para todos)</label>
                  </div>
                </div>

                {/* Days & Meals */}
                <div>
                  <h3 className="text-sm font-black text-gray-900 mb-3">Contenido del menú</h3>
                  <div className="space-y-4">
                    {menuForm.days.map((dayData, dayIdx) => (
                      <div key={dayData.day} className="border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="bg-orange-50 px-4 py-2">
                          <span className="text-sm font-black text-orange-700">{dayData.day}</span>
                        </div>
                        <div className="p-3 space-y-2">
                          {dayData.meals.map((meal, mealIdx) => (
                            <div key={meal.name} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 w-24 shrink-0">{meal.name}</span>
                              <input
                                value={meal.food}
                                onChange={(e) => updateMealFood(dayIdx, mealIdx, e.target.value)}
                                placeholder="Ej: Avena con frutas y miel"
                                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowMenuForm(false); setEditingMenu(null); }}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMenuMutation.isPending || updateMenuMutation.isPending}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
                  >
                    {(createMenuMutation.isPending || updateMenuMutation.isPending)
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                      : editingMenu ? "✓ Guardar cambios" : "✓ Publicar menú"}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                  * Nota: Este contenido no constituye recomendación profesional. Consulta a un profesional de la salud.
                </p>
              </form>
            )}
          </div>
        )}
        {/* Blog Tab */}
        {activeTab === "blog" && (
          <BlogTab expertProfile={myProfile} />
        )}
      </div>
    </AppLayout>
  );
}

// ─── Blog Tab Component ──────────────────────────────────────────────────────
const BLOG_CATEGORIES = ["Nutrición", "Recetas", "Salud", "Bienestar", "Guías", "Ciencia", "Deporte"];

function BlogTab({ expertProfile }: { expertProfile: any }) {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    category: "Nutrición",
    tags: "",
    readTimeMinutes: 5,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: myPosts, refetch } = trpc.blog.myPosts.useQuery({ status: "all" }, { enabled: !!expertProfile });

  const createMutation = trpc.blog.create.useMutation({
    onSuccess: () => { toast.success("Artículo guardado como borrador"); setShowForm(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => { toast.success("Artículo actualizado"); setShowForm(false); setEditingPost(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const publishMutation = trpc.blog.publish.useMutation({
    onSuccess: (post) => { toast.success(post.status === "published" ? "✅ Artículo publicado" : "Artículo vuelto a borrador"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.blog.delete.useMutation({
    onSuccess: () => { toast.success("Artículo eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const uploadCoverMutation = trpc.blog.uploadCover.useMutation({
    onSuccess: ({ url }) => { setForm((f) => ({ ...f, coverImageUrl: url })); toast.success("Imagen subida"); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ title: "", excerpt: "", content: "", coverImageUrl: "", category: "Nutrición", tags: "", readTimeMinutes: 5 });
  }

  function openEdit(post: any) {
    setForm({
      title: post.title ?? "",
      excerpt: post.excerpt ?? "",
      content: post.content ?? "",
      coverImageUrl: post.coverImageUrl ?? "",
      category: post.category ?? "Nutrición",
      tags: post.tags ?? "",
      readTimeMinutes: post.readTimeMinutes ?? 5,
    });
    setEditingPost(post);
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      excerpt: form.excerpt || undefined,
      content: form.content,
      coverImageUrl: form.coverImageUrl || undefined,
      category: form.category,
      tags: form.tags || undefined,
      readTimeMinutes: form.readTimeMinutes,
    };
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadCoverMutation.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }

  if (!expertProfile) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-sm text-orange-800 text-center">
        Primero debes crear tu perfil de experto en la pestaña "👤 Perfil".
      </div>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-black text-gray-900">{editingPost ? "Editar artículo" : "Nuevo artículo"}</h2>
          <button type="button" onClick={() => { setShowForm(false); setEditingPost(null); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-sm">✕ Cancelar</button>
        </div>

        {/* Cover image */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Imagen de portada</label>
          {form.coverImageUrl ? (
            <div className="relative">
              <img src={form.coverImageUrl} alt="Portada" className="w-full h-40 object-cover rounded-2xl" />
              <button type="button" onClick={() => setForm((f) => ({ ...f, coverImageUrl: "" }))} className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black/70">✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors">
              {uploadCoverMutation.isPending ? <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : <>🖼️<span className="text-xs">Subir imagen de portada</span></>}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título *</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required minLength={5} maxLength={256} placeholder="Escribe un título atractivo..." className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Resumen (opcional)</label>
          <textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} maxLength={500} rows={2} placeholder="Breve descripción del artículo (aparece en la lista del blog)..." className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contenido *</label>
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required minLength={10} rows={12} placeholder="Escribe aquí el contenido completo del artículo. Puedes usar Markdown: **negrita**, *cursiva*, ## Títulos, - listas..." className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y font-mono" />
          <p className="text-xs text-gray-400 mt-1">Soporta formato Markdown básico</p>
        </div>

        {/* Category + Read time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white">
              {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tiempo de lectura (min)</label>
            <input type="number" min={1} max={60} value={form.readTimeMinutes} onChange={(e) => setForm((f) => ({ ...f, readTimeMinutes: parseInt(e.target.value) || 5 }))} className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Etiquetas (separadas por coma)</label>
          <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="nutrición, proteinas, dieta..." className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
            {(createMutation.isPending || updateMutation.isPending) ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : editingPost ? "✓ Guardar cambios" : "💾 Guardar borrador"}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center">* Este contenido no constituye recomendación profesional. Consulta a un profesional de la salud.</p>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-gray-900">✍️ Mis artículos</h2>
        <button onClick={() => { resetForm(); setEditingPost(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
          + Nuevo artículo
        </button>
      </div>

      {!myPosts || myPosts.length === 0 ? (
        <div className="bg-gray-50 rounded-3xl p-8 text-center space-y-3">
          <div className="text-4xl">📝</div>
          <p className="text-sm font-semibold text-gray-700">Aún no has escrito ningún artículo</p>
          <p className="text-xs text-gray-400">Comparte tu conocimiento con la comunidad BuddyMarket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex gap-3">
                {post.coverImageUrl && (
                  <img src={post.coverImageUrl} alt={post.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{post.title}</h3>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${
                      post.status === "published" ? "bg-green-100 text-green-700" :
                      post.status === "archived" ? "bg-gray-100 text-gray-500" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {post.status === "published" ? "✅ Publicado" : post.status === "archived" ? "Archivado" : "📝 Borrador"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{post.category} · {post.readTimeMinutes} min lectura</p>
                  {post.publishedAt && (
                    <p className="text-xs text-gray-400">{new Date(post.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(post)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">✏️ Editar</button>
                <button
                  onClick={() => publishMutation.mutate({ id: post.id, publish: post.status !== "published" })}
                  disabled={publishMutation.isPending}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    post.status === "published" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {post.status === "published" ? "⏸ Despublicar" : "🚀 Publicar"}
                </button>
                <button onClick={() => { if (confirm("¿Eliminar este artículo?")) deleteMutation.mutate({ id: post.id }); }} className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
