import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Calendar,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function MenuCard({ menu, onDelete }: { menu: any; onDelete: (id: number) => void }) {
  const startDate = new Date(menu.startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const endDate = new Date(menu.endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const typeLabel = { weekly: "Semanal", monthly: "Mensual", custom: "Personalizado" }[menu.type as string] || menu.type;

  return (
    <Card className="border-border hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-foreground text-sm truncate">{menu.name}</h3>
              {menu.generatedByAI && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  IA
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{startDate} — {endDate}</p>
            {menu.objective && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{menu.objective}</p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" asChild>
            <Link href={`/menus/${menu.id}`}>
              Ver menú <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(menu.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Menus() {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("weekly");
  const [objective, setObjective] = useState("");
  const [aiObjective, setAiObjective] = useState("");
  const [aiPreferences, setAiPreferences] = useState("");

  const { data: menus, isLoading } = trpc.menus.list.useQuery();
  const utils = trpc.useUtils();

  const createMenu = trpc.menus.create.useMutation({
    onSuccess: () => {
      utils.menus.list.invalidate();
      setOpen(false);
      setName("");
      setStartDate("");
      setEndDate("");
      toast.success("Menú creado correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const generateAI = trpc.menus.generateWithAI.useMutation({
    onSuccess: () => {
      utils.menus.list.invalidate();
      setAiOpen(false);
      toast.success("Menú generado con IA");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMenu = trpc.menus.delete.useMutation({
    onSuccess: () => {
      utils.menus.list.invalidate();
      toast.success("Menú eliminado");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    createMenu.mutate({ name, startDate, endDate, type: type as any, objective: objective || undefined });
  };

  const handleGenerateAI = (e: React.FormEvent) => {
    e.preventDefault();
    generateAI.mutate({
      objective: aiObjective || undefined,
      preferences: aiPreferences || undefined,
      days: 7,
      mealsPerDay: 4,
    });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Organizador de Menús
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Planifica tus comidas semanales y mensuales</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={aiOpen} onOpenChange={setAiOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generar con IA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generar menú con IA</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGenerateAI} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Objetivo nutricional</Label>
                    <Input
                      value={aiObjective}
                      onChange={(e) => setAiObjective(e.target.value)}
                      placeholder="Ej: Perder peso, ganar músculo, dieta mediterránea..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preferencias adicionales</Label>
                    <Textarea
                      value={aiPreferences}
                      onChange={(e) => setAiPreferences(e.target.value)}
                      placeholder="Ej: Sin gluten, vegetariano, máximo 30 min de preparación..."
                      rows={3}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={generateAI.isPending}>
                    {generateAI.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando menú...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generar menú semanal
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nuevo menú
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nuevo menú</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="menuName">Nombre *</Label>
                    <Input
                      id="menuName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Menú semana 1"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate">Fecha inicio *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate">Fecha fin *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="objective">Objetivo (opcional)</Label>
                    <Input
                      id="objective"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Ej: Dieta equilibrada, perder peso..."
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMenu.isPending}>
                    {createMenu.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear menú
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Menus grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : menus && menus.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                onDelete={(id) => {
                  if (confirm("¿Eliminar este menú?")) deleteMenu.mutate({ id });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Sin menús planificados</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Crea tu primer menú semanal o genera uno automáticamente con IA
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setAiOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generar con IA
              </Button>
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear menú
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
