import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, Plus, Trash2, Users, CheckCircle, Clock, Archive, Brain } from "lucide-react";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-700" },
  active: { label: "Activo", color: "bg-green-100 text-green-700" },
  archived: { label: "Archivado", color: "bg-orange-100 text-orange-700" },
};

export default function ExpertPlansManager() {
  
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newWeek, setNewWeek] = useState<string>("");
  const [newYear, setNewYear] = useState<string>(new Date().getFullYear().toString());
  const [isTemplate, setIsTemplate] = useState(false);
  const [uploadingPlanId, setUploadingPlanId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: plans = [], isLoading } = trpc.expertPlans.myPlans.useQuery({ status: "all" });

  const createPlan = trpc.expertPlans.create.useMutation({
    onSuccess: () => {
      utils.expertPlans.myPlans.invalidate();
      setCreateOpen(false);
      setNewTitle(""); setNewDesc(""); setNewNotes(""); setNewWeek(""); setIsTemplate(false);
      toast.success("Plan creado: Ahora puedes subir el PDF del plan.");
    },
    onError: (e) => toast.error("Error: e.message"),
  });

  const uploadPdf = trpc.expertPlans.uploadPdf.useMutation({
    onSuccess: () => {
      utils.expertPlans.myPlans.invalidate();
      setUploadingPlanId(null);
      toast.success("PDF subido: El plan ya tiene el PDF adjunto.");
    },
    onError: (e) => { setUploadingPlanId(null); toast.error("Error al subir PDF: e.message"); },
  });

  const deletePlan = trpc.expertPlans.delete.useMutation({
    onSuccess: () => { utils.expertPlans.myPlans.invalidate(); toast.success("Plan eliminado"); },
    onError: (e) => toast.error("Error: e.message"),
  });

  const handleFileChange = async (planId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Solo se aceptan archivos PDF"); return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error("El PDF no puede superar 16 MB"); return;
    }
    setUploadingPlanId(planId);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPdf.mutate({ planId, base64, fileName: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Planes Nutricionales</h1>
          <p className="text-gray-500 mt-1">Sube PDFs de planes personalizados para tus clientes. La IA generará el menú semanal y la lista de la compra automáticamente.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="h-4 w-4" /> Nuevo plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nuevo plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Título del plan *</Label>
                <Input placeholder="Ej: Plan pérdida de peso — Semana 1" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea placeholder="Descripción breve del plan..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Semana</Label>
                  <Input type="number" placeholder="1-52" value={newWeek} onChange={e => setNewWeek(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Año</Label>
                  <Input type="number" placeholder="2026" value={newYear} onChange={e => setNewYear(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Notas para el cliente</Label>
                <Textarea placeholder="Instrucciones o notas adicionales para el cliente..." value={newNotes} onChange={e => setNewNotes(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isTemplate" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)} className="rounded" />
                <Label htmlFor="isTemplate" className="cursor-pointer">Guardar como plantilla reutilizable</Label>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!newTitle.trim() || createPlan.isPending}
                onClick={() => createPlan.mutate({
                  title: newTitle.trim(),
                  description: newDesc.trim() || undefined,
                  notes: newNotes.trim() || undefined,
                  weekNumber: newWeek ? parseInt(newWeek) : undefined,
                  year: newYear ? parseInt(newYear) : undefined,
                  isTemplate,
                })}
              >
                {createPlan.isPending ? "Creando..." : "Crear plan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 bg-orange-50 rounded-2xl border-2 border-dashed border-orange-200">
          <FileText className="h-12 w-12 text-orange-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no tienes planes</h3>
          <p className="text-gray-500 mb-6">Crea tu primer plan nutricional y sube el PDF para que tus clientes puedan generar su menú con IA.</p>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Crear primer plan
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="border border-gray-200 hover:border-orange-200 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 text-base">{plan.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[plan.status]?.color}`}>
                        {STATUS_LABELS[plan.status]?.label}
                      </span>
                      {plan.isTemplate && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Plantilla</span>}
                      {plan.weekNumber && <span className="text-xs text-gray-400">Semana {plan.weekNumber} · {plan.year}</span>}
                    </div>
                    {plan.description && <p className="text-sm text-gray-500 mb-2 line-clamp-1">{plan.description}</p>}

                    {/* PDF status */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {plan.pdfUrl ? (
                        <div className="flex items-center gap-1.5 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">{plan.pdfFileName ?? "PDF adjunto"}</span>
                          <a href={plan.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline ml-1">Ver PDF</a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>Sin PDF adjunto</span>
                        </div>
                      )}
                      {plan.aiGeneratedAt && (
                        <div className="flex items-center gap-1.5 text-sm text-purple-600">
                          <Brain className="h-4 w-4" />
                          <span>Menú IA generado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Upload PDF */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(plan.id, e)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={uploadingPlanId === plan.id}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "application/pdf";
                        input.onchange = (e) => handleFileChange(plan.id, e as any);
                        input.click();
                      }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingPlanId === plan.id ? "Subiendo..." : plan.pdfUrl ? "Cambiar PDF" : "Subir PDF"}
                    </Button>

                    {/* View plan detail */}
                    <Link href={`/expert-plans/${plan.id}`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs text-orange-600 border-orange-200 hover:bg-orange-50">
                        <Users className="h-3.5 w-3.5" /> Gestionar
                      </Button>
                    </Link>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`¿Eliminar el plan "${plan.title}"?`)) deletePlan.mutate({ id: plan.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h4 className="font-semibold text-blue-800 mb-1 flex items-center gap-2"><Brain className="h-4 w-4" /> Cómo funciona la generación con IA</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Crea un plan y sube el PDF con las directrices nutricionales.</li>
          <li>Asigna el plan a un cliente desde "Gestionar".</li>
          <li>El cliente puede generar su menú semanal y lista de la compra con un clic, personalizados según sus preferencias.</li>
          <li>El menú se muestra con nombres de platos reales y detallados, nunca con claves técnicas.</li>
        </ol>
      </div>
    </div>
  );
}
