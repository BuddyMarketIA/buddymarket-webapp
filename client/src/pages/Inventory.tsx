import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ExpirationBadge({ date }: { date: Date | null | undefined }) {
  if (!date) return null;
  const expDate = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">Caducado</Badge>;
  }
  if (diffDays <= 3) {
    return <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">Vence en {diffDays}d</Badge>;
  }
  if (diffDays <= 7) {
    return <Badge className="bg-yellow-100 text-yellow-700 border-0 text-[10px]">Vence en {diffDays}d</Badge>;
  }
  return (
    <span className="text-[10px] text-muted-foreground">
      {expDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
    </span>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [storageLocation, setStorageLocation] = useState("1");
  const [expirationDate, setExpirationDate] = useState("");

  const { data: items, isLoading } = trpc.inventory.list.useQuery();
  const { data: storageLocations } = trpc.catalogs.storageLocations.useQuery();
  const utils = trpc.useUtils();

  const addItem = trpc.inventory.add.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setOpen(false);
      setCustomName("");
      setAmount("");
      setExpirationDate("");
      toast.success("Producto añadido al inventario");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeItem = trpc.inventory.remove.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      toast.success("Producto eliminado");
    },
  });

  const filteredItems = items?.filter((item) => {
    if (!search) return true;
    const name = item.item.customName || item.ingredient?.nameEs || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // Group by storage location
  const grouped = filteredItems?.reduce((acc: Record<string, typeof filteredItems>, item) => {
    const loc = item.storageLocation?.nameEs || "Sin ubicación";
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>) || {};

  const expiringCount = items?.filter((item) => {
    if (!item.item.expirationDate) return false;
    const diffDays = Math.ceil((new Date(item.item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }).length || 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Inventario
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {items?.length || 0} productos · {expiringCount > 0 && (
                <span className="text-orange-600 font-medium">{expiringCount} próximos a vencer</span>
              )}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Añadir producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir al inventario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Nombre del producto</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ej: Leche entera"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ubicación</Label>
                    <Select value={storageLocation} onValueChange={setStorageLocation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {storageLocations?.map((loc) => (
                          <SelectItem key={loc.id} value={String(loc.id)}>
                            {loc.nameEs}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="1">Despensa</SelectItem>
                            <SelectItem value="2">Nevera</SelectItem>
                            <SelectItem value="3">Congelador</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de caducidad (opcional)</Label>
                  <Input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!customName.trim()) {
                      toast.error("El nombre es obligatorio");
                      return;
                    }
                    addItem.mutate({
                      customName: customName.trim(),
                      amount: amount ? Number(amount) : 1,
                      storageLocationId: Number(storageLocation),
                      expirationDate: expirationDate || undefined,
                    });
                  }}
                  disabled={addItem.isPending}
                >
                  {addItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Añadir al inventario
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alert for expiring */}
        {expiringCount > 0 && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
            <p className="text-sm text-orange-800">
              <strong>{expiringCount} producto{expiringCount > 1 ? "s" : ""}</strong> próximo{expiringCount > 1 ? "s" : ""} a vencer en los próximos 3 días.
              Considera usarlos pronto.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en inventario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Items */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredItems && filteredItems.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(grouped).map(([location, locationItems]) => (
              <div key={location}>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {location}
                  <Badge variant="secondary" className="text-[10px] font-normal">{locationItems.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {locationItems.map((item) => (
                    <Card key={item.item.id} className="border-border hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.ingredient?.nameEs || item.item.customName || "Producto"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.item.amount && (
                                <span className="text-xs text-muted-foreground">
                                  {item.item.amount} {item.measure?.nameEs || ""}
                                </span>
                              )}
                              <ExpirationBadge date={item.item.expirationDate} />
                            </div>
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? "Sin resultados" : "Inventario vacío"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search ? "Prueba con otro término de búsqueda" : "Añade productos para controlar tu despensa"}
            </p>
            {!search && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir primer producto
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
