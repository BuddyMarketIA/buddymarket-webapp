import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

/**
 * BackButton — Botón reutilizable de volver atrás.
 * Si se pasa `to`, navega a esa ruta. Si no, usa history.back().
 */
export default function BackButton({ to, label = "Volver", className = "" }: BackButtonProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      window.history.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`flex items-center gap-1.5 text-muted-foreground hover:text-foreground -ml-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
}
