import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BuddyKidsMenuGeneratorProps {
  childId: number;
  childName: string;
  onMenuGenerated?: () => void;
}

export default function BuddyKidsMenuGenerator({ childId, childName, onMenuGenerated }: BuddyKidsMenuGeneratorProps) {
  const [days, setDays] = useState<string>("7");
  const [mealsPerDay, setMealsPerDay] = useState<string>("3");
  const [mealType, setMealType] = useState<"balanced" | "high_protein" | "vegetarian" | "vegan">("balanced");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMenuMutation = trpc.buddyKids.generateAutoMenu.useMutation();

  const handleGenerateMenu = async () => {
    try {
      setIsGenerating(true);
      const menu = await generateMenuMutation.mutateAsync({
        childId,
        days: parseInt(days),
        mealsPerDay: parseInt(mealsPerDay),
        mealType,
      });
      
      toast.success(`¡Menú generado para ${childName}!`);
      onMenuGenerated?.();
    } catch (error) {
      toast.error("Error al generar el menú. Intenta de nuevo.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const mealTypeLabels = {
    balanced: "Balanceado",
    high_protein: "Alto en proteína",
    vegetarian: "Vegetariano",
    vegan: "Vegano",
  };

  return (
    <Card className="w-full border-orange-200 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          Generar Menú Automático
        </CardTitle>
        <CardDescription>
          Crea un menú personalizado con IA considerando alergias y preferencias de {childName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Número de días</label>
            <Select value={days} onValueChange={setDays} disabled={isGenerating}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 7, 14, 30].map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {d} {d === 1 ? "día" : "días"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Comidas por día</label>
            <Select value={mealsPerDay} onValueChange={setMealsPerDay} disabled={isGenerating}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5].map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m} comidas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Tipo de menú</label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as any)} disabled={isGenerating}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanceado</SelectItem>
                <SelectItem value="high_protein">Alto en proteína</SelectItem>
                <SelectItem value="vegetarian">Vegetariano</SelectItem>
                <SelectItem value="vegan">Vegano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            El menú se generará considerando las alergias registradas, comidas favoritas y edad de {childName}.
          </p>
        </div>

        <Button
          onClick={handleGenerateMenu}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold h-11"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando menú con IA...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generar menú con IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
