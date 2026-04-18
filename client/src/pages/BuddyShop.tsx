export default function BuddyShop() {
  const handleVisit = () => {
    window.open("https://buddyshop.app", "_blank", "noopener,noreferrer");
  };

  const CATEGORIES = [
    { emoji: "🍳", name: "Sartenes y ollas", desc: "Antiadherentes, de hierro fundido, woks..." },
    { emoji: "🔪", name: "Cuchillos y tablas", desc: "Cuchillos de chef, tablas de corte, afiladores..." },
    { emoji: "🥣", name: "Utensilios de cocina", desc: "Espátulas, cucharones, pinzas, batidores..." },
    { emoji: "🫙", name: "Almacenamiento", desc: "Tuppers, botes herméticos, bolsas de vacío..." },
    { emoji: "⚖️", name: "Medición y pesaje", desc: "Básculas digitales, tazas medidoras..." },
    { emoji: "🧊", name: "Electrodomésticos", desc: "Batidoras, freidoras de aire, robots de cocina..." },
  ];

  const FEATURES = [
    { emoji: "✅", text: "Productos seleccionados por nutricionistas y chefs" },
    { emoji: "🚚", text: "Envío rápido a toda España" },
    { emoji: "💰", text: "Precios exclusivos para usuarios BuddyMarket" },
    { emoji: "⭐", text: "Valoraciones verificadas de la comunidad" },
  ];

  return (
    <div className="vively-page pb-32">
      {/* Hero */}
      <div
        className="rounded-3xl p-6 mb-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 60%, #3a3a3a 100%)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full" style={{ background: "rgba(249,115,22,0.15)" }} />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full" style={{ background: "rgba(249,115,22,0.08)" }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "rgba(249,115,22,0.2)" }}>
              🛍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">BuddyShop</h1>
                <span className="text-xs font-800 px-2 py-0.5 rounded-lg text-white" style={{ background: "#F97316" }}>
                  .app
                </span>
              </div>
              <p className="text-sm text-muted-foreground/70 mt-0.5">Marketplace de cocina y nutrición</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed mb-5">
            Todo lo que necesitas para cocinar mejor: utensilios, electrodomésticos y accesorios seleccionados por nutricionistas y chefs profesionales.
          </p>

          <button
            onClick={handleVisit}
            className="w-full rounded-2xl py-4 text-base font-900 text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #F97316, #FB923C)",
              boxShadow: "0 6px 20px rgba(249,115,22,0.45)",
            }}
          >
            Visitar BuddyShop
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">buddyshop.app · Abre en nueva pestaña</p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-background rounded-3xl p-5 mb-5 shadow-sm border border-border/50">
        <h2 className="text-base font-900 text-foreground mb-4">¿Por qué BuddyShop?</h2>
        <div className="flex flex-col gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xl">{f.emoji}</span>
              <p className="text-sm font-600 text-foreground/80">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-5">
        <h2 className="text-base font-900 text-foreground mb-3">Categorías destacadas</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={handleVisit}
              className="bg-background rounded-2xl p-4 text-left shadow-sm border border-border/50 transition-all active:scale-95"
            >
              <span className="text-2xl block mb-2">{cat.emoji}</span>
              <p className="text-sm font-800 text-foreground mb-1">{cat.name}</p>
              <p className="text-xs text-muted-foreground/70 leading-tight">{cat.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <div
        className="rounded-3xl p-5 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", border: "1px solid rgba(249,115,22,0.15)" }}
      >
        <span className="text-3xl shrink-0">🎁</span>
        <div className="flex-1">
          <p className="text-sm font-900 text-foreground mb-1">Descuento exclusivo</p>
          <p className="text-xs text-muted-foreground">Usa el código <span className="font-900 text-[#F97316]">BUDDY10</span> para un 10% de descuento en tu primera compra</p>
        </div>
      </div>
    </div>
  );
}
