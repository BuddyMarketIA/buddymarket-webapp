import { lazy, Suspense, useEffect, ComponentType } from "react";
import WelcomeLanguageModal from "@/components/WelcomeLanguageModal";

/**
 * Wrapper for lazy imports that retries failed dynamic imports up to `retries` times.
 * This prevents the ErrorBoundary from triggering on transient cold-start failures.
 */
function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): ReturnType<typeof lazy<T>> {
  return lazy(() => {
    const attempt = (n: number): Promise<{ default: T }> =>
      factory().catch((err) => {
        if (n <= 0) throw err;
        return new Promise<void>((resolve) => setTimeout(resolve, delay)).then(() =>
          attempt(n - 1)
        );
      });
    return attempt(retries);
  });
}
import CookieBanner from "./components/CookieBanner";
import OfflineIndicator from "./components/OfflineIndicator";
import { AccessibleToaster } from "@/components/AccessibleToaster";
import { RetryToastManager } from "@/components/RetryToastManager";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./_core/hooks/useAuth";
// ─── Lazy-loaded pages (code splitting per route) ─────────────────────────────
const Home = lazyWithRetry(() => import("./pages/Home"));
const LandingPage = lazyWithRetry(() => import("./pages/LandingPage"));
const LoginPage = lazyWithRetry(() => import("./pages/LoginPage"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const ExpertPlansManager = lazyWithRetry(() => import("./pages/ExpertPlansManager"));
const ClientPlanView = lazyWithRetry(() => import("./pages/ClientPlanView"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
const About = lazyWithRetry(() => import("./pages/About"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Cookies = lazyWithRetry(() => import("./pages/Cookies"));
const Registration = lazyWithRetry(() => import("./pages/Registration"));
const ActivarCodigo = lazyWithRetry(() => import("./pages/ActivarCodigo"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Nutricionistas = lazyWithRetry(() => import("./pages/Nutricionistas"));
const Empresas = lazyWithRetry(() => import("./pages/Empresas"));
const CalculadoraNutricional = lazyWithRetry(() => import("./pages/CalculadoraNutricional"));
const EmpresaDashboard = lazyWithRetry(() => import("./pages/EmpresaDashboard"));
const Familia = lazyWithRetry(() => import("./pages/Familia"));
const FamiliaUnirse = lazyWithRetry(() => import("./pages/FamiliaUnirse"));
const MisRecetasAsignadas = lazyWithRetry(() => import("./pages/MisRecetasAsignadas"));
const FamiliaCalendario = lazyWithRetry(() => import("./pages/FamiliaCalendario"));
const BuddySetup = lazyWithRetry(() => import("./pages/BuddySetup"));
// Guard: only show BuddySetup if user hasn't completed onboarding
function BuddySetupGuard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!loading && user?.onboardingCompleted) {
      setLocation("/app/dashboard");
    }
  }, [user?.onboardingCompleted, loading, setLocation]);
  if (loading) return null;
  return <BuddySetup />;
}
const OnboardingTour = lazyWithRetry(() => import("./pages/OnboardingTour"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/ResetPasswordPage"));

// App pages (protected)
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Recipes = lazyWithRetry(() => import("./pages/Recipes"));
const RecipeDetail = lazyWithRetry(() => import("./pages/RecipeDetail"));
const RecipeForm = lazyWithRetry(() => import("./pages/RecipeForm"));
const InstagramRecipeImport = lazyWithRetry(() => import("./pages/InstagramRecipeImport"));
const Menus = lazyWithRetry(() => import("./pages/Menus"));
const MyMenus = lazyWithRetry(() => import("./pages/MyMenus"));
const ShoppingLists = lazyWithRetry(() => import("./pages/ShoppingLists"));
const Inventory = lazyWithRetry(() => import("./pages/Inventory"));
const MealLog = lazyWithRetry(() => import("./pages/MealLog"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const AdminContent = lazyWithRetry(() => import("./pages/AdminContent"));
const AdminLogs = lazyWithRetry(() => import("./pages/AdminLogs"));
const AdminFeedback = lazyWithRetry(() => import("./pages/AdminFeedback"));
const AdminRecipeImages = lazyWithRetry(() => import("./pages/AdminRecipeImages"));
const AdminCampaigns = lazyWithRetry(() => import("./pages/AdminCampaigns"));
const BuddyPet = lazyWithRetry(() => import("./pages/BuddyPet"));
const BuddyPetPreview = lazyWithRetry(() => import("./pages/BuddyPetPreview"));
const BuddyKids = lazyWithRetry(() => import("./pages/BuddyKids"));
const SpecialMenus = lazyWithRetry(() => import("./pages/SpecialMenus"));
const EventMenus = lazyWithRetry(() => import("./pages/EventMenus"));
const VetClinicDashboard = lazyWithRetry(() => import("./pages/VetClinicDashboard"));
const Subscription = lazyWithRetry(() => import("./pages/Subscription"));
const BuddyExperts = lazyWithRetry(() => import("./pages/BuddyExperts"));
const BuddyMakers = lazyWithRetry(() => import("./pages/BuddyMakers"));
const BuddyIA = lazyWithRetry(() => import("./pages/BuddyIA"));
const BuddyShop = lazyWithRetry(() => import("./pages/BuddyShop"));
const MercadonaShop = lazyWithRetry(() => import("./pages/MercadonaShop"));
const CarrefourShop = lazyWithRetry(() => import("./pages/CarrefourShop"));
const LidlShop = lazyWithRetry(() => import("./pages/LidlShop"));
const HiperdinoShop = lazyWithRetry(() => import("./pages/HiperdinoShop"));
const ConsumShop = lazyWithRetry(() => import("./pages/ConsumShop"));
const MenuLibrary = lazyWithRetry(() => import("./pages/MenuLibrary"));
const ActiveMenu = lazyWithRetry(() => import("./pages/ActiveMenu"));
const SpecializedMenus = lazyWithRetry(() => import("./pages/SpecializedMenus"));
const Favorites = lazyWithRetry(() => import("./pages/Favorites"));
const BuddyProfile = lazyWithRetry(() => import("./pages/BuddyProfile"));
const Following = lazyWithRetry(() => import("./pages/Following"));
const BuddyExpertDashboard = lazyWithRetry(() => import("./pages/BuddyExpertDashboard"));
const BuddyMakerDashboard = lazyWithRetry(() => import("./pages/BuddyMakerDashboard"));
const BuddyMakerPanel = lazyWithRetry(() => import("./pages/BuddyMakerPanel"));
const BuddyMakerStats = lazyWithRetry(() => import("./pages/BuddyMakerStats"));
const BuddyExpertStats = lazyWithRetry(() => import("./pages/BuddyExpertStats"));
const ReferralDashboard = lazyWithRetry(() => import("./pages/ReferralDashboard"));
const Referrals = lazyWithRetry(() => import("./pages/Referrals"));
const Metrics = lazyWithRetry(() => import("./pages/Metrics"));
// ConnectedHealth and WearablesIntegration removed - consolidated into HealthHub
const NutritionalStats = lazyWithRetry(() => import("./pages/NutritionalStats"));
const Progress = lazyWithRetry(() => import("./pages/Progress"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
const MealNotifications = lazyWithRetry(() => import("./pages/MealNotifications"));
const Achievements = lazyWithRetry(() => import("./pages/Achievements"));
const Challenges = lazyWithRetry(() => import("./pages/Challenges"));
const BuddyApplication = lazyWithRetry(() => import("./pages/BuddyApplication"));
const EventMenuPlanner = lazyWithRetry(() => import("./pages/EventMenuPlanner"));
const SavedEvents = lazyWithRetry(() => import("./pages/SavedEvents"));
const Complements = lazyWithRetry(() => import("./pages/Complements"));
const Badges = lazyWithRetry(() => import("./pages/Badges"));
const PaymentHistory = lazyWithRetry(() => import("./pages/PaymentHistory"));
const BuddyScan = lazyWithRetry(() => import("./pages/BuddyScan"));
const InstallAppBanner = lazyWithRetry(() => import("./components/InstallAppBanner"));
const Herramientas = lazyWithRetry(() => import("./pages/Herramientas"));
const Creators = lazyWithRetry(() => import("./pages/Creators"));
const CreatorDashboard = lazyWithRetry(() => import("./pages/CreatorDashboard"));
const Soporte = lazyWithRetry(() => import("./pages/Soporte"));
const RegisterBuddyExpert = lazyWithRetry(() => import("./pages/RegisterBuddyExpert"));
const RegisterBuddyMaker = lazyWithRetry(() => import("./pages/RegisterBuddyMaker"));
const ExpertPatients = lazyWithRetry(() => import("./pages/ExpertPatients"));
const PatientImport = lazyWithRetry(() => import("./pages/PatientImport"));
const PatientDetailOffline = lazyWithRetry(() => import("./pages/PatientDetail"));
const ExpertPatientDetail = lazyWithRetry(() => import("./pages/ExpertPatientDetail"));
const ExpertChat = lazyWithRetry(() => import("./pages/ExpertChat"));
const ExpertDashboard = lazyWithRetry(() => import("./pages/ExpertDashboard"));
const MenuTemplates = lazyWithRetry(() => import("./pages/expert/MenuTemplates"));
const FoodSubstitutions = lazyWithRetry(() => import("./pages/expert/FoodSubstitutions"));
const SessionPackages = lazyWithRetry(() => import("./pages/expert/SessionPackages"));
const HireRequests = lazyWithRetry(() => import("./pages/expert/HireRequests"));
const AIPlanGenerator = lazyWithRetry(() => import("./pages/expert/AIPlanGenerator"));
const PatientAlerts = lazyWithRetry(() => import("./pages/expert/PatientAlerts"));
const ExpertReviews = lazyWithRetry(() => import("./pages/expert/ExpertReviews"));
const ExpertAvailability = lazyWithRetry(() => import("./pages/expert/ExpertAvailability"));
const ExpertReferrals = lazyWithRetry(() => import("./pages/expert/ExpertReferrals"));
const VideoConsultation = lazyWithRetry(() => import("./pages/expert/VideoConsultation"));
const B2BCorporate = lazyWithRetry(() => import("./pages/expert/B2BCorporate"));
const PatientTrends = lazyWithRetry(() => import("./pages/expert/PatientTrends"));
const ExpertFeatureRequests = lazyWithRetry(() => import("./pages/expert/ExpertFeatureRequests"));
const MyExpert = lazyWithRetry(() => import("./pages/MyExpert"));
const MakerAnalytics = lazyWithRetry(() => import("./pages/MakerAnalytics"));
const IngredientExplorer = lazyWithRetry(() => import("./pages/IngredientExplorer"));
const WeeklyCheckin = lazyWithRetry(() => import("./pages/WeeklyCheckin"));
const MonthlyReports = lazyWithRetry(() => import("./pages/MonthlyReports"));
const FridgeScanner = lazyWithRetry(() => import("./pages/FridgeScanner"));
const BloodTestAnalysis = lazyWithRetry(() => import("./pages/BloodTestAnalysis"));
const ReferralProgram = lazyWithRetry(() => import("./pages/ReferralProgram"));
const AnalyticsDashboard = lazyWithRetry(() => import("./pages/AnalyticsDashboard"));
const WellnessGoals = lazyWithRetry(() => import("./pages/WellnessGoals"));
const HealthHub = lazyWithRetry(() => import("./pages/HealthHub"));
const Ecosystem = lazyWithRetry(() => import("./pages/Ecosystem"));
const BuddyCare = lazyWithRetry(() => import("./pages/BuddyCare"));
const QuickSuggest = lazyWithRetry(() => import("./pages/QuickSuggest"));
const MealPrepPlanner = lazyWithRetry(() => import("./pages/MealPrepPlanner"));
const SustainabilityScore = lazyWithRetry(() => import("./pages/SustainabilityScore"));
const NutritionChat = lazyWithRetry(() => import("./pages/NutritionChat"));
const PriceCompare = lazyWithRetry(() => import("./pages/PriceCompare"));
const MarketplacePage = lazyWithRetry(() => import("./pages/Marketplace"));
const CorporateDashboard = lazyWithRetry(() => import("./pages/CorporateDashboard"));
const Contacto = lazyWithRetry(() => import("./pages/Contacto"));
const RGPDPage = lazyWithRetry(() => import("./pages/RGPD"));
const AvisoLegal = lazyWithRetry(() => import("./pages/AvisoLegal"));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

// Wraps a page component with AppLayout (for pages that don't include it themselves)
function WithLayout({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) {
  return (
    <AppLayout>
      <Component {...props} />
    </AppLayout>
  );
}

// Protects app routes — redirects to /login if not authenticated
function ProtectedRoute({ component: Component, params }: { component: React.ComponentType<any>; params?: any }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  return <WithLayout component={Component} params={params} />;
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public landing page — always accessible without authentication */}
      <Route path="/" component={LandingPage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/faq" component={FAQ} />
      <Route path="/about" component={About} />
      <Route path="/sobre-nosotros" component={About} />
      <Route path="/legal" component={AvisoLegal} />
      <Route path="/gdpr" component={RGPDPage} />
      <Route path="/herramientas" component={Herramientas} />
      <Route path="/nutricionistas" component={Nutricionistas} />
      <Route path="/calculadora" component={CalculadoraNutricional} />
      <Route path="/empresas" component={Empresas} />
      <Route path="/contacto" component={Contacto} />
      <Route path="/empresa/dashboard">{() => <ProtectedPage><EmpresaDashboard /></ProtectedPage>}</Route>
      <Route path="/activar" component={ActivarCodigo} />
      <Route path="/app/soporte">{() => <ProtectedRoute component={Soporte} />}</Route>
      <Route path="/familia" component={Familia} />
      <Route path="/familia/unirse" component={FamiliaUnirse} />
      <Route path="/familia/mis-recetas">{() => <ProtectedPage><MisRecetasAsignadas /></ProtectedPage>}</Route>
      <Route path="/familia/calendario">{() => <ProtectedPage><FamiliaCalendario /></ProtectedPage>}</Route>
      <Route path="/creators" component={Creators} />
      <Route path="/creator-dashboard">{() => <ProtectedPage><CreatorDashboard /></ProtectedPage>}</Route>
      {/* Onboarding wizard — requires auth, no AppLayout */}
      <Route path="/buddy-setup">{() => <ProtectedPage><BuddySetupGuard /></ProtectedPage>}</Route>
      <Route path="/app/tour">{() => <ProtectedPage><OnboardingTour /></ProtectedPage>}</Route>
      {/* /app → redirect to /app/dashboard */}
      <Route path="/app">{() => <Redirect to="/app/dashboard" />}</Route>
      {/* Protected app routes */}
      <Route path="/app/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/app/recipes/new">{() => <ProtectedRoute component={RecipeForm} />}</Route>
      <Route path="/app/recipes/instagram">{() => <ProtectedRoute component={InstagramRecipeImport} />}</Route>
      <Route path="/app/recipes/:id/edit">{(params) => <ProtectedRoute component={RecipeForm} params={params} />}</Route>
      <Route path="/app/recipes/:id">{(params) => <ProtectedRoute component={RecipeDetail} params={params} />}</Route>
      <Route path="/app/recipes">{() => <ProtectedRoute component={Recipes} />}</Route>
      <Route path="/app/ingredients">{() => <ProtectedRoute component={IngredientExplorer} />}</Route>
      <Route path="/app/menus">{() => <ProtectedRoute component={Menus} />}</Route>
      <Route path="/app/my-menus">{() => <ProtectedRoute component={MyMenus} />}</Route>
      <Route path="/app/shopping-lists">{() => <ProtectedRoute component={ShoppingLists} />}</Route>
      <Route path="/app/inventory">{() => <ProtectedRoute component={Inventory} />}</Route>
      <Route path="/app/meal-log">{() => <ProtectedRoute component={MealLog} />}</Route>
      <Route path="/app/diary">{() => <Redirect to="/app/meal-log" />}</Route>
      <Route path="/app/complements">{() => <ProtectedRoute component={Complements} />}</Route>
      <Route path="/app/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/app/badges">{() => <ProtectedRoute component={Badges} />}</Route>
      <Route path="/app/referrals">{() => <ProtectedRoute component={ReferralProgram} />}</Route>
      <Route path="/app/analytics">{() => <ProtectedRoute component={AnalyticsDashboard} />}</Route>
      <Route path="/app/admin">{() => <ProtectedRoute component={Admin} />}</Route>
      <Route path="/app/admin/content">{() => <ProtectedRoute component={AdminContent} />}</Route>
      <Route path="/app/admin/logs">{() => <ProtectedRoute component={AdminLogs} />}</Route>
      <Route path="/app/admin/feedback">{() => <ProtectedRoute component={AdminFeedback} />}</Route>
      <Route path="/app/admin/recipe-images">{() => <ProtectedRoute component={AdminRecipeImages} />}</Route>
      <Route path="/app/admin/campaigns">{() => <ProtectedRoute component={AdminCampaigns} />}</Route>
      <Route path="/app/buddy-pet">{() => <ProtectedRoute component={BuddyPet} />}</Route>
      <Route path="/app/buddy-pet-preview">{() => <ProtectedRoute component={BuddyPetPreview} />}</Route>
      <Route path="/app/buddy-kids">{() => <ProtectedRoute component={BuddyKids} />}</Route>
      <Route path="/app/special-menus">{() => <ProtectedRoute component={SpecialMenus} />}</Route>
      <Route path="/app/event-menus">{() => <ProtectedRoute component={EventMenus} />}</Route>
      <Route path="/app/vet-clinic">{() => <ProtectedRoute component={VetClinicDashboard} />}</Route>
      <Route path="/app/subscription">{() => <ProtectedRoute component={Subscription} />}</Route>
      <Route path="/app/payment-history">{() => <ProtectedRoute component={PaymentHistory} />}</Route>
      <Route path="/app/buddy-experts">{() => <ProtectedRoute component={BuddyExperts} />}</Route>
      <Route path="/app/buddy-makers">{() => <ProtectedRoute component={BuddyMakers} />}</Route>
      <Route path="/app/buddy-ia">{() => <ProtectedRoute component={BuddyIA} />}</Route>
      <Route path="/app/buddy-scan">{() => <ProtectedPage><BuddyScan /></ProtectedPage>}</Route>
      <Route path="/app/buddy-shop">{() => <ProtectedRoute component={BuddyShop} />}</Route>
      <Route path="/app/supermercados">{() => <ProtectedRoute component={MercadonaShop} />}</Route>
      <Route path="/app/supermarkets">{() => <Redirect to="/app/supermercados" />}</Route>
      <Route path="/app/carrefour">{() => <ProtectedRoute component={CarrefourShop} />}</Route>
      <Route path="/app/lidl">{() => <ProtectedRoute component={LidlShop} />}</Route>
      <Route path="/app/hiperdino">{() => <ProtectedRoute component={HiperdinoShop} />}</Route>
      <Route path="/app/consum">{() => <ProtectedRoute component={ConsumShop} />}</Route>
      <Route path="/app/menu-library">{() => <ProtectedRoute component={MenuLibrary} />}</Route>
      <Route path="/app/active-menu">{() => <ProtectedRoute component={ActiveMenu} />}</Route>
      <Route path="/app/specialized-menus">{() => <ProtectedPage><SpecializedMenus /></ProtectedPage>}</Route>
      <Route path="/app/favorites">{() => <ProtectedRoute component={Favorites} />}</Route>
      <Route path="/app/buddy-experts/:id">{() => <ProtectedPage><BuddyProfile /></ProtectedPage>}</Route>
      <Route path="/app/buddy-makers/:id">{() => <ProtectedPage><BuddyProfile /></ProtectedPage>}</Route>
      <Route path="/app/following">{() => <ProtectedRoute component={Following} />}</Route>
      <Route path="/app/buddy-expert-dashboard">{() => <ProtectedPage><BuddyExpertDashboard /></ProtectedPage>}</Route>
      <Route path="/app/buddy-maker-dashboard">{() => <ProtectedPage><BuddyMakerDashboard /></ProtectedPage>}</Route>
      <Route path="/app/buddy-maker-panel">{() => <ProtectedPage><BuddyMakerPanel /></ProtectedPage>}</Route>
      <Route path="/app/buddy-maker-stats">{() => <ProtectedPage><BuddyMakerStats /></ProtectedPage>}</Route>
      <Route path="/app/buddy-expert-stats">{() => <ProtectedPage><BuddyExpertStats /></ProtectedPage>}</Route>
      <Route path="/app/referrals">{() => <ProtectedPage><AppLayout><Referrals /></AppLayout></ProtectedPage>}</Route>
      <Route path="/app/referrals/creator">{() => <ProtectedPage><ReferralDashboard /></ProtectedPage>}</Route>
      <Route path="/app/metrics">{() => <ProtectedRoute component={Metrics} />}</Route>
      <Route path="/app/connected-health">{() => { window.location.replace("/app/health-hub"); return null; }}</Route>
      <Route path="/app/wearables">{() => { window.location.replace("/app/health-hub"); return null; }}</Route>
      <Route path="/app/stats">{() => <ProtectedRoute component={NutritionalStats} />}</Route>
      <Route path="/app/progress">{() => <ProtectedRoute component={Progress} />}</Route>
      <Route path="/app/notifications">{() => <ProtectedPage><Notifications /></ProtectedPage>}</Route>
      <Route path="/app/meal-notifications">{() => <ProtectedRoute component={MealNotifications} />}</Route>
      <Route path="/app/achievements">{() => <ProtectedRoute component={Achievements} />}</Route>
      <Route path="/app/challenges">{() => <ProtectedRoute component={Challenges} />}</Route>
      <Route path="/app/monthly-reports">{() => <ProtectedRoute component={MonthlyReports} />}</Route>
      <Route path="/app/buddy-application">{() => <ProtectedRoute component={BuddyApplication} />}</Route>
      <Route path="/app/event-menu">{() => <ProtectedPage><EventMenuPlanner /></ProtectedPage>}</Route>
      <Route path="/app/saved-events">{() => <ProtectedPage><SavedEvents /></ProtectedPage>}</Route>
      <Route path="/app/expert-plans">{() => <ProtectedPage><ExpertPlansManager /></ProtectedPage>}</Route>
      <Route path="/app/expert/dashboard">{() => <ProtectedRoute component={ExpertDashboard} />}</Route>
      <Route path="/app/wellness-goals">{() => <ProtectedRoute component={WellnessGoals} />}</Route>
      <Route path="/app/health-hub">{() => <ProtectedRoute component={HealthHub} />}</Route>
      <Route path="/app/ecosystem">{() => <ProtectedRoute component={Ecosystem} />}</Route>
      <Route path="/app/buddy-care">{() => <ProtectedRoute component={BuddyCare} />}</Route>
      <Route path="/app/quick-suggest">{() => <ProtectedRoute component={QuickSuggest} />}</Route>
      <Route path="/app/meal-prep">{() => <ProtectedRoute component={MealPrepPlanner} />}</Route>
      <Route path="/app/sustainability">{() => <ProtectedRoute component={SustainabilityScore} />}</Route>
      <Route path="/app/nutrition-chat">{() => <ProtectedRoute component={NutritionChat} />}</Route>
      <Route path="/app/price-compare">{() => <ProtectedRoute component={PriceCompare} />}</Route>
      <Route path="/app/marketplace">{() => <ProtectedRoute component={MarketplacePage} />}</Route>
      <Route path="/app/corporate-dashboard">{() => <ProtectedRoute component={CorporateDashboard} />}</Route>
      <Route path="/app/expert/patients">{() => <ProtectedPage><ExpertPatients /></ProtectedPage>}</Route>
      <Route path="/app/expert/patients/import">{() => <ProtectedPage><PatientImport /></ProtectedPage>}</Route>
      <Route path="/app/expert/patients/:id">{() => <ProtectedPage><ExpertPatientDetail /></ProtectedPage>}</Route>
      <Route path="/app/expert/offline-patients/:id">{() => <ProtectedPage><PatientDetailOffline /></ProtectedPage>}</Route>
      <Route path="/app/expert/chat">{() => <ProtectedPage><ExpertChat /></ProtectedPage>}</Route>
      <Route path="/app/expert/menu-templates">{() => <ProtectedPage><MenuTemplates /></ProtectedPage>}</Route>
      <Route path="/app/expert/food-substitutions">{() => <ProtectedPage><FoodSubstitutions /></ProtectedPage>}</Route>
      <Route path="/app/expert/session-packages">{() => <ProtectedPage><SessionPackages /></ProtectedPage>}</Route>
      <Route path="/app/expert/hire-requests">{() => <ProtectedPage><HireRequests /></ProtectedPage>}</Route>
      <Route path="/app/expert/ai-plan">{() => <ProtectedPage><AIPlanGenerator /></ProtectedPage>}</Route>
      <Route path="/app/expert/alerts">{() => <ProtectedPage><PatientAlerts /></ProtectedPage>}</Route>
      <Route path="/app/expert/reviews">{() => <ProtectedPage><ExpertReviews /></ProtectedPage>}</Route>
      <Route path="/app/expert/availability">{() => <ProtectedPage><ExpertAvailability /></ProtectedPage>}</Route>
      <Route path="/app/expert/referrals">{() => <ProtectedPage><ExpertReferrals /></ProtectedPage>}</Route>
      <Route path="/app/expert/video">{() => <ProtectedPage><VideoConsultation /></ProtectedPage>}</Route>
      <Route path="/app/expert/b2b">{() => <ProtectedPage><B2BCorporate /></ProtectedPage>}</Route>
      <Route path="/app/expert/trends">{() => <ProtectedPage><PatientTrends /></ProtectedPage>}</Route>
      <Route path="/app/expert/feature-requests">{() => <ProtectedPage><ExpertFeatureRequests /></ProtectedPage>}</Route>
      <Route path="/app/my-expert">{() => <ProtectedPage><MyExpert /></ProtectedPage>}</Route>
      <Route path="/app/weekly-checkin">{() => <ProtectedPage><WeeklyCheckin /></ProtectedPage>}</Route>
      <Route path="/app/maker-analytics">{() => <ProtectedPage><MakerAnalytics /></ProtectedPage>}</Route>
      <Route path="/app/my-plans">{() => <ProtectedPage><ClientPlanView /></ProtectedPage>}</Route>
      <Route path="/app/fridge-scanner">{() => <ProtectedRoute component={FridgeScanner} />}</Route>
      <Route path="/app/blood-test">{() => <ProtectedRoute component={BloodTestAnalysis} />}</Route>
      <Route path="/register">{() => <Registration />}</Route>
      <Route path="/register/buddy-expert">{() => <RegisterBuddyExpert />}</Route>
      <Route path="/register/buddy-maker">{() => <RegisterBuddyMaker />}</Route>
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppBanners() {
  const [location] = useLocation();
  const isAppRoute = location.startsWith("/app") || location.startsWith("/register");
  return isAppRoute ? <InstallAppBanner /> : null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <AccessibleToaster />
          <RetryToastManager />
          <WelcomeLanguageModal />
          <Suspense fallback={null}>
            <AppBanners />
          </Suspense>
          <CookieBanner />
          <OfflineIndicator />
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
