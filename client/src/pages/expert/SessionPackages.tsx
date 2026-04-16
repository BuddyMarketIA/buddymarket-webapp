import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SessionPackages() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sessionsCount: "5",
    price: "",
  });

  const { data: packages, isLoading, refetch } = trpc.sessionPackages.getMyPackages.useQuery(
    undefined,
    { enabled: !!user }
  );

  const createMutation = trpc.sessionPackages.createPackage.useMutation({
    onSuccess: () => {
      toast.success("✅ Paquete creado correctamente");
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message || "Error al crear el paquete"),
  });

  const updateMutation = trpc.sessionPackages.updatePackage.useMutation({
    onSuccess: () => {
      toast.success("✅ Paquete actualizado");
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message || "Error al actualizar"),
  });

  const deleteMutation = trpc.sessionPackages.deletePackage.useMutation({
    onSuccess: () => { toast.success("Paquete eliminado"); refetch(); },
    onError: (e) => toast.error(e.message || "Error al eliminar"),
  });

  const toggleActiveMutation = trpc.sessionPackages.updatePackage.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ name: "", description: "", sessionsCount: "5", price: "" });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (pkg: NonNullable<typeof packages>[number]) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      sessionsCount: pkg.sessionsCount.toString(),
      price: pkg.price.toString(),
    });
    setShowModal(true);
  };

  const handleSave = () => {
    const sessionsCount = parseInt(form.sessionsCount);
    const price = parseFloat(form.price);
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    if (isNaN(sessionsCount) || sessionsCount < 1) return toast.error("Número de sesiones inválido");
    if (isNaN(price) || price < 0.5) return toast.error("El precio mínimo es 0.50 €");

    if (editingId) {
      updateMutation.mutate({ id: editingId, name: form.name, description: form.description, sessionsCount, price });
    } else {
      createMutation.mutate({ name: form.name, description: form.description, sessionsCount, price });
    }
  };

  const pricePerSession = (pkg: NonNullable<typeof packages>[number]) =>
    (pkg.price / pkg.sessionsCount).toFixed(2);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎟️ Paquetes de Sesiones</h1>
            <p className="text-sm text-gray-500 mt-1">Define bonos de sesiones que tus pacientes pueden adquirir</p>
          </div>
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
            + Nuevo paquete
          </Button>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">¿Cómo funcionan los paquetes?</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Crea bonos de 5, 10 o más sesiones con precio fijo. Desde la ficha de cada paciente podrás
              asignarles un paquete o enviarles un enlace de pago Stripe. Cada vez que realices una sesión,
              descuenta una del bono.
            </p>
          </div>
        </div>

        {/* Lista de paquetes */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : !packages || packages.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-3">🎟️</div>
            <p className="text-gray-600 font-semibold text-lg">Sin paquetes todavía</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Crea tu primer bono de sesiones para ofrecerlo a tus pacientes</p>
            <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
              + Crear primer paquete
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
                  pkg.isActive ? "border-gray-200 shadow-sm" : "border-gray-100 opacity-60"
                }`}
              >
                {/* Badge activo/inactivo */}
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {pkg.isActive ? "● Activo" : "○ Inactivo"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(pkg.createdAt).toLocaleDateString("es-ES")}
                  </span>
                </div>

                {/* Nombre y descripción */}
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                  )}
                </div>

                {/* Métricas */}
                <div className="flex gap-3">
                  <div className="flex-1 text-center bg-orange-50 rounded-xl py-2">
                    <div className="text-xl font-bold text-orange-600">{pkg.sessionsCount}</div>
                    <div className="text-xs text-gray-500">sesiones</div>
                  </div>
                  <div className="flex-1 text-center bg-green-50 rounded-xl py-2">
                    <div className="text-xl font-bold text-green-600">{pkg.price.toFixed(0)}€</div>
                    <div className="text-xs text-gray-500">precio total</div>
                  </div>
                  <div className="flex-1 text-center bg-blue-50 rounded-xl py-2">
                    <div className="text-xl font-bold text-blue-600">{pricePerSession(pkg)}€</div>
                    <div className="text-xs text-gray-500">por sesión</div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(pkg)}
                    className="flex-1 text-xs"
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActiveMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                    className={`flex-1 text-xs ${pkg.isActive ? "text-yellow-600 border-yellow-300" : "text-green-600 border-green-300"}`}
                  >
                    {pkg.isActive ? "⏸ Pausar" : "▶ Activar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("¿Eliminar este paquete?")) {
                        deleteMutation.mutate({ id: pkg.id });
                      }
                    }}
                    className="text-red-500 border-red-200 hover:bg-red-50 px-2"
                  >
                    🗑
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "✏️ Editar paquete" : "🎟️ Nuevo paquete de sesiones"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre del paquete *</Label>
              <Input
                placeholder="Ej: Bono 5 sesiones"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Qué incluye este bono..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Número de sesiones *</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="5"
                  value={form.sessionsCount}
                  onChange={e => setForm(prev => ({ ...prev, sessionsCount: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Precio total (€) *</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.01"
                  placeholder="150.00"
                  value={form.price}
                  onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            {form.sessionsCount && form.price && !isNaN(parseFloat(form.price)) && !isNaN(parseInt(form.sessionsCount)) && (
              <div className="bg-orange-50 rounded-xl p-3 text-sm text-orange-700">
                💡 Precio por sesión: <strong>{(parseFloat(form.price) / parseInt(form.sessionsCount)).toFixed(2)} €</strong>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingId ? "Actualizar" : "Crear paquete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
