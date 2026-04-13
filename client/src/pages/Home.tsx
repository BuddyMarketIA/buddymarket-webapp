import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/app/dashboard");
  }, [isAuthenticated, loading, navigate]);

  const FEATURES = [
    { emoji: "🥗", title: t("home.features.recipes"), desc: t("home.features.recipesDesc") },
    { emoji: "📅", title: t("home.features.menus"), desc: t("home.features.menusDesc") },
    { emoji: "🛒", title: t("home.features.shopping"), desc: t("home.features.shoppingDesc") },
    { emoji: "📦", title: t("home.features.inventory"), desc: t("home.features.inventoryDesc") },
    { emoji: "📊", title: t("home.features.tracking"), desc: t("home.features.trackingDesc") },
    { emoji: "🤖", title: t("home.features.scan"), desc: t("home.features.scanDesc") },
  ];

  const PLANS = [
    {
      name: t("home.pricing.basicName"),
      price: t("home.pricing.basicPrice"),
      period: "",
      features: [t("home.features.recipes"), t("home.features.menus"), t("home.features.shopping"), t("home.features.inventory")],
      cta: t("home.pricing.basicCta"),
      highlight: false,
    },
    {
      name: t("home.pricing.premiumName"),
      price: "9,99€",
      period: "/mes",
      features: [t("home.features.recipes"), t("home.features.menus"), t("home.features.inventory"), t("home.features.tracking"), "Soporte prioritario"],
      cta: t("home.pricing.premiumCta"),
      highlight: true,
    },
    {
      name: t("home.pricing.proName"),
      price: "19,99€",
      period: "/mes",
      features: ["Todo en Premium", "Perfil médico avanzado", "Consultas con expertos", "API de integración"],
      cta: t("home.pricing.proCta"),
      highlight: false,
    },
  ];

  const STATS = [
    { value: "50K+", label: t("home.stats.activeUsers") },
    { value: "12K+", label: t("home.stats.recipes") },
    { value: "4.9★", label: t("home.stats.rating") },
    { value: "98%", label: t("home.stats.satisfaction") },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "#FFF8F0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: "0 8px 24px rgba(249,115,22,0.35)" }}>🛒</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 150, 300].map((d) => <div key={d} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316", animation: "bounce 1s infinite", animationDelay: `${d}ms` }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#FFFFFF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Sticky Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 12px rgba(249,115,22,0.30)" }}>🛒</div>
          <div>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>BuddyMarket</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#F97316", fontWeight: 600 }}>{t("home.nutritionalManager")}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LanguageSelector variant="compact" />
          <a href="https://buddymarket.io" style={{ padding: "10px 20px", borderRadius: "12px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 12px rgba(249,115,22,0.30)" }}>
            {t("home.enter")}
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFFFFF 100%)", padding: "60px 20px 50px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(249,115,22,0.10)", borderRadius: "100px", padding: "6px 16px", marginBottom: "20px" }}>
            <span style={{ fontSize: "14px" }}>✨</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316" }}>{t("home.hero")}</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px, 8vw, 56px)", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 16px" }}>
            {t("home.heroTitle1")}<br />
            <span style={{ color: "#F97316" }}>{t("home.heroTitle2")}</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280", lineHeight: 1.6, margin: "0 0 32px", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
            {t("home.heroDesc")}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <a href="https://buddymarket.io" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 32px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "16px", fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.35)", letterSpacing: "-0.01em" }}>
              {t("home.getStarted")}
            </a>
            <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>{t("home.noCard")}</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "#1a1a1a", padding: "28px 20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {STATS.map((s) => (
            <div key={s.value} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#F97316", letterSpacing: "-0.03em" }}>{s.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "60px 20px", background: "#FFF8F0" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 8px" }}>{t("home.features.title")}</h2>
            <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>{t("home.features.subtitle")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ background: "white", borderRadius: "20px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(249,115,22,0.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "12px" }}>
                  {f.emoji}
                </div>
                <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.01em" }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "60px 20px", background: "white" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 8px" }}>{t("home.howItWorks.title")}</h2>
            <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>{t("home.howItWorks.subtitle")}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { step: "01", title: t("home.howItWorks.step1Title"), desc: t("home.howItWorks.step1Desc"), emoji: "👤" },
              { step: "02", title: t("home.howItWorks.step2Title"), desc: t("home.howItWorks.step2Desc"), emoji: "📅" },
              { step: "03", title: t("home.howItWorks.step3Title"), desc: t("home.howItWorks.step3Desc"), emoji: "🛒" },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "#FFF8F0", borderRadius: "20px", padding: "20px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0, boxShadow: "0 4px 12px rgba(249,115,22,0.25)" }}>
                  {item.emoji}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#F97316", letterSpacing: "0.05em" }}>{item.step}</span>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1a1a" }}>{item.title}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "60px 20px", background: "#FFF8F0" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 8px" }}>{t("home.pricing.title")}</h2>
            <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>{t("home.pricing.subtitle")}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{ background: plan.highlight ? "linear-gradient(135deg, #F97316, #FB923C)" : "white", borderRadius: "20px", padding: "24px", boxShadow: plan.highlight ? "0 8px 32px rgba(249,115,22,0.30)" : "0 2px 12px rgba(0,0,0,0.06)", border: plan.highlight ? "none" : "1px solid rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.25)", borderRadius: "8px", padding: "3px 10px", fontSize: "14px", fontWeight: 800, color: "white" }}>{t("home.pricing.popular")}</div>
                )}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: plan.highlight ? "white" : "#1a1a1a", letterSpacing: "-0.02em" }}>{plan.name}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "2px", marginTop: "4px" }}>
                      <span style={{ fontSize: "28px", fontWeight: 900, color: plan.highlight ? "white" : "#F97316", letterSpacing: "-0.04em" }}>{plan.price}</span>
                      {plan.period && <span style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{plan.period}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: plan.highlight ? "rgba(255,255,255,0.25)" : "rgba(249,115,22,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={plan.highlight ? "white" : "#F97316"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span style={{ fontSize: "13px", color: plan.highlight ? "rgba(255,255,255,0.9)" : "#374151" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="https://buddymarket.io" style={{ display: "block", textAlign: "center", padding: "13px", borderRadius: "12px", background: plan.highlight ? "white" : "#F97316", color: plan.highlight ? "#F97316" : "white", fontSize: "14px", fontWeight: 800, textDecoration: "none", boxShadow: plan.highlight ? "none" : "0 4px 12px rgba(249,115,22,0.25)" }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 20px", background: "#1a1a1a", textAlign: "center" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", margin: "0 auto 20px", boxShadow: "0 8px 24px rgba(249,115,22,0.40)" }}>🛒</div>
          <h2 style={{ fontSize: "28px", fontWeight: 900, color: "white", letterSpacing: "-0.03em", margin: "0 0 12px" }}>
            {t("home.cta.title")}
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", margin: "0 0 28px", lineHeight: 1.6 }}>
            {t("home.cta.desc")}
          </p>
          <a href="https://buddymarket.io" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 32px", borderRadius: "16px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontSize: "16px", fontWeight: 800, textDecoration: "none", boxShadow: "0 8px 24px rgba(249,115,22,0.40)" }}>
            {t("home.cta.button")}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px 20px", background: "#111111", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "8px", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🛒</div>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>BuddyMarket</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <LanguageSelector variant="footer" className="text-white/50 hover:text-white/80" />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "12px", flexWrap: "wrap" }}>
          <a href="/terms" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            {t("home.footer.terms")}
          </a>
          <a href="/privacy" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            {t("home.footer.privacy")}
          </a>
          <a href="mailto:iabuddymarket@gmail.com" style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            {t("home.footer.contact")}
          </a>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
          {t("home.footer.disclaimer")}
        </p>
      </footer>
    </div>
  );
}
