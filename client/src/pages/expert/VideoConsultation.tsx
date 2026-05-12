import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Clock, User, Calendar, Copy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function VideoConsultation() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [duration, setDuration] = useState(30);

  const { data: patients } = trpc.expertPatients.list.useQuery(undefined, { enabled: !!user });
  const { data: rooms, isLoading, refetch } = trpc.expertEnhanced.getVideoRooms.useQuery(undefined, { enabled: !!user });

  const createMutation = trpc.expertEnhanced.createVideoRoom.useMutation({
    onSuccess: (data) => {
      toast.success("Sala de videoconsulta creada");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const endMutation = trpc.expertEnhanced.endVideoRoom.useMutation({
    onSuccess: () => {
      toast.success("Consulta finalizada");
      refetch();
    },
  });

  const handleCreate = () => {
    if (!selectedPatient) {
      toast.error("Selecciona un paciente");
      return;
    }
    createMutation.mutate({ patientRelId: selectedPatient, durationMinutes: duration });
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado");
  };

  const activeRooms = (rooms || []).filter((r: any) => r.status === "active" || r.status === "waiting");
  const pastRooms = (rooms || []).filter((r: any) => r.status === "ended");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6 text-blue-500" /> Videoconsultas</h1>
            <p className="text-sm text-muted-foreground">Crea salas de videoconsulta para tus pacientes</p>
          </div>
        </div>

        {/* Create Room */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="py-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium mb-1">Paciente</p>
                <Select value={selectedPatient?.toString() || ""} onValueChange={v => setSelectedPatient(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <span className="flex items-center gap-2"><User className="w-3 h-3" /> {p.patientName || `Paciente #${p.id}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <p className="text-sm font-medium mb-1">Duración</p>
                <Select value={duration.toString()} onValueChange={v => setDuration(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60].map(d => <SelectItem key={d} value={d.toString()}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !selectedPatient}
                className="bg-blue-600 hover:bg-blue-700 text-white">
                <Video className="w-4 h-4 mr-1" /> {createMutation.isPending ? "Creando..." : "Crear sala"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Rooms */}
        {activeRooms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Salas activas
            </h2>
            {activeRooms.map((room: any) => (
              <Card key={room.id} className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="py-4 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                        <Video className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{room.patientName || "Paciente"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {room.durationMinutes} min
                          <Badge variant="outline" className="text-[10px]">{room.status === "waiting" ? "Esperando" : "En curso"}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {room.roomUrl && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => copyLink(room.roomUrl)}>
                            <Copy className="w-3 h-3 mr-1" /> Copiar enlace
                          </Button>
                          <a href={room.roomUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                              <Video className="w-3 h-3 mr-1" /> Unirse
                            </Button>
                          </a>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => endMutation.mutate({ roomId: room.id })}>
                        <PhoneOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Past Rooms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de consultas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />)}</div>
            ) : pastRooms.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay consultas anteriores</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pastRooms.slice(0, 20).map((room: any) => (
                  <div key={room.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-muted"><Video className="w-4 h-4 text-muted-foreground" /></div>
                      <div>
                        <p className="text-sm font-medium">{room.patientName || "Paciente"}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {room.createdAt ? new Date(room.createdAt).toLocaleString("es-ES") : ""} · {room.durationMinutes} min
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Finalizada</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
