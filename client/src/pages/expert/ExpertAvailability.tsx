import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Calendar, Clock, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  return `${h.toString().padStart(2, "0")}:${m}`;
});

interface SlotRow {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  slotDuration: number;
}

export default function ExpertAvailability() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { data: existingSlots, isLoading } = trpc.expertEnhanced.getAvailability.useQuery(undefined, {
    enabled: !!user,
    onSuccess: (data: any[]) => {
      if (!loaded && data) {
        setSlots(data.map((s: any) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive ?? true,
          slotDuration: s.slotDuration ?? 30,
        })));
        setLoaded(true);
      }
    },
  });

  const saveMutation = trpc.expertEnhanced.saveAvailability.useMutation({
    onSuccess: () => toast.success("Disponibilidad guardada"),
    onError: (err) => toast.error(err.message),
  });

  const addSlot = () => {
    setSlots(prev => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "13:00", isActive: true, slotDuration: 30 }]);
  };

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, field: keyof SlotRow, value: any) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSave = () => {
    saveMutation.mutate({ slots: slots.map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive, slotDuration: s.slotDuration })) });
  };

  // Group by day for visual calendar
  const byDay = useMemo(() => {
    const map = new Map<number, SlotRow[]>();
    slots.forEach((s, idx) => {
      if (!map.has(s.dayOfWeek)) map.set(s.dayOfWeek, []);
      map.get(s.dayOfWeek)!.push({ ...s, id: idx });
    });
    return map;
  }, [slots]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-emerald-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-emerald-500" /> Disponibilidad</h1>
            <p className="text-sm text-muted-foreground">Configura tus horarios para que los pacientes puedan reservar directamente</p>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="w-4 h-4 mr-1" /> {saveMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {/* Weekly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(d => {
                const daySlots = byDay.get(d.value) || [];
                const activeSlots = daySlots.filter(s => s.isActive);
                return (
                  <div key={d.value} className={`text-center p-3 rounded-xl border ${activeSlots.length > 0 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" : "bg-muted/30 border-muted"}`}>
                    <p className="text-xs font-semibold mb-1">{d.label.slice(0, 3)}</p>
                    {activeSlots.length > 0 ? (
                      <div className="space-y-0.5">
                        {activeSlots.map((s, i) => (
                          <p key={i} className="text-[10px] text-emerald-700 dark:text-emerald-300">{s.startTime}-{s.endTime}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No disponible</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Slot Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Franjas horarias</CardTitle>
              <Button variant="outline" size="sm" onClick={addSlot}><Plus className="w-4 h-4 mr-1" /> Añadir franja</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {slots.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay franjas configuradas</p>
                <Button variant="outline" className="mt-3" onClick={addSlot}><Plus className="w-4 h-4 mr-1" /> Añadir primera franja</Button>
              </div>
            ) : (
              slots.map((slot, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${slot.isActive ? "bg-background" : "bg-muted/30 opacity-60"}`}>
                  <Switch checked={slot.isActive} onCheckedChange={v => updateSlot(idx, "isActive", v)} />
                  <Select value={slot.dayOfWeek.toString()} onValueChange={v => updateSlot(idx, "dayOfWeek", parseInt(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(d => <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={slot.startTime} onValueChange={v => updateSlot(idx, "startTime", v)}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <span className="text-muted-foreground">a</span>
                  <Select value={slot.endTime} onValueChange={v => updateSlot(idx, "endTime", v)}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={slot.slotDuration.toString()} onValueChange={v => updateSlot(idx, "slotDuration", parseInt(v))}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeSlot(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
