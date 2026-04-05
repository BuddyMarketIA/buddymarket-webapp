/**
 * ProductNutritionCard
 * Displays full nutritional breakdown for a scanned product.
 * Supports per-100g and per-serving views, macro bars, and Nutri-Score badge.
 */

interface NutritionPer100g {
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
  fiber?: number;
  sugars?: number;
  saturatedFat?: number;
  salt?: number;
}

interface ProductNutritionCardProps {
  name: string;
  brand?: string | null;
  quantity?: string | null;
  imageUrl?: string | null;
  nutriScore?: string | null;
  novaGroup?: number | null;
  per100g: NutritionPer100g;
  /** If provided, shows a "per serving" tab */
  servingGrams?: number;
  /** Compact mode: smaller layout for use inside modals */
  compact?: boolean;
}

// Nutri-Score color map
const NUTRISCORE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  a: { bg: "#038141", text: "#fff", label: "A" },
  b: { bg: "#85BB2F", text: "#fff", label: "B" },
  c: { bg: "#FECB02", text: "#333", label: "C" },
  d: { bg: "#EE8100", text: "#fff", label: "D" },
  e: { bg: "#E63312", text: "#fff", label: "E" },
};

// NOVA group descriptions
const NOVA_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Sin procesar", color: "#038141" },
  2: { label: "Ingrediente culinario", color: "#85BB2F" },
  3: { label: "Procesado", color: "#EE8100" },
  4: { label: "Ultraprocesado", color: "#E63312" },
};

// Macro bar colors
const MACRO_COLORS = {
  carbs: "#F97316",
  proteins: "#10B981",
  fats: "#3B82F6",
  fiber: "#8B5CF6",
  sugars: "#F59E0B",
  saturatedFat: "#EF4444",
  salt: "#6B7280",
};

function MacroBar({
  label,
  value,
  unit,
  max,
  color,
  icon,
  description,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
  icon: string;
  description?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{label}</span>
          {description && (
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>({description})</span>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function ProductNutritionCard({
  name,
  brand,
  quantity,
  imageUrl,
  nutriScore,
  novaGroup,
  per100g,
  compact = false,
}: ProductNutritionCardProps) {
  const ns = nutriScore?.toLowerCase();
  const nsInfo = ns && NUTRISCORE_COLORS[ns] ? NUTRISCORE_COLORS[ns] : null;
  const novaInfo = novaGroup && NOVA_LABELS[novaGroup] ? NOVA_LABELS[novaGroup] : null;

  // Caloric split for the donut-like summary
  const totalMacroKcal =
    per100g.proteins * 4 + per100g.carbohydrates * 4 + per100g.fats * 9;
  const protPct = totalMacroKcal > 0 ? Math.round((per100g.proteins * 4 / totalMacroKcal) * 100) : 0;
  const carbPct = totalMacroKcal > 0 ? Math.round((per100g.carbohydrates * 4 / totalMacroKcal) * 100) : 0;
  const fatPct = totalMacroKcal > 0 ? Math.round((per100g.fats * 9 / totalMacroKcal) * 100) : 0;

  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Product header */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: compact ? 14 : 18 }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: compact ? 64 : 80,
              height: compact ? 64 : 80,
              borderRadius: 12,
              objectFit: "cover",
              flexShrink: 0,
              border: "2px solid #F3F4F6",
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 3px", fontSize: compact ? 15 : 17, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>
            {name}
          </h3>
          {brand && (
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {brand}
            </p>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {quantity && (
              <span style={{ fontSize: 11, background: "#F3F4F6", color: "#6B7280", padding: "2px 7px", borderRadius: 6, fontWeight: 600 }}>
                📦 {quantity}
              </span>
            )}
            {nsInfo && (
              <span
                style={{
                  fontSize: 11,
                  background: nsInfo.bg,
                  color: nsInfo.text,
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                }}
              >
                Nutri-Score {nsInfo.label}
              </span>
            )}
            {novaInfo && (
              <span
                style={{
                  fontSize: 11,
                  background: novaInfo.color + "20",
                  color: novaInfo.color,
                  padding: "2px 7px",
                  borderRadius: 6,
                  fontWeight: 700,
                  border: `1px solid ${novaInfo.color}40`,
                }}
              >
                NOVA {novaGroup} · {novaInfo.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calorie hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)",
          border: "1.5px solid #FED7AA",
          borderRadius: 14,
          padding: compact ? "12px 16px" : "14px 18px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Energía por 100g
          </p>
          <p style={{ margin: "2px 0 0", fontSize: compact ? 28 : 34, fontWeight: 900, color: "#C2410C", lineHeight: 1 }}>
            {per100g.calories}
            <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 4 }}>kcal</span>
          </p>
        </div>
        {/* Macro split pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <span style={{ fontSize: 11, background: "#10B981", color: "#fff", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>
              P {protPct}%
            </span>
            <span style={{ fontSize: 11, background: "#F97316", color: "#fff", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>
              HC {carbPct}%
            </span>
            <span style={{ fontSize: 11, background: "#3B82F6", color: "#fff", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>
              G {fatPct}%
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 10, color: "#92400E", fontWeight: 600 }}>% de calorías totales</p>
        </div>
      </div>

      {/* Macronutrients section */}
      <div
        style={{
          background: "#FAFAFA",
          border: "1px solid #F3F4F6",
          borderRadius: 14,
          padding: compact ? "12px 14px" : "14px 16px",
          marginBottom: 10,
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Macronutrientes / 100g
        </p>

        <MacroBar
          label="Proteínas"
          value={per100g.proteins}
          unit="g"
          max={35}
          color={MACRO_COLORS.proteins}
          icon="💪"
          description="músculo y reparación"
        />
        <MacroBar
          label="Hidratos de carbono"
          value={per100g.carbohydrates}
          unit="g"
          max={100}
          color={MACRO_COLORS.carbs}
          icon="🌾"
          description="energía principal"
        />
        {per100g.sugars !== undefined && per100g.sugars > 0 && (
          <div style={{ paddingLeft: 18, marginTop: -4, marginBottom: 6 }}>
            <MacroBar
              label="de los cuales azúcares"
              value={per100g.sugars}
              unit="g"
              max={per100g.carbohydrates || 100}
              color={MACRO_COLORS.sugars}
              icon="🍬"
            />
          </div>
        )}
        <MacroBar
          label="Grasas"
          value={per100g.fats}
          unit="g"
          max={50}
          color={MACRO_COLORS.fats}
          icon="🥑"
          description="energía y hormonas"
        />
        {per100g.saturatedFat !== undefined && per100g.saturatedFat > 0 && (
          <div style={{ paddingLeft: 18, marginTop: -4, marginBottom: 6 }}>
            <MacroBar
              label="de las cuales saturadas"
              value={per100g.saturatedFat}
              unit="g"
              max={per100g.fats || 50}
              color={MACRO_COLORS.saturatedFat}
              icon="⚠️"
            />
          </div>
        )}
        {per100g.fiber !== undefined && per100g.fiber > 0 && (
          <MacroBar
            label="Fibra alimentaria"
            value={per100g.fiber}
            unit="g"
            max={20}
            color={MACRO_COLORS.fiber}
            icon="🥦"
            description="digestión y saciedad"
          />
        )}
      </div>

      {/* Minerals / salt */}
      {per100g.salt !== undefined && per100g.salt > 0 && (
        <div
          style={{
            background: "#FAFAFA",
            border: "1px solid #F3F4F6",
            borderRadius: 14,
            padding: compact ? "10px 14px" : "12px 16px",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Minerales / 100g
          </p>
          <MacroBar
            label="Sal"
            value={per100g.salt}
            unit="g"
            max={3}
            color={MACRO_COLORS.salt}
            icon="🧂"
            description="máx. recomendado: 2g/día"
          />
        </div>
      )}

      {/* Data source note */}
      <p style={{ margin: "10px 0 0", fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>
        Datos: Open Food Facts · Por 100g de producto
      </p>
    </div>
  );
}
