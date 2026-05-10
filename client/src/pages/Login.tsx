/**
 * Login Page — Página de inicio de sesión para Buddy One
 * 
 * Soporta:
 * - Google Sign-In (OAuth2)
 * - Apple Sign-In (OAuth2)
 * - Email/Contraseña (futuro)
 * - Magic Link (futuro)
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import WebSSOButtons from "@/components/WebSSOButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/sonner-a11y-shim";
import { ArrowRight, Mail, Lock } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Obtener el parámetro from_webdev si existe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromWebdev = params.get("from_webdev");
    if (fromWebdev) {
      // Mostrar mensaje de bienvenida si viene de webdev
      toast.info("Bienvenido a Buddy One", {
        description: "Inicia sesión para continuar",
      });
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implementar login con email/contraseña
      toast.error("No implementado", {
        description: "El login con email aún no está disponible",
      });
    } catch (err: any) {
      toast.error("Error", {
        description: err.message || "Error al iniciar sesión",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOSuccess = () => {
    // El componente WebSSOButtons maneja la redirección
    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000" />
      </div>

      {/* Contenedor principal */}
      <div className="relative w-full max-w-md space-y-8">
        {/* Logo y título */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Buddy One</h1>
          <p className="text-gray-600">Tu ecosistema de bienestar inteligente</p>
        </div>

        {/* Tarjeta de login */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle>Bienvenido de nuevo</CardTitle>
            <CardDescription>Accede a tu cuenta Buddy One</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Botones de SSO */}
            <div className="space-y-3">
              <WebSSOButtons
                onSuccess={handleSSOSuccess}
                showApple={true}
                className="w-full"
              />
            </div>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">O continúa con email</span>
              </div>
            </div>

            {/* Formulario de email/contraseña */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            {/* Enlaces adicionales */}
            <div className="flex items-center justify-between text-sm">
              <button className="text-orange-600 hover:text-orange-700 font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Pie de página */}
        <div className="text-center space-y-2 text-sm text-gray-600">
          <p>
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Regístrate aquí
            </button>
          </p>
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
            <a href="#" className="hover:text-gray-900">
              Términos
            </a>
            <a href="#" className="hover:text-gray-900">
              Privacidad
            </a>
            <a href="#" className="hover:text-gray-900">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
