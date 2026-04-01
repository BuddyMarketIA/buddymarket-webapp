import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ShoppingListDetail({ listId, onBack }: { listId: number; onBack: () => void }) {
  const { data: listData, isLoading } = trpc.shoppingLists.getById.useQuery({ id: listId });
  const items = listData?.items;
  const utils = trpc.useUtils();

  const toggleItem = trpc.shoppingLists.toggleItem.useMutation({
    onSuccess: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });

  const removeItem = trpc.shoppingLists.removeItem.useMutation({
    onSuccess: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });

  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const addItem = trpc.shoppingLists.addItem.useMutation({
    onSuccess: () => {
      utils.shoppingLists.getById.invalidate({ id: listId });
      setNewItemName("");
      setNewItemAmount("");
      setAddOpen(false);
      toast.success("Producto añadido");
    },
  });

  const purchasedCount = items?.filter((i) => i.item.checked).length || 0;
  const totalCount = items?.length || 0;

  // Group by category
  const grouped = items?.reduce((acc: Record<string, (typeof items)[number][]>, item) => {
    const cat = item.ingredient?.nameEs ? "Ingredientes" : "Otros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, (typeof items)[number][]>) || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver
        </Button>
        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {purchasedCount}/{totalCount} comprados
        </span>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Añadir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Nombre del producto</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ej: Tomates cherry"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cantidad (opcional)</Label>
                <Input
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  placeholder="Ej: 500g, 2 unidades..."
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!newItemName.trim()) return;
                  addItem.mutate({
                    shoppingListId: listId,
                    customName: newItemName.trim(),
                    amount: newItemAmount ? parseFloat(newItemAmount) : undefined,
                  });
                }}
                disabled={addItem.isPending}
              >
                {addItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Añadir producto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(purchasedCount / totalCount) * 100}%` }}
            />
          </div>
          {purchasedCount === totalCount && totalCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4" />
              ¡Lista completada!
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</h3>
              <div className="space-y-1">
                {categoryItems.map((item) => (
                  <div
                    key={item.item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      item.item.checked ? "bg-muted/50 border-border/50" : "bg-card border-border"
                    }`}
                  >
                    <Checkbox
                      checked={item.item.checked || false}
                      onCheckedChange={() =>
                        toggleItem.mutate({ id: item.item.id })
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${item.item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.ingredient?.nameEs || item.item.customName || "Producto"}
                      </span>
                      {item.item.amount && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {item.item.amount} {item.measure?.nameEs || ""}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeItem.mutate({ id: item.item.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Lista vacía. Añade productos para empezar.</p>
        </div>
      )}
    </div>
  );
}

export default function ShoppingLists() {
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [listName, setListName] = useState("");

  const { data: lists, isLoading } = trpc.shoppingLists.list.useQuery();
  const utils = trpc.useUtils();

  const createList = trpc.shoppingLists.create.useMutation({
    onSuccess: (data) => {
      utils.shoppingLists.list.invalidate();
      setOpen(false);
      setListName("");
      if (data?.id) setSelectedList(data.id);
      toast.success("Lista creada");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteList = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => {
      utils.shoppingLists.list.invalidate();
      setSelectedList(null);
      toast.success("Lista eliminada");
    },
  });

  const selectedListData = lists?.find((l) => l.id === selectedList);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Lista de Compra
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Gestiona tus listas de la compra</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Nueva lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva lista de compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Nombre de la lista</Label>
                  <Input
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="Ej: Compra semanal"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && listName.trim()) {
                        createList.mutate({ name: listName.trim() });
                      }
                    }}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (listName.trim()) createList.mutate({ name: listName.trim() });
                  }}
                  disabled={createList.isPending}
                >
                  {createList.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Crear lista
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lists sidebar */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Mis listas</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : lists && lists.length > 0 ? (
              lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedList === list.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">{list.name}</p>
                    {list.completed && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(list.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin listas todavía</p>
              </div>
            )}
          </div>

          {/* List detail */}
          <div className="lg:col-span-2">
            {selectedList && selectedListData ? (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedListData.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8"
                      onClick={() => {
                        if (confirm("¿Eliminar esta lista?")) {
                          deleteList.mutate({ id: selectedList });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ShoppingListDetail listId={selectedList} onBack={() => setSelectedList(null)} />
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-border">
                <div className="text-center">
                  <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Selecciona una lista para ver sus productos</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
