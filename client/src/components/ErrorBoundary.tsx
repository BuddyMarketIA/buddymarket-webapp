import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, WifiOff } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Detects if the error is a failed dynamic import (chunk/module not found).
 * This typically happens during server cold starts or network issues.
 */
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Unable to preload CSS") ||
    msg.includes("ChunkLoadError") ||
    (error.name === "TypeError" && msg.includes("import"))
  );
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Log the error so it appears in Safari Web Inspector / remote debug
    try {
      console.error("[ErrorBoundary] Caught error:", error?.name, error?.message);
      console.error("[ErrorBoundary] Stack:", error?.stack);
    } catch (_) {}
    return { hasError: true, error };
  }

  componentDidUpdate(_: Props, prevState: State) {
    // Auto-retry once for chunk load errors (server cold start) via full page reload
    if (
      this.state.hasError &&
      !prevState.hasError &&
      isChunkLoadError(this.state.error) &&
      this.state.retryCount === 0
    ) {
      this.retryTimer = setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  handleRetry = () => {
    if (isChunkLoadError(this.state.error)) {
      window.location.reload();
    } else {
      this.setState((s) => ({ hasError: false, error: null, retryCount: s.retryCount + 1 }));
    }
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = isChunkLoadError(this.state.error);
      const isAutoRetrying = isChunkError && this.state.retryCount === 0;

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-md p-8 text-center">
            {isChunkError ? (
              <WifiOff size={48} className="text-orange-500 mb-6 flex-shrink-0" />
            ) : (
              <AlertTriangle size={48} className="text-destructive mb-6 flex-shrink-0" />
            )}

            <h2 className="text-xl font-bold mb-3 text-foreground">
              {isChunkError ? "Error de conexión" : "Ha ocurrido un error inesperado"}
            </h2>

            <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
              {isChunkError
                ? isAutoRetrying
                  ? "La aplicación está cargando... Reintentando automáticamente."
                  : "No se pudo cargar la página. Esto puede ocurrir durante el inicio del servidor. Por favor, recarga la página."
                : "Algo salió mal. Por favor, recarga la página para continuar."}
            </p>

            {/* Error details — always visible to help diagnose iOS issues */}
            {!isChunkError && this.state.error && (
              <div className="w-full mb-4 p-3 rounded-lg text-left" style={{background:'#fef2f2',border:'1px solid #fecaca'}}>
                <p className="text-xs font-mono break-all leading-relaxed" style={{color:'#b91c1c'}}>
                  {`${this.state.error.name}: ${this.state.error.message}`.slice(0, 300)}
                </p>
                {(() => {
                  try {
                    const prev = sessionStorage.getItem('bm_last_error');
                    const prevR = sessionStorage.getItem('bm_last_rejection');
                    if (prev || prevR) {
                      return (
                        <p className="text-xs font-mono break-all leading-relaxed mt-1" style={{color:'#7f1d1d'}}>
                          {prev ? `onerror: ${prev}` : ''}{prevR ? ` | rejection: ${prevR}` : ''}
                        </p>
                      );
                    }
                  } catch (_) {}
                  return null;
                })()}
              </div>
            )}

            {isAutoRetrying ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Reintentando...
              </div>
            ) : (
              <button
                onClick={this.handleRetry}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold",
                  "bg-orange-500 text-white",
                  "hover:bg-orange-600 cursor-pointer transition-colors"
                )}
              >
                <RotateCcw size={16} />
                Recargar página
              </button>
            )}

            {/* Show full stack trace in dev mode */}
            {import.meta.env.DEV && !isChunkError && (
              <details className="mt-6 w-full text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer mb-2">
                  Detalles técnicos
                </summary>
                <div className="p-3 rounded bg-muted overflow-auto">
                  <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                    {this.state.error?.stack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
