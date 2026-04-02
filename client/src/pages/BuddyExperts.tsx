import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_EXPERTS = [
  { expert: { id: 1, displayName: "Dra. María López", specialty: "Pérdida de peso", bio: "Dietista-nutricionista con 12 años de experiencia. Especializada en pérdida de peso sostenible y cambio de hábitos.", avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&q=80", credentials: "Dietista-Nutricionista", followersCount: 128400, consultationsCount: 2340, rating: 4.9, verified: true, featured: true, category: "weight-loss" }, user: { name: "María López", imageUrl: null } },
  { expert: { id: 2, displayName: "Lic. Carlos Ruiz", specialty: "Nutrición deportiva", bio: "Nutricionista deportivo. Trabajo con atletas de élite y deportistas amateur para optimizar su rendimiento.", avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&q=80", credentials: "Nutricionista Deportivo", followersCount: 87200, consultationsCount: 1890, rating: 4.8, verified: true, featured: true, category: "sports" }, user: { name: "Carlos Ruiz", imageUrl: null } },
  { expert: { id: 3, displayName: "Dra. Sara Gómez", specialty: "Nutrición clínica", bio: "Especialista en nutrición clínica y enfermedades metabólicas. Diabetes, colesterol y enfermedades cardiovasculares.", avatarUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80", credentials: "Nutricionista Clínica", followersCount: 54300, consultationsCount: 3120, rating: 4.9, verified: true, featured: false, category: "clinical" }, user: { name: "Sara Gómez", imageUrl: null } },
  { expert: { id: 4, displayName: "Lic. Pablo Martín", specialty: "Nutrición vegana", bio: "Experto en dietas plant-based. Te ayudo a seguir una dieta vegana completa y equilibrada sin déficits nutricionales.", avatarUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&q=80", credentials: "Dietista-Nutricionista", followersCount: 32100, consultationsCount: 876, rating: 4.7, verified: true, featured: false, category: "vegan" }, user: { name: "Pablo Martín", imageUrl: null } },
  { expert: { id: 5, displayName: "Dra. Elena Torres", specialty: "Bienestar integral", bio: "Nutricionista y coach de bienestar. Combino nutrición, mindfulness y hábitos saludables para una vida plena.", avatarUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&q=80", credentials: "Nutricionista & Coach", followersCount: 76800, consultationsCount: 1540, rating: 4.8, verified: true, featured: true, category: "wellness" }, user: { name: "Elena Torres", imageUrl: null } },
  { expert: { id: 6, displayName: "Lic. Javier Sanz", specialty: "Ganancia muscular", bio: "Nutricionista especializado en hipertrofia y composición corporal. Planes de nutrición para ganar músculo de forma eficiente.", avatarUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80", credentials: "Nutricionista Deportivo", followersCount: 43500, consultationsCount: 1230, rating: 4.6, verified: false, featured: false, category: "muscle" }, user: { name: "Javier Sanz", imageUrl: null } },
];

// Gradient palettes — different from Makers for visual distinction
const GRADIENTS = [
  "from-indigo-500 via-violet-500 to-purple-600",
  "from-teal-400 via-emerald-500 to-green-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-violet-600 via-purple-600 to-indigo-700",
];

const CATEGORY_LABELS: Record<string, string> = {
  "weight-loss": "Pérdida de peso",
  "sports": "Nutrición deportiva",
  "clinical": "Nutrición clínica",
  "vegan": "Nutrición vegana",
  "wellness": "Bienestar integral",
  "muscle": "Ganancia muscular",
  "balance": "Dieta equilibrada",
  "performance": "Rendimiento",
};

type Tab = "experts" | "testimonials";

// ─── Premium Expert Card ──────────────────────────────────────────────────────
function ExpertCard({ row, onFollow, index }: { row: any; onFollow: (id: number) => void; index: number }) {
  const [, navigate] = useLocation();
  const [following, setFollowing] = useState(false);
  const expert = row.expert;
  const gradient = GRADIENTS[index % GRADIENTS.length];

  const handleFollow = () => {
    setFollowing(!following);
    onFollow(expert.id);
  };

  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div
      className="group relative bg-white rounded-[28px] overflow-hidden cursor-pointer"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
      onClick={() => navigate(`/buddy-experts/${expert.id}`)}
    >
      {/* ── Gradient header ── */}
      <div className={`relative bg-gradient-to-br ${gradient} pt-5 pb-10 px-4 overflow-hidden`}>
        {/* Decorative blobs */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10 blur-2xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "16px 16px" }} />

        {/* Badges */}
        <div className="relative flex justify-between items-start mb-3">
          {expert.verified ? (
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/30">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Verificado
            </span>
          ) : <span />}
          {expert.featured && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
              ⭐ TOP
            </span>
          )}
        </div>

        {/* Avatar with glow */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-white/30 blur-md scale-110" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-[3px] ring-white/60 shadow-2xl">
              <img
                src={expert.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName)}&background=6366F1&color=fff&size=80`}
                alt={expert.displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-4 -mt-5">
        {/* Name + specialty */}
        <div className="flex flex-col items-center mb-2.5">
          <h3 className="font-black text-gray-900 text-[15px] text-center leading-tight tracking-tight">
            {expert.displayName}
          </h3>
          <p className="text-[11px] text-indigo-500 font-bold mt-0.5 tracking-wide uppercase">
            {CATEGORY_LABELS[expert.category] ?? expert.specialty}
          </p>
          {expert.credentials && (
            <span className="mt-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
              {expert.credentials}
            </span>
          )}
        </div>

        {/* Bio */}
        {expert.bio && (
          <p className="text-[11px] text-gray-400 text-center line-clamp-2 leading-relaxed mb-3">
            {expert.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-0 mb-4 bg-gray-50 rounded-2xl p-2.5">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[13px] font-black text-gray-900">{fmtCount(expert.followersCount)}</span>
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Seguidores</span>
          </div>
          <div className="w-px h-7 bg-gray-200" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[13px] font-black text-gray-900">{fmtCount(expert.consultationsCount)}</span>
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Consultas</span>
          </div>
          {expert.rating > 0 && (
            <>
              <div className="w-px h-7 bg-gray-200" />
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[13px] font-black text-gray-900">⭐{expert.rating?.toFixed(1)}</span>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Rating</span>
              </div>
            </>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleFollow}
            className={`flex-1 text-[13px] font-black py-3 rounded-2xl transition-all duration-200 ${
              following
                ? "bg-gray-100 text-gray-500 border-2 border-gray-200"
                : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-95"
            }`}
          >
            {following ? "✓ Siguiendo" : "Seguir"}
          </button>
          <button
            onClick={() => navigate(`/buddy-experts/${expert.id}`)}
            className="flex-1 border-2 border-gray-100 text-gray-700 hover:border-indigo-200 hover:text-indigo-600 text-[13px] font-black py-3 rounded-2xl transition-all duration-200 active:scale-95"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[28px] overflow-hidden animate-pulse" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-100" />
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-gray-200 -mt-10" />
        <div className="h-4 w-28 bg-gray-200 rounded-full" />
        <div className="h-3 w-20 bg-gray-100 rounded-full" />
        <div className="h-10 w-full bg-gray-100 rounded-2xl" />
        <div className="flex gap-2 w-full">
          <div className="flex-1 h-11 bg-gray-200 rounded-2xl" />
          <div className="flex-1 h-11 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial card ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { id: 1, name: "Lucía M.", text: "Perdí 12kg en 4 meses con la Dra. López. Su método es increíble y muy sostenible.", rating: 5, expert: "Dra. María López" },
  { id: 2, name: "Marcos R.", text: "Carlos me ayudó a mejorar mi rendimiento en triatlón. Mis tiempos mejoraron un 15%.", rating: 5, expert: "Lic. Carlos Ruiz" },
  { id: 3, name: "Ana G.", text: "Elena me cambió la vida. No solo perdí peso, sino que aprendí a relacionarme mejor con la comida.", rating: 5, expert: "Dra. Elena Torres" },
  { id: 4, name: "Diego P.", text: "Javier me diseñó un plan perfecto para ganar músculo sin ganar grasa. ¡Increíble resultado!", rating: 5, expert: "Lic. Javier Sanz" },
];

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div className="bg-white rounded-[24px] p-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
          {t.name[0]}
        </div>
        <div>
          <p className="font-black text-gray-900 text-[13px]">{t.name}</p>
          <p className="text-[10px] text-indigo-500 font-bold">{t.expert}</p>
        </div>
        <div className="ml-auto text-yellow-400 text-[12px]">{"⭐".repeat(t.rating)}</div>
      </div>
      <p className="text-[12px] text-gray-500 leading-relaxed italic">"{t.text}"</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BuddyExperts() {
  const [tab, setTab] = useState<Tab>("experts");
  const { user } = useAuth();
  const expertsQuery = trpc.buddyExperts.list.useQuery({});
  const followMutation = trpc.buddyExperts.follow.useMutation({
    onSuccess: () => toast.success("¡Ahora sigues a este BuddyExpert! 🎉"),
    onError: () => toast.error("Error al seguir"),
  });

  const experts = (expertsQuery.data && expertsQuery.data.length > 0) ? expertsQuery.data : DEMO_EXPERTS;

  const handleFollow = (id: number) => {
    if (!user) { toast.error("Inicia sesión para seguir"); return; }
    followMutation.mutate({ expertId: id });
  };

  return (
    <div className="min-h-screen bg-[#F7F3EF]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-black text-gray-900 tracking-tight">BuddyExperts</h1>
            <p className="text-[12px] text-gray-400 font-medium">Nutricionistas y dietistas certificados</p>
          </div>
          <span className="bg-indigo-50 text-indigo-600 text-[11px] font-black px-3 py-1.5 rounded-full border border-indigo-100">
            {experts.length} expertos
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {(["experts", "testimonials"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-black transition-all duration-200 ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "experts" ? "🎓 Expertos" : "💬 Testimonios"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === "experts" && (
          <div className="grid grid-cols-2 gap-3">
            {expertsQuery.isLoading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : experts.map((row: any, i: number) => (
                  <ExpertCard key={row.expert?.id ?? i} row={row} onFollow={handleFollow} index={i} />
                ))
            }
          </div>
        )}

        {tab === "testimonials" && (
          <div className="flex flex-col gap-3">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
