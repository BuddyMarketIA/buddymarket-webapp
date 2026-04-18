import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/sonner-a11y-shim";
import { FileText, Download, TrendingUp, Loader2, BarChart3, Sparkles } from "lucide-react";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function MonthlyReports() {
  const now = new Date();
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const reports = trpc.retention.getMonthlyReports.useQuery();
  const utils = trpc.useUtils();

  const generateReport = trpc.retention.generateMonthlyReport.useMutation({
    onSuccess: (data) => {
      utils.retention.getMonthlyReports.invalidate();
      toast.success(`📊 Informe de ${MONTH_NAMES[(data.report?.month ?? 1) - 1]} generado. Días registrados: ${data.stats.totalDays}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const generatePDF = trpc.retention.generateMonthlyReportPDF.useMutation({
    onSuccess: (data) => {
      setGeneratingPdf(null);
      utils.retention.getMonthlyReports.invalidate();
      if (data.ok && data.url) {
        window.open(data.url, "_blank");
        toast.success("✅ PDF generado. Descargando...");
      } else {
        toast.error("No se pudo generar el PDF. Inténtalo de nuevo.");
      }
    },
    onError: (e) => { setGeneratingPdf(null); toast.error(e.message); },
  });

  const handleGeneratePDF = (year: number, month: number) => {
    const key = `${year}-${month}`;
    setGeneratingPdf(key);
    generatePDF.mutate({ year, month });
  };

  // Generate last 3 months options
  const monthOptions = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Informes Mensuales</h1>
            <p className="text-sm text-muted-foreground">Tu evolución nutricional mes a mes</p>
          </div>
        </div>

        {/* Generate new report */}
        <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-1">Generar informe</h3>
            <p className="text-sm text-muted-foreground mb-3">Selecciona el mes que quieres analizar:</p>
            <div className="flex flex-wrap gap-2">
              {monthOptions.map(({ year, month }) => {
                const alreadyGenerated = reports.data?.some(r => r.year === year && r.month === month);
                return (
                  <Button key={`${year}-${month}`} variant="outline" size="sm"
                    className={alreadyGenerated ? "border-green-400 text-green-600" : "border-blue-300 text-blue-600"}
                    disabled={generateReport.isPending}
                    onClick={() => generateReport.mutate({ year, month })}>
                    {alreadyGenerated ? "✅ " : ""}{MONTH_NAMES[month - 1]} {year}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reports list */}
        {reports.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : reports.data && reports.data.length > 0 ? (
          <div className="space-y-3">
            <h2 className="font-bold text-foreground">Mis informes</h2>
            {reports.data.map(report => {
              const summary = report.summaryJson ? JSON.parse(report.summaryJson) : null;
              const pdfKey = `${report.year}-${report.month}`;
              const isGeneratingThisPdf = generatingPdf === pdfKey;
              return (
                <Card key={report.id} className="border border-border hover:border-blue-300 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{MONTH_NAMES[report.month - 1]} {report.year}</h3>
                        {summary && (
                          <div className="flex flex-wrap gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">📅 {summary.totalDays} días</span>
                            <span className="text-xs text-muted-foreground">🔥 ~{summary.avgCalories} kcal/día</span>
                            <span className="text-xs text-muted-foreground">💪 ~{summary.avgProtein}g prot/día</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Generado el {new Date(report.generatedAt).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {report.pdfUrl ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4 mr-1" /> PDF
                            </a>
                          </Button>
                        ) : (
                          <Button
                            variant="outline" size="sm"
                            disabled={isGeneratingThisPdf}
                            onClick={() => handleGeneratePDF(report.year, report.month)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            {isGeneratingThisPdf
                              ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generando...</>
                              : <><Sparkles className="w-3 h-3 mr-1" /> Generar PDF</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">Sin informes todavía</h3>
              <p className="text-sm text-muted-foreground">Genera tu primer informe mensual para ver tu evolución nutricional</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
