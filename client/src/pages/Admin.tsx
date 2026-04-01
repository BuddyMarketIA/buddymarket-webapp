import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Shield, Users, BookOpen, Tag, AlertCircle, Ruler } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

function CatalogSection({
  title,
  icon: Icon,
  items,
  onAdd,
  onDelete,
  isAdding,
}: {
  title: string;
  icon: any;
  items: { id: number; nameEs: string; nameEn?: string | null }[] | undefined;
  onAdd: (nameEs: string, nameEn?: string) => void;
  onDelete: (id: number) => void;
  isAdding: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="w-4.5 h-4.5 text-primary" />
            {title}
            {items && <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Añadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir {title.toLowerCase()}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Nombre en español *</Label>
                  <Input value={nameEs} onChange={(e) => setNameEs(e.target.value)} placeholder="Nombre en español" />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre en inglés</Label>
                  <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Name in English" />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!nameEs.trim()) return;
                    onAdd(nameEs.trim(), nameEn.trim() || undefined);
                    setNameEs("");
                    setNameEn("");
                    setOpen(false);
                  }}
                  disabled={isAdding}
                >
                  {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Añadir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!items ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-9 bg-muted rounded animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin elementos</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
                <div>
                  <span className="text-sm text-foreground">{item.nameEs}</span>
                  {item.nameEn && <span className="text-xs text-muted-foreground ml-2">({item.nameEn})</span>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { user } = useAuth();

  const { data: adminStats } = trpc.admin.stats.useQuery();
  const { data: allergies } = trpc.catalogs.allergies.useQuery();
  const { data: restrictions } = trpc.catalogs.dietRestrictions.useQuery();
  const { data: categories } = trpc.catalogs.foodCategories.useQuery();
  const { data: measures } = trpc.catalogs.measures.useQuery();
  const utils = trpc.useUtils();

  const addAllergy = trpc.admin.createAllergy.useMutation({
    onSuccess: () => { utils.catalogs.allergies.invalidate(); toast.success("Alergia añadida"); },
  });
  const deleteAllergy = trpc.admin.deleteAllergy.useMutation({
    onSuccess: () => { utils.catalogs.allergies.invalidate(); toast.success("Alergia eliminada"); },
  });

  const addRestriction = trpc.admin.createDietRestriction.useMutation({
    onSuccess: () => { utils.catalogs.dietRestrictions.invalidate(); toast.success("Restricción añadida"); },
  });
  const deleteRestriction = trpc.admin.deleteDietRestriction.useMutation({
    onSuccess: () => { utils.catalogs.dietRestrictions.invalidate(); toast.success("Restricción eliminada"); },
  });

  const addCategory = trpc.admin.createFoodCategory.useMutation({
    onSuccess: () => { utils.catalogs.foodCategories.invalidate(); toast.success("Categoría añadida"); },
  });
  const deleteCategory = trpc.admin.deleteFoodCategory.useMutation({
    onSuccess: () => { utils.catalogs.foodCategories.invalidate(); toast.success("Categoría eliminada"); },
  });

  const addMeasure = trpc.admin.createMeasure.useMutation({
    onSuccess: () => { utils.catalogs.measures.invalidate(); toast.success("Medida añadida"); },
  });
  const deleteMeasure = trpc.admin.deleteMeasure.useMutation({
    onSuccess: () => { utils.catalogs.measures.invalidate(); toast.success("Medida eliminada"); },
  });

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Shield className="w-12 h-12 text-muted-foreground/30" />
          <h2 className="text-lg font-semibold text-foreground">Acceso restringido</h2>
          <p className="text-sm text-muted-foreground">Solo los administradores pueden acceder a esta sección.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Volver al inicio</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Panel de Administración
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los catálogos y configuración de la plataforma</p>
        </div>

        {/* Stats */}
        {adminStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Usuarios", value: adminStats.totalUsers, icon: Users },
              { label: "Recetas", value: adminStats.totalRecipes, icon: BookOpen },
              { label: "Ingredientes", value: adminStats.totalIngredients, icon: Tag },
              { label: "Menús", value: adminStats.totalMenus, icon: AlertCircle },
            ].map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="allergies">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="allergies" className="text-xs">Alergias</TabsTrigger>
            <TabsTrigger value="restrictions" className="text-xs">Restricciones</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categorías</TabsTrigger>
            <TabsTrigger value="measures" className="text-xs">Medidas</TabsTrigger>
          </TabsList>

          <TabsContent value="allergies">
            <CatalogSection
              title="Alergias alimentarias"
              icon={AlertCircle}
              items={allergies}
              onAdd={(nameEs, nameEn) => addAllergy.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
              onDelete={(id) => { if (confirm("¿Eliminar esta alergia?")) deleteAllergy.mutate({ id }); }}
              isAdding={addAllergy.isPending}
            />
          </TabsContent>

          <TabsContent value="restrictions">
            <CatalogSection
              title="Restricciones dietéticas"
              icon={Tag}
              items={restrictions}
              onAdd={(nameEs, nameEn) => addRestriction.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
              onDelete={(id) => { if (confirm("¿Eliminar esta restricción?")) deleteRestriction.mutate({ id }); }}
              isAdding={addRestriction.isPending}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CatalogSection
              title="Categorías de alimentos"
              icon={BookOpen}
              items={categories}
              onAdd={(nameEs, nameEn) => addCategory.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
              onDelete={(id) => { if (confirm("¿Eliminar esta categoría?")) deleteCategory.mutate({ id }); }}
              isAdding={addCategory.isPending}
            />
          </TabsContent>

          <TabsContent value="measures">
            <CatalogSection
              title="Unidades de medida"
              icon={Ruler}
              items={measures}
              onAdd={(nameEs, nameEn) => addMeasure.mutate({ apiParam: nameEs.toLowerCase().replace(/\s+/g, '_'), nameEs, nameEn })}
              onDelete={(id) => { if (confirm("¿Eliminar esta medida?")) deleteMeasure.mutate({ id }); }}
              isAdding={addMeasure.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
