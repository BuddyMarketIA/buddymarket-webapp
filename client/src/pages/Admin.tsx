import { hasRole } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useMemo } from "react"
import { useTranslation } from 'react-i18next';;
import { toast } from "@/components/sonner-a11y-shim";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  ShieldCheckIcon,
  UsersIcon,
  BookOpenIcon,
  TagIcon,
  ExclamationCircleIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  SignalIcon,
  ArrowPathIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  StarIcon,
  GiftIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { RECIPE_PLACEHOLDER_IMAGE as RECIPE_PLACEHOLDER } from "@/lib/constants";
import UsageAnalyticsPanel from "@/components/UsageAnalyticsPanel";
import LLMLatencyChart from "@/components/LLMLatencyChart";
import AdminLicenciasPanel from "@/components/AdminLicenciasPanel";
import AdminVetClinicsPanel from "@/components/AdminVetClinicsPanel";

const TABS = [
  { key: "overview", label: "Resumen", icon: ShieldCheckIcon },
  { key: "analytics", label: "Analíticas", icon: ChartBarIcon },
  { key: "monitor", label: "Monitor APIs", icon: SignalIcon },
  { key: "recipes", label: "Recetas", icon: BookOpenIcon },
  { key: "applications", label: "Solicitudes", icon: UsersIcon },
  { key: "allergies", label: "Alergias", icon: ExclamationCircleIcon },
  { key: "diets", label: "Dietas", icon: TagIcon },
  { key: "categories", label: "Categorías", icon: BookOpenIcon },
  { key: "users", label: "Usuarios", icon: UsersIcon },
  { key: "duplicates", label: "Duplicados", icon: UsersIcon },
  { key: "terms", label: "TyC", icon: DocumentTextIcon },
  { key: "founders", label: "Fundadores", icon: StarIcon },
  { key: "badges", label: "Insignias", icon: TrophyIcon },
  { key: "empresas", label: "Empresas B2B", icon: BuildingOfficeIcon },
  { key: "licencias", label: "Licencias B2B", icon: CurrencyEuroIcon },
  { key: "soporte", label: "Soporte", icon: ChatBubbleLeftRightIcon },
  { key: "clinicas", label: "Clínicas Vet.", icon: HeartIcon },
];

function CatalogSection({
  title,
  items,
  onAdd,
  onDelete,
  isAdding,
}: {
  title: string;
  items: { id: number; nameEs: string; nameEn?: string | null }[] | undefined;
  onAdd: (nameEs: string, nameEn?: string) => void;
  onDelete: (id: number) => void;
  isAdding: boolean;
}) {
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");

  return (
    <div className="vively-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground/80">{title}</h3>
        <span className="rounded-full bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {items?.length ?? 0}
        </span>
      </div>

      {/* Add form */}
      <div className="flex gap-2">
        <input
          value={nameEs}
          onChange={(e) => setNameEs(e.target.value)}
          placeholder="Nombre en español"
          className="vively-input flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && nameEs.trim()) {
              onAdd(nameEs.trim(), nameEn.trim() || undefined);
              setNameEs("");
              setNameEn("");
            }
          }}
        />
        <input
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="English name"
          className="vively-input flex-1"
        />
        <button
          onClick={() => {
            if (!nameEs.trim()) return;
            onAdd(nameEs.trim(), nameEn.trim() || undefined);
            setNameEs("");
            setNameEn("");
          }}
          disabled={isAdding || !nameEs.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Items list */}
      <div className="max-h-48 overflow-y-auto space-y-2">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.nameEs}</p>
                {item.nameEn && <p className="text-xs text-muted-foreground/70">{item.nameEn}</p>}
              </div>
              <button
                onClick={() => onDelete(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        ) : (
          <p className="py-3 text-center text-xs text-muted-foreground/70">Sin elementos. Añade el primero.</p>
        )}
      </div>
    </div>
  );
}

// ── Recipe row with inline image upload and edit ──────────────────────────────
function RecipeRow({ recipe, onUpdated }: { recipe: any; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(recipe.name ?? "");
  const [editDesc, setEditDesc] = useState(recipe.description ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = trpc.admin.uploadRecipeImage.useMutation({
    onSuccess: () => { toast.success("Foto actualizada"); onUpdated(); },
    onError: (err) => toast.error(err.message),
  });

  const updateRecipe = trpc.admin.updateRecipe.useMutation({
    onSuccess: () => { toast.success("Receta actualizada"); setEditing(false); onUpdated(); },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("La imagen no puede superar 8 MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadImage.mutate({ recipeId: recipe.id, imageBase64: base64, mimeType: file.type });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("Error al leer el archivo");
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-background p-3 shadow-sm">
      <div className="flex gap-3">
        {/* Image */}
        <div className="relative shrink-0">
          <img
            src={recipe.imageUrl || RECIPE_PLACEHOLDER}
            alt={recipe.name}
            className="h-16 w-16 rounded-xl object-cover"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Cambiar foto"
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#F97316] text-white shadow hover:bg-orange-600 disabled:opacity-50"
          >
            {uploading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-b border-white" />
            ) : (
              <PhotoIcon className="h-3 w-3" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Info / edit */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="vively-input w-full text-sm py-1"
                placeholder="Nombre de la receta"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="vively-input w-full text-xs py-1 resize-none"
                rows={2}
                placeholder="Descripción"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateRecipe.mutate({ id: recipe.id, name: editName, description: editDesc })}
                  disabled={updateRecipe.isPending}
                  className="flex items-center gap-2 rounded-lg bg-green-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <CheckIcon className="h-3 w-3" /> Guardar
                </button>
                <button
                  onClick={() => { setEditing(false); setEditName(recipe.name ?? ""); setEditDesc(recipe.description ?? ""); }}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  <XMarkIcon className="h-3 w-3" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{recipe.name}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground/70">{recipe.description || "Sin descripción"}</p>
                <p className="mt-0.5 text-xs text-gray-300">ID #{recipe.id} · {recipe.userName ?? "—"}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-muted/50"
                title=t("common.edit")
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();

  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: allergies } = trpc.catalogs.allergies.useQuery();
  const { data: dietRestrictions } = trpc.catalogs.dietRestrictions.useQuery();
  const { data: foodCategories } = trpc.catalogs.foodCategories.useQuery();
  const [appFilter, setAppFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [roleReqFilter, setRoleReqFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [roleReqNote, setRoleReqNote] = useState<Record<number, string>>({});
  // Users tab state
  const [userSearch, setUserSearch] = useState("");
  const [userSearchDebounced, setUserSearchDebounced] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState<"all" | "free" | "pro" | "pro_max">("all");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "buddyexpert" | "user">("all");
  const [userOffset, setUserOffset] = useState(0);
  const USER_PAGE_SIZE = 30;
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setUserSearchDebounced(userSearch); setUserOffset(0); }, 350);
    return () => clearTimeout(t);
  }, [userSearch]);
  const { data: usersRaw } = trpc.admin.users.useQuery(
    { limit: USER_PAGE_SIZE, offset: userOffset, search: userSearchDebounced || undefined },
    { enabled: activeTab === "users" }
  );
  // Client-side plan/role filter on top of server search
  const users = useMemo(() => {
    if (!usersRaw) return [];
    return usersRaw.filter((u: any) => {
      const plan = u.subscription?.status === "active" ? (u.subscription?.plan === "pro_max" ? "pro_max" : "pro") : "free";
      if (userPlanFilter !== "all" && plan !== userPlanFilter) return false;
      const role = u.role ?? "user";
      if (userRoleFilter !== "all" && role !== userRoleFilter) return false;
      return true;
    });
  }, [usersRaw, userPlanFilter, userRoleFilter]);
  const { data: applications, isLoading: appsLoading } = trpc.buddyApplications.listPending.useQuery(
    { status: appFilter },
    { enabled: activeTab === "applications" }
  );
  const { data: roleRequests, isLoading: roleReqLoading } = trpc.roleRequests.adminList.useQuery(
    { status: roleReqFilter },
    { enabled: activeTab === "applications" }
  );

  // Recipes tab state
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeOffset, setRecipeOffset] = useState(0);
  const RECIPE_LIMIT = 30;
  const { data: recipesData, refetch: refetchRecipes } = trpc.admin.recipes.useQuery(
    { limit: RECIPE_LIMIT, offset: recipeOffset, search: recipeSearch || undefined },
    { enabled: activeTab === "recipes" }
  );

  const utils = trpc.useUtils();

  const addAllergy = trpc.admin.createAllergy.useMutation({
    onSuccess: () => { utils.catalogs.allergies.invalidate(); toast.success("Alergia añadida"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteAllergy = trpc.admin.deleteAllergy.useMutation({
    onSuccess: () => { utils.catalogs.allergies.invalidate(); toast.success("Eliminada"); },
  });

  const addDiet = trpc.admin.createDietRestriction.useMutation({
    onSuccess: () => { utils.catalogs.dietRestrictions.invalidate(); toast.success("Restricción añadida"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteDiet = trpc.admin.deleteDietRestriction.useMutation({
    onSuccess: () => { utils.catalogs.dietRestrictions.invalidate(); toast.success("Eliminada"); },
  });

  const addCategory = trpc.admin.createFoodCategory.useMutation({
    onSuccess: () => { utils.catalogs.foodCategories.invalidate(); toast.success("Categoría añadida"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteCategory = trpc.admin.deleteFoodCategory.useMutation({
    onSuccess: () => { utils.catalogs.foodCategories.invalidate(); toast.success("Eliminada"); },
  });

  const approveRoleReq = trpc.roleRequests.approve.useMutation({
    onSuccess: () => { utils.roleRequests.adminList.invalidate(); toast.success("✅ Solicitud de rol aprobada"); },
    onError: (err: any) => toast.error(err.message),
  });
  const rejectRoleReq = trpc.roleRequests.reject.useMutation({
    onSuccess: () => { utils.roleRequests.adminList.invalidate(); toast.success("❌ Solicitud de rol rechazada"); },
    onError: (err: any) => toast.error(err.message),
  });

  const reviewApplication = trpc.buddyApplications.review.useMutation({
    onSuccess: (_data, vars) => {
      utils.buddyApplications.listPending.invalidate();
      toast.success((vars as any).action === "approve" ? "✅ Solicitud aprobada" : "❌ Solicitud rechazada");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Duplicate accounts state
  const [dupEmail, setDupEmail] = useState("");
  const [dupSearchEmail, setDupSearchEmail] = useState("");
  const { data: dupAccounts, isLoading: dupLoading } = trpc.admin.findDuplicateAccounts.useQuery(
    { email: dupSearchEmail },
    { enabled: activeTab === "duplicates" && dupSearchEmail.length > 3 }
  );
  const mergeAccounts = trpc.admin.mergeAccounts.useMutation({
    onSuccess: (data) => { utils.admin.findDuplicateAccounts.invalidate(); toast.success(`✅ ${data.deleted} cuenta(s) eliminada(s)`); },
    onError: (err) => toast.error(err.message),
  });
  const promoteToAdminProMax = trpc.admin.promoteToAdminProMax.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("✅ Cuenta promovida a Admin + Pro Max"); },
    onError: (err) => toast.error(err.message),
  });

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("Rol actualizado"); },
    onError: (err) => toast.error(err.message),
  });
  const setUserPlan = trpc.admin.setUserPlan.useMutation({
    onSuccess: (_data, vars) => {
      utils.admin.users.invalidate();
      const labels: Record<string, string> = { free: "Free", basic: "Pro", premium: "Pro", pro_max: "Pro Max" };
      toast.success(`Plan cambiado a ${labels[vars.plan] ?? vars.plan}`);
    },
    onError: (err) => toast.error(err.message),
  });
  const setUserAccountType = trpc.admin.setUserAccountType.useMutation({
    onSuccess: (_data, vars) => {
      utils.admin.users.invalidate();
      const labels: Record<string, string> = { user: "Usuario", buddymaker: "BuddyMaker", buddyexpert: "BuddyExpert", business: "Empresa" };
      toast.success(`Tipo de cuenta: ${labels[vars.accountType] ?? vars.accountType}`);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: (data) => {
      utils.admin.users.invalidate();
      toast.success(data.method === "hard_delete" ? "Usuario eliminado permanentemente" : "Usuario desactivado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });
  const addSecondaryRoleMut = trpc.admin.addSecondaryRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("Rol secundario añadido"); },
    onError: (err) => toast.error(err.message),
  });
  const removeSecondaryRoleMut = trpc.admin.removeSecondaryRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); toast.success("Rol secundario eliminado"); },
    onError: (err) => toast.error(err.message),
  });

  if (!hasRole(user, "admin")) {
    return (
      <div className="vively-page container text-center">
        <ShieldCheckIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-bold text-foreground/80">Acceso restringido</h2>
        <p className="mt-1 text-sm text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>
        <Link href="/app/dashboard" className="btn-vively mt-4 inline-block">
          Ir al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900">
          <ShieldCheckIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Panel Admin</h1>
          <p className="text-xs text-muted-foreground/70">Gestión de Buddy One</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Usuarios totales", value: (stats as any)?.totalUsers ?? 0, icon: "👥" },
              { label: "Recetas", value: (stats as any)?.totalRecipes ?? 0, icon: "🍽️" },
              { label: "Alergias", value: (stats as any)?.totalAllergies ?? 0, icon: "⚠️" },
              { label: "Categorías", value: (stats as any)?.totalCategories ?? 0, icon: "🏷️" },
            ].map((stat) => (
              <div key={stat.label} className="vively-card text-center">
                <p className="text-2xl">{stat.icon}</p>
                <p className="text-xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="vively-card">
            <h3 className="mb-2 text-sm font-bold text-foreground/80">Accesos rápidos</h3>
            <div className="space-y-2">
              <Link
                href="/app/admin/content"
                className="flex w-full items-center justify-between rounded-xl bg-orange-50 border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                <span>➕ Añadir recetas y menús (sin redespliegue)</span>
                <span className="text-orange-400">→</span>
              </Link>
              <Link
                href="/app/admin/logs"
                className="flex w-full items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <span>🔴 Registros de errores del servidor</span>
                <span className="text-red-400">→</span>
              </Link>
              <Link
                href="/app/admin/feedback"
                className="flex w-full items-center justify-between rounded-xl bg-purple-50 border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-100"
              >
                <span>💬 Feedback de usuarios</span>
                <span className="text-purple-400">→</span>
              </Link>
              {[
                { label: "Gestionar recetas y fotos", tab: "recipes" },
                { label: "Gestionar alergias", tab: "allergies" },
                { label: "Gestionar dietas", tab: "diets" },
                { label: "Gestionar categorías", tab: "categories" },
                { label: "Gestionar usuarios", tab: "users" },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className="flex w-full items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted/50"
                >
                  {item.label}
                  <span className="text-muted-foreground/70">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {activeTab === "analytics" && (
        <UsageAnalyticsPanel />
      )}

      {/* API Monitor */}
      {activeTab === "monitor" && (
        <ApiMonitorPanel />
      )}
      {/* Recipes */}
      {activeTab === "recipes" && (
        <div className="space-y-3">
          <div className="vively-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground/80">
                Recetas
                <span className="ml-2 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {recipesData?.total ?? "…"}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground/70">Toca 📷 para añadir foto · ✏️ para editar</p>
            </div>
            {/* Search */}
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <input
                value={recipeSearch}
                onChange={(e) => { setRecipeSearch(e.target.value); setRecipeOffset(0); }}
                placeholder="Buscar receta por nombre…"
                className="vively-input w-full pl-9 text-sm"
              />
            </div>
            {/* List */}
            <div className="space-y-2 max-h-[65vh] overflow-y-auto">
              {!recipesData ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                </div>
              ) : recipesData.recipes.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground/70">No se encontraron recetas</p>
              ) : (
                recipesData.recipes.map((r: any) => (
                  <RecipeRow key={r.id} recipe={r} onUpdated={() => refetchRecipes()} />
                ))
              )}
            </div>
            {/* Pagination */}
            {recipesData && recipesData.total > RECIPE_LIMIT && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setRecipeOffset(Math.max(0, recipeOffset - RECIPE_LIMIT))}
                  disabled={recipeOffset === 0}
                  className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-muted-foreground/70">
                  {recipeOffset + 1}–{Math.min(recipeOffset + RECIPE_LIMIT, recipesData.total)} de {recipesData.total}
                </span>
                <button
                  onClick={() => setRecipeOffset(recipeOffset + RECIPE_LIMIT)}
                  disabled={recipeOffset + RECIPE_LIMIT >= recipesData.total}
                  className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allergies */}
      {activeTab === "allergies" && (
        <CatalogSection
          title="Alergias"
          items={allergies}
          onAdd={(nameEs, nameEn) => addAllergy.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
          onDelete={(id) => deleteAllergy.mutate({ id })}
          isAdding={addAllergy.isPending}
        />
      )}

      {/* Diets */}
      {activeTab === "diets" && (
        <CatalogSection
          title="Restricciones dietéticas"
          items={dietRestrictions}
          onAdd={(nameEs, nameEn) => addDiet.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
          onDelete={(id) => deleteDiet.mutate({ id })}
          isAdding={addDiet.isPending}
        />
      )}

      {/* Categories */}
      {activeTab === "categories" && (
        <CatalogSection
          title="Categorías de comida"
          items={foodCategories}
          onAdd={(nameEs, nameEn) => addCategory.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
          onDelete={(id) => deleteCategory.mutate({ id })}
          isAdding={addCategory.isPending}
        />
      )}

      {/* Applications */}
      {activeTab === "applications" && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setAppFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  appFilter === s ? "bg-gray-900 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "pending" ? "⏳ Pendientes" : s === "approved" ? "✅ Aprobadas" : "❌ Rechazadas"}
              </button>
            ))}
          </div>

          {appsLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" /></div>
          ) : !applications?.length ? (
            <div className="vively-card text-center py-8 text-muted-foreground/70">
              <p className="text-2xl mb-2">📥</p>
              <p className="text-sm">No hay solicitudes {appFilter === "pending" ? "pendientes" : appFilter === "approved" ? "aprobadas" : "rechazadas"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(applications as any[]).map((row: any) => {
                const app = row.app ?? row;
                const appUser = row.user ?? {};
                return (
                <div key={app.id} className="vively-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{app.type === "expert" ? "🎓" : "👨‍🍳"}</span>
                      <div>
                        <p className="font-bold text-sm text-foreground">{app.displayName || appUser.name || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground/70">{appUser.email} · {app.type === "expert" ? "BuddyExpert" : "BuddyMaker"}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      app.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{app.status}</span>
                  </div>

                  {app.specialty && <p className="text-xs text-muted-foreground"><span className="font-medium">Especialidad:</span> {app.specialty}</p>}
                  {app.expertCategory && <p className="text-xs text-muted-foreground"><span className="font-medium">Categoría:</span> {app.expertCategory}</p>}
                  {app.motivation && (
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Motivación</p>
                      <p className="text-xs text-foreground/80">{app.motivation}</p>
                    </div>
                  )}
                  {app.experience && (
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Experiencia</p>
                      <p className="text-xs text-foreground/80">{app.experience}</p>
                    </div>
                  )}
                  {app.certifications && <p className="text-xs text-muted-foreground"><span className="font-medium">Certificaciones:</span> {app.certifications}</p>}
                  {app.instagramHandle && <p className="text-xs text-muted-foreground">📸 {app.instagramHandle}</p>}

                  {app.status === "pending" && (
                    <div className="space-y-2 pt-1 border-t border-border/50">
                      <input
                        placeholder="Nota para el usuario (opcional)"
                        value={adminNote[app.id] ?? ""}
                        onChange={e => setAdminNote(prev => ({ ...prev, [app.id]: e.target.value }))}
                        className="vively-input w-full text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => reviewApplication.mutate({ id: app.id, action: "approve", adminNote: adminNote[app.id] })}
                          disabled={reviewApplication.isPending}
                          className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50"
                        >
                          ✅ Aprobar
                        </button>
                        <button
                          onClick={() => reviewApplication.mutate({ id: app.id, action: "reject", adminNote: adminNote[app.id] })}
                          disabled={reviewApplication.isPending}
                          className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  )}

                  {app.adminNote && (
                    <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2">Nota admin: "{app.adminNote}"</p>
                  )}
                </div>
              );
              })}
            </div>
          )}

          {/* Role Requests sub-section */}
          <div className="space-y-4">
          <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">🎭 Solicitudes de cambio de rol</h3>
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setRoleReqFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  roleReqFilter === s ? "bg-gray-900 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "pending" ? "⏳ Pendientes" : s === "approved" ? "✅ Aprobadas" : "❌ Rechazadas"}
              </button>
            ))}
          </div>
          {roleReqLoading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" /></div>
          ) : !roleRequests?.length ? (
            <div className="vively-card text-center py-6 text-muted-foreground/70">
              <p className="text-2xl mb-2">🎭</p>
              <p className="text-sm">No hay solicitudes de rol {roleReqFilter === "pending" ? "pendientes" : roleReqFilter === "approved" ? "aprobadas" : "rechazadas"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(roleRequests as any[]).map((req: any) => (
                <div key={req.id} className="vively-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{req.roleType === "buddyexpert" ? "🎓" : "👨‍🍳"}</span>
                      <div>
                        <p className="font-bold text-sm text-foreground">{req.user?.name || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground/70">{req.user?.email} · {req.roleType === "buddyexpert" ? "BuddyExpert" : "BuddyMaker"}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      req.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      req.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{req.status}</span>
                  </div>
                  {req.motivation && (
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Motivación</p>
                      <p className="text-xs text-foreground/80">{req.motivation}</p>
                    </div>
                  )}
                  {req.specialties?.length > 0 && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium">Especialidades:</span> {req.specialties.join(", ")}</p>
                  )}
                  {req.socialLinks && (
                    <div className="flex gap-3 text-xs text-blue-500">
                      {req.socialLinks.instagram && <span>📸 {req.socialLinks.instagram}</span>}
                      {req.socialLinks.youtube && <span>▶️ {req.socialLinks.youtube}</span>}
                      {req.socialLinks.website && <a href={req.socialLinks.website} target="_blank" rel="noreferrer" className="underline">🌐 Web</a>}
                    </div>
                  )}
                  {req.status === "pending" && (
                    <div className="space-y-2 pt-1 border-t border-border/50">
                      <input
                        placeholder="Nota para el usuario (opcional)"
                        value={roleReqNote[req.id] ?? ""}
                        onChange={e => setRoleReqNote(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="vively-input w-full text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveRoleReq.mutate({ requestId: req.id, note: roleReqNote[req.id] })}
                          disabled={approveRoleReq.isPending}
                          className="flex-1 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50"
                        >
                          ✅ Aprobar y asignar rol
                        </button>
                        <button
                          onClick={() => rejectRoleReq.mutate({ requestId: req.id, note: roleReqNote[req.id] })}
                          disabled={rejectRoleReq.isPending}
                          className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  )}
                  {req.reviewNote && (
                    <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2">Nota admin: "{req.reviewNote}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {activeTab === "terms" && (
        <TermsAcceptancePanel />
      )}

       {/* Founders */}
      {activeTab === "founders" && (
        <FoundersPanel />
      )}
      {/* Badges */}
      {activeTab === "badges" && (
        <AdminBadgesPanel />
      )}
      {/* Empresas B2B */}
      {activeTab === "empresas" && (
        <AdminEmpresasPanel />
      )}
      {/* Licencias B2B */}
      {activeTab === "licencias" && (
        <AdminLicenciasPanel />
      )}
      {/* Soporte */}
      {activeTab === "soporte" && (
        <AdminSoportePanel />
      )}
      {/* Clínicas Veterinarias */}
      {activeTab === "clinicas" && (
        <AdminVetClinicsPanel />
      )}
      {/* Users */}
      {activeTab === "duplicates" && (
        <div className="vively-card space-y-4">
          <h3 className="text-sm font-bold text-foreground/80">🔍 Buscar cuentas duplicadas</h3>
          <p className="text-xs text-muted-foreground/70">Busca por email para ver todas las cuentas asociadas a ese correo. Puedes elegir cuál conservar y eliminar las duplicadas.</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={dupEmail}
              onChange={(e) => setDupEmail(e.target.value)}
              placeholder="luismariaccc@gmail.com"
              className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setDupSearchEmail(dupEmail)}
              className="rounded-xl bg-[#F97316] px-4 py-2 text-sm font-semibold text-white"
            >
              Buscar
            </button>
          </div>
          {dupLoading && <p className="text-xs text-muted-foreground/70">Buscando...</p>}
          {dupAccounts && dupAccounts.length === 0 && <p className="text-xs text-muted-foreground/70">No se encontraron cuentas con ese email.</p>}
          {dupAccounts && dupAccounts.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-orange-600">{dupAccounts.length} cuenta(s) encontrada(s) con este email:</p>
              {dupAccounts.map((acc: any) => (
                <div key={acc.id} className="rounded-2xl border border-border/50 bg-background p-3 shadow-sm space-y-2">
                  <div className="flex items-center gap-3">
                    {acc.imageUrl ? (
                      <img src={acc.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-sm font-bold text-muted-foreground">
                        {acc.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{acc.name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground/70">ID: {acc.id} · {acc.loginMethod ?? "desconocido"} · {acc.role}</p>
                      <p className="text-xs text-muted-foreground/70">Creada: {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("es-ES") : "?"}</p>
                      {acc.deletedAt && <p className="text-xs text-red-400">⚠️ Eliminada el {new Date(acc.deletedAt).toLocaleDateString("es-ES")}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => promoteToAdminProMax.mutate({ userId: acc.id })}
                        className="rounded-lg bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                      >
                        Admin + Pro Max
                      </button>
                      {!acc.deletedAt && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la cuenta ID ${acc.id} (${acc.name || acc.email})? Esta acción es reversible.`)) {
                              mergeAccounts.mutate({ keepUserId: -1, deleteUserIds: [acc.id] });
                            }
                          }}
                          className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === "users" && (
        <div className="vively-card space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground/80">
              Usuarios registrados
              <span className="ml-2 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {usersRaw?.length ?? 0} mostrados
              </span>
            </h3>
            <div className="flex gap-2 flex-wrap">
              {(["all","free","pro","pro_max"] as const).map(p => (
                <button key={p} onClick={() => setUserPlanFilter(p)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    userPlanFilter === p ? "bg-gray-900 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}>
                  {p === "all" ? "Todos" : p === "free" ? "Free" : p === "pro" ? "Pro" : "Pro Max"}
                </button>
              ))}
              {(["all","admin","buddyexpert","user"] as const).map(r => (
                <button key={r} onClick={() => setUserRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    userRoleFilter === r ? "bg-orange-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}>
                  {r === "all" ? "Todos roles" : r === "admin" ? "Admin" : r === "buddyexpert" ? "Expert" : "Usuario"}
                </button>
              ))}
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="vively-input pl-9 w-full text-sm"
            />
          </div>
          <div className="max-h-[65vh] overflow-y-auto space-y-3">
            {users.length === 0 && (
              <p className="text-center text-xs text-muted-foreground/70 py-6">No se encontraron usuarios con estos filtros.</p>
            )}
            {(users ?? []).map((u: any) => {
              const planLabel = u.subscription?.status === "active"
                ? (u.subscription?.plan === "pro_max" ? "Pro Max" : "Pro")
                : "Free";
              const planColor = u.subscription?.status === "active"
                ? (u.subscription?.plan === "pro_max" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700")
                : "bg-muted/50 text-muted-foreground";
              return (
                <div key={u.id} className="rounded-2xl border border-border/50 bg-background p-3 shadow-sm space-y-3">
                  {/* User info row */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F97316]/10 text-sm font-bold text-[#F97316]">
                      {u.name ? u.name[0].toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{u.name || "Sin nombre"}</p>
                      <p className="truncate text-xs text-muted-foreground/70">{u.email || u.openId}</p>
                      <p className="truncate text-xs text-muted-foreground/50">ID: {u.id} · {u.role} · {u.loginMethod ?? "?"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${planColor}`}>
                      {planLabel}
                    </span>
                  </div>
                  {/* Controls row */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Rol del sistema */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Rol</p>
                      <select
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as any })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs font-semibold text-foreground/80"
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                        <option value="buddyexpert">BuddyExpert</option>
                      </select>
                    </div>
                    {/* Tipo de cuenta */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Tipo</p>
                      <select
                        value={(u as any).accountType ?? "user"}
                        onChange={(e) => setUserAccountType.mutate({ userId: u.id, accountType: e.target.value as any })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs font-semibold text-foreground/80"
                      >
                        <option value="user">Usuario</option>
                        <option value="buddymaker">BuddyMaker</option>
                        <option value="buddyexpert">BuddyExpert</option>
                        <option value="business">Empresa</option>
                      </select>
                    </div>
                    {/* Plan */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Plan</p>
                      <select
                        value={
                          u.subscription?.status === "active"
                            ? (u.subscription?.plan ?? "basic")
                            : "free"
                        }
                        onChange={(e) => setUserPlan.mutate({ userId: u.id, plan: e.target.value as any })}
                        className="w-full rounded-lg border border-border bg-muted/30 px-2 py-1.5 text-xs font-semibold text-foreground/80"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Pro (Basic)</option>
                        <option value="premium">Pro (Premium)</option>
                        <option value="pro_max">Pro Max</option>
                      </select>
                    </div>
                  </div>
                  {/* Roles secundarios */}
                  <div className="space-y-1 pt-1">
                    <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Roles adicionales</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {((u as any).secondaryRoles ?? []).map((sr: string) => (
                        <span key={sr} className="inline-flex items-center gap-2 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-300">
                          {sr === "buddyexpert" ? "BuddyExpert" : sr === "admin" ? "Admin" : sr}
                          <button
                            onClick={() => removeSecondaryRoleMut.mutate({ userId: u.id, secondaryRole: sr })}
                            className="ml-0.5 text-orange-500 hover:text-red-600 font-bold leading-none"
                            title="Quitar rol"
                          >×</button>
                        </span>
                      ))}
                      {!((u as any).secondaryRoles ?? []).includes("buddyexpert") && u.role !== "buddyexpert" && (
                        <button
                          onClick={() => addSecondaryRoleMut.mutate({ userId: u.id, secondaryRole: "buddyexpert" })}
                          className="rounded-full border border-dashed border-orange-300 px-2 py-0.5 text-xs text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >+ BuddyExpert</button>
                      )}
                      {!((u as any).secondaryRoles ?? []).includes("admin") && u.role !== "admin" && (
                        <button
                          onClick={() => addSecondaryRoleMut.mutate({ userId: u.id, secondaryRole: "admin" })}
                          className="rounded-full border border-dashed border-blue-300 px-2 py-0.5 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >+ Admin</button>
                      )}
                      {((u as any).secondaryRoles ?? []).length === 0 && u.role === "admin" && !((u as any).secondaryRoles ?? []).includes("buddyexpert") && (
                        <button
                          onClick={() => addSecondaryRoleMut.mutate({ userId: u.id, secondaryRole: "buddyexpert" })}
                          className="rounded-full border border-dashed border-orange-300 px-2 py-0.5 text-xs text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        >+ BuddyExpert</button>
                      )}
                      {((u as any).secondaryRoles ?? []).length === 0 && u.role !== "admin" && (
                        <span className="text-xs text-muted-foreground/50">Sin roles adicionales</span>
                      )}
                    </div>
                  </div>
                  {/* Borrar usuario */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        if (confirm(`¿Borrar al usuario ${u.name || u.email} (ID ${u.id})? El usuario quedará desactivado y desaparecerá de todas las listas.`)) {
                          deleteUser.mutate({ userId: u.id, hardDelete: false });
                        }
                      }}
                      disabled={deleteUser.isPending}
                      className="flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      Borrar usuario
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Pagination */}
          {(usersRaw?.length === USER_PAGE_SIZE || userOffset > 0) && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <button
                onClick={() => setUserOffset(Math.max(0, userOffset - USER_PAGE_SIZE))}
                disabled={userOffset === 0}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-40"
              >← Anterior</button>
              <span className="text-xs text-muted-foreground/70">Página {Math.floor(userOffset / USER_PAGE_SIZE) + 1}</span>
              <button
                onClick={() => setUserOffset(userOffset + USER_PAGE_SIZE)}
                disabled={(usersRaw?.length ?? 0) < USER_PAGE_SIZE}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-40"
              >Siguiente →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Terms Acceptance Panel──────────────────────────────────────────
function TermsAcceptancePanel() {
  const { data: users, isLoading } = trpc.admin.users.useQuery({});

  const accepted = (users ?? []).filter((u: any) => u.termsAcceptedAt);
  const notAccepted = (users ?? []).filter((u: any) => !u.termsAcceptedAt);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="vively-card text-center">
          <p className="text-2xl font-bold text-foreground">{users?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Total usuarios</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-bold text-green-600">{accepted.length}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Han aceptado</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-bold text-orange-500">{notAccepted.length}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Sin aceptar</p>
        </div>
      </div>

      {/* Users who accepted */}
      <div className="vively-card space-y-3">
        <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Usuarios que han aceptado los TyC
          <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{accepted.length}</span>
        </h3>
        <div className="max-h-72 overflow-y-auto space-y-2">
          {accepted.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground/70 py-4">Ningún usuario ha aceptado los TyC todavía.</p>
          ) : (
            accepted.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                    {u.name ? u.name[0].toUpperCase() : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{u.name || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground/70">{u.email || u.openId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-green-600">v{u.termsVersion ?? "1.0"}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {u.termsAcceptedAt ? new Date(u.termsAcceptedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                  </p>
                  {u.marketingConsent && (
                    <span className="text-xs text-purple-500 font-medium">+ Marketing</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Users who have NOT accepted */}
      {notAccepted.length > 0 && (
        <div className="vively-card space-y-3">
          <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            Usuarios sin aceptar
            <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">{notAccepted.length}</span>
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {notAccepted.map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600">
                  {u.name ? u.name[0].toUpperCase() : "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{u.name || "Sin nombre"}</p>
                  <p className="text-xs text-muted-foreground/70">{u.email || u.openId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Founders Panel ───────────────────────────────────────────────────────────
function FoundersPanel() {
  const { data: stats, refetch: refetchStats } = trpc.admin.getFounderStats.useQuery();
  const { data: founders, refetch: refetchFounders, isLoading } = trpc.admin.getFounderEmails.useQuery();
  const [newEmail, setNewEmail] = useState("");
  const [filter, setFilter] = useState<"all" | "claimed" | "pending">("all");

  const addFounder = trpc.admin.addFounderEmail.useMutation({
    onSuccess: () => { toast.success("Email añadido"); setNewEmail(""); refetchFounders(); refetchStats(); },
    onError: (err) => toast.error(err.message),
  });
  const removeFounder = trpc.admin.removeFounderEmail.useMutation({
    onSuccess: () => { toast.success("Email eliminado"); refetchFounders(); refetchStats(); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (founders ?? []).filter((f) => {
    if (filter === "claimed") return !!f.claimedAt;
    if (filter === "pending") return !f.claimedAt;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="vively-card text-center">
          <p className="text-2xl font-black text-foreground">{stats?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Total fundadores</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-black text-green-600">{stats?.claimed ?? 0}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">PRO activado</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-black text-orange-500">{stats?.pending ?? 0}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Pendientes</p>
        </div>
      </div>

      {/* Progress bar */}
      {stats && stats.total > 0 && (
        <div className="vively-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Tasa de conversión</p>
            <p className="text-xs font-bold text-green-600">{Math.round((stats.claimed / stats.total) * 100)}%</p>
          </div>
          <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
              style={{ width: `${(stats.claimed / stats.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">{stats.claimed} de {stats.total} usuarios originales ya se han registrado</p>
        </div>
      )}

      {/* Add email */}
      <div className="vively-card">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Añadir email fundador</p>
        <div className="flex gap-2">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@ejemplo.com"
            className="vively-input flex-1"
            onKeyDown={(e) => { if (e.key === "Enter" && newEmail.trim()) addFounder.mutate({ email: newEmail.trim() }); }}
          />
          <button
            onClick={() => { if (newEmail.trim()) addFounder.mutate({ email: newEmail.trim() }); }}
            disabled={addFounder.isPending || !newEmail.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F97316] text-white disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "claimed", "pending"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f ? "bg-[#F97316] text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "all" ? "Todos" : f === "claimed" ? "✅ Activados" : "⏳ Pendientes"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="vively-card space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground/80">Lista de emails fundadores</h3>
          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs font-semibold text-muted-foreground">{filtered.length}</span>
        </div>
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground/70 py-4">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground/70 py-4">No hay emails en esta categoría.</p>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {filtered.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${f.claimedAt ? "bg-green-500" : "bg-orange-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.email}</p>
                    {f.claimedAt && (
                      <p className="text-xs text-green-600">
                        PRO activado el {new Date(f.claimedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
                {!f.claimedAt && (
                  <button
                    onClick={() => removeFounder.mutate({ id: f.id })}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
                    title=t("common.delete")
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── API Monitor Panel ─────────────────────────────────────────────────────────
function ApiMonitorPanel() {
  const { data: monitors, refetch: refetchMonitors, isLoading } = trpc.admin.getApiMonitors.useQuery();
  const [selectedMonitorId, setSelectedMonitorId] = useState<number | null>(null);
  const { data: logs } = trpc.admin.getApiLogs.useQuery(
    { monitorId: selectedMonitorId! },
    { enabled: selectedMonitorId !== null }
  );

  const recheckMutation = trpc.admin.recheckApi.useMutation({
    onSuccess: () => { toast.success("Recheck completado"); refetchMonitors(); },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.admin.toggleMonitor.useMutation({
    onSuccess: () => { refetchMonitors(); },
    onError: (err) => toast.error(err.message),
  });

  const resetErrorsMutation = trpc.admin.resetMonitorErrors.useMutation({
    onSuccess: () => { toast.success("Errores reseteados — monitor marcado como OK"); refetchMonitors(); },
    onError: (err) => toast.error(err.message),
  });

  const testLLMMutation = trpc.admin.testLLMConnection.useMutation({
    onSuccess: (data: any) => {
      if (data.success) toast.success(`LLM OK — ${data.latencyMs}ms · finish: ${data.finishReason}`);
      else toast.error(`LLM ERROR: ${data.error}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const { data: llmLogs, refetch: refetchLLMLogs } = trpc.admin.getLLMErrorLogs.useQuery({ limit: 20 });
  const [showLLMLogs, setShowLLMLogs] = useState(false);

  const statusColor = (status: string | null) => {
    if (status === "ok") return "bg-green-100 text-green-700";
    if (status === "down") return "bg-red-100 text-red-700";
    if (status === "degraded") return "bg-yellow-100 text-yellow-700";
    return "bg-muted/50 text-muted-foreground";
  };

  const statusDot = (status: string | null) => {
    if (status === "ok") return "bg-green-500";
    if (status === "down") return "bg-red-500";
    if (status === "degraded") return "bg-yellow-500";
    return "bg-gray-300";
  };

  const statusLabel = (status: string | null) => {
    if (status === "ok") return t("common.ok");
    if (status === "down") return "ERROR";
    if (status === "degraded") return "DEGRADADO";
    return "Sin datos";
  };

  const okCount = monitors?.filter((m) => m.lastStatus === "ok").length ?? 0;
  const errorCount = monitors?.filter((m) => m.lastStatus === "down" || m.lastStatus === "degraded").length ?? 0;
  const pendingCount = monitors?.filter((m) => !m.lastStatus).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="vively-card text-center">
          <p className="text-2xl font-extrabold text-green-600">{okCount}</p>
          <p className="text-xs text-muted-foreground">Operativos</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-extrabold text-red-500">{errorCount}</p>
          <p className="text-xs text-muted-foreground">Con fallos</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-extrabold text-muted-foreground/70">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Sin comprobar</p>
        </div>
      </div>

      {/* Monitors list */}
      <div className="vively-card space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
            <SignalIcon className="h-4 w-4 text-[#F97316]" />
            Monitores de API
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!monitors) return;
                monitors.forEach((m) => recheckMutation.mutate({ monitorId: m.id }));
              }}
              disabled={recheckMutation.isPending || !monitors?.length}
              className="flex items-center gap-2 rounded-lg bg-orange-100 px-2.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-200 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${recheckMutation.isPending ? "animate-spin" : ""}`} />
              Recheck All
            </button>
            <button
              onClick={() => refetchMonitors()}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
              Actualizar
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
          </div>
        )}

        {!isLoading && (!monitors || monitors.length === 0) && (
          <p className="py-4 text-center text-xs text-muted-foreground/70">No hay monitores configurados.</p>
        )}

        {monitors?.map((monitor) => (
          <div
            key={monitor.id}
            className={`rounded-xl border p-3 transition-all ${
              selectedMonitorId === monitor.id ? "border-[#F97316] bg-orange-50" : "border-border/50 bg-muted/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(monitor.lastStatus)}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{monitor.name}</p>
                  <p className="truncate text-xs text-muted-foreground/70">{monitor.endpoint}</p>
                  {monitor.lastCheckedAt && (
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-300">
                      <ClockIcon className="h-3 w-3" />
                      {new Date(monitor.lastCheckedAt).toLocaleString("es-ES")}
                      {monitor.lastLatencyMs != null && ` · ${monitor.lastLatencyMs}ms`}
                    </p>
                  )}
                  {monitor.lastErrorMessage && (
                    <p className="mt-0.5 text-xs text-red-500 line-clamp-1">{monitor.lastErrorMessage}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor(monitor.lastStatus)}`}>
                  {statusLabel(monitor.lastStatus)}
                </span>
                <button
                  onClick={() => recheckMutation.mutate({ monitorId: monitor.id })}
                  disabled={recheckMutation.isPending}
                  title="Recheck ahora"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm hover:bg-muted/50 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-3.5 w-3.5 ${recheckMutation.isPending ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setSelectedMonitorId(selectedMonitorId === monitor.id ? null : monitor.id)}
                  title="Ver historial"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-sm hover:bg-muted/50"
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ monitorId: monitor.id, isActive: !monitor.isActive })}
                  title={monitor.isActive ? "Pausar monitor" : "Activar monitor"}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm ${
                    monitor.isActive ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-muted/50 text-muted-foreground/70 hover:bg-muted"
                  }`}
                >
                  {monitor.isActive ? <CheckIcon className="h-3.5 w-3.5" /> : <XMarkIcon className="h-3.5 w-3.5" />}
                </button>
                {(monitor.lastStatus === "down" || monitor.lastStatus === "degraded") && (
                  <button
                    onClick={() => resetErrorsMutation.mutate({ monitorId: monitor.id })}
                    disabled={resetErrorsMutation.isPending}
                    title="Reactivar: marcar como OK y resetear errores"
                    className="flex h-7 items-center gap-2 rounded-lg bg-blue-100 px-2 text-xs font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Reactivar
                  </button>
                )}
              </div>
            </div>

            {/* Logs panel */}
            {selectedMonitorId === monitor.id && (
              <div className="mt-3 border-t border-orange-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Últimas comprobaciones</p>
                {!logs || logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground/70">Sin historial todavía.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg bg-background px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusDot(log.status)}`} />
                          <span className="font-semibold text-foreground/80">{statusLabel(log.status)}</span>
                          {log.httpStatus && <span className="text-muted-foreground/70">HTTP {log.httpStatus}</span>}
                          {log.latencyMs != null && <span className="text-muted-foreground/70">{log.latencyMs}ms</span>}
                        </div>
                        <span className="text-gray-300">
                          {new Date(log.checkedAt!).toLocaleTimeString("es-ES")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* LLM Health Section */}
      <div className="vively-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
            <span className="text-base">🤖</span>
            Servicio de IA (LLM)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => testLLMMutation.mutate()}
              disabled={testLLMMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-violet-100 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${testLLMMutation.isPending ? "animate-spin" : ""}`} />
              {testLLMMutation.isPending ? "Probando..." : "Test conexión"}
            </button>
            <button
              onClick={() => { setShowLLMLogs(!showLLMLogs); refetchLLMLogs(); }}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${showLLMLogs ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
            >
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
              {llmLogs && llmLogs.length > 0 ? `${llmLogs.length} errores` : "Sin errores"}
            </button>
          </div>
        </div>

        {testLLMMutation.data && (
          <div className={`rounded-lg px-3 py-2 text-xs font-medium ${testLLMMutation.data.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {testLLMMutation.data.success
              ? `✓ Conexión OK · ${testLLMMutation.data.latencyMs}ms · finish_reason: ${testLLMMutation.data.finishReason} · tokens: ${(testLLMMutation.data.usage as any)?.total_tokens ?? "N/A"}`
              : `✗ Error: ${(testLLMMutation.data as any).error}`}
          </div>
        )}

        {showLLMLogs && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Últimos errores del generador de menús</p>
            {!llmLogs || llmLogs.length === 0 ? (
              <p className="text-xs text-green-600 font-medium">Sin errores registrados</p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {llmLogs.map((log: any, i: number) => (
                  <div key={i} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-red-700">{log.procedure}</span>
                      <span className="text-muted-foreground">{new Date(log.ts).toLocaleString("es-ES")}</span>
                    </div>
                    <p className="text-red-600 font-medium">Status: {log.status} · User: {log.userId}</p>
                    <p className="text-red-500 mt-0.5 line-clamp-2">{log.message}</p>
                    {log.stack && <p className="text-muted-foreground/70 mt-0.5 text-[10px] line-clamp-1">{log.stack}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* LLM Latency History Chart */}
      <LLMLatencyChart />

      <p className="text-center text-xs text-muted-foreground/70">
        Los monitores se comprueban automáticamente cada 5 minutos. Recibirás una notificación cuando falle un endpoint.
      </p>
    </div>
  );
}

// ── Admin Badges Panel ────────────────────────────────────────────────────────
function AdminBadgesPanel() {
  const { data: catalog, isLoading: loadingCatalog } = trpc.badges.getCatalog.useQuery();
  const { data: leaderboard, isLoading: loadingLeaderboard } = trpc.badges.getLeaderboard.useQuery();

  const RARITY_COLORS: Record<string, string> = {
    common: "bg-muted/50 text-muted-foreground",
    rare: "bg-blue-100 text-blue-700",
    epic: "bg-purple-100 text-purple-700",
    legendary: "bg-amber-100 text-amber-700",
  };

  const totalBadges = catalog?.length ?? 0;
  const totalEarned = catalog?.filter((b: any) => b.earned).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="vively-card text-center">
          <div className="text-3xl font-bold text-amber-500">{totalBadges}</div>
          <div className="text-xs text-muted-foreground mt-1">Insignias en catálogo</div>
        </div>
        <div className="vively-card text-center">
          <div className="text-3xl font-bold text-violet-600">{leaderboard?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Usuarios con insignias</div>
        </div>
        <div className="vively-card text-center overflow-hidden">
          <div className="text-xl font-bold text-emerald-600 truncate">
            {(leaderboard?.reduce((sum: number, u: any) => sum + (u.badgeCount ?? 0), 0) ?? 0).toLocaleString("es-ES")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Total insignias</div>
        </div>
        <div className="vively-card text-center overflow-hidden">
          <div className="text-xl font-bold text-orange-500 truncate">
            {(leaderboard?.reduce((sum: number, u: any) => sum + (u.totalPoints ?? 0), 0) ?? 0).toLocaleString("es-ES")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Puntos totales</div>
        </div>
      </div>

      {/* Catalog overview */}
      <div className="vively-card">
        <h3 className="text-sm font-bold text-foreground/80 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-4 h-4 text-amber-500" />
          Catálogo de insignias ({totalBadges})
        </h3>
        {loadingCatalog ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {catalog?.map((badge: any) => (
              <div key={badge.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                <span className="text-2xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{badge.nameEs}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">{badge.descriptionEs}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RARITY_COLORS[badge.rarity] ?? "bg-muted/50 text-muted-foreground"}`}>
                    {badge.rarity}
                  </span>
                  <span className="text-xs font-bold text-amber-600">+{badge.points}pts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="vively-card">
        <h3 className="text-sm font-bold text-foreground/80 mb-4 flex items-center gap-2">
          <StarIcon className="w-4 h-4 text-amber-500" />
          Ranking de usuarios por insignias
        </h3>
        {loadingLeaderboard ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : leaderboard?.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground/70 py-6">Aún no hay usuarios con insignias</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {leaderboard?.map((entry: any, index: number) => (
              <div key={entry.userId} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? "bg-amber-400 text-white" :
                  index === 1 ? "bg-gray-400 text-white" :
                  index === 2 ? "bg-orange-400 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{entry.userName ?? "Usuario"}</p>
                  <p className="text-xs text-muted-foreground/70">{entry.userEmail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-amber-600">{entry.totalPoints} pts</p>
                  <p className="text-xs text-muted-foreground/70">{entry.badgeCount} insignias</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Panel Admin Empresas B2B ─────────────────────────────────────────────────
function AdminEmpresasPanel() {
  const [subTab, setSubTab] = useState<"empresas" | "leads" | "resumen">("resumen");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "trial" | "active" | "suspended" | "cancelled">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "starter" | "business" | "enterprise" | "corporate">("all");
  const [search, setSearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [leadFilter, setLeadFilter] = useState<boolean | undefined>(undefined);

  const { data: companiesData, refetch: refetchCompanies } = trpc.company.adminGetCompanies.useQuery(
    { status: statusFilter, plan: planFilter, search: search || undefined },
    { enabled: subTab === "empresas" || subTab === "resumen" }
  );
  const { data: companyDetail, refetch: refetchDetail } = trpc.company.adminGetCompanyDetail.useQuery(
    { companyId: selectedCompanyId! },
    { enabled: selectedCompanyId !== null }
  );
  const { data: leads, refetch: refetchLeads } = trpc.company.adminGetLeads.useQuery(
    { contacted: leadFilter },
    { enabled: subTab === "leads" }
  );

  const updateCompany = trpc.company.adminUpdateCompany.useMutation({
    onSuccess: () => { toast.success("Empresa actualizada"); refetchCompanies(); refetchDetail(); },
    onError: (e) => toast.error(e.message),
  });
  const updateLead = trpc.company.adminUpdateLead.useMutation({
    onSuccess: () => { toast.success("Lead actualizado"); refetchLeads(); },
    onError: (e) => toast.error(e.message),
  });
  const triggerSync = trpc.company.adminTriggerCompanyBillingSync.useMutation({
    onSuccess: (d) => { toast.success(`Sync OK — ${d.activeLicenses} licencias activas · ${d.totalAmount.toFixed(2)} €`); refetchDetail(); refetchCompanies(); },
    onError: (e) => toast.error(e.message),
  });

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    trial: "bg-blue-100 text-blue-700",
    active: "bg-green-100 text-green-700",
    suspended: "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const PLAN_COLORS: Record<string, string> = {
    starter: "bg-muted/50 text-foreground/80",
    business: "bg-blue-100 text-blue-700",
    enterprise: "bg-purple-100 text-purple-700",
    corporate: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "resumen", label: "📊 Resumen global" },
          { key: "empresas", label: "🏢 Empresas" },
          { key: "leads", label: "📋 Leads" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => { setSubTab(t.key); setSelectedCompanyId(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              subTab === t.key ? "bg-gray-900 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RESUMEN GLOBAL ── */}
      {subTab === "resumen" && companiesData && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Empresas totales", value: companiesData.summary.total, icon: "🏢", color: "bg-blue-50 text-blue-700" },
              { label: "Empresas activas", value: companiesData.summary.active, icon: "✅", color: "bg-green-50 text-green-700" },
              { label: "Licencias activas", value: companiesData.summary.totalLicensesActive, icon: "👥", color: "bg-purple-50 text-purple-700" },
              { label: "MRR estimado", value: `${companiesData.summary.totalMRR.toFixed(0)} €`, icon: "💶", color: "bg-amber-50 text-amber-700" },
            ].map(kpi => (
              <div key={kpi.label} className={`rounded-2xl p-4 ${kpi.color}`}>
                <p className="text-2xl mb-1">{kpi.icon}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
                <p className="text-xs opacity-70 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Distribución por plan */}
          <div className="vively-card">
            <h4 className="text-sm font-bold text-foreground/80 mb-3">Distribución por plan</h4>
            <div className="space-y-2">
              {(["starter", "business", "enterprise", "corporate"] as const).map(plan => {
                const count = companiesData.companies.filter(c => c.plan === plan).length;
                const pct = companiesData.summary.total > 0 ? (count / companiesData.summary.total) * 100 : 0;
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-20 text-center ${PLAN_COLORS[plan]}`}>{plan}</span>
                    <div className="flex-1 bg-muted/50 rounded-full h-2">
                      <div className="bg-[#F97316] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabla resumen de empresas activas */}
          <div className="vively-card overflow-x-auto">
            <h4 className="text-sm font-bold text-foreground/80 mb-3">Empresas activas — MRR por empresa</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground/70 border-b border-border/50">
                  <th className="text-left py-2 font-semibold">Empresa</th>
                  <th className="text-center py-2 font-semibold">Plan</th>
                  <th className="text-center py-2 font-semibold">Licencias</th>
                  <th className="text-right py-2 font-semibold">MRR</th>
                </tr>
              </thead>
              <tbody>
                {companiesData.companies.filter(c => c.status === "active").map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-muted/30 cursor-pointer" onClick={() => { setSubTab("empresas"); setSelectedCompanyId(c.id); }}>
                    <td className="py-2">
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-muted-foreground/70">{c.contactEmail}</p>
                    </td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[c.plan]}`}>{c.plan}</span>
                    </td>
                    <td className="py-2 text-center text-foreground/80">{c.licensesActive}/{c.licensesTotal}</td>
                    <td className="py-2 text-right font-bold text-green-700">{c.estimatedMRR.toFixed(0)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EMPRESAS ── */}
      {subTab === "empresas" && (
        <div className="space-y-4">
          {/* Detalle de empresa seleccionada */}
          {selectedCompanyId && companyDetail ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedCompanyId(null)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ← Volver al listado
              </button>

              {/* Header empresa */}
              <div className="vively-card space-y-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{companyDetail.company.name}</h3>
                    <p className="text-xs text-muted-foreground/70">{companyDetail.company.contactEmail} · {companyDetail.company.industry || "Sin sector"}</p>
                    {companyDetail.company.accessCode && (
                      <p className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded mt-1 inline-block">
                        Código: {companyDetail.company.accessCode}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[companyDetail.company.status]}`}>
                      {companyDetail.company.status}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${PLAN_COLORS[companyDetail.company.plan]}`}>
                      {companyDetail.company.plan}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{companyDetail.stats.activeMembers}</p>
                    <p className="text-xs text-muted-foreground/70">Miembros activos</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-foreground">{companyDetail.company.licensesTotal}</p>
                    <p className="text-xs text-muted-foreground/70">Licencias contratadas</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-700">{companyDetail.stats.totalBilled.toFixed(0)} €</p>
                    <p className="text-xs text-muted-foreground/70">Total facturado</p>
                  </div>
                </div>

                {/* Acciones admin */}
                <div className="border-t border-border/50 pt-3 space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Acciones de administración</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["pending", "trial", "active", "suspended", "cancelled"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateCompany.mutate({ companyId: companyDetail.company.id, status: s })}
                        disabled={updateCompany.isPending || companyDetail.company.status === s}
                        className={`py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 ${
                          companyDetail.company.status === s
                            ? STATUS_COLORS[s] + " cursor-default"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {s === "active" ? "✅ Activar" : s === "suspended" ? "⏸ Suspender" : s === "cancelled" ? "❌ Cancelar" : s === "trial" ? "🔬 Trial" : "⏳ Pendiente"}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => triggerSync.mutate({ companyId: companyDetail.company.id })}
                      disabled={triggerSync.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      <ArrowPathIcon className={`h-3.5 w-3.5 ${triggerSync.isPending ? "animate-spin" : ""}`} />
                      Sincronizar facturación
                    </button>
                  </div>
                  {/* Notas */}
                  <AdminCompanyNotes
                    companyId={companyDetail.company.id}
                    currentNotes={companyDetail.company.notes || ""}
                    onSave={(notes) => updateCompany.mutate({ companyId: companyDetail.company.id, notes })}
                    isSaving={updateCompany.isPending}
                  />
                </div>
              </div>

              {/* Miembros */}
              <div className="vively-card">
                <h4 className="text-sm font-bold text-foreground/80 mb-3">
                  Miembros ({companyDetail.stats.totalMembers})
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {companyDetail.members.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70 text-center py-4">Sin miembros aún</p>
                  ) : companyDetail.members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-[#F97316]/10 flex items-center justify-center text-xs font-bold text-[#F97316] shrink-0">
                          {m.userName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{m.userName || "Sin nombre"}</p>
                          <p className="text-xs text-muted-foreground/70 truncate">{m.userEmail}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${m.isActive ? "bg-green-100 text-green-700" : "bg-muted/50 text-muted-foreground"}`}>
                          {m.isActive ? "activo" : "inactivo"}
                        </span>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          {m.lastActiveAt ? new Date(m.lastActiveAt).toLocaleDateString("es-ES") : "Nunca"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historial de facturación */}
              <div className="vively-card overflow-x-auto">
                <h4 className="text-sm font-bold text-foreground/80 mb-3">Historial de facturación</h4>
                {companyDetail.snapshots.length === 0 ? (
                  <p className="text-xs text-muted-foreground/70 text-center py-4">Sin snapshots de facturación aún</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground/70 border-b border-border/50">
                        <th className="text-left py-2 font-semibold">Período</th>
                        <th className="text-center py-2 font-semibold">Licencias</th>
                        <th className="text-center py-2 font-semibold">€/licencia</th>
                        <th className="text-right py-2 font-semibold">Total</th>
                        <th className="text-center py-2 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyDetail.snapshots.map((s: any) => (
                        <tr key={s.id} className="border-b border-gray-50">
                          <td className="py-2 text-foreground/80">
                            {new Date(s.billingPeriodStart).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                          </td>
                          <td className="py-2 text-center text-foreground/80">{s.activeLicenses}</td>
                          <td className="py-2 text-center text-foreground/80">{s.pricePerLicense.toFixed(2)} €</td>
                          <td className="py-2 text-right font-bold text-foreground">{s.totalAmount.toFixed(2)} €</td>
                          <td className="py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                              s.status === "paid" ? "bg-green-100 text-green-700" :
                              s.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                              s.status === "disputed" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* Listado de empresas */
            <div className="space-y-3">
              {/* Filtros */}
              <div className="flex gap-2 flex-wrap">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar empresa..."
                  className="vively-input flex-1 min-w-[160px] text-sm"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="vively-input text-xs"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="trial">Trial</option>
                  <option value="active">Activa</option>
                  <option value="suspended">Suspendida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value as any)}
                  className="vively-input text-xs"
                >
                  <option value="all">Todos los planes</option>
                  <option value="starter">Starter</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              {!companiesData ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" /></div>
              ) : companiesData.companies.length === 0 ? (
                <div className="vively-card text-center py-8 text-muted-foreground/70">
                  <p className="text-2xl mb-2">🏢</p>
                  <p className="text-sm">No hay empresas con estos filtros</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {companiesData.companies.map(c => (
                    <div
                      key={c.id}
                      className="vively-card cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedCompanyId(c.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-foreground">{c.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PLAN_COLORS[c.plan]}`}>{c.plan}</span>
                          </div>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">{c.contactEmail} · {c.industry || "Sin sector"}</p>
                          {c.accessCode && (
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">Código: {c.accessCode}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-green-700">{c.estimatedMRR.toFixed(0)} €/mes</p>
                          <p className="text-xs text-muted-foreground/70">{c.licensesActive}/{c.licensesTotal} lic.</p>
                          <p className="text-xs text-muted-foreground/70">{c.activeMembersCount} miembros</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LEADS ── */}
      {subTab === "leads" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {([
              { label: "Todos", value: undefined },
              { label: "Sin contactar", value: false },
              { label: "Contactados", value: true },
            ] as const).map(f => (
              <button
                key={String(f.value)}
                onClick={() => setLeadFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  leadFilter === f.value ? "bg-gray-900 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {!leads ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" /></div>
          ) : leads.length === 0 ? (
            <div className="vively-card text-center py-8 text-muted-foreground/70">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm">No hay leads con estos filtros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead: any) => (
                <div key={lead.id} className="vively-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground">{lead.companyName}</p>
                      <p className="text-xs text-muted-foreground">{lead.contactName} · {lead.contactEmail}</p>
                      {lead.contactPhone && <p className="text-xs text-muted-foreground/70">{lead.contactPhone}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lead.contacted ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {lead.contacted ? "Contactado" : t("common.pending")}
                      </span>
                      <p className="text-xs text-muted-foreground/70 mt-1">{new Date(lead.createdAt).toLocaleDateString("es-ES")}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                    {lead.employeeCount && <span>👥 {lead.employeeCount} empleados</span>}
                    {lead.industry && <span>🏭 {lead.industry}</span>}
                    {lead.planInterest && <span className={`px-1.5 py-0.5 rounded-full ${PLAN_COLORS[lead.planInterest]}`}>{lead.planInterest}</span>}
                  </div>
                  {lead.message && (
                    <div className="bg-muted/30 rounded-xl p-2">
                      <p className="text-xs text-muted-foreground">{lead.message}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 border-t border-border/50">
                    <a
                      href={`mailto:${lead.contactEmail}?subject=Buddy One for Business — ${lead.companyName}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      <EnvelopeIcon className="h-3.5 w-3.5" />
                      Enviar email
                    </a>
                    <button
                      onClick={() => updateLead.mutate({ leadId: lead.id, contacted: !lead.contacted })}
                      disabled={updateLead.isPending}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 ${
                        lead.contacted
                          ? "bg-muted/50 text-muted-foreground hover:bg-muted"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      {lead.contacted ? "Marcar pendiente" : "Marcar contactado"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Subcomponente para notas de empresa
function AdminCompanyNotes({
  companyId, currentNotes, onSave, isSaving
}: { companyId: number; currentNotes: string; onSave: (notes: string) => void; isSaving: boolean }) {
  const [notes, setNotes] = useState(currentNotes);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Notas internas</p>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={3}
        placeholder="Notas internas sobre esta empresa (solo visibles para admins)..."
        className="vively-input w-full text-xs resize-none"
      />
      <button
        onClick={() => onSave(notes)}
        disabled={isSaving || notes === currentNotes}
        className="px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-40"
      >
        {isSaving ? t("common.saving") : "Guardar notas"}
      </button>
    </div>
  );
}

// ── AdminSoportePanel ─────────────────────────────────────────────────────────
const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low:      { label: "Baja",     color: "bg-muted/50 text-muted-foreground" },
  medium:   { label: "Media",    color: "bg-yellow-100 text-yellow-700" },
  high:     { label: "Alta",     color: "bg-orange-100 text-orange-700" },
  critical: { label: "Crítica",  color: "bg-red-100 text-red-700" },
};
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open:        { label: "Abierto",     color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "En curso",    color: "bg-purple-100 text-purple-700" },
  waiting:     { label: "Esperando",   color: "bg-yellow-100 text-yellow-700" },
  resolved:    { label: "Resuelto",    color: "bg-green-100 text-green-700" },
  closed:      { label: "Cerrado",     color: "bg-muted/50 text-muted-foreground" },
};
const CATEGORY_LABELS_ADMIN: Record<string, string> = {
  billing:       "Facturación",
  technical:     "Técnico",
  account:       "Cuenta",
  recipes:       "Recetas",
  nutrition:     "Nutrición",
  family:        "Familia",
  subscription:  "Suscripción",
  other:         "Otro",
};

function AdminSoportePanel() {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const utils = trpc.useUtils();

  const { data: ticketsData, isLoading } = trpc.support.adminGetTickets.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    priority: priorityFilter === "all" ? undefined : priorityFilter as any,
    search: searchQuery || undefined,
    limit: 50,
  });

  const { data: ticketDetail, isLoading: detailLoading } = trpc.support.adminGetTicketDetail.useQuery(
    { ticketId: selectedTicket?.id },
    { enabled: !!selectedTicket?.id }
  );

  const updateStatus = trpc.support.adminUpdateTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket actualizado");
      utils.support.adminGetTickets.invalidate();
      utils.support.adminGetTicketDetail.invalidate({ ticketId: selectedTicket?.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const replyMutation = trpc.support.adminReplyTicket.useMutation({
    onSuccess: () => {
      toast.success("Respuesta enviada");
      setReplyText("");
      utils.support.adminGetTicketDetail.invalidate({ ticketId: selectedTicket?.id });
      utils.support.adminGetTickets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const tickets = ticketsData?.tickets ?? [];
  const summary = ticketsData?.kpis;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: summary.total, color: "bg-muted/30 text-foreground/80" },
            { label: "Abiertos", value: summary.open, color: "bg-blue-50 text-blue-700" },
            { label: "En curso", value: summary.in_progress, color: "bg-purple-50 text-purple-700" },
            { label: "Esperando", value: summary.waiting_user, color: "bg-yellow-50 text-yellow-700" },
            { label: "Resueltos", value: summary.resolved, color: "bg-green-50 text-green-700" },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-2xl p-3 text-center ${kpi.color}`}>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs font-medium mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: ticket list */}
        <div className="lg:w-2/5 space-y-3">
          {/* Filters */}
          <div className="vively-card space-y-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tickets..."
                className="vively-input pl-9 w-full text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "open", "in_progress", "waiting", "resolved", "closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s === "all" ? "Todos" : STATUS_LABELS[s]?.label ?? s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "critical", "high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    priorityFilter === p
                      ? "bg-gray-900 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p === "all" ? "Todas" : PRIORITY_LABELS[p]?.label ?? p}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket list */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground/70">Cargando tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground/70">No hay tickets con estos filtros.</div>
            ) : (
              tickets.map((ticket: any) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left rounded-2xl border p-3 transition-all ${
                    selectedTicket?.id === ticket.id
                      ? "border-orange-300 bg-orange-50"
                      : "border-border/50 bg-background hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.userName} · #{ticket.id}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{ticket.lastMessage || ticket.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABELS[ticket.status]?.color}`}>
                        {STATUS_LABELS[ticket.status]?.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_LABELS[ticket.priority]?.color}`}>
                        {PRIORITY_LABELS[ticket.priority]?.label}
                      </span>
                      {ticket.unreadCount > 0 && (
                        <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {ticket.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(ticket.updatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: ticket detail */}
        <div className="lg:flex-1">
          {!selectedTicket ? (
            <div className="vively-card flex flex-col items-center justify-center py-16 text-center">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-200 mb-3" />
              <p className="text-sm text-muted-foreground/70">Selecciona un ticket para ver el detalle</p>
            </div>
          ) : detailLoading ? (
            <div className="vively-card py-12 text-center text-sm text-muted-foreground/70">Cargando...</div>
          ) : ticketDetail ? (
            <div className="vively-card space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{ticketDetail.ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ticketDetail.ticket.userName} · {ticketDetail.ticket.userEmail} · #{ticketDetail.ticket.id}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    Categoría: {CATEGORY_LABELS_ADMIN[ticketDetail.ticket.category] ?? ticketDetail.ticket.category}
                    
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-muted-foreground/70 hover:text-muted-foreground shrink-0"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Status / Priority controls */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={ticketDetail.ticket.status}
                  onChange={(e) => updateStatus.mutate({ ticketId: ticketDetail.ticket.id, status: e.target.value as any })}
                  className="vively-input text-xs py-1 px-2"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={ticketDetail.ticket.priority}
                  onChange={(e) => updateStatus.mutate({ ticketId: ticketDetail.ticket.id, priority: e.target.value as any })}
                  className="vively-input text-xs py-1 px-2"
                >
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={ticketDetail.ticket.assignedAdminId?.toString() ?? ""}
                  onChange={(e) => updateStatus.mutate({ ticketId: ticketDetail.ticket.id, assignedAdminId: e.target.value ? parseInt(e.target.value) : null })}
                  className="vively-input text-xs py-1 px-2"
                >
                  <option value="">Sin asignar</option>
                  <option value="admin">Admin</option>
                  <option value="soporte">Soporte</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>

              {/* Messages thread */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {/* Initial description */}
                <div className="rounded-2xl bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground/80">{ticketDetail.ticket.userName} <span className="font-normal text-muted-foreground/70">(usuario)</span></p>
                    <p className="text-xs text-muted-foreground/70">{new Date(ticketDetail.ticket.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{(ticketDetail.messages?.[0] as any)?.message ?? ""}</p>
                </div>
                {/* Messages */}
                {(ticketDetail.messages ?? []).map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-3 ${
                      msg.isInternal
                        ? "bg-yellow-50 border border-yellow-200"
                        : msg.senderRole === "admin"
                        ? "bg-orange-50 border border-orange-100"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground/80">
                        {msg.senderName}
                        {msg.senderRole === "admin" && <span className="ml-1 text-orange-500">(Admin)</span>}
                        {msg.isInternal && <span className="ml-1 text-yellow-600">(Nota interna)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground/70">{new Date(msg.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Nota interna (no visible para el usuario)
                  </label>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder={isInternal ? "Nota interna para el equipo..." : "Respuesta al usuario..."}
                  className={`vively-input w-full text-sm resize-none ${isInternal ? "border-yellow-300 bg-yellow-50" : ""}`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => replyMutation.mutate({
                      ticketId: ticketDetail.ticket.id,
                      message: replyText,
                      isInternal,
                    })}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="flex-1 py-2 rounded-xl bg-[#F97316] text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40"
                  >
                    {replyMutation.isPending ? t("common.sending") : isInternal ? "Guardar nota" : "Enviar respuesta"}
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ ticketId: ticketDetail.ticket.id, status: "resolved" })}
                    disabled={ticketDetail.ticket.status === "resolved" || updateStatus.isPending}
                    className="px-3 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-40"
                  >
                    Resolver
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
