import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  UserIcon,
  HeartIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const TABS = [
  { key: "personal", label: "Personal", icon: UserIcon },
  { key: "medical", label: "Médico", icon: HeartIcon },
  { key: "prefs", label: "Compras", icon: ShoppingBagIcon },
  { key: "allergies", label: "Alergias", icon: ExclamationCircleIcon },
];

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const { user, logout } = useAuth();

  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: allergies } = trpc.catalogs.allergies.useQuery();
  const { data: restrictions } = trpc.catalogs.dietRestrictions.useQuery();
  const utils = trpc.useUtils();

  // Personal
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState("");

  // Medical
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [medicalConditions, setMedicalConditions] = useState("");
  const [hasSurgery, setHasSurgery] = useState(false);
  const [surgery, setSurgery] = useState("");
  const [useMetabolismMedication, setUseMetabolismMedication] = useState(false);
  const [metabolismMedication, setMetabolismMedication] = useState("");

  // Preferences
  const [purchaseFrequency, setPurchaseFrequency] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [organicProducts, setOrganicProducts] = useState(false);
  const [suggestHealthier, setSuggestHealthier] = useState(false);

  // Allergies
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
        setGender(profile.profile.gender || "");
        setMainGoal(profile.profile.mainGoal || "");
        setActivityLevel(profile.profile.activityLevel || "");
        setDailyCalorieGoal(profile.profile.dailyCalorieGoal ? String(profile.profile.dailyCalorieGoal) : "");
      }
      if (profile.medicalProfile) {
        setHasMedicalConditions(profile.medicalProfile.hasMedicalConditions || false);
        setMedicalConditions(profile.medicalProfile.medicalConditions || "");
        setHasSurgery(profile.medicalProfile.hasSurgery || false);
        setSurgery(profile.medicalProfile.surgery || "");
        setUseMetabolismMedication(profile.medicalProfile.useMetabolismMedication || false);
        setMetabolismMedication(profile.medicalProfile.metabolismMedication || "");
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
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Datos actualizados"); },
    onError: (err) => toast.error(err.message),
  });
  const updateProfileMutation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Perfil actualizado"); },
    onError: (err) => toast.error(err.message),
  });
  const updateMedical = trpc.profile.updateMedical.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Perfil médico actualizado"); },
    onError: (err) => toast.error(err.message),
  });
  const updatePreferences = trpc.profile.updatePreferences.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Preferencias actualizadas"); },
    onError: (err) => toast.error(err.message),
  });
  const setAllergiesMutation = trpc.profile.setAllergies.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Alergias actualizadas"); },
  });
  const setDietRestrictionsMutation = trpc.profile.setDietRestrictions.useMutation({
    onSuccess: () => { utils.profile.get.invalidate(); toast.success("Restricciones actualizadas"); },
  });

  const toggleAllergy = (id: number) => {
    const next = selectedAllergies.includes(id)
      ? selectedAllergies.filter((a) => a !== id)
      : [...selectedAllergies, id];
    setSelectedAllergies(next);
    setAllergiesMutation.mutate({ allergyIds: next });
  };

  const toggleRestriction = (id: number) => {
    const next = selectedRestrictions.includes(id)
      ? selectedRestrictions.filter((r) => r !== id)
      : [...selectedRestrictions, id];
    setSelectedRestrictions(next);
    setDietRestrictionsMutation.mutate({ restrictionIds: next });
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="vively-page">
      {/* Avatar + name */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#F97316] text-2xl font-bold text-white shadow-md">
          {initials}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user?.name ?? "Mi perfil"}</h1>
        <p className="text-sm text-gray-400">{user?.email ?? ""}</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex rounded-2xl bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-all ${
              activeTab === tab.key ? "bg-white text-orange-500 shadow-sm font-bold" : "text-gray-500"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal tab */}
      {activeTab === "personal" && (
        <div className="space-y-3">
          <div className="vively-card space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Datos básicos</h3>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Nombre completo</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="vively-input" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Teléfono</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="vively-input" placeholder="+34 600 000 000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="vively-input resize-none" placeholder="Cuéntanos algo sobre ti..." />
            </div>
            <button
              onClick={() => updateBasic.mutate({ name: name || undefined, phone: phone || undefined, description: description || undefined })}
              disabled={updateBasic.isPending}
              className="btn-vively w-full"
            >
              Guardar datos básicos
            </button>
          </div>

          <div className="vively-card space-y-3">
            <h3 className="text-sm font-bold text-gray-700">Datos físicos y objetivos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Altura (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="vively-input" placeholder="170" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">Peso (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="vively-input" placeholder="70" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Género</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="vively-input">
                <option value="">Seleccionar</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Objetivo principal</label>
              <select value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} className="vively-input">
                <option value="">Seleccionar</option>
                <option value="lose_weight">Perder peso</option>
                <option value="maintain">Mantener peso</option>
                <option value="gain_weight">Ganar peso</option>
                <option value="gain_muscle">Ganar músculo</option>
                <option value="eat_healthier">Comer más sano</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Nivel de actividad</label>
              <select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="vively-input">
                <option value="">Seleccionar</option>
                <option value="sedentary">Sedentario</option>
                <option value="light">Ligero</option>
                <option value="moderate">Moderado</option>
                <option value="active">Activo</option>
                <option value="very_active">Muy activo</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Objetivo calórico diario (kcal)</label>
              <input type="number" value={dailyCalorieGoal} onChange={(e) => setDailyCalorieGoal(e.target.value)} className="vively-input" placeholder="2000" />
            </div>
            <button
              onClick={() => updateProfileMutation.mutate({
                height: height ? Number(height) : undefined,
                weight: weight ? Number(weight) : undefined,
                gender: (gender || undefined) as any,
              mainGoal: (mainGoal || undefined) as any,
              activityLevel: (activityLevel || undefined) as any,
                dailyCalorieGoal: dailyCalorieGoal ? Number(dailyCalorieGoal) : undefined,
              })}
              disabled={updateProfileMutation.isPending}
              className="btn-vively w-full"
            >
              Guardar perfil físico
            </button>
          </div>
        </div>
      )}

      {/* Medical tab */}
      {activeTab === "medical" && (
        <div className="vively-card space-y-4">
          <h3 className="text-sm font-bold text-gray-700">Perfil médico</h3>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={hasMedicalConditions} onChange={(e) => setHasMedicalConditions(e.target.checked)} className="rounded" />
              Tengo condiciones médicas
            </label>
            {hasMedicalConditions && (
              <textarea value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} rows={3} className="vively-input resize-none" placeholder="Describe tus condiciones médicas..." />
            )}
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={hasSurgery} onChange={(e) => setHasSurgery(e.target.checked)} className="rounded" />
              He tenido cirugías relevantes
            </label>
            {hasSurgery && (
              <textarea value={surgery} onChange={(e) => setSurgery(e.target.value)} rows={2} className="vively-input resize-none" placeholder="Describe las cirugías..." />
            )}
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <input type="checkbox" checked={useMetabolismMedication} onChange={(e) => setUseMetabolismMedication(e.target.checked)} className="rounded" />
              Tomo medicación que afecta al metabolismo
            </label>
            {useMetabolismMedication && (
              <input value={metabolismMedication} onChange={(e) => setMetabolismMedication(e.target.value)} className="vively-input" placeholder="Nombre del medicamento" />
            )}
          </div>
          <button
            onClick={() => updateMedical.mutate({
              hasMedicalConditions,
              medicalConditions: medicalConditions || undefined,
              hasSurgery,
              surgery: surgery || undefined,
              useMetabolismMedication,
              metabolismMedication: metabolismMedication || undefined,
            })}
            disabled={updateMedical.isPending}
            className="btn-vively w-full"
          >
            Guardar perfil médico
          </button>
        </div>
      )}

      {/* Preferences tab */}
      {activeTab === "prefs" && (
        <div className="vively-card space-y-4">
          <h3 className="text-sm font-bold text-gray-700">Preferencias de compra</h3>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Frecuencia de compra</label>
            <select value={purchaseFrequency} onChange={(e) => setPurchaseFrequency(e.target.value)} className="vively-input">
              <option value="">Seleccionar</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="biweekly">Quincenal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Lugar de compra habitual</label>
            <input value={purchaseLocation} onChange={(e) => setPurchaseLocation(e.target.value)} className="vively-input" placeholder="Ej: Mercadona, Carrefour..." />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Prefiero productos ecológicos</span>
            <input type="checkbox" checked={organicProducts} onChange={(e) => setOrganicProducts(e.target.checked)} className="h-5 w-5 rounded accent-[#F97316]" />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Sugerir alternativas más saludables</span>
            <input type="checkbox" checked={suggestHealthier} onChange={(e) => setSuggestHealthier(e.target.checked)} className="h-5 w-5 rounded accent-[#F97316]" />
          </div>
          <button
            onClick={() => updatePreferences.mutate({
              purchaseFrequency: purchaseFrequency || undefined,
              purchaseLocation: purchaseLocation || undefined,
              organicProducts,
              suggestHealthierProducts: suggestHealthier,
            })}
            disabled={updatePreferences.isPending}
            className="btn-vively w-full"
          >
            Guardar preferencias
          </button>
        </div>
      )}

      {/* Allergies tab */}
      {activeTab === "allergies" && (
        <div className="space-y-5">
          <div className="vively-card">
            <h3 className="mb-3 text-sm font-bold text-gray-700">Alergias alimentarias</h3>
            <div className="flex flex-wrap gap-2">
              {(allergies ?? []).map((a: any) => (
                <button
                  key={a.id}
                  onClick={() => toggleAllergy(a.id)}
                  className={`selectable-badge ${selectedAllergies.includes(a.id) ? "selectable-badge-active" : "selectable-badge-inactive"}`}
                >
                  {a.nameEs}
                </button>
              ))}
            </div>
          </div>
          <div className="vively-card">
            <h3 className="mb-3 text-sm font-bold text-gray-700">Restricciones dietéticas</h3>
            <div className="flex flex-wrap gap-2">
              {(restrictions ?? []).map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => toggleRestriction(r.id)}
                  className={`selectable-badge ${selectedRestrictions.includes(r.id) ? "selectable-badge-active" : "selectable-badge-inactive"}`}
                >
                  {r.nameEs}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="mt-8">
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-100 py-3 text-sm font-semibold text-red-500 hover:bg-red-50"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>

      <div className="vively-disclaimer">
        <p>VIVELY no constituye recomendaciones profesionales de nutrición.</p>
      </div>
    </div>
  );
}
