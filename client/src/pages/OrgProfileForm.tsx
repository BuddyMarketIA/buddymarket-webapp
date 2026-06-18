/**
 * OrgProfileForm — Organization profile form for Empresa and Clínica Veterinaria
 */
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

type OrgType = "empresa" | "clinica_vet";

const VET_SPECIALIZATIONS = [
  "Nutrición canina", "Nutrición felina", "Animales exóticos", "Aves",
  "Reptiles", "Roedores", "Animales de granja", "Nutrición geriátrica veterinaria",
];

const SECTORS = [
  "Tecnología", "Salud y farmacia", "Educación", "Finanzas y banca",
  "Retail y comercio", "Hostelería y restauración", "Industria y manufactura",
  "Construcción", "Transporte y logística", "Servicios profesionales",
  "Administración pública", "Deporte y fitness", "Medios y comunicación", "Otro",
];

export default function OrgProfileForm() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orgType = (params.get("type") ?? "empresa") as OrgType;
  const isEmpresa = orgType === "empresa";

  const [organizationName, setOrganizationName] = useState("");
  const [cif, setCif] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  // Empresa fields
  const [employeeCount, setEmployeeCount] = useState("");
  const [sector, setSector] = useState("");
  const [licenseCount, setLicenseCount] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  // Clínica vet fields
  const [vetLicenseNumber, setVetLicenseNumber] = useState("");
  const [vetCount, setVetCount] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const submitOrgProfile = trpc.profileSetup.submitOrgProfile.useMutation();

  const toggleSpecialization = (s: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    if (!organizationName.trim()) {
      toast.error("El nombre de la organización es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      await submitOrgProfile.mutateAsync({
        profileType: orgType,
        organizationName: organizationName.trim(),
        cif: cif || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        phone: phone || undefined,
        website: website || undefined,
        ...(isEmpresa ? {
          employeeCount: employeeCount ? parseInt(employeeCount) : undefined,
          sector: sector || undefined,
          licenseCount: licenseCount ? parseInt(licenseCount) : undefined,
          contactPersonName: contactName || undefined,
          contactPersonEmail: contactEmail || undefined,
          contactPersonPhone: contactPhone || undefined,
        } : {
          vetLicenseNumber: vetLicenseNumber || undefined,
          vetCount: vetCount ? parseInt(vetCount) : undefined,
          specializations: selectedSpecializations.length > 0 ? selectedSpecializations : undefined,
        }),
      });
      await utils.auth.me.invalidate();
      // Go directly to onboarding tour (org profiles don't need approval)
      setLocation("/buddy-setup");
    } catch {
      toast.error("Error al guardar el perfil. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f3] to-[#fff5ec]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-6">
        <button
          onClick={() => setLocation("/profile-setup")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm text-muted-foreground"
        >
          ←
        </button>
        <div>
          <p className="text-xs text-muted-foreground">Perfil de organización</p>
          <h1 className="text-xl font-extrabold text-foreground">
            {isEmpresa ? "🏢 Datos de empresa" : "🐾 Datos de clínica veterinaria"}
          </h1>
        </div>
      </div>

      <div className="px-6 pb-16 max-w-2xl mx-auto space-y-5">
        {/* Section: Basic info */}
        <div className="rounded-2xl bg-background border border-border p-5 space-y-4">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
            Información básica
          </h2>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              {isEmpresa ? "Nombre de la empresa" : "Nombre de la clínica"} <span className="text-orange-500">*</span>
            </label>
            <input
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              placeholder={isEmpresa ? "Empresa S.L." : "Clínica Veterinaria Ejemplo"}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                {isEmpresa ? "CIF" : "Nº de colegiación"}
              </label>
              <input
                value={isEmpresa ? cif : vetLicenseNumber}
                onChange={e => isEmpresa ? setCif(e.target.value) : setVetLicenseNumber(e.target.value)}
                placeholder={isEmpresa ? "B12345678" : "COL-12345"}
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Teléfono</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Dirección</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Calle Ejemplo, 123"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Ciudad</label>
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Madrid"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Código postal</label>
              <input
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                placeholder="28001"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Sitio web</label>
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://mi-empresa.com"
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Section: Empresa-specific */}
        {isEmpresa && (
          <>
            <div className="rounded-2xl bg-background border border-border p-5 space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                Detalles de empresa
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Nº de empleados</label>
                  <input
                    type="number"
                    value={employeeCount}
                    onChange={e => setEmployeeCount(e.target.value)}
                    placeholder="50"
                    min="1"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Licencias deseadas</label>
                  <input
                    type="number"
                    value={licenseCount}
                    onChange={e => setLicenseCount(e.target.value)}
                    placeholder="20"
                    min="1"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Sector</label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Selecciona un sector</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-2xl bg-background border border-border p-5 space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
                Persona de contacto
              </h2>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Nombre</label>
                <input
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Ana García"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="ana@empresa.com"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Teléfono</label>
                  <input
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Section: Clínica vet-specific */}
        {!isEmpresa && (
          <div className="rounded-2xl bg-background border border-border p-5 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">
              Detalles de la clínica
            </h2>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Nº de veterinarios</label>
              <input
                type="number"
                value={vetCount}
                onChange={e => setVetCount(e.target.value)}
                placeholder="3"
                min="1"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">Especializaciones</label>
              <div className="flex flex-wrap gap-2">
                {VET_SPECIALIZATIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSpecialization(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedSpecializations.includes(s)
                        ? "bg-teal-500 text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !organizationName.trim()}
          className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-40 transition-all active:scale-95 hover:bg-orange-600"
        >
          {loading ? "Guardando perfil…" : "Guardar y continuar →"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Todos los campos excepto el nombre son opcionales. Podrás completarlos más tarde.
        </p>
      </div>
    </div>
  );
}
