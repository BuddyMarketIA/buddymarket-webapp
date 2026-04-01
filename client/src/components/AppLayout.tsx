import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  HomeIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Inicio",
    to: "/dashboard",
    matches: ["/dashboard", "/"],
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    key: "recipes",
    label: "Recetas",
    to: "/recipes",
    matches: ["/recipes", "/recipe"],
    icon: BookOpenIcon,
    activeIcon: BookOpenIconSolid,
  },
  {
    key: "diary",
    label: "Diario",
    to: "/meal-log",
    matches: ["/meal-log"],
    icon: ClipboardDocumentListIcon,
    activeIcon: ClipboardDocumentListIconSolid,
  },
  {
    key: "profile",
    label: "Perfil",
    to: "/profile",
    matches: ["/profile"],
    icon: UserCircleIcon,
    activeIcon: UserCircleIconSolid,
  },
];

const matchesPath = (pathname: string, matches: string[]) =>
  matches.some(
    (m) =>
      pathname === m ||
      pathname.startsWith(`${m}/`) ||
      pathname.startsWith(`${m}?`)
  );

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-[#00D27A] flex items-center justify-center shadow-lg">
              <span className="text-2xl font-black text-white tracking-tight">V</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00D27A]/30 animate-ping" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Cargando VIVELY...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="text-center space-y-6 max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#00D27A] flex items-center justify-center mx-auto shadow-lg">
            <span className="text-3xl font-black text-white tracking-tight">V</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VIVELY</h1>
            <p className="text-gray-500 text-sm mt-1">Come mejor. Vive mejor.</p>
          </div>
          <p className="text-gray-600 text-sm">
            Inicia sesión para acceder a tu plataforma de nutrición inteligente.
          </p>
          <Button
            asChild
            className="w-full rounded-2xl bg-[#00D27A] hover:bg-[#00b868] text-white font-semibold py-3 h-auto"
          >
            <a href={getLoginUrl()}>Iniciar sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  const hiddenPrefixes = ["/onboarding"];
  const shouldShowNav = !hiddenPrefixes.some((p) => location.startsWith(p));
  const isAiActive = matchesPath(location, ["/ai-chat"]);

  return (
    <>
      {/* Page content */}
      <div className={shouldShowNav ? "pb-36" : ""}>{children}</div>

      {/* Bottom navigation */}
      {shouldShowNav && (
        <div className="bottom-nav-container">
          <div className="bottom-nav-inner">
            {/* Main nav bar */}
            <nav className="bottom-nav-bar">
              <div className="grid w-full grid-cols-4 gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = matchesPath(location, item.matches);
                  const Icon = isActive ? item.activeIcon : item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.to}
                      className={`flex min-w-0 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center transition-colors ${
                        isActive ? "text-[#00D27A]" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Icon
                        className={`mb-0.5 h-6 w-6 ${isActive ? "text-[#00D27A]" : "text-gray-400"}`}
                      />
                      <span
                        className={`truncate text-[11px] font-semibold ${
                          isActive ? "text-[#00D27A]" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* AI chat button */}
            <Link
              href="/ai-chat"
              aria-label="VIVELY IA"
              className={`bottom-nav-ai-btn ${isAiActive ? "text-[#00D27A]" : "text-gray-700"}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border p-2 ${
                  isAiActive
                    ? "border-[#00D27A]/60 bg-[#00D27A]/15"
                    : "border-[#00D27A]/30 bg-[#00D27A]/8"
                }`}
              >
                <SparklesIcon
                  className={`h-6 w-6 ${isAiActive ? "text-[#00D27A]" : "text-[#00D27A]/70"}`}
                />
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
