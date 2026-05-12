import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, ChevronUp, MessageSquare, Lightbulb,
  CheckCircle2, Clock, Rocket, Eye, Filter, TrendingUp,
  Sparkles, Send, BarChart3, Users,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "patient_management", label: "Gestión de pacientes", icon: "👥", color: "#F97316" },
  { value: "plans_menus", label: "Planes y menús", icon: "📋", color: "#10B981" },
  { value: "tracking_metrics", label: "Seguimiento y métricas", icon: "📊", color: "#3B82F6" },
  { value: "communication", label: "Comunicación", icon: "💬", color: "#8B5CF6" },
  { value: "billing", label: "Facturación", icon: "💳", color: "#EF4444" },
  { value: "integrations", label: "Integraciones", icon: "🔗", color: "#06B6D4" },
  { value: "other", label: "Otro", icon: "💡", color: "#6B7280" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  under_review: { label: "En revisión", icon: <Eye size={12} />, color: "#F59E0B", bg: "#FEF3C7" },
  planned: { label: "Planificado", icon: <Clock size={12} />, color: "#3B82F6", bg: "#DBEAFE" },
  in_progress: { label: "En desarrollo", icon: <Rocket size={12} />, color: "#8B5CF6", bg: "#EDE9FE" },
  completed: { label: "Completado", icon: <CheckCircle2 size={12} />, color: "#10B981", bg: "#D1FAE5" },
  declined: { label: "Descartado", icon: <MessageSquare size={12} />, color: "#6B7280", bg: "#F3F4F6" },
};

const SORT_OPTIONS = [
  { value: "votes", label: "Más votadas" },
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
];

type CategoryValue = typeof CATEGORIES[number]["value"];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ExpertFeatureRequests() {
  const { user } = useAuth();
  const [, nav] = useLocation();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"votes" | "newest" | "oldest">("votes");
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"board" | "roadmap" | "mine">("board");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryValue>("patient_management");

  // Queries
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.expertFeatureRequests.list.useQuery(
    {
      category: selectedCategory !== "all" ? selectedCategory as any : undefined,
      status: selectedStatus !== "all" ? selectedStatus as any : undefined,
      sortBy,
    },
    { enabled: !!user, refetchInterval: 30000 }
  );
  const { data: myRequests } = trpc.expertFeatureRequests.getMine.useQuery(
    undefined,
    { enabled: !!user && activeTab === "mine" }
  );

  // Mutations
  const createMutation = trpc.expertFeatureRequests.create.useMutation({
    onSuccess: () => {
      toast.success("Solicitud enviada. Nuestro equipo la revisará pronto.");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setCategory("patient_management");
      utils.expertFeatureRequests.list.invalidate();
      utils.expertFeatureRequests.getMine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const voteMutation = trpc.expertFeatureRequests.toggleVote.useMutation({
    onMutate: async ({ requestId }) => {
      await utils.expertFeatureRequests.list.cancel();
      const prev = utils.expertFeatureRequests.list.getData();
      if (prev) {
        utils.expertFeatureRequests.list.setData(undefined, {
          ...prev,
          requests: prev.requests.map(r =>
            r.id === requestId
              ? { ...r, hasVoted: !r.hasVoted, voteCount: r.hasVoted ? r.voteCount - 1 : r.voteCount + 1 }
              : r
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.expertFeatureRequests.list.setData(undefined, context.prev);
      toast.error("Error al votar");
    },
    onSettled: () => utils.expertFeatureRequests.list.invalidate(),
  });

  const handleSubmit = () => {
    if (title.length < 5) return toast.error("El título debe tener al menos 5 caracteres");
    if (description.length < 20) return toast.error("La descripción debe tener al menos 20 caracteres");
    createMutation.mutate({ title, description, category });
  };

  // Roadmap data
  const roadmapData = useMemo(() => {
    if (!data?.requests) return { planned: [], in_progress: [], completed: [] };
    return {
      planned: data.requests.filter(r => r.status === "planned"),
      in_progress: data.requests.filter(r => r.status === "in_progress"),
      completed: data.requests.filter(r => r.status === "completed"),
    };
  }, [data]);

  const totalRequests = data?.total ?? 0;
  const totalVotes = data?.requests?.reduce((sum, r) => sum + r.voteCount, 0) ?? 0;

  if (!user) return null;

  return (
    <div style={{ background: "#F5F0EB", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1B2B4B 0%, #2D3B5B 100%)", padding: "20px 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={() => nav("/app/expert/dashboard")} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px", cursor: "pointer", display: "flex" }}>
            <ArrowLeft size={18} color="#fff" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>
              Product Board
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Tu voz construye BuddyOne
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="gap-1.5"
            style={{ background: "#F97316", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13 }}
          >
            <Plus size={15} /> Nueva idea
          </Button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>{totalRequests}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Solicitudes</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#F97316" }}>{totalVotes}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Votos totales</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#10B981" }}>
              {data?.statusStats?.find(s => s.status === "completed")?.count ?? 0}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Implementadas</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {([
            { key: "board", label: "Tablero", icon: <BarChart3 size={13} /> },
            { key: "roadmap", label: "Roadmap", icon: <TrendingUp size={13} /> },
            { key: "mine", label: "Mis ideas", icon: <Sparkles size={13} /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8, border: "none",
                background: activeTab === tab.key ? "#F97316" : "rgba(255,255,255,0.08)",
                color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.7)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>

        {/* ── Board Tab ── */}
        {activeTab === "board" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-auto min-w-[140px] h-9 text-xs rounded-lg bg-white border-gray-200">
                  <Filter size={12} className="mr-1" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-auto min-w-[130px] h-9 text-xs rounded-lg bg-white border-gray-200">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-auto min-w-[130px] h-9 text-xs rounded-lg bg-white border-gray-200">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
              {data?.categoryStats?.map(cs => (
                <button
                  key={cs.category}
                  onClick={() => setSelectedCategory(selectedCategory === cs.category ? "all" : cs.category)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 20, border: "none",
                    background: selectedCategory === cs.category ? CATEGORIES.find(c => c.value === cs.category)?.color ?? "#6B7280" : "#fff",
                    color: selectedCategory === cs.category ? "#fff" : "#374151",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)", whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                >
                  {CATEGORIES.find(c => c.value === cs.category)?.icon} {cs.label}
                  <span style={{
                    background: selectedCategory === cs.category ? "rgba(255,255,255,0.3)" : "#F3F4F6",
                    borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                  }}>
                    {cs.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Request list */}
            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 100, background: "#fff", borderRadius: 14, animation: "pulse 1.5s infinite" }} />
                ))}
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
              </div>
            ) : data?.requests?.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Lightbulb size={40} style={{ margin: "0 auto 12px", color: "#F97316", opacity: 0.5 }} />
                  <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    Todavía no hay solicitudes
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                    Se el primero en proponer una mejora para la plataforma
                  </p>
                  <Button onClick={() => setShowForm(true)} style={{ background: "#F97316", border: "none", borderRadius: 10, fontWeight: 700 }}>
                    <Plus size={15} /> Enviar mi primera idea
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data?.requests?.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onVote={() => voteMutation.mutate({ requestId: request.id })}
                    isOwnRequest={request.userId === user?.id}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Roadmap Tab ── */}
        {activeTab === "roadmap" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
              Aquí puedes ver en qué estamos trabajando y qué viene a continuación. Tu feedback y votos nos ayudan a priorizar.
            </p>

            {/* Planned */}
            <RoadmapColumn
              title="Planificado"
              subtitle="Próximamente"
              items={roadmapData.planned}
              color="#3B82F6"
              bg="#EFF6FF"
              icon={<Clock size={16} />}
              onVote={(id) => voteMutation.mutate({ requestId: id })}
              userId={user?.id}
            />

            {/* In Progress */}
            <RoadmapColumn
              title="En desarrollo"
              subtitle="Trabajando en ello"
              items={roadmapData.in_progress}
              color="#8B5CF6"
              bg="#F5F3FF"
              icon={<Rocket size={16} />}
              onVote={(id) => voteMutation.mutate({ requestId: id })}
              userId={user?.id}
            />

            {/* Completed */}
            <RoadmapColumn
              title="Completado"
              subtitle="Ya disponible"
              items={roadmapData.completed}
              color="#10B981"
              bg="#ECFDF5"
              icon={<CheckCircle2 size={16} />}
              onVote={(id) => voteMutation.mutate({ requestId: id })}
              userId={user?.id}
            />

            {roadmapData.planned.length === 0 && roadmapData.in_progress.length === 0 && roadmapData.completed.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <TrendingUp size={40} style={{ margin: "0 auto 12px", color: "#3B82F6", opacity: 0.5 }} />
                  <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    El roadmap se irá llenando con vuestras ideas
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
                    Cuando nuestro equipo revise las solicitudes, aparecerán aquí organizadas por estado
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── My Ideas Tab ── */}
        {activeTab === "mine" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Mis solicitudes ({myRequests?.length ?? 0})
              </p>
              <Button
                onClick={() => setShowForm(true)}
                size="sm"
                style={{ background: "#F97316", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12 }}
              >
                <Plus size={13} /> Nueva
              </Button>
            </div>

            {!myRequests?.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Sparkles size={40} style={{ margin: "0 auto 12px", color: "#F97316", opacity: 0.5 }} />
                  <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
                    Aún no has enviado ninguna idea
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>
                    Cuéntanos qué necesitas para mejorar la experiencia con tus pacientes
                  </p>
                  <Button onClick={() => setShowForm(true)} style={{ background: "#F97316", border: "none", borderRadius: 10, fontWeight: 700 }}>
                    <Plus size={15} /> Enviar mi primera idea
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myRequests.map(request => {
                  const statusCfg = STATUS_CONFIG[request.status];
                  const catCfg = CATEGORIES.find(c => c.value === request.category);
                  return (
                    <Card key={request.id} className="border-0 shadow-sm overflow-hidden">
                      <CardContent style={{ padding: 16 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 3,
                                padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                                background: statusCfg?.bg ?? "#F3F4F6", color: statusCfg?.color ?? "#6B7280",
                              }}>
                                {statusCfg?.icon} {statusCfg?.label ?? request.status}
                              </span>
                              <span style={{ fontSize: 10, color: "#9CA3AF" }}>
                                {catCfg?.icon} {catCfg?.label}
                              </span>
                            </div>
                            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{request.title}</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                              {request.description.length > 120 ? request.description.slice(0, 120) + "..." : request.description}
                            </p>
                            {request.adminNote && (
                              <div style={{ marginTop: 8, padding: "8px 10px", background: "#FEF3C7", borderRadius: 8, borderLeft: "3px solid #F59E0B" }}>
                                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#92400E" }}>Respuesta del equipo:</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#78350F", lineHeight: 1.4 }}>{request.adminNote}</p>
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                            <ChevronUp size={16} color="#F97316" />
                            <span style={{ fontSize: 16, fontWeight: 900, color: "#111827" }}>{request.voteCount}</span>
                            <span style={{ fontSize: 9, color: "#9CA3AF" }}>votos</span>
                          </div>
                        </div>
                        <p style={{ margin: "8px 0 0", fontSize: 10, color: "#9CA3AF" }}>
                          Enviada el {new Date(request.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── New Request Dialog ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px]" style={{ borderRadius: 16 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Lightbulb size={20} color="#F97316" />
              Nueva solicitud de mejora
            </DialogTitle>
            <DialogDescription>
              Cuéntanos qué funcionalidad te ayudaría a trabajar mejor con tus pacientes. Las ideas más votadas por la comunidad se priorizan.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Categoría</Label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 10,
                      border: category === c.value ? `2px solid ${c.color}` : "2px solid #E5E7EB",
                      background: category === c.value ? `${c.color}10` : "#fff",
                      cursor: "pointer", fontSize: 12, fontWeight: 600,
                      color: category === c.value ? c.color : "#374151",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Título</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej: Poder duplicar un plan nutricional existente"
                maxLength={255}
                className="rounded-lg"
              />
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "#9CA3AF", textAlign: "right" }}>{title.length}/255</p>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Descripción</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe con detalle qué necesitas y cómo te ayudaría en tu día a día con los pacientes..."
                rows={4}
                maxLength={2000}
                className="rounded-lg resize-none"
              />
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "#9CA3AF", textAlign: "right" }}>{description.length}/2000</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || title.length < 5 || description.length < 20}
              className="w-full gap-2"
              style={{ background: "#F97316", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, padding: "12px" }}
            >
              <Send size={15} />
              {createMutation.isPending ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Request Card ────────────────────────────────────────────────────────────
function RequestCard({ request, onVote, isOwnRequest }: {
  request: any;
  onVote: () => void;
  isOwnRequest: boolean;
}) {
  const statusCfg = STATUS_CONFIG[request.status];
  const catCfg = CATEGORIES.find(c => c.value === request.category);
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-0 shadow-sm overflow-hidden" style={{ transition: "transform 0.15s", cursor: "pointer" }}>
      <CardContent style={{ padding: 0 }}>
        <div style={{ display: "flex" }}>
          {/* Vote column */}
          <button
            onClick={(e) => { e.stopPropagation(); onVote(); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "12px 14px", gap: 2, border: "none", cursor: "pointer",
              background: request.hasVoted ? "#FFF7ED" : "#FAFAFA",
              borderRight: "1px solid #F3F4F6",
              transition: "background 0.2s",
              minWidth: 56,
            }}
            aria-label={request.hasVoted ? "Quitar voto" : "Votar"}
          >
            <ChevronUp
              size={20}
              style={{
                color: request.hasVoted ? "#F97316" : "#9CA3AF",
                transition: "color 0.2s, transform 0.2s",
                transform: request.hasVoted ? "scale(1.15)" : "scale(1)",
              }}
            />
            <span style={{
              fontSize: 16, fontWeight: 900,
              color: request.hasVoted ? "#F97316" : "#374151",
              transition: "color 0.2s",
            }}>
              {request.voteCount}
            </span>
          </button>

          {/* Content */}
          <div style={{ flex: 1, padding: "12px 14px", minWidth: 0 }} onClick={() => setExpanded(!expanded)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: statusCfg?.bg ?? "#F3F4F6", color: statusCfg?.color ?? "#6B7280",
              }}>
                {statusCfg?.icon} {statusCfg?.label ?? request.status}
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: `${catCfg?.color ?? "#6B7280"}15`, color: catCfg?.color ?? "#6B7280",
              }}>
                {catCfg?.icon} {catCfg?.label}
              </span>
              {isOwnRequest && (
                <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "#FEF3C7", color: "#92400E" }}>
                  Tu idea
                </span>
              )}
            </div>

            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
              {request.title}
            </p>

            <p style={{ margin: 0, fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
              {expanded ? request.description : (request.description.length > 100 ? request.description.slice(0, 100) + "..." : request.description)}
            </p>

            {request.adminNote && (
              <div style={{ marginTop: 8, padding: "6px 10px", background: "#FEF3C7", borderRadius: 8, borderLeft: "3px solid #F59E0B" }}>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#92400E" }}>Respuesta del equipo:</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#78350F", lineHeight: 1.4 }}>{request.adminNote}</p>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              {request.authorImage ? (
                <img src={request.authorImage} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#9CA3AF" }}>
                  {request.authorName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                {request.authorName ?? "Anónimo"} · {new Date(request.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Roadmap Column ──────────────────────────────────────────────────────────
function RoadmapColumn({ title, subtitle, items, color, bg, icon, onVote, userId }: {
  title: string; subtitle: string; items: any[]; color: string; bg: string;
  icon: React.ReactNode; onVote: (id: number) => void; userId?: number;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>{subtitle} · {items.length} ideas</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "16px", background: bg, borderRadius: 12, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>Sin elementos por ahora</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(item => {
            const catCfg = CATEGORIES.find(c => c.value === item.category);
            return (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", background: "#fff", borderRadius: 12,
                borderLeft: `3px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <button
                  onClick={() => onVote(item.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    gap: 1, border: "none", background: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  <ChevronUp size={14} color={item.hasVoted ? "#F97316" : "#9CA3AF"} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: item.hasVoted ? "#F97316" : "#374151" }}>{item.voteCount}</span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.title}</p>
                  <span style={{ fontSize: 10, color: catCfg?.color ?? "#6B7280" }}>{catCfg?.icon} {catCfg?.label}</span>
                </div>
                {item.userId === userId && (
                  <span style={{ padding: "2px 6px", borderRadius: 6, fontSize: 9, fontWeight: 700, background: "#FEF3C7", color: "#92400E", flexShrink: 0 }}>
                    Tu idea
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
