import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, AlertCircle, Heart, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/lib/auth";

export default function BuddyKids() {
  const { user } = useAuth();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAllergyOpen, setIsAllergyOpen] = useState(false);
  const [isHabitOpen, setIsHabitOpen] = useState(false);

  // Queries
  const { data: childProfiles, isLoading: loadingProfiles, refetch: refetchProfiles } = trpc.buddyKids.getChildProfiles.useQuery();
  const { data: selectedChildData } = trpc.buddyKids.getChildProfile.useQuery(
    { childId: selectedChild! },
    { enabled: !!selectedChild }
  );
  const { data: allergies } = trpc.buddyKids.getChildAllergies.useQuery(
    { childId: selectedChild! },
    { enabled: !!selectedChild }
  );
  const { data: habits } = trpc.buddyKids.getChildHabits.useQuery(
    { childId: selectedChild! },
    { enabled: !!selectedChild }
  );

  // Mutations
  const createChildMutation = trpc.buddyKids.createChildProfile.useMutation({
    onSuccess: () => {
      refetchProfiles();
      setIsCreateOpen(false);
    },
  });

  const deleteChildMutation = trpc.buddyKids.deleteChildProfile.useMutation({
    onSuccess: () => {
      refetchProfiles();
      setSelectedChild(null);
    },
  });

  const addAllergyMutation = trpc.buddyKids.addChildAllergy.useMutation({
    onSuccess: () => {
      setIsAllergyOpen(false);
    },
  });

  const deleteAllergyMutation = trpc.buddyKids.deleteChildAllergy.useMutation();

  const createHabitMutation = trpc.buddyKids.createChildHabit.useMutation({
    onSuccess: () => {
      setIsHabitOpen(false);
    },
  });

  const logHabitMutation = trpc.buddyKids.logHabitProgress.useMutation();

  const handleCreateChild = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createChildMutation.mutate({
      name: formData.get("name") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      ageGroup: formData.get("ageGroup") as "1_3" | "4_6" | "7_12" | "13_17",
      gender: (formData.get("gender") as "male" | "female" | "other") || undefined,
      objective: (formData.get("objective") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleAddAllergy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedChild) return;

    const formData = new FormData(e.currentTarget);
    addAllergyMutation.mutate({
      childId: selectedChild,
      allergyType: formData.get("allergyType") as any,
      allergyName: formData.get("allergyName") as string,
      severity: (formData.get("severity") as any) || "moderate",
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleCreateHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedChild) return;

    const formData = new FormData(e.currentTarget);
    createHabitMutation.mutate({
      childId: selectedChild,
      habitType: formData.get("habitType") as any,
      habitName: formData.get("habitName") as string,
      dailyTarget: formData.get("dailyTarget") ? parseInt(formData.get("dailyTarget") as string) : undefined,
      unit: (formData.get("unit") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleLogHabit = (habitId: number) => {
    logHabitMutation.mutate({
      habitId,
      logDate: new Date().toISOString().split("T")[0],
      completed: 1,
    });
  };

  if (!user) {
    return <div className="p-8 text-center">Por favor inicia sesión</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">BuddyKids</h1>
          <p className="text-gray-600">Nutrición, hábitos y bienestar para tus niños</p>
        </div>

        {/* Create Child Button */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6 bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Añadir niño
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear perfil de niño</DialogTitle>
              <DialogDescription>Añade un nuevo niño a tu familia</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChild} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
              </div>
              <div>
                <Label htmlFor="ageGroup">Grupo de edad</Label>
                <Select name="ageGroup" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_3">1-3 años</SelectItem>
                    <SelectItem value="4_6">4-6 años</SelectItem>
                    <SelectItem value="7_12">7-12 años</SelectItem>
                    <SelectItem value="13_17">13-17 años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="gender">Género</Label>
                <Select name="gender">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="objective">Objetivo</Label>
                <Input id="objective" name="objective" placeholder="Ej: Comer más verdura" />
              </div>
              <Button type="submit" className="w-full">Crear perfil</Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Child Profiles Grid */}
        {loadingProfiles ? (
          <div className="text-center py-12">Cargando...</div>
        ) : !childProfiles || childProfiles.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-500 mb-4">No tienes niños añadidos aún</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Crear primer perfil
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {childProfiles.map((child) => (
              <Card
                key={child.id}
                className={`cursor-pointer transition-all ${selectedChild === child.id ? "ring-2 ring-purple-600" : ""}`}
                onClick={() => setSelectedChild(child.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{child.name}</CardTitle>
                  <CardDescription>{child.ageGroup.replace("_", "-")} años</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 mb-4">
                    {child.objective && <p>Objetivo: {child.objective}</p>}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChildMutation.mutate({ childId: child.id });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Selected Child Details */}
        {selectedChild && selectedChildData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedChildData.name}</CardTitle>
                <CardDescription>Perfil del niño</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Edad</p>
                    <p className="font-semibold">{selectedChildData.ageGroup}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Género</p>
                    <p className="font-semibold">{selectedChildData.gender || "No especificado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Altura</p>
                    <p className="font-semibold">{selectedChildData.height || "No registrada"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peso</p>
                    <p className="font-semibold">{selectedChildData.weight || "No registrado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different sections */}
            <Tabs defaultValue="allergies" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="allergies">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Alergias
                </TabsTrigger>
                <TabsTrigger value="habits">
                  <Zap className="w-4 h-4 mr-2" />
                  Hábitos
                </TabsTrigger>
                <TabsTrigger value="menus">
                  <Heart className="w-4 h-4 mr-2" />
                  Menús
                </TabsTrigger>
              </TabsList>

              {/* Allergies Tab */}
              <TabsContent value="allergies">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Alergias e Intolerancias</CardTitle>
                      <Dialog open={isAllergyOpen} onOpenChange={setIsAllergyOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Añadir alergia
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Registrar alergia</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleAddAllergy} className="space-y-4">
                            <div>
                              <Label htmlFor="allergyType">Tipo de alergia</Label>
                              <Select name="allergyType" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gluten">Gluten</SelectItem>
                                  <SelectItem value="lactose">Lactosa</SelectItem>
                                  <SelectItem value="nuts">Frutos secos</SelectItem>
                                  <SelectItem value="peanuts">Cacahuetes</SelectItem>
                                  <SelectItem value="shellfish">Mariscos</SelectItem>
                                  <SelectItem value="eggs">Huevos</SelectItem>
                                  <SelectItem value="soy">Soja</SelectItem>
                                  <SelectItem value="sesame">Sésamo</SelectItem>
                                  <SelectItem value="fish">Pescado</SelectItem>
                                  <SelectItem value="other">Otra</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="allergyName">Nombre del alérgeno</Label>
                              <Input id="allergyName" name="allergyName" required />
                            </div>
                            <div>
                              <Label htmlFor="severity">Severidad</Label>
                              <Select name="severity">
                                <SelectTrigger>
                                  <SelectValue placeholder="Moderada" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mild">Leve</SelectItem>
                                  <SelectItem value="moderate">Moderada</SelectItem>
                                  <SelectItem value="severe">Severa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" className="w-full">Registrar alergia</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!allergies || allergies.length === 0 ? (
                      <p className="text-gray-500">No hay alergias registradas</p>
                    ) : (
                      <div className="space-y-2">
                        {allergies.map((allergy) => (
                          <div key={allergy.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <div>
                              <p className="font-semibold">{allergy.allergyName}</p>
                              <p className="text-sm text-gray-600">Severidad: {allergy.severity}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAllergyMutation.mutate({ allergyId: allergy.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Habits Tab */}
              <TabsContent value="habits">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Hábitos Saludables</CardTitle>
                      <Dialog open={isHabitOpen} onOpenChange={setIsHabitOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Crear hábito
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Crear nuevo hábito</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateHabit} className="space-y-4">
                            <div>
                              <Label htmlFor="habitType">Tipo de hábito</Label>
                              <Select name="habitType" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="water">Hidratación</SelectItem>
                                  <SelectItem value="fruit_vegetable">Frutas y verduras</SelectItem>
                                  <SelectItem value="sleep">Sueño</SelectItem>
                                  <SelectItem value="activity">Actividad física</SelectItem>
                                  <SelectItem value="breakfast">Desayuno</SelectItem>
                                  <SelectItem value="ultraprocesados">Evitar ultraprocesados</SelectItem>
                                  <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="habitName">Nombre del hábito</Label>
                              <Input id="habitName" name="habitName" required />
                            </div>
                            <div>
                              <Label htmlFor="dailyTarget">Objetivo diario</Label>
                              <Input id="dailyTarget" name="dailyTarget" type="number" />
                            </div>
                            <div>
                              <Label htmlFor="unit">Unidad</Label>
                              <Input id="unit" name="unit" placeholder="Ej: vasos, porciones, minutos" />
                            </div>
                            <Button type="submit" className="w-full">Crear hábito</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!habits || habits.length === 0 ? (
                      <p className="text-gray-500">No hay hábitos creados</p>
                    ) : (
                      <div className="space-y-2">
                        {habits.map((habit) => (
                          <div key={habit.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <p className="font-semibold">{habit.habitName}</p>
                              <p className="text-sm text-gray-600">
                                Objetivo: {habit.dailyTarget} {habit.unit}
                              </p>
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleLogHabit(habit.id)}
                            >
                              Registrar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Menus Tab */}
              <TabsContent value="menus">
                <Card>
                  <CardHeader>
                    <CardTitle>Menús Personalizados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">Los menús personalizados se generarán pronto</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
