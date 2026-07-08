import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import SavedMenusGrid from "@/components/SavedMenusGrid";
import { usePlan } from "@/hooks/usePlan";
import { UpgradeGate, UpgradeModal } from "@/components/UpgradeGate";

export default function SpecialMenus() {
  const { isFree, tier } = usePlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    menuType: "dieta_especial" as const,
    startDate: "",
    endDate: "",
    dailyCalories: "",
    persons: "1",
    difficulty: "easy" as const,
    notes: "",
  });

  // Queries
  const { data: specialMenus = [], isLoading, refetch } = trpc.savedMenus.specialMenus.list.useQuery();

  // Mutations
  const createMutation = trpc.savedMenus.specialMenus.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        menuType: "dieta_especial",
        startDate: "",
        endDate: "",
        dailyCalories: "",
        persons: "1",
        difficulty: "easy",
        notes: "",
      });
      toast.success("Menú especial creado correctamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el menú");
    },
  });

  const duplicateMutation = trpc.savedMenus.specialMenus.duplicate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Menú duplicado correctamente");
    },
  });

  const deleteMutation = trpc.savedMenus.specialMenus.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Menú eliminado correctamente");
    },
  });

  const exportPDFMutation = trpc.savedMenus.specialMenus.exportPDF.useMutation({
    onSuccess: (data) => {
      // El PDF se genera en el servidor y se descarga directamente
      toast.success("Menú exportado correctamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al exportar el menú");
    },
  });

  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      menuType: formData.menuType,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      dailyCalories: formData.dailyCalories ? parseInt(formData.dailyCalories) : undefined,
      persons: parseInt(formData.persons),
      difficulty: formData.difficulty,
      notes: formData.notes || undefined,
    });
  };

  const menuTypeLabels: Record<string, string> = {
    dieta_especial: "Dieta Especial",
    alergia: "Alergia",
    restriccion_religiosa: "Restricción Religiosa",
    preferencia_cultural: "Preferencia Cultural",
    condicion_medica: "Condición Médica",
    otro: "Otro",
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal feature="canAccessSpecializedMenus" currentTier={tier} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🍽️ Menús Especiales</h1>
          <p className="text-muted-foreground text-sm">
            Crea y gestiona menús adaptados a dietas especiales, alergias y restricciones
          </p>
        </div>
        {isFree ? (
          <Button onClick={() => setShowUpgradeModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Lock className="h-4 w-4 mr-2" />
            Desbloquear menús especiales
          </Button>
        ) : (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear menú especial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear menú especial</DialogTitle>
              <DialogDescription>
                Define un nuevo menú adaptado a necesidades especiales
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del menú *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Menú sin gluten"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el propósito de este menú"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="menuType">Tipo de menú *</Label>
                  <Select value={formData.menuType} onValueChange={(v) => setFormData({ ...formData, menuType: v as any })}>
                    <SelectTrigger id="menuType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(menuTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v as any })}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="startDate">Fecha de inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Fecha de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="persons">Personas</Label>
                  <Input
                    id="persons"
                    type="number"
                    min="1"
                    value={formData.persons}
                    onChange={(e) => setFormData({ ...formData, persons: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="dailyCalories">Calorías diarias</Label>
                  <Input
                    id="dailyCalories"
                    type="number"
                    value={formData.dailyCalories}
                    onChange={(e) => setFormData({ ...formData, dailyCalories: e.target.value })}
                    placeholder="Ej: 2000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre este menú"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear menú especial"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Free plan upgrade banner */}
      {isFree && (
        <div
          className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-center gap-4 cursor-pointer"
          onClick={() => setShowUpgradeModal(true)}
        >
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-orange-800">Menús especiales — funcionalidad Pro</p>
            <p className="text-xs text-orange-600/80 mt-0.5">Crea menús adaptados a dietas especiales, alergias y condiciones médicas. Actualiza tu plan para acceder.</p>
          </div>
          <span className="text-xs font-extrabold text-orange-500 bg-orange-100 px-3 py-1.5 rounded-full flex-shrink-0">PRO</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Todos los menús</TabsTrigger>
          <TabsTrigger value="by-type">Por tipo</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <SavedMenusGrid
            menus={specialMenus}
            isLoading={isLoading}
            onDuplicate={(menuId) => duplicateMutation.mutate({ menuId })}
            onDelete={(menuId) => deleteMutation.mutate({ menuId })}
            onExport={(menuId) => exportPDFMutation.mutate({ menuId })}
            emptyMessage="No hay menús especiales creados aún"
            isDuplicating={duplicateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            isExporting={exportPDFMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="by-type" className="mt-6 space-y-6">
          {Object.entries(menuTypeLabels).map(([type, label]) => {
            const filtered = specialMenus.filter((m) => m.menuType === type);
            return (
              <div key={type}>
                <h3 className="text-lg font-semibold mb-4">{label}</h3>
                {filtered.length > 0 ? (
                  <SavedMenusGrid
                    menus={filtered}
                    isLoading={false}
                    onDuplicate={(menuId) => duplicateMutation.mutate({ menuId })}
                    onDelete={(menuId) => deleteMutation.mutate({ menuId })}
                    onExport={(menuId) => exportPDFMutation.mutate({ menuId })}
                    isDuplicating={duplicateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                    isExporting={exportPDFMutation.isPending}
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No hay menús de tipo "{label}"
                  </p>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
