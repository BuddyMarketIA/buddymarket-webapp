import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Image, Play, Pause, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminRecipeImages() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalSuccess, setTotalSuccess] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [shouldStop, setShouldStop] = useState(false);

  const { data: stats, refetch: refetchStats } = trpc.recipeImages.getStats.useQuery(undefined, {
    refetchInterval: isRunning ? 10000 : false,
  });

  const generateBatch = trpc.recipeImages.generateBatch.useMutation();

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 200));
  }, []);

  const runBatches = useCallback(async () => {
    setIsRunning(true);
    setShouldStop(false);
    setTotalProcessed(0);
    setTotalSuccess(0);
    setTotalFailed(0);
    setCurrentBatch(0);
    setLogs([]);

    let batchNum = 0;
    let consecutiveEmpty = 0;

    while (!shouldStop) {
      batchNum++;
      setCurrentBatch(batchNum);
      addLog(`🚀 Iniciando lote #${batchNum} (offset: 0, siempre toma las primeras 100 pendientes)...`);

      try {
        const result = await generateBatch.mutateAsync({ batchSize: 100, offset: 0 });

        if (result.processed === 0) {
          consecutiveEmpty++;
          addLog(`✅ No hay más recetas pendientes. ¡Proceso completado!`);
          if (consecutiveEmpty >= 2) break;
          continue;
        }

        consecutiveEmpty = 0;
        setTotalProcessed(prev => prev + result.processed);
        setTotalSuccess(prev => prev + result.success);
        setTotalFailed(prev => prev + result.failed);

        addLog(`📊 Lote #${batchNum}: ${result.success} ✓ / ${result.failed} ✗ de ${result.processed} recetas`);

        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err: any) => {
            addLog(`  ❌ ${err.name} (ID: ${err.id}): ${err.error}`);
          });
        }

        // Refetch stats after each batch
        refetchStats();

        // Check if user wants to stop
        if (shouldStop) {
          addLog(`⏹️ Proceso detenido por el usuario.`);
          break;
        }

        // Small pause between batches
        addLog(`⏳ Esperando 2s antes del siguiente lote...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err: any) {
        addLog(`💥 Error en lote #${batchNum}: ${err.message}`);
        toast.error(`Error en lote #${batchNum}: ${err.message}`);
        // Wait longer on error before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    setIsRunning(false);
    refetchStats();
    toast.success(`Proceso finalizado: ${totalSuccess} imágenes generadas`);
  }, [shouldStop, generateBatch, addLog, refetchStats, totalSuccess]);

  const stopProcess = () => {
    setShouldStop(true);
    addLog(`⏹️ Deteniendo después del lote actual...`);
  };

  const pendingCount = stats?.unsplashImages ?? 0;
  const aiCount = stats?.aiGenerated ?? 0;
  const totalRecipes = stats?.total ?? 0;
  const progressPercent = totalRecipes > 0 ? Math.round((aiCount / totalRecipes) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6 text-orange-500" />
            Generador de Imágenes de Recetas
          </h1>
          <p className="text-muted-foreground">
            Genera imágenes del plato terminado usando IA para todas las recetas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{totalRecipes.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Recetas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">{pendingCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Pendientes (Unsplash)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{aiCount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Generadas (IA)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">{Math.ceil(pendingCount / 100)}</p>
              <p className="text-sm text-muted-foreground">Lotes Pendientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
          <CardDescription>
            {aiCount} de {totalRecipes} recetas con imagen de plato terminado ({progressPercent}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>{progressPercent}% completado</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Generación por Lotes</CardTitle>
          <CardDescription>
            Cada lote procesa 100 recetas. Genera una imagen IA del plato terminado, la sube a S3 y actualiza la BD.
            Tiempo estimado: ~50s por receta (incluye generación + upload).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            {!isRunning ? (
              <Button
                onClick={runBatches}
                disabled={pendingCount === 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Generación Automática
              </Button>
            ) : (
              <Button onClick={stopProcess} variant="destructive">
                <Pause className="h-4 w-4 mr-2" />
                Detener Después del Lote Actual
              </Button>
            )}
            <Button variant="outline" onClick={() => refetchStats()} disabled={isRunning}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Stats
            </Button>
          </div>

          {isRunning && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              <div>
                <p className="font-medium">Procesando lote #{currentBatch}...</p>
                <p className="text-sm text-muted-foreground">
                  Sesión: {totalProcessed} procesadas, {totalSuccess} éxitos, {totalFailed} fallos
                </p>
              </div>
            </div>
          )}

          {/* Session Stats */}
          {totalProcessed > 0 && (
            <div className="flex gap-4 text-sm">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {totalSuccess} generadas
              </Badge>
              <Badge variant="outline" className="gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                {totalFailed} fallidas
              </Badge>
              <Badge variant="outline">
                Lotes completados: {currentBatch}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Esperando inicio de generación...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-0.5">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
