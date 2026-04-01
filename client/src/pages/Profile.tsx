import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Heart, ShoppingBag, Target, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Profile() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: allergies } = trpc.catalogs.allergies.useQuery();
  const { data: restrictions } = trpc.catalogs.dietRestrictions.useQuery();
  const utils = trpc.useUtils();

  // Basic user info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Profile
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [cookingLevel, setCookingLevel] = useState("");
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState("");
  const [dailyMeals, setDailyMeals] = useState("");

  // Medical
  const [medicalConditions, setMedicalConditions] = useState("");
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [surgery, setSurgery] = useState("");
  const [hasSurgery, setHasSurgery] = useState(false);
  const [metabolismMedication, setMetabolismMedication] = useState("");
  const [useMetabolismMedication, setUseMetabolismMedication] = useState(false);
  const [medicalDiet, setMedicalDiet] = useState("");
  const [hasMedicalDiet, setHasMedicalDiet] = useState(false);

  // Preferences
  const [purchaseFrequency, setPurchaseFrequency] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [organicProducts, setOrganicProducts] = useState(false);
  const [suggestHealthier, setSuggestHealthier] = useState(false);

  // Allergies & restrictions
  const [selectedAllergies, setSelectedAllergies] = useState<number[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<number[]>([]);

  useEffect(() => {
    if (profile) {
      setName(profile.user.name || "");
      setPhone(profile.user.phone || "");
      setDescription(profile.user.description || "");
      if (profile.profile) {
        setHeight(profile.profile.height ? String(profile.profile.height) : "");
        setWeight(profile.profile.weight ? String(profile.profile.weight) : "");
        setTargetWeight(profile.profile.targetWeight ? String(profile.profile.targetWeight) : "");
        setGender(profile.profile.gender || "");
        setActivityLevel(profile.profile.activityLevel || "");
        setMainGoal(profile.profile.mainGoal || "");
        setCookingLevel(profile.profile.cookingLevel || "");
        setDailyCalorieGoal(profile.profile.dailyCalorieGoal ? String(profile.profile.dailyCalorieGoal) : "");
        setDailyMeals(profile.profile.dailyMeals ? String(profile.profile.dailyMeals) : "");
      }
      if (profile.medicalProfile) {
        setMedicalConditions(profile.medicalProfile.medicalConditions || "");
        setHasMedicalConditions(profile.medicalProfile.hasMedicalConditions || false);
        setSurgery(profile.medicalProfile.surgery || "");
        setHasSurgery(profile.medicalProfile.hasSurgery || false);
        setMetabolismMedication(profile.medicalProfile.metabolismMedication || "");
        setUseMetabolismMedication(profile.medicalProfile.useMetabolismMedication || false);
        setMedicalDiet(profile.medicalProfile.medicalDiet || "");
        setHasMedicalDiet(profile.medicalProfile.hasMedicalDiet || false);
      }
      if (profile.preferences) {
        setPurchaseFrequency(profile.preferences.purchaseFrequency || "");
        setPurchaseLocation(profile.preferences.purchaseLocation || "");
        setOrganicProducts(profile.preferences.organicProducts || false);
        setSuggestHealthier(profile.preferences.suggestHealthierProducts || false);
      }
      setSelectedAllergies(profile.allergies?.map((a) => a?.id).filter(Boolean) as number[] || []);
      setSelectedRestrictions(profile.dietRestrictions?.map((r) => r?.id).filter(Boolean) as number[] || []);
    }
  }, [profile]);

  const updateBasic = trpc.profile.updateBasic.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Datos básicos actualizados"); },
  });
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Perfil actualizado"); },
  });
  const updateMedical = trpc.profile.updateMedical.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Perfil médico actualizado"); },
  });
  const updatePreferences = trpc.profile.updatePreferences.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Preferencias actualizadas"); },
  });
  const setAllergies = trpc.profile.setAllergies.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Alergias actualizadas"); },
  });
  const setDietRestrictions = trpc.profile.setDietRestrictions.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Restricciones actualizadas"); },
  });

  const toggleAllergy = (id: number) => {
    setSelectedAllergies((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };
  const toggleRestriction = (id: number) => {
    setSelectedRestrictions((prev) => prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Mi Perfil
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tu información personal y preferencias</p>
        </div>

        <Tabs defaultValue="personal">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="personal" className="text-xs">
              <User className="w-3.5 h-3.5 mr-1 hidden sm:block" />Personal
            </TabsTrigger>
            <TabsTrigger value="medical" className="text-xs">
              <Heart className="w-3.5 h-3.5 mr-1 hidden sm:block" />Médico
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs">
              <ShoppingBag className="w-3.5 h-3.5 mr-1 hidden sm:block" />Compras
            </TabsTrigger>
            <TabsTrigger value="allergies" className="text-xs">
              <AlertCircle className="w-3.5 h-3.5 mr-1 hidden sm:block" />Alergias
            </TabsTrigger>
          </TabsList>

          {/* Personal */}
          <TabsContent value="personal">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Datos personales y objetivos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nombre completo</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Teléfono</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Descripción</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cuéntanos algo sobre ti..." rows={2} />
                </div>
                <Button
                  size="sm"
                  onClick={() => updateBasic.mutate({ name: name || undefined, phone: phone || undefined, description: description || undefined })}
                  disabled={updateBasic.isPending}
                >
                  {updateBasic.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Guardar datos básicos
                </Button>

                <div className="border-t border-border pt-4 space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Datos físicos y objetivos</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Género</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Femenino</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Altura (cm)</Label>
                      <Input type="number" min="100" max="250" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Peso (kg)</Label>
                      <Input type="number" min="30" max="300" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Objetivo principal</Label>
                      <Select value={mainGoal} onValueChange={setMainGoal}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lose_weight">Perder peso</SelectItem>
                          <SelectItem value="gain_muscle">Ganar músculo</SelectItem>
                          <SelectItem value="maintain">Mantener peso</SelectItem>
                          <SelectItem value="improve_health">Mejorar salud</SelectItem>
                          <SelectItem value="eat_healthier">Comer más sano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Actividad física</Label>
                      <Select value={activityLevel} onValueChange={setActivityLevel}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentario</SelectItem>
                          <SelectItem value="light">Ligero</SelectItem>
                          <SelectItem value="moderate">Moderado</SelectItem>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="very_active">Muy activo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nivel de cocina</Label>
                      <Select value={cookingLevel} onValueChange={setCookingLevel}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Principiante</SelectItem>
                          <SelectItem value="intermediate">Intermedio</SelectItem>
                          <SelectItem value="advanced">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Comidas al día</Label>
                      <Input type="number" min="1" max="10" value={dailyMeals} onChange={(e) => setDailyMeals(e.target.value)} placeholder="3" />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => updateProfile.mutate({
                      height: height ? Number(height) : undefined,
                      weight: weight ? Number(weight) : undefined,
                      gender: gender as any || undefined,
                      activityLevel: activityLevel as any || undefined,
                      mainGoal: mainGoal as any || undefined,
                      cookingLevel: cookingLevel as any || undefined,
                      dailyCalorieGoal: dailyCalorieGoal ? Number(dailyCalorieGoal) : undefined,
                      dailyMeals: dailyMeals ? Number(dailyMeals) : undefined,
                    })}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Guardar perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical */}
          <TabsContent value="medical">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4.5 h-4.5 text-primary" />
                  Perfil médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  Esta información es confidencial y se usa para personalizar tus recomendaciones nutricionales.
                </div>

                {[
                  { label: "Condiciones médicas", value: medicalConditions, setter: setMedicalConditions, hasSwitch: hasMedicalConditions, switchSetter: setHasMedicalConditions, placeholder: "Ej: Diabetes tipo 2, hipertensión..." },
                  { label: "Cirugías o intervenciones", value: surgery, setter: setSurgery, hasSwitch: hasSurgery, switchSetter: setHasSurgery, placeholder: "Ej: Apendicectomía 2015..." },
                  { label: "Medicación para el metabolismo", value: metabolismMedication, setter: setMetabolismMedication, hasSwitch: useMetabolismMedication, switchSetter: setUseMetabolismMedication, placeholder: "Ej: Metformina, Levotiroxina..." },
                  { label: "Dieta médica prescrita", value: medicalDiet, setter: setMedicalDiet, hasSwitch: hasMedicalDiet, switchSetter: setHasMedicalDiet, placeholder: "Ej: Dieta baja en sodio, sin gluten..." },
                ].map((field) => (
                  <div key={field.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{field.label}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Tengo</span>
                        <Switch checked={field.hasSwitch} onCheckedChange={field.switchSetter} />
                      </div>
                    </div>
                    {field.hasSwitch && (
                      <Textarea
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        rows={2}
                      />
                    )}
                  </div>
                ))}

                <Button
                  size="sm"
                  onClick={() => updateMedical.mutate({
                    medicalConditions: medicalConditions || undefined,
                    hasMedicalConditions,
                    surgery: surgery || undefined,
                    hasSurgery,
                    metabolismMedication: metabolismMedication || undefined,
                    useMetabolismMedication,
                    medicalDiet: medicalDiet || undefined,
                    hasMedicalDiet,
                  })}
                  disabled={updateMedical.isPending}
                >
                  {updateMedical.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Guardar perfil médico
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="w-4.5 h-4.5 text-primary" />
                  Preferencias de compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Frecuencia de compra</Label>
                    <Select value={purchaseFrequency} onValueChange={setPurchaseFrequency}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diaria</SelectItem>
                        <SelectItem value="twice_week">2 veces/semana</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Lugar habitual de compra</Label>
                    <Input value={purchaseLocation} onChange={(e) => setPurchaseLocation(e.target.value)} placeholder="Ej: Mercadona, Carrefour..." />
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Prefiero productos orgánicos/ecológicos", value: organicProducts, setter: setOrganicProducts },
                    { label: "Sugerir alternativas más saludables", value: suggestHealthier, setter: setSuggestHealthier },
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <span className="text-sm text-foreground">{pref.label}</span>
                      <Switch checked={pref.value} onCheckedChange={pref.setter} />
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={() => updatePreferences.mutate({
                    purchaseFrequency: purchaseFrequency || undefined,
                    purchaseLocation: purchaseLocation || undefined,
                    organicProducts,
                    suggestHealthierProducts: suggestHealthier,
                  })}
                  disabled={updatePreferences.isPending}
                >
                  {updatePreferences.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Guardar preferencias
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies */}
          <TabsContent value="allergies">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-primary" />
                  Alergias e intolerancias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {allergies && allergies.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Alergias alimentarias</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allergies.map((allergy) => (
                        <label
                          key={allergy.id}
                          className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAllergies.includes(allergy.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Checkbox checked={selectedAllergies.includes(allergy.id)} onCheckedChange={() => toggleAllergy(allergy.id)} />
                          <span className="text-sm">{allergy.nameEs}</span>
                        </label>
                      ))}
                    </div>
                    <Button size="sm" className="mt-3" onClick={() => setAllergies.mutate({ allergyIds: selectedAllergies })} disabled={setAllergies.isPending}>
                      {setAllergies.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                      Guardar alergias
                    </Button>
                  </div>
                )}
                {restrictions && restrictions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Restricciones dietéticas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {restrictions.map((restriction) => (
                        <label
                          key={restriction.id}
                          className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedRestrictions.includes(restriction.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Checkbox checked={selectedRestrictions.includes(restriction.id)} onCheckedChange={() => toggleRestriction(restriction.id)} />
                          <span className="text-sm">{restriction.nameEs}</span>
                        </label>
                      ))}
                    </div>
                    <Button size="sm" className="mt-3" onClick={() => setDietRestrictions.mutate({ restrictionIds: selectedRestrictions })} disabled={setDietRestrictions.isPending}>
                      {setDietRestrictions.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                      Guardar restricciones
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          La información proporcionada no constituye recomendación médica profesional. Consulta siempre con un profesional de la salud.
        </p>
      </div>
    </AppLayout>
  );
}
