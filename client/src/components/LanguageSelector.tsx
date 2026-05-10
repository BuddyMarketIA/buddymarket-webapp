import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface LanguageSelectorProps {
  variant?: "icon" | "full" | "compact" | "footer";
  className?: string;
}

export default function LanguageSelector({
  variant = "icon",
  className = "",
}: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const updateBasic = trpc.profile.updateBasic.useMutation();

  // Sync user's saved locale from DB on first load
  useEffect(() => {
    if (user?.locale && user.locale !== i18n.language) {
      i18n.changeLanguage(user.locale);
    }
  }, [user?.locale]);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ??
    SUPPORTED_LANGUAGES[0];

  const handleChange = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem("buddymarket_language", code);
    // Persist to DB if user is logged in
    if (user) {
      updateBasic.mutate({ locale: code });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 px-2 ${className}`}
          title="Change language"
        >
          {variant === "full" ? (
            <>
              <Globe className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                {currentLang.flag} {currentLang.name}
              </span>
            </>
          ) : variant === "compact" ? (
            <>
              <span className="text-base">{currentLang.flag}</span>
              <span className="text-sm font-medium hidden sm:inline">{currentLang.name}</span>
            </>
          ) : variant === "footer" ? (
            <>
              <Globe className="h-3.5 w-3.5 opacity-60" />
              <span className="text-xs opacity-70">{currentLang.flag} {currentLang.name}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">{currentLang.flag}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`gap-2 cursor-pointer ${
              i18n.language === lang.code
                ? "font-semibold bg-accent"
                : ""
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.name}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-primary text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
