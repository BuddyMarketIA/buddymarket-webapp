import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Leaf, TreePine, Droplets, Truck, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/sonner-a11y-shim";

export default function SustainabilityScore() {
  const { user } = useAuth();

  const { data: seasonalData } = trpc.sustainability.getSeasonalProducts.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: scoreData } = trpc.sustainability.getWeeklyScore.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <Leaf className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sostenibilidad</h1>
        <p className="text-muted-foreground">Inicia sesión para ver tu impacto ambiental</p>
      </div>
    );
  }

  const score = scoreData?.score || 0;
  const scoreColor = score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  const scoreLabel = score >= 75 ? "Excelente" : score >= 50 ? "Mejorable" : "Alto impacto";

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Huella Ecológica</h1>
        <p className="text-muted-foreground mt-1">Tu impacto ambiental semanal</p>
      </div>

      {/* Score Circle */}
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                className={scoreColor}
                strokeDasharray={`${score * 2.83} 283`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <p className={`font-semibold ${scoreColor}`}>{scoreLabel}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {scoreData?.co2Saved ? `${scoreData.co2Saved} kg CO₂ ahorrados esta semana` : "Registra comidas para calcular tu huella"}
          </p>
        </CardContent>
      </Card>

      {/* Impact breakdown */}
      {scoreData?.breakdown && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-3 text-center">
              <Droplets className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold">{scoreData.breakdown.water}L</p>
              <p className="text-xs text-muted-foreground">Agua</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <TreePine className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold">{scoreData.breakdown.co2}kg</p>
              <p className="text-xs text-muted-foreground">CO₂</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Truck className="w-5 h-5 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold">{scoreData.breakdown.km}km</p>
              <p className="text-xs text-muted-foreground">Transporte</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seasonal Products */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">🌱</span>
            Productos de temporada — {seasonalData?.month || "este mes"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {seasonalData?.products && (
            <div className="space-y-3">
              {Object.entries(seasonalData.products as Record<string, string[]>).map(([category, items]) => (
                <div key={category}>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{category}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(items as string[]).map((item: string) => (
                      <span key={item} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      {scoreData?.tips && scoreData.tips.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Consejos para reducir tu huella
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {scoreData.tips.map((tip: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
