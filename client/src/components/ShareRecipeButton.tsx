import { useState, useRef, useEffect } from "react";
import { Share2, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ShareRecipeButtonProps {
  recipeId: number;
  recipeName: string;
  recipeDescription?: string;
  /** "icon" = small icon button for cards, "full" = full button for detail page */
  variant?: "icon" | "full" | "bar";
}

export default function ShareRecipeButton({
  recipeId,
  recipeName,
  recipeDescription,
  variant = "icon",
}: ShareRecipeButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Build the public URL for this recipe
  const recipeUrl = `${window.location.origin}/app/recipes/${recipeId}`;

  // WhatsApp message
  const whatsappText = encodeURIComponent(
    `💚 ¡He encontrado esta receta en BuddyMarket y tenías que verla!\n\n🍽️ *${recipeName}*${recipeDescription ? "\n\n" + recipeDescription : ""}\n\n👉 ${recipeUrl}\n\n_BuddyMarket — Tu asistente nutricional inteligente. Recetas saludables, menús con IA y mucho más 🥗_`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  // Telegram message
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(recipeUrl)}&text=${encodeURIComponent(`🍽️ ${recipeName} — BuddyMarket`)}`;

  // Twitter/X
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🍽️ ${recipeName}`)}&url=${encodeURIComponent(recipeUrl)}`;

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(recipeUrl)}`;

  const instagramAction = async () => {
    try {
      await navigator.clipboard.writeText(recipeUrl);
      toast.success("Enlace copiado — pégalo en Instagram Stories o en tu bio 📸");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use native Web Share API on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipeName,
          text: `¡Mira esta receta que te puede interesar! 🍽️ ${recipeName}${recipeDescription ? " — " + recipeDescription : ""}`,
          url: recipeUrl,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to menu
      }
    }

    setShowMenu((v) => !v);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(recipeUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
    setShowMenu(false);
  };

  if (variant === "full") {
    return (
      <div style={{ position: "relative", display: "inline-block" }} ref={menuRef}>
        <button
          onClick={handleShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "#fff7ed",
            border: "1.5px solid #fed7aa",
            borderRadius: 12,
            color: "#ea580c",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#ffedd5";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#f97316";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#fff7ed";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#fed7aa";
          }}
        >
          <Share2 size={16} />
          Compartir receta
        </button>

        {showMenu && (
          <ShareMenu
            whatsappUrl={whatsappUrl}
            telegramUrl={telegramUrl}
            twitterUrl={twitterUrl}
            facebookUrl={facebookUrl}
            onInstagram={instagramAction}
            onCopy={handleCopy}
            copied={copied}
            onClose={() => setShowMenu(false)}
            align="left"
          />
        )}
      </div>
    );
  }

  // Icon variant (for recipe cards)
  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={handleShare}
        title="Compartir receta"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.92)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#ea580c",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#fff7ed";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.92)";
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        <Share2 size={14} />
      </button>

      {showMenu && (
        <ShareMenu
          whatsappUrl={whatsappUrl}
          telegramUrl={telegramUrl}
          twitterUrl={twitterUrl}
          facebookUrl={facebookUrl}
          onInstagram={instagramAction}
          onCopy={handleCopy}
          copied={copied}
          onClose={() => setShowMenu(false)}
          align="right"
        />
      )}
    </div>
  );
}

// ─── Share dropdown menu ───────────────────────────────────────────────────────
function ShareMenu({
  whatsappUrl,
  telegramUrl,
  twitterUrl,
  facebookUrl,
  onInstagram,
  onCopy,
  copied,
  onClose,
  align,
}: {
  whatsappUrl: string;
  telegramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  onInstagram: () => void;
  onCopy: (e: React.MouseEvent) => void;
  copied: boolean;
  onClose: () => void;
  align: "left" | "right";
}) {
  const options = [
    {
      label: "WhatsApp",
      icon: "💬",
      color: "#25D366",
      bg: "#f0fdf4",
      href: whatsappUrl,
    },
    {
      label: "Telegram",
      icon: "✈️",
      color: "#0088cc",
      bg: "#eff6ff",
      href: telegramUrl,
    },
    {
      label: "Twitter / X",
      icon: "🐦",
      color: "#000",
      bg: "#f9fafb",
      href: twitterUrl,
    },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        [align === "right" ? "right" : "left"]: 0,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        border: "1px solid #f3f4f6",
        padding: "8px",
        zIndex: 1000,
        minWidth: 200,
        animation: "fadeInDown 0.18s ease",
      }}
    >
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 8px", borderBottom: "1px solid #f3f4f6", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Compartir receta</span>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}>
          <X size={14} />
        </button>
      </div>

      {/* Social options */}
      {options.map((opt) => (
        <a
          key={opt.label}
          href={opt.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            borderRadius: 10,
            textDecoration: "none",
            color: opt.color,
            fontWeight: 600,
            fontSize: 13,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = opt.bg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</span>
          {opt.label}
        </a>
      ))}

      {/* Instagram */}
      <button
        onClick={(e) => { e.stopPropagation(); onInstagram(); onClose(); }}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: "transparent", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, width: "100%", color: "#bc1888", transition: "background 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fdf2f8")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>📸</span>
        Instagram (copiar enlace)
      </button>

      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} />

      {/* Copy link */}
      <button
        onClick={onCopy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 10px",
          borderRadius: 10,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: copied ? "#16a34a" : "#374151",
          fontWeight: 600,
          fontSize: 13,
          width: "100%",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
        {copied ? "¡Enlace copiado!" : "Copiar enlace"}
      </button>
    </div>
  );
}
