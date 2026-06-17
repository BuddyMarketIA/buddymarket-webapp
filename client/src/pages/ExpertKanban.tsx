// @ts-nocheck
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, Search, ChevronRight, Tag, AlertTriangle,
  Plus, ArrowLeft, Kanban, RefreshCw,
} from "lucide-react";

const STAGES = [
  { id: "new", label: "Nuevos", color: "bg-blue-100 border-blue-300 text-blue-800", dot: "bg-blue-500" },
  { id: "active", label: "En Seguimiento", color: "bg-green-100 border-green-300 text-green-800", dot: "bg-green-500" },
  { id: "follow_up", label: "Revisión", color: "bg-amber-100 border-amber-300 text-amber-800", dot: "bg-amber-500" },
  { id: "inactive", label: "Inactivos", color: "bg-gray-100 border-gray-300 text-gray-600", dot: "bg-gray-400" },
  { id: "discharged", label: "Alta", color: "bg-purple-100 border-purple-300 text-purple-800", dot: "bg-purple-500" },
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ExpertKanban() {
  const [, nav] = useLocation();
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState<{ patientId: number; fromStage: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const { data: kanbanData, isLoading, refetch } = trpc.expertPro.getKanbanBoard.useQuery();
  const updateStage = trpc.expertPro.updateKanbanStage.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const { data: labels = [] } = trpc.expertPro.listLabels.useQuery();

  const handleDrop = (toStage: string) => {
    if (!dragging || dragging.fromStage === toStage) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    updateStage.mutate({ patientId: dragging.patientId, stage: toStage as any });
    setDragging(null);
    setDragOver(null);
  };

  const allPatients = kanbanData?.patients ?? [];
  const filteredPatients = search
    ? allPatients.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
      )
    : allPatients;

  const byStage = STAGES.reduce((acc, s) => {
    acc[s.id] = filteredPatients.filter(p => (p.kanbanStage ?? "new") === s.id);
    return acc;
  }, {} as Record<string, typeof allPatients>);

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav("/app/expert/patients")}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} className="text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Kanban size={22} className="text-orange-500" />
                Vista Kanban
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {allPatients.length} pacientes · Arrastra para cambiar etapa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => nav("/app/expert/patients")}
              className="flex items-center gap-1.5"
            >
              <Users size={14} /> Lista
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <div className="grid grid-cols-5 gap-4">
            {STAGES.map(s => (
              <div key={s.id} className="space-y-3">
                <div className="h-8 bg-muted/50 rounded-lg animate-pulse" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto">
            {STAGES.map(stage => (
              <div
                key={stage.id}
                className={`flex flex-col rounded-2xl border-2 p-3 min-h-[400px] transition-colors ${
                  dragOver === stage.id ? "border-orange-400 bg-orange-50/50" : "border-border bg-muted/20"
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                    <span className="text-sm font-bold text-foreground">{stage.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.color}`}>
                    {byStage[stage.id]?.length ?? 0}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2">
                  {(byStage[stage.id] ?? []).map(patient => (
                    <div
                      key={patient.id}
                      draggable
                      onDragStart={() => setDragging({ patientId: patient.id, fromStage: stage.id })}
                      onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      onClick={() => nav(`/app/expert/offline-patients/${patient.id}`)}
                      className={`bg-background rounded-xl border border-border p-3 cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all group ${
                        dragging?.patientId === patient.id ? "opacity-50 scale-95" : ""
                      }`}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(patient.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-orange-600 transition-colors">
                            {patient.name ?? "Sin nombre"}
                          </p>
                          {patient.objective && (
                            <p className="text-xs text-muted-foreground truncate">{patient.objective}</p>
                          )}
                        </div>
                      </div>

                      {/* Labels */}
                      {patient.labels && patient.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {patient.labels.slice(0, 3).map((lbl: any) => (
                            <span
                              key={lbl.id}
                              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: lbl.color + "22", color: lbl.color }}
                            >
                              {lbl.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {patient.lastWeight && (
                          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            {patient.lastWeight} kg
                          </span>
                        )}
                        {patient.daysWithoutLog >= 7 && (
                          <span className="text-xs text-red-600 flex items-center gap-0.5">
                            <AlertTriangle size={10} /> {patient.daysWithoutLog}d
                          </span>
                        )}
                        {patient.inviteAcceptedAt && (
                          <span className="text-xs text-green-600">● Buddy</span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state */}
                  {(byStage[stage.id] ?? []).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-xs text-muted-foreground/60">Sin pacientes</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          <span className="font-semibold">Leyenda:</span>
          {STAGES.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </div>
          ))}
          <span className="ml-4">· Arrastra las tarjetas para cambiar etapa</span>
        </div>
      </div>
    </AppLayout>
  );
}
