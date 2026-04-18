import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";

type Tab = "/app/profile" | "plans" | "pdf-plans" | "/app/menus" | "blog" | "services";

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
  // Stripe Connect
  const { data: connectStatus, refetch: refetchConnect } = trpc.stripeConnect.getConnectStatus.useQuery(
    { creatorType: "buddyexpert" },
    { enabled: !!user && !!myProfile }
  );
  const startOnboarding = trpc.stripeConnect.getOnboardingLink.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e: any) => { toast.error("Error al iniciar el proceso: " + e.message); },
  });
  const getDashboardLink = trpc.stripeConnect.getStripeDashboardLink.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (e) => { toast.error("Error al abrir el dashboard: " + e.message); },
  });

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

  const uploadAvatarMutation = trpc.buddyExperts.uploadAvatar.useMutation({
    onSuccess: (data) => { toast.success("Foto de perfil subida"); setProfileForm((p) => ({ ...p, avatarUrl: data.url })); refetchProfile(); },
    onError: () => toast.error("Error al subir la foto"),
  });

  const uploadCoverImageMutation = trpc.buddyExperts.uploadCoverImage.useMutation({
    onSuccess: (data) => { toast.success("Imagen de portada subida"); setProfileForm((p) => ({ ...p, coverUrl: data.url })); refetchProfile(); },
    onError: () => toast.error("Error al subir la portada"),
  });

  const avatarFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no puede superar 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAvatarMutation.mutate({ imageBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("La imagen no puede superar 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadCoverImageMutation.mutate({ imageBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

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
          <h2 className="text-xl font-bold text-foreground">Inicia sesión para acceder a tu panel de experto</h2>
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
            <h1 className="text-xl font-black text-foreground">Panel BuddyExpert</h1>
            <p className="text-xs text-muted-foreground">Gestiona tu perfil y tus menús semanales</p>
          </div>
          <a href="/app/buddy-expert-stats" className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors">
            <span>📊</span> Estadísticas
          </a>
        </div>

        {/* Stripe Connect Banner */}
        {myProfile && (
          <div className={`mb-4 rounded-2xl p-4 border ${connectStatus?.chargesEnabled ? "bg-green-50 border-green-200" : "bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"}`}>
            {connectStatus?.chargesEnabled ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-bold text-green-800">Cuenta Stripe Connect activa</p>
                    <p className="text-xs text-green-600">
                      {connectStatus.payoutsEnabled ? "Cobros y pagos habilitados" : "Cobros habilitados — pagos pendientes de verificación"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => getDashboardLink.mutate({ creatorType: "buddyexpert" })}
                  disabled={getDashboardLink.isPending}
                  className="shrink-0 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {getDashboardLink.isPending ? "Abriendo..." : "Ver dashboard Stripe"}
                </button>
              </div>
            ) : connectStatus?.connected ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <p className="text-sm font-bold text-purple-800">Verificación en curso</p>
                    <p className="text-xs text-purple-600">Completa el proceso de verificación en Stripe para empezar a cobrar</p>
                  </div>
                </div>
                <button
                  onClick={() => startOnboarding.mutate({ creatorType: "buddyexpert" })}
                  disabled={startOnboarding.isPending}
                  className="shrink-0 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {startOnboarding.isPending ? "Cargando..." : "Continuar verificación"}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💳</span>
                  <div>
                    <p className="text-sm font-bold text-purple-800">Conecta tu cuenta de pagos</p>
                    <p className="text-xs text-purple-600">Activa Stripe Connect para cobrar por tus planes y menús premium</p>
                  </div>
                </div>
                <button
                  onClick={() => startOnboarding.mutate({ creatorType: "buddyexpert" })}
                  disabled={startOnboarding.isPending}
                  className="shrink-0 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {startOnboarding.isPending ? "Cargando..." : "Conectar Stripe"}
                </button>
              </div>
            )}
          </div>
        )}
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted/50 rounded-2xl p-1">
          {(["/app/profile", "plans", "pdf-plans", "/app/menus", "blog", "services"] as Tab[]).map((tab) => (
              <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? "bg-background text-orange-600 shadow-sm" : "text-muted-foreground"}`}
            >
              {tab === "/app/profile" ? "👤 Perfil" : tab === "plans" ? "📊 Planes" : tab === "pdf-plans" ? "📄 PDF" : tab === "/app/menus" ? "📋 Menús" : tab === "services" ? "💰 Servicios" : "✍️ Blog"}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "/app/profile" && (
          <form onSubmit={handleSaveProfile} className="bg-background rounded-3xl p-6 shadow-sm border border-border/50 space-y-4">
            <h2 className="text-base font-black text-foreground mb-2">
              {myProfile ? "Editar perfil de experto" : "Crear perfil de experto"}
            </h2>
            {!myProfile && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800">
                <strong>¿Eres nutricionista, dietista o experto en nutrición?</strong> Crea tu perfil para aparecer en la sección BuddyExperts y compartir menús con la comunidad.
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Nombre público *</label>
                <input
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Ej: Ana García, Nutricionista"
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Especialidad</label>
                <input
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="Ej: Nutricionista deportiva, Dietista clínica..."
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Categoría principal</label>
                <select
                  value={profileForm.category}
                  onChange={(e) => setProfileForm((p) => ({ ...p, category: e.target.value as Category }))}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Bio / Presentación</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Cuéntanos sobre tu experiencia y metodología..."
                  rows={3}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              {/* Foto de perfil */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Foto de perfil</label>
                <div className="flex items-center gap-3">
                  {profileForm.avatarUrl ? (
                    <img src={profileForm.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-400 text-2xl border border-border">👤</div>
                  )}
                  <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    {uploadAvatarMutation.isPending ? <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : "📷"}
                    {uploadAvatarMutation.isPending ? "Subiendo..." : "Subir foto"}
                  </button>
                </div>
              </div>
              {/* Imagen de portada */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Imagen de portada</label>
                <div className="flex items-center gap-3">
                  {profileForm.coverUrl ? (
                    <img src={profileForm.coverUrl} alt="" className="w-24 h-14 rounded-xl object-cover border border-border" />
                  ) : (
                    <div className="w-24 h-14 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground/70 text-xl border border-border">🖼️</div>
                  )}
                  <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                  <button
                    type="button"
                    onClick={() => coverFileRef.current?.click()}
                    disabled={uploadCoverImageMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-300 text-orange-600 text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    {uploadCoverImageMutation.isPending ? <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : "🖼️"}
                    {uploadCoverImageMutation.isPending ? "Subiendo..." : "Subir portada"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Instagram</label>
                  <input
                    value={profileForm.instagramHandle}
                    onChange={(e) => setProfileForm((p) => ({ ...p, instagramHandle: e.target.value }))}
                    placeholder="@usuario"
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Web / LinkedIn</label>
                  <input
                    value={profileForm.websiteUrl}
                    onChange={(e) => setProfileForm((p) => ({ ...p, websiteUrl: e.target.value }))}
                    placeholder="https://..."
                    type="url"
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
            {/* Explicación contextual de planes */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-blue-800 mb-1">📊 ¿Qué son los Planes Nutricionales?</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Los planes nutricionales son programas estructurados de varias semanas que puedes vender o compartir con la comunidad. Incluyen objetivos calóricos, número de comidas y nivel de dificultad. Los usuarios pueden suscribirse a tus planes desde tu perfil público.
              </p>
            </div>
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
                  <div className="text-center py-12 text-muted-foreground/70">
                    <div className="text-5xl mb-3">📊</div>
                    <p className="font-semibold">Aún no has creado ningún plan</p>
                    <p className="text-sm mt-1">Crea planes nutricionales para compartir con la comunidad</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myPlans.map((plan) => (
                      <div key={plan.id} className="bg-background rounded-2xl p-4 shadow-sm border border-border/50">
                        <div className="flex items-start gap-3">
                          {plan.coverUrl && (
                            <img src={plan.coverUrl} alt={plan.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm line-clamp-1">{plan.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
                                {CATEGORIES.find((c) => c.value === plan.category)?.label ?? plan.category}
                              </span>
                              <span className="text-xs text-muted-foreground/70">{plan.durationWeeks} semanas</span>
                              {plan.dailyCalories && <span className="text-xs text-muted-foreground/70">{plan.dailyCalories} kcal</span>}
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${
                                plan.price && plan.price > 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                              }`}>
                                {plan.price && plan.price > 0 ? `${plan.price}€` : "Gratis"}
                              </span>
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${plan.isPublic ? "bg-green-100 text-green-700" : "bg-muted/50 text-muted-foreground"}`}>
                                {plan.isPublic ? "Público" : "Privado"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground/70 mt-1">{plan.copiesCount} copias</p>
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
              <form onSubmit={handleSavePlan} className="bg-background rounded-3xl p-6 shadow-sm border border-border/50 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-foreground">
                    {editingPlan ? "Editar plan" : "Nuevo plan nutricional"}
                  </h2>
                  <button type="button" onClick={() => { setShowPlanForm(false); setEditingPlan(null); }} aria-label="Cerrar formulario" className="text-muted-foreground/70 hover:text-muted-foreground text-xl font-bold">×</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Título del plan *</label>
                    <input
                      required
                      value={planForm.title}
                      onChange={(e) => setPlanForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Plan de pérdida de peso en 4 semanas"
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Descripción</label>
                    <textarea
                      value={planForm.description}
                      onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe el objetivo y características del plan..."
                      rows={2}
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Categoría</label>
                      <select
                        value={planForm.category}
                        onChange={(e) => setPlanForm((p) => ({ ...p, category: e.target.value as Category }))}
                        className="w-full rounded-xl border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Nivel</label>
                      <select
                        value={planForm.level}
                        onChange={(e) => setPlanForm((p) => ({ ...p, level: e.target.value as any }))}
                        className="w-full rounded-xl border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="principiante">Principiante</option>
                        <option value="intermedio">Intermedio</option>
                        <option value="avanzado">Avanzado</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Semanas</label>
                      <input
                        value={planForm.durationWeeks}
                        onChange={(e) => setPlanForm((p) => ({ ...p, durationWeeks: e.target.value }))}
                        type="number" min="1" max="52"
                        className="w-full rounded-xl border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Kcal/día</label>
                      <input
                        value={planForm.dailyCalories}
                        onChange={(e) => setPlanForm((p) => ({ ...p, dailyCalories: e.target.value }))}
                        type="number" min="500" max="5000" placeholder="Ej: 1800"
                        className="w-full rounded-xl border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Precio (€)</label>
                      <input
                        value={planForm.price}
                        onChange={(e) => setPlanForm((p) => ({ ...p, price: e.target.value }))}
                        type="number" min="0" step="0.01" placeholder="0 = gratis"
                        className="w-full rounded-xl border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">URL imagen de portada</label>
                    <input
                      value={planForm.coverUrl}
                      onChange={(e) => setPlanForm((p) => ({ ...p, coverUrl: e.target.value }))}
                      placeholder="https://..."
                      type="url"
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                    <label htmlFor="planIsPublic" className="text-sm text-foreground/80">Visible públicamente en BuddyExperts</label>
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
            {/* Explicación contextual de menús */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-teal-800 mb-1">📋 ¿Qué son los Menús Semanales?</p>
              <p className="text-xs text-teal-700 leading-relaxed">
                Los menús semanales son plantillas de alimentación día a día que publicas en tu perfil. Son gratuitos para los usuarios y te ayudan a ganar visibilidad y seguidores. Puedes asignarlos directamente a tus pacientes desde su perfil.
              </p>
            </div>
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
                  <div className="text-center py-12 text-muted-foreground/70">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="font-semibold">Aún no has publicado ningún menú</p>
                    <p className="text-sm mt-1">Comparte menús semanales gratuitos para ganar seguidores</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myMenus.map((menu) => (
                      <div key={menu.id} className="bg-background rounded-2xl p-4 shadow-sm border border-border/50">
                        <div className="flex items-start gap-3">
                          {menu.coverUrl && (
                            <img src={menu.coverUrl} alt={menu.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm line-clamp-1">{menu.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{menu.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-semibold">
                                {CATEGORIES.find((c) => c.value === menu.category)?.label ?? menu.category}
                              </span>
                              {menu.dailyCalories && (
                                <span className="text-xs text-muted-foreground/70">{menu.dailyCalories} kcal/día</span>
                              )}
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${menu.isPublic ? "bg-green-100 text-green-700" : "bg-muted/50 text-muted-foreground"}`}>
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
              <form onSubmit={handleSaveMenu} className="bg-background rounded-3xl p-6 shadow-sm border border-border/50 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-foreground">
                    {editingMenu ? "Editar menú" : "Nuevo menú semanal"}
                  </h2>
                  <button type="button" onClick={() => { setShowMenuForm(false); setEditingMenu(null); }} aria-label="Cerrar formulario" className="text-muted-foreground/70 hover:text-muted-foreground text-xl font-bold">×</button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Título del menú *</label>
                    <input
                      required
                      value={menuForm.title}
                      onChange={(e) => setMenuForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ej: Menú semanal para pérdida de peso"
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Descripción</label>
                    <textarea
                      value={menuForm.description}
                      onChange={(e) => setMenuForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe el objetivo y características del menú..."
                      rows={2}
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Categoría</label>
                      <select
                        value={menuForm.category}
                        onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value as Category }))}
                        className="w-full rounded-xl border border-border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Calorías/día</label>
                      <input
                        value={menuForm.dailyCalories}
                        onChange={(e) => setMenuForm((p) => ({ ...p, dailyCalories: e.target.value }))}
                        placeholder="Ej: 1800"
                        type="number"
                        min="500"
                        max="5000"
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">URL imagen de portada</label>
                    <input
                      value={menuForm.coverUrl}
                      onChange={(e) => setMenuForm((p) => ({ ...p, coverUrl: e.target.value }))}
                      placeholder="https://..."
                      type="url"
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                    <label htmlFor="isPublic" className="text-sm font-semibold text-foreground/80">Publicar como menú público (visible para todos)</label>
                  </div>
                </div>

                {/* Days & Meals */}
                <div>
                  <h3 className="text-sm font-black text-foreground mb-3">Contenido del menú</h3>
                  <div className="space-y-4">
                    {menuForm.days.map((dayData, dayIdx) => (
                      <div key={dayData.day} className="border border-border/50 rounded-2xl overflow-hidden">
                        <div className="bg-orange-50 px-4 py-2">
                          <span className="text-sm font-black text-orange-700">{dayData.day}</span>
                        </div>
                        <div className="p-3 space-y-2">
                          {dayData.meals.map((meal, mealIdx) => (
                            <div key={meal.name} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground w-24 shrink-0">{meal.name}</span>
                              <input
                                value={meal.food}
                                onChange={(e) => updateMealFood(dayIdx, mealIdx, e.target.value)}
                                placeholder="Ej: Avena con frutas y miel"
                                className="flex-1 rounded-xl border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-muted-foreground bg-muted/50"
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

                <p className="text-xs text-muted-foreground/70 text-center">
                  * Nota: Este contenido no constituye recomendación profesional. Consulta a un profesional de la salud.
                </p>
              </form>
            )}
          </div>
        )}
        {/* PDF Plans Tab */}
        {activeTab === "pdf-plans" && (
          <PdfPlansTab expertProfile={myProfile} />
        )}
        {/* Blog Tab */}
        {activeTab === "blog" && (
          <BlogTab expertProfile={myProfile} />
        )}
        {/* Services Tab */}
        {activeTab === "services" && (
          <ServicePlansTab />
        )}
      </div>
    </AppLayout>
  );
}

// ─── Service Plans Tab Component ────────────────────────────────────────────
function ServicePlansTab() {
  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.buddyExperts.getMyServicePlans.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", billingPeriod: "monthly", durationMonths: "", includes: "", maxConsultations: "", isPopular: false });

  const createMut = trpc.buddyExperts.createServicePlan.useMutation({
    onSuccess: () => { toast.success("Plan creado"); utils.buddyExperts.getMyServicePlans.invalidate(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message || "Error"),
  });
  const updateMut = trpc.buddyExperts.updateServicePlan.useMutation({
    onSuccess: () => { toast.success("Plan actualizado"); utils.buddyExperts.getMyServicePlans.invalidate(); setShowForm(false); setEditingPlan(null); resetForm(); },
    onError: (e) => toast.error(e.message || "Error"),
  });
  const deleteMut = trpc.buddyExperts.deleteServicePlan.useMutation({
    onSuccess: () => { toast.success("Plan eliminado"); utils.buddyExperts.getMyServicePlans.invalidate(); },
    onError: (e) => toast.error(e.message || "Error"),
  });

  const resetForm = () => setForm({ name: "", description: "", price: "", billingPeriod: "monthly", durationMonths: "", includes: "", maxConsultations: "", isPopular: false });

  const openEdit = (plan: any) => {
    let includesList: string[] = [];
    try { includesList = plan.includes ? JSON.parse(plan.includes) : []; } catch { includesList = []; }
    setForm({
      name: plan.name || "",
      description: plan.description || "",
      price: String(plan.price ?? ""),
      billingPeriod: plan.billingPeriod || "monthly",
      durationMonths: String(plan.durationMonths ?? ""),
      includes: includesList.join("\n"),
      maxConsultations: String(plan.maxConsultations ?? ""),
      isPopular: plan.isPopular ?? false,
    });
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const includesArr = form.includes.split("\n").map(s => s.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price) || 0,
      billingPeriod: form.billingPeriod as any,
      durationMonths: form.durationMonths ? parseInt(form.durationMonths) : undefined,
      includes: includesArr.length > 0 ? JSON.stringify(includesArr) : undefined,
      maxConsultations: form.maxConsultations ? parseInt(form.maxConsultations) : undefined,
      isPopular: form.isPopular,
    };
    if (editingPlan) updateMut.mutate({ id: editingPlan.id, ...payload });
    else createMut.mutate(payload);
  };

  const periodLabel: Record<string, string> = { monthly: "mes", quarterly: "trimestre", annual: "año", one_time: "pago único" };

  return (
    <div>
      <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
        <p className="text-sm text-blue-800 font-medium">💡 Planes de contratación</p>
        <p className="text-xs text-blue-600 mt-1">Define los servicios que ofreces a tus pacientes. Aparecerán en tu perfil público para que puedan solicitarte directamente.</p>
      </div>
      <button onClick={() => { resetForm(); setEditingPlan(null); setShowForm(true); }} className="w-full py-3 rounded-2xl border-2 border-dashed border-orange-300 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors mb-4">
        + Crear nuevo plan de servicio
      </button>
      {isLoading && <div className="h-24 bg-muted/50 rounded-2xl animate-pulse" />}
      {!isLoading && (!plans || plans.length === 0) && (
        <div className="text-center py-10 text-muted-foreground/70">
          <div className="text-4xl mb-2">💰</div>
          <p className="text-sm">Aún no tienes planes de servicio</p>
        </div>
      )}
      <div className="space-y-3">
        {(plans ?? []).map((plan: any) => {
          let includes: string[] = [];
          try { includes = plan.includes ? JSON.parse(plan.includes) : []; } catch { includes = []; }
          return (
            <div key={plan.id} className={`bg-background rounded-2xl border-2 p-4 shadow-sm ${plan.isPopular ? "border-orange-300" : "border-border/50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-sm">{plan.name}</h4>
                    {plan.isPopular && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">⭐ Popular</span>}
                    {!plan.isActive && <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">Inactivo</span>}
                  </div>
                  <p className="text-lg font-black text-orange-500 mt-0.5">{plan.price === 0 ? "Gratis" : `${plan.price}€`}<span className="text-xs font-normal text-muted-foreground/70">/{periodLabel[plan.billingPeriod] ?? plan.billingPeriod}</span></p>
                  {plan.description && <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>}
                  {includes.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {includes.slice(0, 3).map((item: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-1"><span className="text-green-500">✓</span>{item}</li>
                      ))}
                      {includes.length > 3 && <li className="text-xs text-muted-foreground/70">+{includes.length - 3} más...</li>}
                    </ul>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => openEdit(plan)} className="text-xs bg-muted/50 text-foreground/80 px-3 py-1.5 rounded-lg hover:bg-muted">✏️ Editar</button>
                  <button onClick={() => { if (confirm("¿Eliminar este plan?")) deleteMut.mutate({ id: plan.id }); }} className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100">🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-lg">{editingPlan ? "Editar plan" : "Nuevo plan de servicio"}</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground">×</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Nombre del plan *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ej: Plan Seguimiento Mensual" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Descripción</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe qué incluye este plan..." className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground/80 mb-1">Precio (€) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} placeholder="89" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/80 mb-1">Facturación</label>
                    <select value={form.billingPeriod} onChange={e => setForm(f => ({...f, billingPeriod: e.target.value}))} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                      <option value="monthly">Mensual</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="annual">Anual</option>
                      <option value="one_time">Pago único</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground/80 mb-1">Duración (meses)</label>
                    <input type="number" value={form.durationMonths} onChange={e => setForm(f => ({...f, durationMonths: e.target.value}))} placeholder="3" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground/80 mb-1">Consultas incluidas</label>
                    <input type="number" value={form.maxConsultations} onChange={e => setForm(f => ({...f, maxConsultations: e.target.value}))} placeholder="2" className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground/80 mb-1">Qué incluye (una línea por item)</label>
                  <textarea value={form.includes} onChange={e => setForm(f => ({...f, includes: e.target.value}))} placeholder="Menú semanal personalizado&#10;2 consultas/mes&#10;Chat con la nutricionista" className="w-full border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300" rows={4} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPopular} onChange={e => setForm(f => ({...f, isPopular: e.target.checked}))} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-foreground/80">Marcar como plan popular (⭐)</span>
                </label>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.price || createMut.isPending || updateMut.isPending}
                className="mt-4 w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 disabled:opacity-50"
              >
                {createMut.isPending || updateMut.isPending ? "Guardando..." : editingPlan ? "Guardar cambios" : "Crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
      <form onSubmit={handleSubmit} className="bg-background rounded-3xl p-6 shadow-sm border border-border/50 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-black text-foreground">{editingPost ? "Editar artículo" : "Nuevo artículo"}</h2>
          <button type="button" onClick={() => { setShowForm(false); setEditingPost(null); resetForm(); }} className="text-muted-foreground/70 hover:text-muted-foreground text-sm">✕ Cancelar</button>
        </div>

        {/* Cover image */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Imagen de portada</label>
          {form.coverImageUrl ? (
            <div className="relative">
              <img src={form.coverImageUrl} alt="Portada" className="w-full h-40 object-cover rounded-2xl" />
              <button type="button" onClick={() => setForm((f) => ({ ...f, coverImageUrl: "" }))} aria-label="Eliminar imagen" className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black/70">✕</button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-32 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground/70 hover:border-orange-300 hover:text-orange-400 transition-colors">
              {uploadCoverMutation.isPending ? <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : <>🖼️<span className="text-xs">Subir imagen de portada</span></>}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Título *</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required minLength={5} maxLength={256} placeholder="Escribe un título atractivo..." className="w-full px-4 py-3 rounded-2xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Resumen (opcional)</label>
          <textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} maxLength={500} rows={2} placeholder="Breve descripción del artículo (aparece en la lista del blog)..." className="w-full px-4 py-3 rounded-2xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contenido *</label>
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} required minLength={10} rows={12} placeholder="Escribe aquí el contenido completo del artículo. Puedes usar Markdown: **negrita**, *cursiva*, ## Títulos, - listas..." className="w-full px-4 py-3 rounded-2xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-y font-mono" />
          <p className="text-xs text-muted-foreground/70 mt-1">Soporta formato Markdown básico</p>
        </div>

        {/* Category + Read time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Categoría</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-2xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-background">
              {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tiempo de lectura (min)</label>
            <input type="number" min={1} max={60} value={form.readTimeMinutes} onChange={(e) => setForm((f) => ({ ...f, readTimeMinutes: parseInt(e.target.value) || 5 }))} className="w-full px-3 py-2.5 rounded-2xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Etiquetas (separadas por coma)</label>
          <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="nutrición, proteinas, dieta..." className="w-full px-4 py-3 rounded-2xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
            {(createMutation.isPending || updateMutation.isPending) ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</> : editingPost ? "✓ Guardar cambios" : "💾 Guardar borrador"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground/70 text-center">* Este contenido no constituye recomendación profesional. Consulta a un profesional de la salud.</p>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-foreground">✍️ Mis artículos</h2>
        <button onClick={() => { resetForm(); setEditingPost(null); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
          + Nuevo artículo
        </button>
      </div>

      {!myPosts || myPosts.length === 0 ? (
        <div className="bg-muted/30 rounded-3xl p-8 text-center space-y-3">
          <div className="text-4xl">📝</div>
          <p className="text-sm font-semibold text-foreground/80">Aún no has escrito ningún artículo</p>
          <p className="text-xs text-muted-foreground/70">Comparte tu conocimiento con la comunidad BuddyMarket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myPosts.map((post) => (
            <div key={post.id} className="bg-background rounded-2xl p-4 shadow-sm border border-border/50">
              <div className="flex gap-3">
                {post.coverImageUrl && (
                  <img src={post.coverImageUrl} alt={post.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2">{post.title}</h3>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${
                      post.status === "published" ? "bg-green-100 text-green-700" :
                      post.status === "archived" ? "bg-muted/50 text-muted-foreground" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {post.status === "published" ? "✅ Publicado" : post.status === "archived" ? "Archivado" : "📝 Borrador"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{post.category} · {post.readTimeMinutes} min lectura</p>
                  {post.publishedAt && (
                    <p className="text-xs text-muted-foreground/70">{new Date(post.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(post)} className="flex-1 py-1.5 rounded-xl text-xs font-semibold bg-muted/50 text-foreground/80 hover:bg-muted transition-colors">✏️ Editar</button>
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
// ─── PDF Plans Tab Component ─────────────────────────────────────────────────
function PdfPlansTab({ expertProfile }: { expertProfile: any }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", notes: "", weekNumber: "", year: new Date().getFullYear().toString() });
  const [uploadingPdf, setUploadingPdf] = useState<number | null>(null);
  const [dragOverPlan, setDragOverPlan] = useState<number | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<number | null>(null);
  const [assigningPlan, setAssigningPlan] = useState<number | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientSearchEnabled, setClientSearchEnabled] = useState(false);
  const [generatingMenu, setGeneratingMenu] = useState<number | null>(null);
  const [menuPrefs, setMenuPrefs] = useState({ allergies: "", restrictions: "", dislikedFoods: "", cookingTime: "", persons: "1", notes: "" });
  const [showPrefsFor, setShowPrefsFor] = useState<number | null>(null);

  const { data: myPlans, refetch } = trpc.expertPlans.myPlans.useQuery(
    { status: "all" },
    { enabled: !!expertProfile }
  );

  const { data: foundClient } = trpc.expertPlans.searchClientByEmail.useQuery(
    { email: clientEmail },
    { enabled: clientSearchEnabled && clientEmail.includes("@") && clientEmail.includes(".") }
  );

  const createMutation = trpc.expertPlans.create.useMutation({
    onSuccess: () => { toast.success("Plan creado"); setShowForm(false); resetForm(); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadPdfMutation = trpc.expertPlans.uploadPdf.useMutation({
    onSuccess: () => { toast.success("PDF subido correctamente ✓"); setUploadingPdf(null); refetch(); },
    onError: (e) => { toast.error(e.message); setUploadingPdf(null); },
  });
  const assignMutation = trpc.expertPlans.assignToClient.useMutation({
    onSuccess: () => { toast.success("Plan asignado al cliente ✓"); setAssigningPlan(null); setClientEmail(""); setClientSearchEnabled(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMutation = trpc.expertPlans.updateStatus.useMutation({
    onSuccess: (updated) => { toast.success(`Estado actualizado a "${updated.status}"`); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const generateMenuMutation = trpc.expertPlans.generateAiMenu.useMutation({
    onSuccess: () => { toast.success("Menú generado con IA ✨"); setGeneratingMenu(null); setShowPrefsFor(null); refetch(); },
    onError: (e) => { toast.error(e.message); setGeneratingMenu(null); },
  });
  const deleteMutation = trpc.expertPlans.delete.useMutation({
    onSuccess: () => { toast.success("Plan eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ title: "", description: "", notes: "", weekNumber: "", year: new Date().getFullYear().toString() });
  }
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      title: form.title,
      description: form.description || undefined,
      notes: form.notes || undefined,
      weekNumber: form.weekNumber ? parseInt(form.weekNumber) : undefined,
      year: form.year ? parseInt(form.year) : undefined,
    });
  }
  async function handlePdfUpload(planId: number, file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("El PDF no puede superar 16 MB");
      return;
    }
    setUploadingPdf(planId);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPdfMutation.mutate({ planId, base64, fileName: file.name });
    };
    reader.onerror = () => { toast.error("Error al leer el archivo"); setUploadingPdf(null); };
    reader.readAsDataURL(file);
  }
  function handleDrop(planId: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverPlan(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfUpload(planId, file);
  }
  function handleFileInput(planId: number) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,application/pdf";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) handlePdfUpload(planId, file);
    };
    input.click();
  }
  function handleGenerateMenu(planId: number) {
    setGeneratingMenu(planId);
    generateMenuMutation.mutate({
      planId,
      userPreferences: {
        allergies: menuPrefs.allergies || undefined,
        restrictions: menuPrefs.restrictions || undefined,
        dislikedFoods: menuPrefs.dislikedFoods || undefined,
        cookingTime: menuPrefs.cookingTime || undefined,
        persons: parseInt(menuPrefs.persons) || 1,
        notes: menuPrefs.notes || undefined,
      },
    });
  }

  if (!expertProfile) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-800 text-center">
        Primero debes crear tu perfil de experto en la pestaña "Mi Perfil".
      </div>
    );
  }

  const DAYS_ES: Record<string, string> = { lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves", viernes: "Viernes", sabado: "Sábado", domingo: "Domingo" };
  const MEALS_ES: Record<string, string> = { desayuno: "🌅 Desayuno", media_manana: "🍎 Media mañana", comida: "🍽️ Comida", merienda: "☕ Merienda", cena: "🌙 Cena" };
  const SHOPPING_ES: Record<string, string> = { frutas_verduras: "🥦 Frutas y verduras", proteinas: "🥩 Proteínas", lacteos: "🥛 Lácteos", cereales_pasta: "🌾 Cereales y pasta", legumbres: "🫘 Legumbres", otros: "🛒 Otros" };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4">
        <h3 className="font-black text-foreground text-sm mb-1">📄 Planes PDF personalizados</h3>
        <p className="text-xs text-muted-foreground">Sube planes nutricionales en PDF para tus clientes. La IA leerá el PDF y generará un menú semanal + lista de la compra adaptado a las preferencias de cada cliente.</p>
      </div>

      {/* Create button / form */}
      {!showForm ? (
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
        >
          + Crear nuevo plan PDF
        </button>
      ) : (
        <form onSubmit={handleCreate} className="bg-background rounded-2xl p-5 shadow-sm border border-border/50 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-black text-foreground text-sm">Nuevo plan PDF</h3>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} aria-label="Cerrar formulario" className="text-muted-foreground/70 hover:text-muted-foreground text-lg">✕</button>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Título del plan *</label>
            <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Ej: Plan Pérdida de Peso — Semana 1" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Breve descripción del plan..." className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Semana nº</label>
              <input type="number" min="1" max="52" value={form.weekNumber} onChange={(e) => setForm(p => ({ ...p, weekNumber: e.target.value }))} placeholder="Ej: 1" className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Año</label>
              <input type="number" min="2024" max="2030" value={form.year} onChange={(e) => setForm(p => ({ ...p, year: e.target.value }))} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Notas internas</label>
            <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Notas para el cliente, ajustes especiales..." className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
            {createMutation.isPending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</> : "✓ Crear plan"}
          </button>
        </form>
      )}

      {/* Plans list */}
      {(!myPlans || myPlans.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground/70">
          <div className="text-5xl mb-3">📄</div>
          <p className="font-semibold">Aún no tienes planes PDF</p>
          <p className="text-sm mt-1">Crea un plan y sube el PDF con el menú nutricional</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myPlans.map((plan: any) => {
            const isExpanded = expandedPlan === plan.id;
            const isAssigning = assigningPlan === plan.id;
            const isUploadingThis = uploadingPdf === plan.id;
            const isDragOver = dragOverPlan === plan.id;
            const isGeneratingThis = generatingMenu === plan.id;
            const showPrefsModal = showPrefsFor === plan.id;
            let parsedMenu: any = null;
            let parsedShopping: any = null;
            try { if (plan.aiGeneratedMenu) parsedMenu = JSON.parse(plan.aiGeneratedMenu); } catch {}
            try { if (plan.aiGeneratedShoppingList) parsedShopping = JSON.parse(plan.aiGeneratedShoppingList); } catch {}

            return (
              <div key={plan.id} className="bg-background rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                {/* Plan header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate">{plan.title}</h3>
                      {plan.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{plan.description}</p>}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {plan.weekNumber && <span className="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 font-semibold">Semana {plan.weekNumber}</span>}
                        <select
                          value={plan.status}
                          onChange={(e) => updateStatusMutation.mutate({ planId: plan.id, status: e.target.value as any })}
                          className={`text-xs rounded-full px-2 py-0.5 font-semibold border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 ${plan.status === "active" ? "bg-green-100 text-green-700" : plan.status === "archived" ? "bg-muted/50 text-muted-foreground" : "bg-yellow-100 text-yellow-700"}`}
                        >
                          <option value="draft">Borrador</option>
                          <option value="active">✓ Activo</option>
                          <option value="archived">Archivado</option>
                        </select>
                        {plan.pdfFileName && <span className="text-xs bg-orange-50 text-orange-600 rounded-full px-2 py-0.5 font-semibold">📎 PDF</span>}
                        {plan.aiGeneratedAt && <span className="text-xs bg-purple-50 text-purple-600 rounded-full px-2 py-0.5 font-semibold">✨ IA</span>}
                        {plan.clientUserId && <span className="text-xs bg-teal-50 text-teal-600 rounded-full px-2 py-0.5 font-semibold">👤 Asignado</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setExpandedPlan(isExpanded ? null : plan.id)} className="text-muted-foreground/70 hover:text-muted-foreground text-sm p-1" title={isExpanded ? "Colapsar" : "Expandir"}>
                        {isExpanded ? "▲" : "▼"}
                      </button>
                      <button onClick={() => { if (confirm("¿Eliminar este plan?")) deleteMutation.mutate({ id: plan.id }); }} className="text-red-400 hover:text-red-600 text-sm p-1" title="Eliminar">🗑️</button>
                    </div>
                  </div>

                  {/* PDF Upload Zone */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-3 transition-all ${isDragOver ? "border-orange-400 bg-orange-50" : "border-border hover:border-orange-300"} ${isUploadingThis ? "opacity-60" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverPlan(plan.id); }}
                    onDragLeave={() => setDragOverPlan(null)}
                    onDrop={(e) => handleDrop(plan.id, e)}
                  >
                    {isUploadingThis ? (
                      <div className="flex items-center justify-center gap-2 py-1">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-orange-600 font-semibold">Subiendo PDF...</span>
                      </div>
                    ) : plan.pdfUrl ? (
                      <div className="flex items-center justify-between gap-2">
                        <a href={plan.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1 min-w-0">
                          <span>📄</span>
                          <span className="truncate">{plan.pdfFileName ?? "Ver PDF"}</span>
                        </a>
                        <button onClick={() => handleFileInput(plan.id)} className="text-xs text-muted-foreground hover:text-orange-600 font-semibold shrink-0 whitespace-nowrap">
                          ↻ Reemplazar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleFileInput(plan.id)} className="w-full text-center">
                        <div className="text-2xl mb-1">📤</div>
                        <p className="text-xs font-bold text-orange-600">Subir PDF del plan nutricional</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Arrastra aquí o haz clic · Máx. 16 MB</p>
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    {plan.pdfUrl && (
                      <button
                        onClick={() => { setShowPrefsFor(showPrefsModal ? null : plan.id); setMenuPrefs({ allergies: "", restrictions: "", dislikedFoods: "", cookingTime: "", persons: "1", notes: "" }); }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        ✨ {parsedMenu ? "Regenerar menú IA" : "Generar menú con IA"}
                      </button>
                    )}
                    <button
                      onClick={() => { setAssigningPlan(isAssigning ? null : plan.id); setClientEmail(""); setClientSearchEnabled(false); }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                    >
                      👤 {plan.clientUserId ? "Reasignar cliente" : "Asignar a cliente"}
                    </button>
                  </div>

                  {/* AI Menu preferences panel */}
                  {showPrefsModal && (
                    <div className="mt-3 bg-purple-50 rounded-xl p-3 border border-purple-100 space-y-2">
                      <p className="text-xs font-bold text-purple-700 mb-2">Preferencias para generar el menú</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground font-semibold block mb-1">Alergias</label>
                          <input value={menuPrefs.allergies} onChange={(e) => setMenuPrefs(p => ({ ...p, allergies: e.target.value }))} placeholder="Ej: gluten, lactosa" className="w-full rounded-lg border border-purple-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-semibold block mb-1">Restricciones</label>
                          <input value={menuPrefs.restrictions} onChange={(e) => setMenuPrefs(p => ({ ...p, restrictions: e.target.value }))} placeholder="Ej: vegetariano" className="w-full rounded-lg border border-purple-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-semibold block mb-1">No le gusta</label>
                          <input value={menuPrefs.dislikedFoods} onChange={(e) => setMenuPrefs(p => ({ ...p, dislikedFoods: e.target.value }))} placeholder="Ej: brócoli, hígado" className="w-full rounded-lg border border-purple-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-semibold block mb-1">Personas</label>
                          <input type="number" min="1" max="10" value={menuPrefs.persons} onChange={(e) => setMenuPrefs(p => ({ ...p, persons: e.target.value }))} className="w-full rounded-lg border border-purple-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold block mb-1">Tiempo de cocina</label>
                        <select value={menuPrefs.cookingTime} onChange={(e) => setMenuPrefs(p => ({ ...p, cookingTime: e.target.value }))} className="w-full rounded-lg border border-purple-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400">
                          <option value="">Sin restricción</option>
                          <option value="rapido">Rápido (&lt;20 min)</option>
                          <option value="medio">Medio (20-45 min)</option>
                          <option value="elaborado">Elaborado (&gt;45 min)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold block mb-1">Notas adicionales</label>
                        <textarea value={menuPrefs.notes} onChange={(e) => setMenuPrefs(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Cualquier indicación adicional..." className="w-full rounded-lg border border-purple-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none" />
                      </div>
                      <button
                        onClick={() => handleGenerateMenu(plan.id)}
                        disabled={isGeneratingThis}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
                      >
                        {isGeneratingThis ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generando menú...</> : "✨ Generar menú semanal con IA"}
                      </button>
                    </div>
                  )}

                  {/* Assign to client panel */}
                  {isAssigning && (
                    <div className="mt-3 bg-teal-50 rounded-xl p-3 border border-teal-100 space-y-2">
                      <p className="text-xs font-bold text-teal-700 mb-2">Asignar plan a un cliente</p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => { setClientEmail(e.target.value); setClientSearchEnabled(false); }}
                          placeholder="Email del cliente..."
                          className="flex-1 rounded-lg border border-teal-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button
                          onClick={() => setClientSearchEnabled(true)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
                        >
                          Buscar
                        </button>
                      </div>
                      {clientSearchEnabled && foundClient === null && (
                        <p className="text-xs text-red-500">No se encontró ningún usuario con ese email.</p>
                      )}
                      {clientSearchEnabled && foundClient && (
                        <div className="flex items-center justify-between bg-background rounded-lg p-2 border border-teal-200">
                          <div className="flex items-center gap-2">
                            {foundClient.avatarUrl ? (
                              <img src={foundClient.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                                {(foundClient.name ?? foundClient.email ?? "?")[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-bold text-foreground">{foundClient.name ?? "Sin nombre"}</p>
                              <p className="text-xs text-muted-foreground">{foundClient.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => assignMutation.mutate({ planId: plan.id, clientUserId: foundClient.id })}
                            disabled={assignMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                          >
                            {assignMutation.isPending ? "..." : "Asignar"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded: AI Generated Menu */}
                {isExpanded && parsedMenu && (
                  <div className="border-t border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-foreground text-sm">✨ Menú semanal generado por IA</h4>
                      {plan.aiGeneratedAt && (
                        <span className="text-xs text-muted-foreground/70">
                          {new Date(plan.aiGeneratedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {Object.entries(DAYS_ES).map(([dayKey, dayLabel]) => {
                        const dayMenu = parsedMenu[dayKey];
                        if (!dayMenu) return null;
                        return (
                          <div key={dayKey} className="bg-background rounded-xl p-3 border border-border/50">
                            <h5 className="font-bold text-orange-600 text-xs uppercase tracking-wide mb-2">{dayLabel}</h5>
                            <div className="space-y-1">
                              {Object.entries(MEALS_ES).map(([mealKey, mealLabel]) => {
                                const meal = dayMenu[mealKey];
                                if (!meal) return null;
                                return (
                                  <div key={mealKey} className="flex gap-2 text-xs">
                                    <span className="text-muted-foreground w-28 shrink-0">{mealLabel}</span>
                                    <span className="text-foreground/80">{meal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {parsedShopping && (
                      <div className="mt-4">
                        <h4 className="font-bold text-foreground text-sm mb-3">🛒 Lista de la compra</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {Object.entries(SHOPPING_ES).map(([catKey, catLabel]) => {
                            const items: string[] = parsedShopping[catKey];
                            if (!items || items.length === 0) return null;
                            return (
                              <div key={catKey} className="bg-background rounded-xl p-3 border border-border/50">
                                <h5 className="font-bold text-foreground/80 text-xs mb-2">{catLabel}</h5>
                                <ul className="space-y-0.5">
                                  {items.map((item, i) => (
                                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {isExpanded && !parsedMenu && (
                  <div className="border-t border-border/50 bg-muted/30 p-4 text-center text-xs text-muted-foreground/70">
                    {plan.pdfUrl ? "Genera el menú con IA usando el botón de arriba." : "Sube el PDF primero para poder generar el menú con IA."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
