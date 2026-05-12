import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, Users, Heart, TrendingUp, Mail, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function B2BCorporate() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    employeeCount: "",
    message: "",
  });

  const { data: companies, isLoading } = trpc.expertEnhanced.getB2BCompanies.useQuery(undefined, { enabled: !!user });

  const submitMutation = trpc.expertEnhanced.submitB2BInquiry.useMutation({
    onSuccess: () => {
      toast.success("Solicitud enviada con éxito. Nos pondremos en contacto pronto.");
      setShowForm(false);
      setForm({ companyName: "", contactName: "", contactEmail: "", contactPhone: "", employeeCount: "", message: "" });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!form.companyName.trim() || !form.contactEmail.trim()) {
      toast.error("Nombre de empresa y email son obligatorios");
      return;
    }
    submitMutation.mutate({
      companyName: form.companyName,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone || undefined,
      employeeCount: form.employeeCount ? parseInt(form.employeeCount) : undefined,
      message: form.message || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-teal-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-teal-500" /> Plan B2B Empresas</h1>
            <p className="text-sm text-muted-foreground">Bienestar corporativo para empleados</p>
          </div>
        </div>

        {/* Hero */}
        <Card className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white border-0 overflow-hidden">
          <CardContent className="py-8 relative">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Bienestar corporativo con BuddyOne</h2>
              <p className="text-white/80 max-w-lg">Ofrece a tus empleados acceso a nutricionistas profesionales, planes personalizados y seguimiento de salud como beneficio de empresa.</p>
              <div className="flex gap-6 mt-6">
                {[
                  { icon: Users, label: "Plazas flexibles", desc: "Desde 10 empleados" },
                  { icon: Heart, label: "Nutrición personalizada", desc: "Plan individual" },
                  { icon: TrendingUp, label: "Dashboard HR", desc: "Métricas de bienestar" },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-2">
                    <f.icon className="w-5 h-5 text-white/80 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="text-xs text-white/60">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!showForm && (
                <Button onClick={() => setShowForm(true)} className="mt-6 bg-white text-teal-700 hover:bg-white/90">
                  <Mail className="w-4 h-4 mr-1" /> Solicitar información
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        {showForm && (
          <Card>
            <CardHeader><CardTitle className="text-base">Solicitar plan B2B</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre de la empresa *</Label>
                  <Input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} className="mt-1" placeholder="Acme Corp" />
                </div>
                <div>
                  <Label>Persona de contacto</Label>
                  <Input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} className="mt-1" placeholder="María García" />
                </div>
                <div>
                  <Label>Email de contacto *</Label>
                  <Input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))} className="mt-1" placeholder="hr@acme.com" />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))} className="mt-1" placeholder="+34 600 000 000" />
                </div>
                <div>
                  <Label>Número de empleados</Label>
                  <Input type="number" value={form.employeeCount} onChange={e => setForm(p => ({ ...p, employeeCount: e.target.value }))} className="mt-1" placeholder="50" />
                </div>
              </div>
              <div>
                <Label>Mensaje adicional</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="mt-1" placeholder="Cuéntanos qué necesitas..." />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="bg-teal-600 hover:bg-teal-700 text-white">
                  {submitMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Companies (admin view) */}
        {companies && companies.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Empresas activas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companies.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
                        <Building2 className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{c.companyName}</p>
                        <p className="text-xs text-muted-foreground">{c.contactEmail} · {c.maxSeats} plazas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "active" ? "default" : "secondary"}>
                        {c.status === "active" ? "Activa" : c.status === "pending" ? "Pendiente" : c.status}
                      </Badge>
                      <span className="text-sm font-medium">{c.usedSeats || 0}/{c.maxSeats}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card>
          <CardHeader><CardTitle className="text-base">Beneficios del plan B2B</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Nutricionista dedicado", desc: "Cada empleado tiene acceso a un experto en nutrición certificado" },
                { title: "Planes personalizados", desc: "Menús semanales adaptados a objetivos y restricciones individuales" },
                { title: "Dashboard para RRHH", desc: "Métricas agregadas de bienestar del equipo (anónimas)" },
                { title: "Seguimiento continuo", desc: "Check-ins semanales y ajustes de plan según progreso" },
                { title: "Videoconsultas incluidas", desc: "Sesiones de seguimiento por videollamada con el experto" },
                { title: "ROI medible", desc: "Reducción de absentismo y mejora del bienestar documentada" },
              ].map(b => (
                <div key={b.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
