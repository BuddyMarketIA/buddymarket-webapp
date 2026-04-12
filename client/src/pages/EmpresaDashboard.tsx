import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/sonner-a11y-shim";
import {
  Users, CheckCircle2, Clock, Copy, Download, BarChart3,
  Building2, TrendingUp, AlertCircle, ArrowLeft, RefreshCw
} from "lucide-react";

export default function EmpresaDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [searchCode, setSearchCode] = useState("");

  const { data, isLoading, error, refetch } = trpc.company.getDashboard.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Código copiado al portapapeles");
    });
  };

  const copyAllCodes = () => {
    if (!data?.availableCodes?.length) return;
    navigator.clipboard.writeText(data.availableCodes.join("\n")).then(() => {
      toast.success(`${data.availableCodes.length} códigos copiados al portapapeles`);
    });
  };

  const downloadCodes = () => {
    if (!data?.availableCodes?.length) return;
    const content = [
      "CÓDIGOS DE ACTIVACIÓN BUDDYMARKET FOR BUSINESS",
      `Empresa: ${data.company.name}`,
      `Generado: ${new Date().toLocaleDateString("es-ES")}`,
      "",
      "Instrucciones:",
      "1. Comparte este código con cada empleado",
      "2. El empleado abre BuddyMarket y va a Perfil > Activar código de empresa",
      "3. Introduce el código y su acceso Pro Max se activa al instante",
      "",
      "CÓDIGOS DISPONIBLES:",
      ...data.availableCodes,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buddymarket-codigos-${data.company.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Archivo de códigos descargado");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando panel de empresa...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
            <p className="text-muted-foreground mb-6">Necesitas iniciar sesión para acceder al panel de empresa.</p>
            <Button asChild className="w-full">
              <Link href="/">Ir al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Sin empresa asociada</h2>
            <p className="text-muted-foreground mb-6">
              Tu cuenta no tiene ninguna empresa asociada. Si acabas de contratar un plan,
              puede tardar unos minutos en activarse.
            </p>
            <div className="space-y-3">
              <Button onClick={() => refetch()} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
              </Button>
              <Button asChild className="w-full">
                <Link href="/empresas">Ver planes empresariales</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { company, metrics, recentMembers, availableCodes } = data;
  const filteredCodes = searchCode
    ? availableCodes.filter((c) => c.includes(searchCode.toUpperCase()))
    : availableCodes;

  const planLabels: Record<string, string> = {
    starter: "Starter",
    business: "Business",
    enterprise: "Enterprise",
    corporate: "Corporate",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-amber-500/10 text-amber-600" },
    trial: { label: "Período de prueba", color: "bg-blue-500/10 text-blue-600" },
    active: { label: "Activo", color: "bg-emerald-500/10 text-emerald-600" },
    suspended: { label: "Suspendido", color: "bg-rose-500/10 text-rose-600" },
    cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground" },
  };

  const statusInfo = statusLabels[company.status] || statusLabels.pending;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="font-semibold text-sm">{company.name}</div>
              <div className="text-xs text-muted-foreground">Panel de RRHH · BuddyMarket for Business</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <Badge variant="outline">{planLabels[company.plan] || company.plan}</Badge>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── MÉTRICAS PRINCIPALES ──────────────────────────────────────── */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="text-lg font-semibold mb-4">Resumen de activación</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Licencias totales</span>
                </div>
                <div className="text-2xl font-bold">{metrics.licensesTotal}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Activadas</span>
                </div>
                <div className="text-2xl font-bold text-emerald-600">{metrics.licensesUsed}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Disponibles</span>
                </div>
                <div className="text-2xl font-bold text-amber-600">{metrics.licensesAvailable}</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Tasa de activación</span>
                </div>
                <div className="text-2xl font-bold text-primary">{metrics.activationRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progreso de activación</span>
              <span>{metrics.licensesUsed} / {metrics.licensesTotal} empleados</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${metrics.activationRate}%` }}
                role="progressbar"
                aria-valuenow={metrics.activationRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${metrics.activationRate}% de empleados activados`}
              />
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ── CÓDIGOS DISPONIBLES ────────────────────────────────────── */}
          <section aria-labelledby="codes-heading">
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle id="codes-heading" className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Códigos disponibles ({availableCodes.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAllCodes}
                      disabled={!availableCodes.length}
                      aria-label="Copiar todos los códigos"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadCodes}
                      disabled={!availableCodes.length}
                      aria-label="Descargar códigos como archivo de texto"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Descargar
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Buscar código..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="mt-2"
                  aria-label="Buscar código de activación"
                />
              </CardHeader>
              <CardContent>
                {availableCodes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm">Todos los códigos han sido activados</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    {filteredCodes.map((code) => (
                      <div
                        key={code}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <code className="text-sm font-mono tracking-wider">{code}</code>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background"
                          aria-label={`Copiar código ${code}`}
                        >
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    {filteredCodes.length === 0 && searchCode && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No se encontraron códigos con "{searchCode}"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ── ACTIVACIONES RECIENTES ────────────────────────────────── */}
          <section aria-labelledby="recent-heading">
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle id="recent-heading" className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Activaciones recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Aún no hay empleados activados</p>
                    <p className="text-xs mt-1">Distribuye los códigos para empezar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMembers.map((member, i) => (
                      <div key={member.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium">Empleado #{member.id}</div>
                            <div className="text-xs text-muted-foreground">
                              Activado: {new Date(member.joinedAt).toLocaleDateString("es-ES")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {member.lastActiveAt
                              ? `Activo: ${new Date(member.lastActiveAt).toLocaleDateString("es-ES")}`
                              : "Sin actividad"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ── INSTRUCCIONES ─────────────────────────────────────────────── */}
        <section aria-labelledby="instructions-heading">
          <Card className="border-border/50 bg-primary/5">
            <CardContent className="p-6">
              <h3 id="instructions-heading" className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Cómo distribuir los códigos a tus empleados
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-1">1. Descarga los códigos</div>
                  <p className="text-muted-foreground text-xs">
                    Usa el botón "Descargar" para obtener un archivo .txt con todos los códigos disponibles.
                  </p>
                </div>
                <div>
                  <div className="font-medium mb-1">2. Distribuye por email o Slack</div>
                  <p className="text-muted-foreground text-xs">
                    Envía un código único a cada empleado. Incluye el enlace a buddymarket.es/activar para facilitar el proceso.
                  </p>
                </div>
                <div>
                  <div className="font-medium mb-1">3. El empleado activa en 30 segundos</div>
                  <p className="text-muted-foreground text-xs">
                    El empleado va a Perfil → Activar código de empresa, introduce el código y su Pro Max se activa al instante.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── INFO CONTRATO ─────────────────────────────────────────────── */}
        {(company.contractStartAt || company.contractEndAt) && (
          <section>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Plan activo</div>
                    <div className="font-medium">{planLabels[company.plan] || company.plan}</div>
                  </div>
                  {company.contractStartAt && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Inicio del contrato</div>
                      <div className="font-medium">
                        {new Date(company.contractStartAt).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  )}
                  {company.contractEndAt && (
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">Renovación</div>
                      <div className="font-medium">
                        {new Date(company.contractEndAt).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
