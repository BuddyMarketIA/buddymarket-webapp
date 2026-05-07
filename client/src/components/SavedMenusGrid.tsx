import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Trash2, Eye, Calendar, Users, Zap } from "lucide-react";
import { toast } from "@/components/sonner-a11y-shim";

interface SavedMenu {
  id: number;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  startDate?: string;
  eventDate?: string;
  persons?: number | null;
  difficulty?: string;
  dailyCalories?: number | null;
  eventType?: string;
  menuType?: string;
  createdAt: Date;
}

interface SavedMenusGridProps {
  menus: SavedMenu[];
  isLoading: boolean;
  onDuplicate: (menuId: number) => void;
  onDelete: (menuId: number) => void;
  onView?: (menu: SavedMenu) => void;
  emptyMessage?: string;
  isDuplicating?: boolean;
  isDeleting?: boolean;
}

export default function SavedMenusGrid({
  menus,
  isLoading,
  onDuplicate,
  onDelete,
  onView,
  emptyMessage = "No hay menús guardados",
  isDuplicating = false,
  isDeleting = false,
}: SavedMenusGridProps) {
  const [selectedMenu, setSelectedMenu] = useState<SavedMenu | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleView = (menu: SavedMenu) => {
    setSelectedMenu(menu);
    setIsViewOpen(true);
    onView?.(menu);
  };

  const handleDuplicate = (menuId: number) => {
    onDuplicate(menuId);
    toast.success("Menú duplicado correctamente");
  };

  const handleDelete = (menuId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este menú?")) {
      onDelete(menuId);
      toast.success("Menú eliminado correctamente");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!menus || menus.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {menus.map((menu) => (
        <Card key={menu.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Imagen de portada */}
          {menu.coverImage ? (
            <div className="h-40 bg-muted overflow-hidden">
              <img
                src={menu.coverImage}
                alt={menu.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
              <Zap className="h-12 w-12 text-orange-300" />
            </div>
          )}

          {/* Contenido */}
          <CardHeader className="pb-3">
            <CardTitle className="text-lg line-clamp-2">{menu.name}</CardTitle>
            {menu.description && (
              <CardDescription className="line-clamp-2">
                {menu.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Información del menú */}
            <div className="flex flex-wrap gap-2">
              {menu.difficulty && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                  {menu.difficulty === "easy"
                    ? "Fácil"
                    : menu.difficulty === "medium"
                    ? "Medio"
                    : "Difícil"}
                </span>
              )}
              {menu.persons && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  <Users className="h-3 w-3" />
                  {menu.persons} {menu.persons === 1 ? "persona" : "personas"}
                </span>
              )}
              {menu.dailyCalories && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  {menu.dailyCalories} kcal
                </span>
              )}
            </div>

            {/* Fecha */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {menu.eventDate
                ? new Date(menu.eventDate).toLocaleDateString("es-ES")
                : menu.startDate
                ? new Date(menu.startDate).toLocaleDateString("es-ES")
                : "Sin fecha"}
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-2">
              <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(menu)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </DialogTrigger>
                {selectedMenu && (
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{selectedMenu.name}</DialogTitle>
                      {selectedMenu.description && (
                        <DialogDescription>{selectedMenu.description}</DialogDescription>
                      )}
                    </DialogHeader>
                    <div className="space-y-4">
                      {selectedMenu.coverImage && (
                        <img
                          src={selectedMenu.coverImage}
                          alt={selectedMenu.name}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {selectedMenu.difficulty && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Dificultad
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedMenu.difficulty === "easy"
                                ? "Fácil"
                                : selectedMenu.difficulty === "medium"
                                ? "Medio"
                                : "Difícil"}
                            </p>
                          </div>
                        )}
                        {selectedMenu.persons && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Personas
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedMenu.persons}
                            </p>
                          </div>
                        )}
                        {selectedMenu.dailyCalories && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Calorías
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedMenu.dailyCalories} kcal
                            </p>
                          </div>
                        )}
                        {(selectedMenu.eventDate || selectedMenu.startDate) && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Fecha
                            </p>
                            <p className="text-lg font-semibold">
                              {selectedMenu.eventDate
                                ? new Date(selectedMenu.eventDate).toLocaleDateString(
                                    "es-ES"
                                  )
                                : selectedMenu.startDate
                                ? new Date(selectedMenu.startDate).toLocaleDateString(
                                    "es-ES"
                                  )
                                : "Sin fecha"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                )}
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDuplicate(menu.id)}
                disabled={isDuplicating}
                title="Duplicar menú"
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(menu.id)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Eliminar menú"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
