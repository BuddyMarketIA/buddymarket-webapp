import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const SPECIALTIES = [
  { key: "", label: "Todos" },
  { key: "nutricion", label: "Nutrición" },
  { key: "fitness", label: "Fitness" },
  { key: "vegano", label: "Vegano/Plant-based" },
  { key: "deportivo", label: "Nutrición deportiva" },
  { key: "clinica", label: "Nutrición clínica" },
];

const EXPERTS = [
  {
    id: 1,
    name: "Dra. María González",
    title: "Dietista-Nutricionista",
    specialty: "clinica",
    specialtyLabel: "Nutrición clínica",
    bio: "Especialista en nutrición clínica y terapéutica con más de 10 años de experiencia. Experta en enfermedades metabólicas, diabetes y obesidad.",
    rating: 4.9,
    reviews: 127,
    price: "45€/sesión",
    tags: ["Diabetes", "Obesidad", "Metabolismo"],
    available: true,
    initials: "MG",
    color: "#F97316",
  },
  {
    id: 2,
    name: "Carlos Martínez",
    title: "Nutricionista deportivo",
    specialty: "deportivo",
    specialtyLabel: "Nutrición deportiva",
    bio: "Nutricionista especializado en rendimiento deportivo y composición corporal. Trabaja con atletas de élite y deportistas amateur.",
    rating: 4.8,
    reviews: 89,
    price: "50€/sesión",
    tags: ["Rendimiento", "Masa muscular", "Pérdida de grasa"],
    available: true,
    initials: "CM",
    color: "#3B82F6",
  },
  {
    id: 3,
    name: "Laura Sánchez",
    title: "Nutricionista vegana",
    specialty: "vegano",
    specialtyLabel: "Vegano/Plant-based",
    bio: "Especialista en dietas plant-based y veganismo. Ayuda a transicionar hacia una alimentación vegana equilibrada y saludable.",
    rating: 4.9,
    reviews: 203,
    price: "40€/sesión",
    tags: ["Veganismo", "Plant-based", "Sostenibilidad"],
    available: true,
    initials: "LS",
    color: "#10B981",
  },
  {
    id: 4,
    name: "Javier Ruiz",
    title: "Personal Trainer & Nutricionista",
    specialty: "fitness",
    specialtyLabel: "Fitness",
    bio: "Entrenador personal certificado con formación en nutrición. Planes de entrenamiento y alimentación personalizados para alcanzar tus objetivos.",
    rating: 4.7,
    reviews: 156,
    price: "55€/sesión",
    tags: ["Entrenamiento", "Nutrición", "Transformación"],
    available: false,
    initials: "JR",
    color: "#8B5CF6",
  },
  {
    id: 5,
    name: "Ana Fernández",
    title: "Nutricionista pediátrica",
    specialty: "clinica",
    specialtyLabel: "Nutrición clínica",
    bio: "Especialista en nutrición infantil y adolescente. Experta en trastornos alimentarios y alimentación complementaria.",
    rating: 5.0,
    reviews: 74,
    price: "45€/sesión",
    tags: ["Niños", "Adolescentes", "Trastornos alimentarios"],
    available: true,
    initials: "AF",
    color: "#EC4899",
  },
  {
    id: 6,
    name: "Pablo Torres",
    title: "Coach nutricional",
    specialty: "nutricion",
    specialtyLabel: "Nutrición",
    bio: "Coach nutricional con enfoque en hábitos saludables y cambio de comportamiento. Metodología basada en evidencia científica.",
    rating: 4.6,
    reviews: 112,
    price: "35€/sesión",
    tags: ["Hábitos", "Mindful eating", "Coaching"],
    available: true,
    initials: "PT",
    color: "#F59E0B",
  },
];

export default function BuddyExperts() {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = EXPERTS.filter((e) => {
    const matchesSpecialty = !filter || e.specialty === filter;
    const matchesSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.bio.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesSpecialty && matchesSearch;
  });

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">BuddyExperts</h1>
        <p className="text-sm text-gray-500 mt-1">Conecta con nutricionistas y expertos certificados</p>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar expertos o especialidades..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Specialty filters */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SPECIALTIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-700 transition-all ${
              filter === s.key
                ? "bg-[#F97316] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Become an expert banner */}
      <div
        className="mb-5 rounded-2xl p-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: "rgba(249,115,22,0.20)" }}
        >
          ⭐
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-800 text-white">¿Eres nutricionista?</p>
          <p className="text-xs text-gray-400 mt-0.5">Únete a BuddyExperts y llega a miles de usuarios</p>
        </div>
        <button
          onClick={() => toast.info("Próximamente — Registro de expertos")}
          className="shrink-0 rounded-xl px-3 py-2 text-xs font-700 text-white"
          style={{ background: "#F97316" }}
        >
          Aplicar
        </button>
      </div>

      {/* Expert count */}
      <p className="text-xs text-gray-400 mb-3 font-600">
        {filtered.length} experto{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Expert cards */}
      <div className="flex flex-col gap-4">
        {filtered.map((expert) => (
          <div
            key={expert.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-start gap-3 mb-3">
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-900 shrink-0"
                style={{ background: `linear-gradient(135deg, ${expert.color}, ${expert.color}cc)` }}
              >
                {expert.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-800 text-gray-900 leading-tight">{expert.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{expert.title}</p>
                  </div>
                  {expert.available ? (
                    <span className="shrink-0 text-xs font-700 text-green-600 bg-green-50 rounded-full px-2 py-0.5">
                      Disponible
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-700 text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      Ocupado
                    </span>
                  )}
                </div>
                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-3.5 h-3.5"
                        fill={star <= Math.round(expert.rating) ? "#F97316" : "#e5e7eb"}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-700 text-gray-700">{expert.rating}</span>
                  <span className="text-xs text-gray-400">({expert.reviews} reseñas)</span>
                </div>
              </div>
            </div>

            {/* Specialty badge */}
            <div className="mb-2">
              <span
                className="inline-block text-xs font-700 rounded-full px-3 py-1"
                style={{ background: `${expert.color}18`, color: expert.color }}
              >
                {expert.specialtyLabel}
              </span>
            </div>

            {/* Bio */}
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{expert.bio}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {expert.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-600">
                  {tag}
                </span>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Precio</p>
                <p className="text-base font-900 text-gray-900">{expert.price}</p>
              </div>
              <button
                onClick={() =>
                  toast.info(`Contactando con ${expert.name}... Próximamente disponible`)
                }
                className="rounded-2xl px-5 py-2.5 text-sm font-800 text-white transition-all active:scale-95"
                style={{
                  background: expert.available
                    ? "linear-gradient(135deg, #F97316, #FB923C)"
                    : "#d1d5db",
                  boxShadow: expert.available ? "0 4px 12px rgba(249,115,22,0.30)" : "none",
                }}
                disabled={!expert.available}
              >
                {expert.available ? "Reservar sesión" : "No disponible"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-base font-700 text-gray-700">No se encontraron expertos</p>
          <p className="text-sm text-gray-400 mt-1">Prueba con otros filtros o términos de búsqueda</p>
        </div>
      )}

      {/* Bottom disclaimer */}
      <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
        Los BuddyExperts son profesionales independientes. BuddyMarket no es responsable de los servicios prestados. Consulta siempre con tu médico antes de cambiar tu dieta.
      </p>
    </div>
  );
}
