import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  ChevronLeft,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  HelpCircle,
  CreditCard,
  Settings,
  Lightbulb,
  Apple,
  LifeBuoy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Abierto", color: "bg-blue-100 text-blue-700 border-blue-200", icon: <MessageSquare className="h-3 w-3" /> },
  in_progress: { label: "En progreso", color: "bg-orange-100 text-orange-700 border-orange-200", icon: <Clock className="h-3 w-3" /> },
  waiting_user: { label: "Esperando tu respuesta", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: <AlertCircle className="h-3 w-3" /> },
  resolved: { label: "Resuelto", color: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  closed: { label: "Cerrado", color: "bg-gray-100 text-gray-600 border-gray-200", icon: <XCircle className="h-3 w-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Baja", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Media", color: "bg-blue-100 text-blue-700" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-700" },
};

const CATEGORY_OPTIONS = [
  { value: "billing", label: "Facturación", icon: <CreditCard className="h-4 w-4" /> },
  { value: "technical", label: "Problema técnico", icon: <Settings className="h-4 w-4" /> },
  { value: "account", label: "Mi cuenta", icon: <HelpCircle className="h-4 w-4" /> },
  { value: "feature", label: "Sugerencia", icon: <Lightbulb className="h-4 w-4" /> },
  { value: "nutrition", label: "Nutrición", icon: <Apple className="h-4 w-4" /> },
  { value: "other", label: "Otro", icon: <LifeBuoy className="h-4 w-4" /> },
];

function formatDate(date: Date | string) {
  return format(new Date(date), "d MMM yyyy · HH:mm", { locale: es });
}

// ─── Ticket Detail Modal ─────────────────────────────────────────────────────

function TicketDetailModal({
  ticketId,
  onClose,
}: {
  ticketId: number;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [reply, setReply] = useState("");

  const { data, isLoading, refetch } = trpc.support.getTicketDetail.useQuery({ ticketId });

  const addMessage = trpc.support.addMessage.useMutation({
    onSuccess: () => {
      setReply("");
      refetch();
      utils.support.getMyTickets.invalidate();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeTicket = trpc.support.closeTicket.useMutation({
    onSuccess: () => {
      toast({ title: "Ticket cerrado", description: "Tu consulta ha sido marcada como cerrada." });
      refetch();
      utils.support.getMyTickets.invalidate();
    },
  });

  const ticket = data?.ticket;
  const messages = data?.messages ?? [];
  const isClosed = ticket?.status === "closed" || ticket?.status === "resolved";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-snug">
                {isLoading ? "Cargando..." : ticket?.subject}
              </DialogTitle>
              {ticket && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_CONFIG[ticket.status]?.color}`}>
                    {STATUS_CONFIG[ticket.status]?.icon}
                    {STATUS_CONFIG[ticket.status]?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[ticket.priority]?.color}`}>
                    {PRIORITY_CONFIG[ticket.priority]?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">#{ticket.id}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.authorId === user?.id;
              const isAdmin = msg.authorRole === "admin";
              return (
                <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                    {isAdmin ? "BM" : (msg.authorName?.[0] ?? "U")}
                  </div>
                  <div className={`max-w-[75%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                      <span className="font-medium">{isAdmin ? "Equipo BuddyMarket" : (msg.authorName ?? "Tú")}</span>
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isOwnMessage ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply box */}
        <div className="px-6 py-4 border-t">
          {isClosed ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Este ticket está cerrado. Si necesitas más ayuda, abre una nueva consulta.
            </p>
          ) : (
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="resize-none min-h-[72px] text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && reply.trim()) {
                    addMessage.mutate({ ticketId, message: reply.trim() });
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  disabled={!reply.trim() || addMessage.isPending}
                  onClick={() => addMessage.mutate({ ticketId, message: reply.trim() })}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {addMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                {ticket && !isClosed && (
                  <Button
                    size="icon"
                    variant="outline"
                    title="Cerrar ticket"
                    onClick={() => closeTicket.mutate({ ticketId })}
                    disabled={closeTicket.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── New Ticket Form ─────────────────────────────────────────────────────────

function NewTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");

  const createTicket = trpc.support.createTicket.useMutation({
    onSuccess: () => {
      toast({ title: "Consulta enviada ✅", description: "Te responderemos lo antes posible. Recibirás un email de confirmación." });
      utils.support.getMyTickets.invalidate();
      onSuccess();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    createTicket.mutate({ subject: subject.trim(), category: category as any, priority: priority as any, message: message.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="subject">Asunto *</Label>
        <Input
          id="subject"
          placeholder="Describe brevemente tu consulta"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={256}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {opt.icon} {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Descripción *</Label>
        <Textarea
          id="message"
          placeholder="Explica tu consulta con el mayor detalle posible. Cuanta más información nos des, más rápido podremos ayudarte."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[140px] resize-none"
          required
        />
        <p className="text-xs text-muted-foreground">{message.length}/5000 caracteres</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={!subject.trim() || !message.trim() || createTicket.isPending}
          className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
        >
          {createTicket.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" />Enviar consulta</>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Soporte() {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "new">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const { data: tickets, isLoading } = trpc.support.getMyTickets.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Inicia sesión para acceder al soporte.</p>
      </div>
    );
  }

  const openTickets = tickets?.filter(t => !["closed", "resolved"].includes(t.status)) ?? [];
  const closedTickets = tickets?.filter(t => ["closed", "resolved"].includes(t.status)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-orange-500" />
              Centro de soporte
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Estamos aquí para ayudarte. Tiempo medio de respuesta: menos de 24h.
            </p>
          </div>
          {view === "list" && (
            <Button
              onClick={() => setView("new")}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva consulta
            </Button>
          )}
        </div>

        {/* New ticket form */}
        {view === "new" && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base">Nueva consulta</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <NewTicketForm onSuccess={() => setView("list")} />
            </CardContent>
          </Card>
        )}

        {/* Ticket list */}
        {view === "list" && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tickets?.length === 0 ? (
              <Card className="py-16 text-center">
                <CardContent>
                  <LifeBuoy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No tienes consultas abiertas</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    ¿Tienes alguna duda o problema? Nuestro equipo está aquí para ayudarte.
                  </p>
                  <Button
                    onClick={() => setView("new")}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Abrir primera consulta
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Open tickets */}
                {openTickets.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Consultas activas ({openTickets.length})
                    </h2>
                    <div className="space-y-2">
                      {openTickets.map((ticket) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          onClick={() => setSelectedTicketId(ticket.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Closed tickets */}
                {closedTickets.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Historial ({closedTickets.length})
                    </h2>
                    <div className="space-y-2">
                      {closedTickets.map((ticket) => (
                        <TicketRow
                          key={ticket.id}
                          ticket={ticket}
                          onClick={() => setSelectedTicketId(ticket.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Ticket detail modal */}
      {selectedTicketId && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
}

// ─── Ticket Row ──────────────────────────────────────────────────────────────

function TicketRow({
  ticket,
  onClick,
}: {
  ticket: {
    id: number;
    subject: string;
    category: string;
    priority: string;
    status: string;
    statusLabel: string;
    priorityLabel: string;
    categoryLabel: string;
    messageCount: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
  onClick: () => void;
}) {
  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
  const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card border rounded-xl px-4 py-3.5 hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.color}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityCfg.color}`}>
              {priorityCfg.label}
            </span>
            <span className="text-xs text-muted-foreground">{ticket.categoryLabel}</span>
          </div>
          <p className="font-medium text-sm truncate">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground mt-1">
            #{ticket.id} · Actualizado {formatDate(ticket.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <MessageSquare className="h-3.5 w-3.5" />
          {ticket.messageCount}
        </div>
      </div>
    </button>
  );
}
