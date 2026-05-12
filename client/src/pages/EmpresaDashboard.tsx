import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/sonner-a11y-shim";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, CheckCircle2, Clock, Copy, Download, BarChart3,
  Building2, TrendingUp, AlertCircle, ArrowLeft, RefreshCw,
  Bell, Send, Mail, Eye, ChevronDown, ChevronUp, CreditCard, FileText,
  FileDown, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function EmpresaDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState<"activation" | "engagement" | "expiry_warning">("activation");
  const [reminderSubject, setReminderSubject] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [recipientList, setRecipientList] = useState("");
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = trpc.company.getDashboard.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const { data: companyAccess, refetch: refetchAccess } = trpc.codes.getMyCompanyAccess.useQuery(undefined, {
    enabled: !!user,
  });
  const generateCodeMutation = trpc.codes.generateCompanyCode.useMutation({
    onSuccess: (result) => {
      toast.success(`Código generado: ${result.code}`);
      refetchAccess();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });
  const { data: campaigns, refetch: refetchCampaigns } = trpc.companyReminders.listCampaigns.useQuery(undefined, {
    enabled: !!user && showCampaigns,
  });
  const { data: campaignLogs } = trpc.companyReminders.getCampaignLogs.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId }
  );
  const { data: reminderStats } = trpc.companyReminders.getStats.useQuery(undefined, { enabled: !!user });
  const { data: billingData } = trpc.company.getBillingHistory.useQuery(undefined, { enabled: !!user });
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);
  const downloadInvoiceMutation = trpc.company.downloadInvoice.useMutation({
    onSuccess: (result) => {
      // Decodificar base64 y descargar
      const byteCharacters = atob(result.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Factura descargada correctamente");
      setDownloadingInvoiceId(null);
    },
    onError: (err) => {
      toast.error(`Error al generar factura: ${err.message}`);
      setDownloadingInvoiceId(null);
    },
  });

  const handleDownloadInvoice = (snapshotId: number) => {
    setDownloadingInvoiceId(snapshotId);
    downloadInvoiceMutation.mutate({ snapshotId });
  };

  const sendReminderMutation = trpc.companyReminders.sendNow.useMutation({
    onSuccess: (result) => {
      toast.success(`Recordatorios enviados: ${result.sentCount} exitosos, ${result.failedCount} fallidos`);
      setShowReminderModal(false);
      setRecipientList("");
      setReminderMessage("");
      refetchCampaigns();
    },
    onError: (err) => toast.error(`Error al enviar: ${err.message}`),
  });

  const handleSendReminders = () => {
    const lines = recipientList.trim().split("\n").filter(Boolean);
    const recipients = lines.map((line) => {
      const [email, name, activationCode, expiresAt] = line.split(",").map((s) => s.trim());
      return { email, name: name || email, activationCode, expiresAt };
    }).filter((r) => r.email && r.email.includes("@"));
    if (recipients.length === 0) {
      toast.error("Introduce al menos un destinatario válido (email,nombre,código)");
      return;
    }
    const defaultSubjects: Record<string, string> = {
      activation: `${data?.company?.name || "Tu empresa"} te invita a activar Buddy One Pro`,
      engagement: "Como va tu nutricion esta semana? — Buddy One",
      expiry_warning: "Tu codigo de Buddy One expira pronto",
    };
    sendReminderMutation.mutate({
      name: `Campana ${reminderType} — ${new Date().toLocaleDateString("es-ES")}`,
      type: reminderType,
      subject: reminderSubject || defaultSubjects[reminderType],
      customMessage: reminderMessage || undefined,
      recipients,
    });
  };

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
      "2. El empleado abre Buddy One y va a Perfil > Activar código de empresa",
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
    growth: "Growth",
    business: "Business",
    enterprise: "Enterprise",
    corporate: "Corporate",
    global: "Global",
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
              <div className="text-xs text-muted-foreground">Panel de RRHH · Buddy One for Business</div>
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

        {/* ── CÓDIGO ÚNICO DE EMPRESA ─────────────────────────────────── */}
        <section aria-labelledby="access-code-heading">
          <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 id="access-code-heading" className="font-black text-orange-900 text-lg mb-1 flex items-center gap-2">
                    🏢 Código de acceso para empleados
                  </h3>
                  <p className="text-orange-700 text-sm mb-3">
                    Comparte este código con tus empleados. Cada empleado lo introduce al registrarse o en
                    {" "}<a href="/activar" className="font-bold underline" target="_blank">buddymarket.es/activar</a>{" "}
                    y su acceso Pro Max se activa al instante. Sin coste para el empleado.
                  </p>
                  {companyAccess?.accessCode ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-background border-2 border-orange-300 rounded-xl px-6 py-3 font-mono font-black text-2xl tracking-widest text-orange-900 shadow-sm">
                        {companyAccess.accessCode}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => {
                          navigator.clipboard.writeText(companyAccess.accessCode!);
                          toast.success("Código copiado");
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => {
                          const link = `${window.location.origin}/activar?code=${companyAccess.accessCode}`;
                          navigator.clipboard.writeText(link);
                          toast.success("Enlace de activación copiado");
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copiar enlace
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="bg-background border-2 border-dashed border-orange-300 rounded-xl px-6 py-3 text-orange-400 text-sm font-medium">
                        Sin código generado aún
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                        onClick={() => generateCodeMutation.mutate({})}
                        disabled={generateCodeMutation.isPending}
                      >
                        {generateCodeMutation.isPending ? "Generando..." : "Generar código"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-6xl">🔑</div>
              </div>
              {companyAccess?.accessCode && (
                <div className="mt-4 p-3 bg-background/70 rounded-xl border border-orange-200 text-xs text-orange-800">
                  <strong>Enlace directo para empleados:</strong>{" "}
                  <span className="font-mono">{window.location.origin}/activar?code={companyAccess.accessCode}</span>
                </div>
              )}
            </CardContent>
          </Card>
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
        {/* ── RECORDATORIOS ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                Recordatorios a empleados
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Notifica a los empleados que aún no han activado su código
              </p>
            </div>
            <Button onClick={() => setShowReminderModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Send className="w-4 h-4" />
              Enviar recordatorio
            </Button>
          </div>

          {/* Stats row */}
          {reminderStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">{reminderStats.pendingCodes}</div>
                  <div className="text-xs text-muted-foreground mt-1">Códigos pendientes</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{reminderStats.totalCampaigns}</div>
                  <div className="text-xs text-muted-foreground mt-1">Campañas enviadas</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{reminderStats.totalSent}</div>
                  <div className="text-xs text-muted-foreground mt-1">Emails entregados</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-500">{reminderStats.totalFailed}</div>
                  <div className="text-xs text-muted-foreground mt-1">Fallidos</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Campaign history toggle */}
          <button
            onClick={() => setShowCampaigns(!showCampaigns)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {showCampaigns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showCampaigns ? "Ocultar historial de campañas" : "Ver historial de campañas"}
          </button>

          {showCampaigns && campaigns && (
            <Card className="border-border/50">
              <CardContent className="p-0">
                {campaigns.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Aún no has enviado ningún recordatorio.
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {campaigns.map((c) => (
                      <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {c.sentAt ? new Date(c.sentAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Pendiente"}
                            {" · "}{c.sentCount} enviados · {c.failedCount} fallidos
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={c.status === "sent" ? "default" : c.status === "failed" ? "destructive" : "secondary"} className="text-xs">
                            {c.status === "sent" ? "Enviada" : c.status === "failed" ? "Error" : c.status === "cancelled" ? "Cancelada" : "Pendiente"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCampaignId(selectedCampaignId === c.id ? null : c.id)}
                            className="gap-1 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            Logs
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Campaign logs detail — privacy-first: only show aggregate status, no individual emails */}
          {selectedCampaignId && campaignLogs && (
            <Card className="border-border/50 mt-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Resumen de envíos — {campaignLogs.campaign.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-emerald-600">
                      {campaignLogs.logs.filter((l: any) => l.status === "sent").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Entregados</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-500">
                      {campaignLogs.logs.filter((l: any) => l.status === "failed").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Fallidos</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-amber-500">
                      {campaignLogs.logs.filter((l: any) => l.status !== "sent" && l.status !== "failed").length}
                    </div>
                    <div className="text-xs text-muted-foreground">Pendientes</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Por privacidad, los datos individuales de los destinatarios no se muestran en este panel.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ── HISTORIAL DE FACTURACIÓN ────────────────────────────────────── */}
        <section aria-labelledby="billing-heading">
          <h2 id="billing-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            Historial de facturación
          </h2>

          {/* Tarjeta resumen del mes actual */}
          {billingData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/50 md:col-span-1">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Licencias activas</span>
                    </div>
                    <div className="text-3xl font-bold">{billingData.company.licensesActive ?? 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">de {billingData.company.licensesTotal ?? 0} contratadas</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 md:col-span-2">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Evolución mensual de licencias activas</span>
                    </div>
                    {billingData.snapshots.length > 0 ? (
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={billingData.snapshots.slice(0, 6).reverse().map(s => ({
                          mes: new Date(s.billingPeriodStart).toLocaleDateString("es-ES", { month: "short", year: "2-digit" }),
                          licencias: s.activeLicenses,
                          total: s.totalAmount,
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                            formatter={(value: number, name: string) => name === "licencias" ? [value, "Licencias activas"] : [`${value.toFixed(2)} €`, "Total"]}
                          />
                          <Bar dataKey="licencias" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                        No hay datos de facturación aún
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tabla de historial */}
              {billingData.snapshots.length > 0 && (
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Detalle por mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Período</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Licencias activas</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio/licencia</th>
                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Factura</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingData.snapshots.map((snapshot) => (
                            <tr key={snapshot.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3 font-medium">
                                {new Date(snapshot.billingPeriodStart).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-semibold">{snapshot.activeLicenses}</span>
                                <span className="text-muted-foreground text-xs ml-1">empleados</span>
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {snapshot.pricePerLicense.toFixed(2)} €
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">
                                {snapshot.totalAmount.toFixed(2)} €
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  snapshot.status === "paid" ? "bg-emerald-500/10 text-emerald-600" :
                                  snapshot.status === "confirmed" ? "bg-blue-500/10 text-blue-600" :
                                  (snapshot.status as string) === "failed" ? "bg-red-500/10 text-red-600" :
                                  "bg-amber-500/10 text-amber-600"
                                }`}>
                                  {snapshot.status === "paid" ? "Pagado" :
                                   snapshot.status === "confirmed" ? "Confirmado" :
                                   (snapshot.status as string) === "failed" ? "Error" : "Pendiente"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleDownloadInvoice(snapshot.id)}
                                  disabled={downloadingInvoiceId === snapshot.id}
                                  aria-label={`Descargar factura de ${new Date(snapshot.billingPeriodStart).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`}
                                >
                                  {downloadingInvoiceId === snapshot.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <FileDown className="h-3.5 w-3.5" />
                                  )}
                                  PDF
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-muted-foreground text-center">
                La facturación se actualiza automáticamente el día 28 de cada mes según las licencias activas en los últimos 30 días.
              </p>
            </div>
          )}

          {!billingData && (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">El historial de facturación aparecerá aquí una vez que se genere el primer ciclo de facturación.</p>
              </CardContent>
            </Card>
          )}
        </section>

      </main>

      {/* ── MODAL ENVIAR RECORDATORIO ──────────────────────────────────────── */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Enviar recordatorio a empleados
            </DialogTitle>
            <DialogDescription>
              Notifica a los empleados que aún no han activado su código de Buddy One.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder-type">Tipo de recordatorio</Label>
              <Select value={reminderType} onValueChange={(v) => setReminderType(v as typeof reminderType)}>
                <SelectTrigger id="reminder-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activation">Activación — empleados sin activar código</SelectItem>
                  <SelectItem value="engagement">Engagement — empleados inactivos</SelectItem>
                  <SelectItem value="expiry_warning">Aviso de expiración — códigos próximos a vencer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder-subject">Asunto del email (opcional)</Label>
              <Input
                id="reminder-subject"
                placeholder="Se usará el asunto por defecto si lo dejas vacío"
                value={reminderSubject}
                onChange={(e) => setReminderSubject(e.target.value)}
              />
            </div>

            {/* Custom message */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder-message">Mensaje personalizado (opcional)</Label>
              <Textarea
                id="reminder-message"
                placeholder="Añade un mensaje personal de tu empresa que aparecerá destacado en el email..."
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Recipients */}
            <div className="space-y-1.5">
              <Label htmlFor="reminder-recipients">
                Destinatarios <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reminder-recipients"
                placeholder={"Un destinatario por línea con formato:\nemail,nombre,codigo_activacion,fecha_expiracion\n\nEjemplo:\njuan@empresa.com,Juan García,BM-ABCD1234,31/12/2026\nmaria@empresa.com,María López,BM-EFGH5678"}
                value={recipientList}
                onChange={(e) => setRecipientList(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Formato: <code className="bg-muted px-1 rounded">email,nombre,código,fecha_expiración</code> — el código y la fecha son opcionales para recordatorios de engagement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReminderModal(false)}
                className="flex-1"
                disabled={sendReminderMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendReminders}
                disabled={sendReminderMutation.isPending || !recipientList.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-2"
              >
                {sendReminderMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar recordatorios
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
