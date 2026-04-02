import { trpc } from "@/lib/trpc";
import { useState } from "react";
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
} from "@heroicons/react/24/outline";

const TABS = [
  { key: "overview", label: "Resumen", icon: ShieldCheckIcon },
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

  if (user?.role !== "admin") {
    return (
      <div className="vively-page container text-center">
        <ShieldCheckIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <h2 className="text-lg font-bold text-gray-700">Acceso restringido</h2>
        <p className="mt-1 text-sm text-gray-500">Solo los administradores pueden acceder a esta sección.</p>
        <Link href="/dashboard" className="btn-vively mt-4 inline-block">
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
          <p className="text-xs text-gray-400">Gestión de VIVELY</p>
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

      {/* Allergies */}
      {activeTab === "allergies" && (
        <CatalogSection
          title="Alergias alimentarias"
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
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {(users ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F97316]/10 text-sm font-bold text-[#F97316]">
                  {u.name ? u.name[0].toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">{u.name || "Sin nombre"}</p>
                  <p className="truncate text-xs text-gray-400">{u.email || u.openId}</p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as any })}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
