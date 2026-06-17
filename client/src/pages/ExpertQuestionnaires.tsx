// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ClipboardList, Plus, Trash2, ArrowLeft, Send,
  ChevronDown, ChevronUp, CheckSquare, AlignLeft,
  Hash, ToggleLeft, Star,
} from "lucide-react";

const QUESTION_TYPES = [
  { id: "text",    label: "Texto libre",    icon: AlignLeft },
  { id: "number",  label: "Número",         icon: Hash },
  { id: "choice",  label: "Opción múltiple",icon: CheckSquare },
  { id: "scale",   label: "Escala 1-10",    icon: Star },
  { id: "boolean", label: "Sí / No",        icon: ToggleLeft },
];

export default function ExpertQuestionnaires() {
  const [, nav] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "", questions: [] as any[] });
  const [newQ, setNewQ] = useState({ text: "", type: "text", options: "", required: true });
  const [showSend, setShowSend] = useState<number | null>(null);
  const [sendPatientId, setSendPatientId] = useState("");

  const { data: questionnaires = [], refetch } = trpc.expertPro.listQuestionnaires.useQuery();
  const { data: patients = [] } = trpc.offlinePatients.list.useQuery();

  const createQ = trpc.expertPro.createQuestionnaire.useMutation({
    onSuccess: () => { toast.success("Cuestionario creado"); setShowCreate(false); setForm({ title: "", description: "", questions: [] }); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteQ = trpc.expertPro.deleteQuestionnaire.useMutation({
    onSuccess: () => { toast.success("Eliminado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const sendQ = trpc.expertPro.sendQuestionnaire.useMutation({
    onSuccess: () => { toast.success("Cuestionario enviado al paciente"); setShowSend(null); setSendPatientId(""); },
    onError: (e) => toast.error(e.message),
  });

  const addQuestion = () => {
    if (!newQ.text.trim()) return;
    const q: any = { text: newQ.text, type: newQ.type, required: newQ.required };
    if (newQ.type === "choice" && newQ.options.trim()) {
      q.options = newQ.options.split("\n").map(o => o.trim()).filter(Boolean);
    }
    setForm(f => ({ ...f, questions: [...f.questions, q] }));
    setNewQ({ text: "", type: "text", options: "", required: true });
  };

  const removeQuestion = (idx: number) => {
    setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => nav("/app/expert/patients")} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList size={22} className="text-orange-500" />
                Cuestionarios
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Crea y envía cuestionarios personalizados a tus pacientes</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
            <Plus size={14} /> Nuevo
          </Button>
        </div>

        {/* Lista */}
        {questionnaires.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border">
            <ClipboardList size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Aún no tienes cuestionarios</p>
            <p className="text-sm text-muted-foreground/70 mb-4">Crea cuestionarios de anamnesis, seguimiento o satisfacción</p>
            <Button onClick={() => setShowCreate(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
              Crear primer cuestionario
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {questionnaires.map((q: any) => (
              <div key={q.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{q.title}</p>
                    {q.description && <p className="text-xs text-muted-foreground truncate">{q.description}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {q.questions?.length ?? 0} preguntas · {q.sentCount ?? 0} enviados
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={e => { e.stopPropagation(); setShowSend(q.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 text-orange-700 text-xs font-semibold hover:bg-orange-200 transition-colors"
                    >
                      <Send size={11} /> Enviar
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar cuestionario?")) deleteQ.mutate({ id: q.id }); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    {expandedId === q.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                  </div>
                </div>

                {expandedId === q.id && q.questions?.length > 0 && (
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    {q.questions.map((question: any, idx: number) => {
                      const TypeIcon = QUESTION_TYPES.find(t => t.id === question.type)?.icon ?? AlignLeft;
                      return (
                        <div key={idx} className="flex items-start gap-2 py-1.5">
                          <TypeIcon size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-foreground">{question.text}</p>
                            {question.options && (
                              <p className="text-xs text-muted-foreground">{question.options.join(" · ")}</p>
                            )}
                          </div>
                          {question.required && (
                            <span className="ml-auto text-xs text-orange-500 flex-shrink-0">Obligatoria</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear cuestionario */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo cuestionario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Anamnesis inicial" className="mt-1" />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descripción del cuestionario" className="mt-1" />
            </div>

            {/* Preguntas añadidas */}
            {form.questions.length > 0 && (
              <div className="space-y-2">
                <Label>Preguntas ({form.questions.length})</Label>
                {form.questions.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                    <span className="text-sm flex-1 truncate">{q.text}</span>
                    <span className="text-xs text-muted-foreground">{QUESTION_TYPES.find(t => t.id === q.type)?.label}</span>
                    <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Añadir pregunta */}
            <div className="bg-muted/20 rounded-xl p-3 space-y-3 border border-border">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Añadir pregunta</Label>
              <Input value={newQ.text} onChange={e => setNewQ(q => ({ ...q, text: e.target.value }))} placeholder="Texto de la pregunta..." />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={newQ.type}
                    onChange={e => setNewQ(q => ({ ...q, type: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-border px-2 py-1.5 text-sm bg-background"
                  >
                    {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newQ.required}
                      onChange={e => setNewQ(q => ({ ...q, required: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Obligatoria</span>
                  </label>
                </div>
              </div>
              {newQ.type === "choice" && (
                <div>
                  <Label className="text-xs">Opciones (una por línea)</Label>
                  <Textarea
                    value={newQ.options}
                    onChange={e => setNewQ(q => ({ ...q, options: e.target.value }))}
                    placeholder={"Opción A\nOpción B\nOpción C"}
                    rows={3}
                    className="mt-1 text-sm"
                  />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                disabled={!newQ.text.trim()}
                className="w-full"
              >
                <Plus size={13} className="mr-1" /> Añadir pregunta
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={() => createQ.mutate({ title: form.title, description: form.description, questions: form.questions })}
              disabled={!form.title || form.questions.length === 0 || createQ.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createQ.isPending ? "Creando..." : "Crear cuestionario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal enviar cuestionario */}
      <Dialog open={showSend !== null} onOpenChange={() => setShowSend(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enviar cuestionario</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Seleccionar paciente</Label>
            <select
              value={sendPatientId}
              onChange={e => setSendPatientId(e.target.value)}
              className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm bg-background"
            >
              <option value="">Seleccionar...</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name ?? p.fullName}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSend(null)}>Cancelar</Button>
            <Button
              onClick={() => sendQ.mutate({ questionnaireId: showSend!, patientId: parseInt(sendPatientId) })}
              disabled={!sendPatientId || sendQ.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {sendQ.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
