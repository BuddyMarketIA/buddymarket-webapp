import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  EnvelopeIcon,
  PlusIcon,
  TrashIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  TagIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type Tab = "dashboard" | "contacts" | "lists" | "campaigns" | "editor";

// ─── BuddyOne Email Template ──────────────────────────────────────────────────
function getBuddyOneTemplate(content: string, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FFF5EE;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF5EE;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#FF6B00,#FF3D7F);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">BuddyOne</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Tu ecosistema de bienestar</p>
  </td></tr>
  <!-- Content -->
  <tr><td style="padding:40px;">
    ${content}
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#1a1a2e;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;">BUDDY MARKET IA, S.L. · Calle Villanueva 2, 3ºc, 28001 Madrid</p>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.5);font-size:11px;">Has recibido este email porque estás suscrito a BuddyOne. <a href="#" style="color:#FF6B00;">Cancelar suscripción</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const TEMPLATES = [
  {
    id: "blank",
    name: "En blanco",
    description: "Empieza desde cero",
    content: `<p style="color:#374151;font-size:15px;line-height:1.6;">Escribe tu contenido aquí...</p>`,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Actualizaciones y novedades",
    content: `<h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">{{name}}, estas son las novedades 🎉</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;">Esta semana en BuddyOne tenemos grandes noticias para ti.</p>
<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
<h3 style="color:#FF6B00;font-size:16px;margin:0 0 8px;">🍽️ Nuevas recetas</h3>
<p style="color:#374151;font-size:14px;line-height:1.5;">Hemos añadido 50 nuevas recetas saludables adaptadas a tus preferencias.</p>
<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">
<h3 style="color:#FF6B00;font-size:16px;margin:0 0 8px;">🤖 Mejoras en BuddyIA</h3>
<p style="color:#374151;font-size:14px;line-height:1.5;">Nuestro asistente ahora entiende mejor tus necesidades nutricionales.</p>
<div style="text-align:center;margin:32px 0;">
  <a href="https://buddymarket.io" style="background:linear-gradient(135deg,#FF6B00,#FF3D7F);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Abrir BuddyOne</a>
</div>`,
  },
  {
    id: "investor",
    name: "Inversores",
    description: "Comunicación con inversores",
    content: `<h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Actualización para inversores</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;">Estimado/a {{name}},</p>
<p style="color:#374151;font-size:15px;line-height:1.6;">Queremos compartir contigo los últimos avances de BuddyOne.</p>
<table width="100%" cellpadding="12" cellspacing="0" style="margin:24px 0;border-collapse:collapse;">
  <tr style="background:#FFF5EE;">
    <td style="border-radius:8px 0 0 0;font-weight:600;color:#1a1a2e;">Usuarios</td>
    <td style="border-radius:0 8px 0 0;color:#FF6B00;font-weight:700;font-size:18px;">180+</td>
  </tr>
  <tr>
    <td style="font-weight:600;color:#1a1a2e;">Pantallas</td>
    <td style="color:#FF6B00;font-weight:700;font-size:18px;">120+</td>
  </tr>
  <tr style="background:#FFF5EE;">
    <td style="border-radius:0 0 0 8px;font-weight:600;color:#1a1a2e;">Recetas</td>
    <td style="border-radius:0 0 8px 0;color:#FF6B00;font-weight:700;font-size:18px;">17.000+</td>
  </tr>
</table>
<p style="color:#374151;font-size:15px;line-height:1.6;">Seguimos avanzando hacia nuestros objetivos de crecimiento.</p>
<p style="color:#374151;font-size:15px;line-height:1.6;">Un saludo,<br><strong>Luis Cabello de los Cobos</strong><br>Co-Founder & COO</p>`,
  },
  {
    id: "promo",
    name: "Promoción",
    description: "Ofertas y descuentos",
    content: `<div style="text-align:center;">
  <h2 style="color:#1a1a2e;font-size:26px;margin:0 0 8px;">🎁 Oferta especial para ti</h2>
  <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">Solo por tiempo limitado</p>
  <div style="background:linear-gradient(135deg,#FF6B00,#FF3D7F);border-radius:12px;padding:32px;margin:0 0 24px;">
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 8px;">PLAN PRO MAX</p>
    <p style="color:#ffffff;font-size:36px;font-weight:800;margin:0;">50% OFF</p>
    <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:8px 0 0;">Primer mes a solo 9,99€</p>
  </div>
  <a href="https://buddymarket.io" style="background:#1a1a2e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Activar oferta</a>
</div>`,
  },
  {
    id: "founder",
    name: "Fundadores",
    description: "Email especial para fundadores",
    content: `<h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">Bienvenido/a a BuddyOne, {{name}} 🚀</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;">Eres uno de nuestros primeros usuarios y eso te convierte en <strong>Fundador/a de BuddyOne</strong>.</p>
<div style="background:#FFF5EE;border-radius:12px;padding:24px;margin:24px 0;border-left:4px solid #FF6B00;">
  <p style="color:#1a1a2e;font-size:15px;margin:0 0 8px;font-weight:600;">🎁 Tu regalo de fundador:</p>
  <p style="color:#374151;font-size:15px;margin:0;">1 año GRATIS de Plan Pro Max (valor: 239,88€)</p>
</div>
<p style="color:#374151;font-size:15px;line-height:1.6;">Tu plan se activará automáticamente al registrarte. Además, tienes un código de referido para tus amigos: si se registran en los próximos 7 días, reciben 3 meses gratis de Pro Max.</p>
<div style="text-align:center;margin:32px 0;">
  <a href="https://buddymarket.io" style="background:linear-gradient(135deg,#FF6B00,#FF3D7F);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Entrar a BuddyOne</a>
</div>
<p style="color:#374151;font-size:15px;line-height:1.6;">Gracias por confiar en nosotros desde el principio.</p>
<p style="color:#374151;font-size:15px;line-height:1.6;">Un abrazo,<br><strong>Luis Cabello de los Cobos</strong><br>Co-Founder & COO, BuddyOne</p>`,
  },
];

export default function AdminCampaigns() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Campaign editor state
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignPreview, setCampaignPreview] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignListId, setCampaignListId] = useState<number | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Contact form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newTags, setNewTags] = useState("");

  // List form state
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListColor, setNewListColor] = useState("#F97316");

  // Import state
  const [importText, setImportText] = useState("");
  const [importListId, setImportListId] = useState<number | undefined>();

  // Queries
  const stats = trpc.emailCampaigns.getStats.useQuery();
  const contacts = trpc.emailCampaigns.listContacts.useQuery({ search: searchQuery, page: 1, limit: 100 });
  const lists = trpc.emailCampaigns.listLists.useQuery();
  const campaigns = trpc.emailCampaigns.listCampaigns.useQuery();

  // Mutations
  const createContact = trpc.emailCampaigns.createContact.useMutation({
    onSuccess: () => { toast.success("Contacto añadido"); contacts.refetch(); stats.refetch(); setShowNewContact(false); setNewEmail(""); setNewName(""); setNewCompany(""); setNewTags(""); },
    onError: (e) => toast.error(e.message),
  });
  const deleteContact = trpc.emailCampaigns.deleteContact.useMutation({
    onSuccess: () => { toast.success("Contacto eliminado"); contacts.refetch(); stats.refetch(); },
  });
  const importContacts = trpc.emailCampaigns.importContacts.useMutation({
    onSuccess: (data) => { toast.success(`${data.imported} importados, ${data.skipped} omitidos`); contacts.refetch(); stats.refetch(); lists.refetch(); setShowImport(false); setImportText(""); },
    onError: (e) => toast.error(e.message),
  });
  const createList = trpc.emailCampaigns.createList.useMutation({
    onSuccess: () => { toast.success("Lista creada"); lists.refetch(); stats.refetch(); setShowNewList(false); setNewListName(""); setNewListDesc(""); },
  });
  const deleteList = trpc.emailCampaigns.deleteList.useMutation({
    onSuccess: () => { toast.success("Lista eliminada"); lists.refetch(); stats.refetch(); },
  });
  const createCampaign = trpc.emailCampaigns.createCampaign.useMutation({
    onSuccess: () => { toast.success("Campaña guardada"); campaigns.refetch(); stats.refetch(); setActiveTab("campaigns"); resetEditor(); },
    onError: (e) => toast.error(e.message),
  });
  const sendCampaign = trpc.emailCampaigns.sendCampaign.useMutation({
    onSuccess: (data) => { toast.success(`Enviada: ${data.totalSent} emails, ${data.totalFailed} fallidos`); campaigns.refetch(); stats.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const sendTestEmail = trpc.emailCampaigns.sendTestEmail.useMutation({
    onSuccess: (data) => { if (data.success) toast.success("Email de prueba enviado"); else toast.error(data.error || "Error"); },
  });
  const deleteCampaign = trpc.emailCampaigns.deleteCampaign.useMutation({
    onSuccess: () => { toast.success("Campaña eliminada"); campaigns.refetch(); stats.refetch(); },
  });

  function resetEditor() {
    setCampaignName(""); setCampaignSubject(""); setCampaignPreview(""); setCampaignContent(""); setCampaignListId(undefined); setSelectedTemplate(""); setEditingCampaignId(null);
  }

  function handleSelectTemplate(templateId: string) {
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (tpl) {
      setSelectedTemplate(templateId);
      setCampaignContent(tpl.content);
    }
  }

  function handleImport() {
    const lines = importText.trim().split("\n").filter(l => l.trim());
    const parsed = lines.map(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      return { email: parts[0], name: parts[1] || undefined, company: parts[2] || undefined };
    }).filter(c => c.email && c.email.includes("@"));

    if (parsed.length === 0) { toast.error("No se encontraron emails válidos"); return; }
    importContacts.mutate({ contacts: parsed, listId: importListId, source: "csv_import" });
  }

  function handleSaveCampaign() {
    if (!campaignName || !campaignSubject || !campaignContent) {
      toast.error("Completa nombre, asunto y contenido"); return;
    }
    const fullHtml = getBuddyOneTemplate(campaignContent, campaignSubject);
    createCampaign.mutate({ name: campaignName, subject: campaignSubject, previewText: campaignPreview, htmlContent: fullHtml, listId: campaignListId });
  }

  function handleSendCampaign(id: number) {
    if (!confirm("¿Enviar esta campaña? Esta acción no se puede deshacer.")) return;
    sendCampaign.mutate({ id });
  }

  function handleSendTest() {
    const email = prompt("Email para la prueba:", user?.email || "");
    if (!email) return;
    const fullHtml = getBuddyOneTemplate(campaignContent, campaignSubject);
    sendTestEmail.mutate({ to: email, subject: campaignSubject, htmlContent: fullHtml });
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  const tabs = [
    { key: "dashboard" as Tab, label: "Dashboard", icon: ChartBarIcon },
    { key: "contacts" as Tab, label: "Contactos", icon: UserGroupIcon },
    { key: "lists" as Tab, label: "Listas", icon: TagIcon },
    { key: "campaigns" as Tab, label: "Campañas", icon: EnvelopeIcon },
    { key: "editor" as Tab, label: "Nueva campaña", icon: PlusIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF3D7F] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app/admin" className="text-white/80 hover:text-white">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <EnvelopeIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold">Campañas de Email</h1>
          </div>
          <p className="text-sm text-white/80">info@buddymarket.io via Resend</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex gap-1 px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#FF6B00] text-[#FF6B00]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Contactos" value={stats.data?.totalContacts ?? 0} icon="👥" />
              <StatCard label="Listas" value={stats.data?.totalLists ?? 0} icon="📋" />
              <StatCard label="Campañas" value={stats.data?.totalCampaigns ?? 0} icon="📧" />
              <StatCard label="Enviadas" value={stats.data?.totalSent ?? 0} icon="✅" />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Últimas campañas</h3>
              {stats.data?.recentCampaigns?.length === 0 && (
                <p className="text-gray-500 text-sm">No hay campañas todavía. Crea tu primera campaña.</p>
              )}
              <div className="space-y-3">
                {stats.data?.recentCampaigns?.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      {c.totalSent ? <span className="text-xs text-gray-500">{c.totalSent} enviados</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS */}
        {activeTab === "contacts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar contactos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50">
                  <ArrowUpTrayIcon className="w-4 h-4" /> Importar
                </button>
                <button onClick={() => setShowNewContact(true)} className="flex items-center gap-1 px-3 py-2 text-sm bg-[#FF6B00] text-white rounded-lg hover:bg-orange-600">
                  <PlusIcon className="w-4 h-4" /> Añadir
                </button>
              </div>
            </div>

            {/* Import modal */}
            {showImport && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold mb-3">Importar contactos</h3>
                <p className="text-sm text-gray-500 mb-3">Pega emails (uno por línea). Formato: email, nombre, empresa</p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={6}
                  className="w-full border rounded-lg p-3 text-sm font-mono"
                  placeholder={"luis@ejemplo.com, Luis García, Empresa SA\nmaria@test.com, María López"}
                />
                <div className="flex items-center gap-3 mt-3">
                  <select
                    value={importListId || ""}
                    onChange={(e) => setImportListId(e.target.value ? Number(e.target.value) : undefined)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sin lista</option>
                    {lists.data?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <button onClick={handleImport} disabled={importContacts.isPending} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                    {importContacts.isPending ? "Importando..." : "Importar"}
                  </button>
                  <button onClick={() => setShowImport(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            )}

            {/* New contact form */}
            {showNewContact && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold mb-3">Nuevo contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="email" placeholder="Email *" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Nombre" value={newName} onChange={(e) => setNewName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Empresa" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Tags (separados por coma)" value={newTags} onChange={(e) => setNewTags(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => createContact.mutate({ email: newEmail, name: newName || undefined, company: newCompany || undefined, tags: newTags ? newTags.split(",").map(t => t.trim()) : undefined })} disabled={!newEmail || createContact.isPending} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                    Guardar
                  </button>
                  <button onClick={() => setShowNewContact(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            )}

            {/* Contacts table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Empresa</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Origen</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {contacts.data?.contacts?.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{c.email}</td>
                      <td className="px-4 py-3">{c.name || "—"}</td>
                      <td className="px-4 py-3">{c.company || "—"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{c.source}</span></td>
                      <td className="px-4 py-3">
                        {c.subscribed ? <span className="text-green-600 text-xs font-medium">Suscrito</span> : <span className="text-red-500 text-xs">Baja</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { if (confirm("¿Eliminar contacto?")) deleteContact.mutate({ id: c.id }); }} className="text-red-500 hover:text-red-700">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {contacts.data?.contacts?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay contactos. Añade o importa contactos para empezar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LISTS */}
        {activeTab === "lists" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Listas de distribución</h2>
              <button onClick={() => setShowNewList(true)} className="flex items-center gap-1 px-3 py-2 text-sm bg-[#FF6B00] text-white rounded-lg hover:bg-orange-600">
                <PlusIcon className="w-4 h-4" /> Nueva lista
              </button>
            </div>

            {showNewList && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-semibold mb-3">Nueva lista</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input type="text" placeholder="Nombre de la lista *" value={newListName} onChange={(e) => setNewListName(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Descripción" value={newListDesc} onChange={(e) => setNewListDesc(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="color" value={newListColor} onChange={(e) => setNewListColor(e.target.value)} className="border rounded-lg px-3 py-2 h-10" />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => createList.mutate({ name: newListName, description: newListDesc || undefined, color: newListColor })} disabled={!newListName} className="px-4 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                    Crear lista
                  </button>
                  <button onClick={() => setShowNewList(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lists.data?.map(list => (
                <div key={list.id} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: list.color || "#F97316" }} />
                      <h3 className="font-semibold text-gray-900">{list.name}</h3>
                    </div>
                    <button onClick={() => { if (confirm("¿Eliminar lista?")) deleteList.mutate({ id: list.id }); }} className="text-red-400 hover:text-red-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {list.description && <p className="text-sm text-gray-500 mb-3">{list.description}</p>}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>{list.contactCount} contactos</span>
                  </div>
                </div>
              ))}
              {lists.data?.length === 0 && (
                <div className="col-span-3 p-8 text-center text-gray-500 bg-white rounded-xl border">
                  <TagIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay listas. Crea una para organizar tus contactos.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAMPAIGNS */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
              <button onClick={() => { resetEditor(); setActiveTab("editor"); }} className="flex items-center gap-1 px-3 py-2 text-sm bg-[#FF6B00] text-white rounded-lg hover:bg-orange-600">
                <PlusIcon className="w-4 h-4" /> Nueva campaña
              </button>
            </div>

            <div className="space-y-3">
              {campaigns.data?.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Asunto: {c.subject}</p>
                      {c.sentAt && <p className="text-xs text-gray-400 mt-1">Enviada: {new Date(c.sentAt).toLocaleString("es-ES")}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.status === "sent" && (
                        <div className="text-right text-sm">
                          <p className="text-green-600 font-medium">{c.totalSent} enviados</p>
                          {(c.totalFailed ?? 0) > 0 && <p className="text-red-500">{c.totalFailed} fallidos</p>}
                        </div>
                      )}
                      {c.status === "draft" && (
                        <>
                          <button onClick={() => handleSendCampaign(c.id)} disabled={sendCampaign.isPending} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                            <PaperAirplaneIcon className="w-4 h-4" /> Enviar
                          </button>
                          <button onClick={() => { if (confirm("¿Eliminar?")) deleteCampaign.mutate({ id: c.id }); }} className="text-red-400 hover:text-red-600 p-1.5">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.data?.length === 0 && (
                <div className="p-8 text-center text-gray-500 bg-white rounded-xl border">
                  <EnvelopeIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay campañas. Crea tu primera campaña.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EDITOR */}
        {activeTab === "editor" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCampaignId ? "Editar campaña" : "Nueva campaña"}
            </h2>

            {/* Template selector */}
            {!selectedTemplate && (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-medium text-gray-900 mb-4">Elige una plantilla</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="p-4 border-2 rounded-xl text-left hover:border-[#FF6B00] transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{tpl.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedTemplate && (
              <>
                {/* Campaign details */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la campaña *</label>
                      <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Ej: Newsletter Mayo 2026" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lista de destinatarios</label>
                      <select value={campaignListId || ""} onChange={(e) => setCampaignListId(e.target.value ? Number(e.target.value) : undefined)} className="w-full border rounded-lg px-3 py-2 text-sm">
                        <option value="">Todos los contactos suscritos</option>
                        {lists.data?.map(l => <option key={l.id} value={l.id}>{l.name} ({l.contactCount})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del email *</label>
                      <input type="text" value={campaignSubject} onChange={(e) => setCampaignSubject(e.target.value)} placeholder="Ej: 🚀 Novedades de BuddyOne" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Texto de previsualización</label>
                      <input type="text" value={campaignPreview} onChange={(e) => setCampaignPreview(e.target.value)} placeholder="Texto que aparece en la bandeja de entrada" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300" />
                    </div>
                  </div>
                </div>

                {/* Content editor */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">Contenido del email (HTML)</label>
                    <div className="flex gap-2">
                      <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1 px-3 py-1.5 text-xs border rounded-lg hover:bg-gray-50">
                        <EyeIcon className="w-3 h-3" /> {showPreview ? "Editor" : "Preview"}
                      </button>
                      <button onClick={handleSendTest} disabled={!campaignSubject || !campaignContent} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                        <PaperAirplaneIcon className="w-3 h-3" /> Enviar prueba
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Variables disponibles: {"{{name}}"}, {"{{email}}"}</p>
                  {showPreview ? (
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={getBuddyOneTemplate(campaignContent, campaignSubject)}
                        className="w-full h-[500px]"
                        title="Preview"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={campaignContent}
                      onChange={(e) => setCampaignContent(e.target.value)}
                      rows={16}
                      className="w-full border rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-orange-300"
                      placeholder="<h2>Hola {{name}}</h2><p>Tu contenido aquí...</p>"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button onClick={() => { resetEditor(); setSelectedTemplate(""); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    Cancelar
                  </button>
                  <div className="flex gap-2">
                    <button onClick={handleSaveCampaign} disabled={createCampaign.isPending || !campaignName || !campaignSubject || !campaignContent} className="flex items-center gap-2 px-5 py-2 bg-[#FF6B00] text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                      {createCampaign.isPending ? "Guardando..." : "Guardar como borrador"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString("es-ES")}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    sending: "bg-yellow-100 text-yellow-700",
    sent: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    draft: "Borrador",
    scheduled: "Programada",
    sending: "Enviando...",
    sent: "Enviada",
    failed: "Fallida",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
