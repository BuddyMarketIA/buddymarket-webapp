import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import SavedMenusGrid from "@/components/SavedMenusGrid";

export default function EventMenus() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventType: "fiesta" as const,
    eventDate: "",
    guestCount: "1",
    budget: "",
    difficulty: "easy" as const,
    cuisineType: "",
    notes: "",
  });

  // Queries
  const { data: eventMenus = [], isLoading, refetch } = trpc.savedMenus.eventMenus.list.useQuery();

  // Mutations
  const createMutation = trpc.savedMenus.eventMenus.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        eventType: "fiesta",
        eventDate: "",
        guestCount: "1",
        budget: "",
        difficulty: "easy",
        cuisineType: "",
        notes: "",
      });
      toast.success("Menú de evento creado correctamente");
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear el menú");
    },
  });

  const duplicateMutation = trpc.savedMenus.eventMenus.duplicate.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Menú duplicado correctamente");
    },
  });

  const deleteMutation = trpc.savedMenus.eventMenus.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Menú eliminado correctamente");
    },
  });

  const exportPDFMutation = trpc.savedMenus.eventMenus.exportPDF.useMutation({
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
    if (!formData.name || !formData.eventDate) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      eventType: formData.eventType,
      eventDate: formData.eventDate,
      guestCount: parseInt(formData.guestCount),
      budget: formData.budget || undefined,
      difficulty: formData.difficulty,
      cuisineType: formData.cuisineType || undefined,
      notes: formData.notes || undefined,
    });
  };

  const eventTypeLabels: Record<string, string> = {
    cumpleanos: "🎂 Cumpleaños",
    boda: "💒 Boda",
    aniversario: "💑 Aniversario",
    reunion_familiar: "👨‍👩‍👧‍👦 Reunión Familiar",
    comida_negocios: "💼 Comida de Negocios",
    picnic: "🧺 Picnic",
    cena_romantica: "🕯️ Cena Romántica",
    fiesta: "🎉 Fiesta",
    otro: "📋 Otro",
  };

  const cuisineTypes = [
    "Española",
    "Italiana",
    "Francesa",
    "Asiática",
    "Mexicana",
    "Vegetariana",
    "Vegana",
    "Fusión",
    "Otra",
  ];

  // Agrupar menús por mes
  const menusByMonth = eventMenus.reduce(
    (acc, menu) => {
      const date = new Date(menu.eventDate);
      const monthKey = date.toLocaleDateString("es-ES", { year: "numeric", month: "long" });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(menu);
      return acc;
    },
    {} as Record<string, typeof eventMenus>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎉 Menús de Eventos</h1>
          <p className="text-muted-foreground text-sm">
            Planifica y gestiona menús para tus eventos especiales
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Crear menú de evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear menú de evento</DialogTitle>
              <DialogDescription>
                Planifica un menú especial para tu evento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del evento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Cumpleaños de María"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el evento"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="eventType">Tipo de evento *</Label>
                  <Select value={formData.eventType} onValueChange={(v) => setFormData({ ...formData, eventType: v as any })}>
                    <SelectTrigger id="eventType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventDate">Fecha del evento *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="guestCount">Número de invitados</Label>
                  <Input
                    id="guestCount"
                    type="number"
                    min="1"
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  />
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
                  <Label htmlFor="cuisineType">Tipo de cocina</Label>
                  <Select value={formData.cuisineType} onValueChange={(v) => setFormData({ ...formData, cuisineType: v })}>
                    <SelectTrigger id="cuisineType">
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="budget">Presupuesto (€)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Ej: 500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas adicionales sobre el evento"
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear menú de evento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="by-type">Por tipo</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <SavedMenusGrid
            menus={eventMenus}
            isLoading={isLoading}
            onDuplicate={(menuId) => duplicateMutation.mutate({ menuId })}
            onDelete={(menuId) => deleteMutation.mutate({ menuId })}
            onExport={(menuId) => exportPDFMutation.mutate({ menuId })}
            emptyMessage="No hay menús de eventos creados aún"
            isDuplicating={duplicateMutation.isPending}
            isDeleting={deleteMutation.isPending}
            isExporting={exportPDFMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = eventMenus.filter((m) => new Date(m.eventDate) >= today);
            return upcoming.length > 0 ? (
              <SavedMenusGrid
                menus={upcoming}
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
                No hay eventos próximos
              </p>
            );
          })()}
        </TabsContent>

        <TabsContent value="by-type" className="mt-6 space-y-6">
          {Object.entries(eventTypeLabels).map(([type, label]) => {
            const filtered = eventMenus.filter((m) => m.eventType === type);
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
