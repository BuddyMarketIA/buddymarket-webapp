import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
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
} from "@heroicons/react/24/outline";
import { RECIPE_PLACEHOLDER_IMAGE as RECIPE_PLACEHOLDER } from "@/lib/constants";

const TABS = [
  { key: "overview", label: "Resumen", icon: ShieldCheckIcon },
  { key: "monitor", label: "Monitor APIs", icon: SignalIcon },
  { key: "recipes", label: "Recetas", icon: BookOpenIcon },
  { key: "applications", label: "Solicitudes", icon: UsersIcon },
  { key: "allergies", label: "Alergias", icon: ExclamationCircleIcon },
  { key: "diets", label: "Dietas", icon: TagIcon },
  { key: "categories", label: "Categorías", icon: BookOpenIcon },
  { key: "users", label: "Usuarios", icon: UsersIcon },
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
        <h3 className="text-sm font-bold text-gray-700">{title}</h3>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
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
      <div className="max-h-48 overflow-y-auto space-y-1.5">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.nameEs}</p>
                {item.nameEn && <p className="text-xs text-gray-400">{item.nameEn}</p>}
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
          <p className="py-3 text-center text-xs text-gray-400">Sin elementos. Añade el primero.</p>
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
    <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
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
            <div className="space-y-1.5">
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
              <div className="flex gap-1.5">
                <button
                  onClick={() => updateRecipe.mutate({ id: recipe.id, name: editName, description: editDesc })}
                  disabled={updateRecipe.isPending}
                  className="flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  <CheckIcon className="h-3 w-3" /> Guardar
                </button>
                <button
                  onClick={() => { setEditing(false); setEditName(recipe.name ?? ""); setEditDesc(recipe.description ?? ""); }}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                >
                  <XMarkIcon className="h-3 w-3" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-800">{recipe.name}</p>
                <p className="line-clamp-2 text-xs text-gray-400">{recipe.description || "Sin descripción"}</p>
                <p className="mt-0.5 text-xs text-gray-300">ID #{recipe.id} · {recipe.userName ?? "—"}</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                title="Editar"
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
  const { data: users } = trpc.admin.users.useQuery({});
  const { data: applications, isLoading: appsLoading } = trpc.buddyApplications.listPending.useQuery(
    { status: appFilter },
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

  const reviewApplication = trpc.buddyApplications.review.useMutation({
    onSuccess: (_data, vars) => {
      utils.buddyApplications.listPending.invalidate();
      toast.success((vars as any).action === "approve" ? "✅ Solicitud aprobada" : "❌ Solicitud rechazada");
    },
    onError: (err: any) => toast.error(err.message),
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

  if (user?.role !== "admin") {
    return (
      <div className="vively-page container text-center">
        <ShieldCheckIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-700">Acceso restringido</h2>
        <p className="mt-1 text-sm text-gray-500">Solo los administradores pueden acceder a esta sección.</p>
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
          <h1 className="text-xl font-extrabold text-gray-900">Panel Admin</h1>
          <p className="text-xs text-gray-400">Gestión de BuddyMarket</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
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
                <p className="text-xl font-extrabold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="vively-card">
            <h3 className="mb-2 text-sm font-bold text-gray-700">Accesos rápidos</h3>
            <div className="space-y-2">
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
                  className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {item.label}
                  <span className="text-gray-400">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
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
              <h3 className="text-sm font-bold text-gray-700">
                Recetas
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                  {recipesData?.total ?? "…"}
                </span>
              </h3>
              <p className="text-xs text-gray-400">Toca 📷 para añadir foto · ✏️ para editar</p>
            </div>
            {/* Search */}
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                <p className="py-6 text-center text-sm text-gray-400">No se encontraron recetas</p>
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
                  className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-200"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-gray-400">
                  {recipeOffset + 1}–{Math.min(recipeOffset + RECIPE_LIMIT, recipesData.total)} de {recipesData.total}
                </span>
                <button
                  onClick={() => setRecipeOffset(recipeOffset + RECIPE_LIMIT)}
                  disabled={recipeOffset + RECIPE_LIMIT >= recipesData.total}
                  className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:opacity-40 hover:bg-gray-200"
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
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map(s => (
              <button
                key={s}
                onClick={() => setAppFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  appFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {s === "pending" ? "⏳ Pendientes" : s === "approved" ? "✅ Aprobadas" : "❌ Rechazadas"}
              </button>
            ))}
          </div>

          {appsLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" /></div>
          ) : !applications?.length ? (
            <div className="vively-card text-center py-8 text-gray-400">
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
                        <p className="font-bold text-sm text-gray-900">{app.displayName || appUser.name || "Sin nombre"}</p>
                        <p className="text-xs text-gray-400">{appUser.email} · {app.type === "expert" ? "BuddyExpert" : "BuddyMaker"}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      app.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>{app.status}</span>
                  </div>

                  {app.specialty && <p className="text-xs text-gray-600"><span className="font-medium">Especialidad:</span> {app.specialty}</p>}
                  {app.expertCategory && <p className="text-xs text-gray-600"><span className="font-medium">Categoría:</span> {app.expertCategory}</p>}
                  {app.motivation && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Motivación</p>
                      <p className="text-xs text-gray-700">{app.motivation}</p>
                    </div>
                  )}
                  {app.experience && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Experiencia</p>
                      <p className="text-xs text-gray-700">{app.experience}</p>
                    </div>
                  )}
                  {app.certifications && <p className="text-xs text-gray-600"><span className="font-medium">Certificaciones:</span> {app.certifications}</p>}
                  {app.instagramHandle && <p className="text-xs text-gray-600">📸 {app.instagramHandle}</p>}

                  {app.status === "pending" && (
                    <div className="space-y-2 pt-1 border-t border-gray-100">
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
                    <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">Nota admin: "{app.adminNote}"</p>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div className="vively-card space-y-3">
          <h3 className="text-sm font-bold text-gray-700">
            Usuarios registrados
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {users?.length ?? 0}
            </span>
          </h3>
          <div className="max-h-[70vh] overflow-y-auto space-y-3">
            {(users ?? []).map((u: any) => {
              const planLabel = u.subscription?.status === "active"
                ? (u.subscription?.plan === "pro_max" ? "Pro Max" : "Pro")
                : "Free";
              const planColor = u.subscription?.status === "active"
                ? (u.subscription?.plan === "pro_max" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700")
                : "bg-gray-100 text-gray-500";
              return (
                <div key={u.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm space-y-3">
                  {/* User info row */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F97316]/10 text-sm font-bold text-[#F97316]">
                      {u.name ? u.name[0].toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{u.name || "Sin nombre"}</p>
                      <p className="truncate text-xs text-gray-400">{u.email || u.openId}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${planColor}`}>
                      {planLabel}
                    </span>
                  </div>
                  {/* Controls row */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Rol del sistema */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rol</p>
                      <select
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                        <option value="buddyexpert">BuddyExpert</option>
                      </select>
                    </div>
                    {/* Tipo de cuenta */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tipo</p>
                      <select
                        defaultValue={(u as any).accountType ?? "user"}
                        onChange={(e) => setUserAccountType.mutate({ userId: u.id, accountType: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        <option value="user">Usuario</option>
                        <option value="buddymaker">BuddyMaker</option>
                        <option value="buddyexpert">BuddyExpert</option>
                        <option value="business">Empresa</option>
                      </select>
                    </div>
                    {/* Plan */}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Plan</p>
                      <select
                        value={
                          u.subscription?.status === "active"
                            ? (u.subscription?.plan ?? "basic")
                            : "free"
                        }
                        onChange={(e) => setUserPlan.mutate({ userId: u.id, plan: e.target.value as any })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        <option value="free">Free</option>
                        <option value="basic">Pro (Basic)</option>
                        <option value="premium">Pro (Premium)</option>
                        <option value="pro_max">Pro Max</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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

  const statusColor = (status: string | null) => {
    if (status === "ok") return "bg-green-100 text-green-700";
    if (status === "down") return "bg-red-100 text-red-700";
    if (status === "degraded") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-500";
  };

  const statusDot = (status: string | null) => {
    if (status === "ok") return "bg-green-500";
    if (status === "down") return "bg-red-500";
    if (status === "degraded") return "bg-yellow-500";
    return "bg-gray-300";
  };

  const statusLabel = (status: string | null) => {
    if (status === "ok") return "OK";
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
          <p className="text-xs text-gray-500">Operativos</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-extrabold text-red-500">{errorCount}</p>
          <p className="text-xs text-gray-500">Con fallos</p>
        </div>
        <div className="vively-card text-center">
          <p className="text-2xl font-extrabold text-gray-400">{pendingCount}</p>
          <p className="text-xs text-gray-500">Sin comprobar</p>
        </div>
      </div>

      {/* Monitors list */}
      <div className="vively-card space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <SignalIcon className="h-4 w-4 text-[#F97316]" />
            Monitores de API
          </h3>
          <button
            onClick={() => refetchMonitors()}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
          </div>
        )}

        {!isLoading && (!monitors || monitors.length === 0) && (
          <p className="py-4 text-center text-xs text-gray-400">No hay monitores configurados.</p>
        )}

        {monitors?.map((monitor) => (
          <div
            key={monitor.id}
            className={`rounded-xl border p-3 transition-all ${
              selectedMonitorId === monitor.id ? "border-[#F97316] bg-orange-50" : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(monitor.lastStatus)}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{monitor.name}</p>
                  <p className="truncate text-xs text-gray-400">{monitor.endpoint}</p>
                  {monitor.lastCheckedAt && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-300">
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
              <div className="flex shrink-0 items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor(monitor.lastStatus)}`}>
                  {statusLabel(monitor.lastStatus)}
                </span>
                <button
                  onClick={() => recheckMutation.mutate({ monitorId: monitor.id })}
                  disabled={recheckMutation.isPending}
                  title="Recheck ahora"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm hover:bg-gray-100 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-3.5 w-3.5 ${recheckMutation.isPending ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setSelectedMonitorId(selectedMonitorId === monitor.id ? null : monitor.id)}
                  title="Ver historial"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm hover:bg-gray-100"
                >
                  <ClockIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ monitorId: monitor.id, isActive: !monitor.isActive })}
                  title={monitor.isActive ? "Pausar monitor" : "Activar monitor"}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm ${
                    monitor.isActive ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  {monitor.isActive ? <CheckIcon className="h-3.5 w-3.5" /> : <XMarkIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Logs panel */}
            {selectedMonitorId === monitor.id && (
              <div className="mt-3 border-t border-orange-100 pt-3">
                <p className="mb-2 text-xs font-semibold text-gray-500">Últimas comprobaciones</p>
                {!logs || logs.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin historial todavía.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${statusDot(log.status)}`} />
                          <span className="font-semibold text-gray-700">{statusLabel(log.status)}</span>
                          {log.httpStatus && <span className="text-gray-400">HTTP {log.httpStatus}</span>}
                          {log.latencyMs != null && <span className="text-gray-400">{log.latencyMs}ms</span>}
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

      <p className="text-center text-xs text-gray-400">
        Los monitores se comprueban automáticamente cada 5 minutos. Recibirás una notificación cuando falle un endpoint.
      </p>
    </div>
  );
}
