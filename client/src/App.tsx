import { lazy, Suspense } from "react";
import WelcomeLanguageModal from "@/components/WelcomeLanguageModal";
import CookieBanner from "./components/CookieBanner";
import OfflineIndicator from "./components/OfflineIndicator";
import { AccessibleToaster } from "@/components/AccessibleToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./_core/hooks/useAuth";
// ─── Lazy-loaded pages (code splitting per route) ─────────────────────────────
const Home = lazy(() => import("./pages/Home"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ExpertPlansManager = lazy(() => import("./pages/ExpertPlansManager"));
const ClientPlanView = lazy(() => import("./pages/ClientPlanView"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Registration = lazy(() => import("./pages/Registration"));
const ActivarCodigo = lazy(() => import("./pages/ActivarCodigo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Nutricionistas = lazy(() => import("./pages/Nutricionistas"));
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresaDashboard = lazy(() => import("./pages/EmpresaDashboard"));
const Familia = lazy(() => import("./pages/Familia"));
const FamiliaUnirse = lazy(() => import("./pages/FamiliaUnirse"));
const MisRecetasAsignadas = lazy(() => import("./pages/MisRecetasAsignadas"));
const FamiliaCalendario = lazy(() => import("./pages/FamiliaCalendario"));
const BuddySetup = lazy(() => import("./pages/BuddySetup"));
const OnboardingTour = lazy(() => import("./pages/OnboardingTour"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

// App pages (protected)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Recipes = lazy(() => import("./pages/Recipes"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const RecipeForm = lazy(() => import("./pages/RecipeForm"));
const Menus = lazy(() => import("./pages/Menus"));
const MyMenus = lazy(() => import("./pages/MyMenus"));
const ShoppingLists = lazy(() => import("./pages/ShoppingLists"));
const Inventory = lazy(() => import("./pages/Inventory"));
const MealLog = lazy(() => import("./pages/MealLog"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const Subscription = lazy(() => import("./pages/Subscription"));
const BuddyExperts = lazy(() => import("./pages/BuddyExperts"));
const BuddyMakers = lazy(() => import("./pages/BuddyMakers"));
const BuddyIA = lazy(() => import("./pages/BuddyIA"));
const BuddyShop = lazy(() => import("./pages/BuddyShop"));
const MercadonaShop = lazy(() => import("./pages/MercadonaShop"));
const CarrefourShop = lazy(() => import("./pages/CarrefourShop"));
const LidlShop = lazy(() => import("./pages/LidlShop"));
const HiperdinoShop = lazy(() => import("./pages/HiperdinoShop"));
const ConsumShop = lazy(() => import("./pages/ConsumShop"));
const MenuLibrary = lazy(() => import("./pages/MenuLibrary"));
const ActiveMenu = lazy(() => import("./pages/ActiveMenu"));
const SpecializedMenus = lazy(() => import("./pages/SpecializedMenus"));
const Favorites = lazy(() => import("./pages/Favorites"));
const BuddyProfile = lazy(() => import("./pages/BuddyProfile"));
const Following = lazy(() => import("./pages/Following"));
const BuddyExpertDashboard = lazy(() => import("./pages/BuddyExpertDashboard"));
const BuddyMakerDashboard = lazy(() => import("./pages/BuddyMakerDashboard"));
const BuddyMakerStats = lazy(() => import("./pages/BuddyMakerStats"));
const BuddyExpertStats = lazy(() => import("./pages/BuddyExpertStats"));
const ReferralDashboard = lazy(() => import("./pages/ReferralDashboard"));
const Referrals = lazy(() => import("./pages/Referrals"));
const Metrics = lazy(() => import("./pages/Metrics"));
const ConnectedHealth = lazy(() => import("./pages/ConnectedHealth"));
const NutritionalStats = lazy(() => import("./pages/NutritionalStats"));
const Progress = lazy(() => import("./pages/Progress"));
const Notifications = lazy(() => import("./pages/Notifications"));
const MealNotifications = lazy(() => import("./pages/MealNotifications"));
const Achievements = lazy(() => import("./pages/Achievements"));
const BuddyApplication = lazy(() => import("./pages/BuddyApplication"));
const EventMenuPlanner = lazy(() => import("./pages/EventMenuPlanner"));
const SavedEvents = lazy(() => import("./pages/SavedEvents"));
const Complements = lazy(() => import("./pages/Complements"));
const Badges = lazy(() => import("./pages/Badges"));
const BuddyScan = lazy(() => import("./pages/BuddyScan"));
const InstallAppBanner = lazy(() => import("./components/InstallAppBanner"));
const Herramientas = lazy(() => import("./pages/Herramientas"));
const Creators = lazy(() => import("./pages/Creators"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const Soporte = lazy(() => import("./pages/Soporte"));
const RegisterBuddyExpert = lazy(() => import("./pages/RegisterBuddyExpert"));
const RegisterBuddyMaker = lazy(() => import("./pages/RegisterBuddyMaker"));
const ExpertPatients = lazy(() => import("./pages/ExpertPatients"));
const ExpertPatientDetail = lazy(() => import("./pages/ExpertPatientDetail"));
const MyExpert = lazy(() => import("./pages/MyExpert"));
const MakerAnalytics = lazy(() => import("./pages/MakerAnalytics"));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando...</p>
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
  const [, setLocation] = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    setLocation("/login");
    return null;
  }
  // Redirect to onboarding wizard if not completed yet
  if (!user.onboardingCompleted) {
    setLocation("/buddy-setup");
    return null;
  }
  return <WithLayout component={Component} params={params} />;
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    setLocation("/login");
    return null;
  }
  return <>{children}</>;
}

function Router() {
  const isAppDomain = typeof window !== 'undefined' && window.location.hostname.includes('buddymarket.io');
  return (
    <Switch>
      {/* Public landing — on buddymarket.io show LoginPage */}
      <Route path="/">{() => isAppDomain ? <LoginPage /> : <LandingPage />}</Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/faq" component={FAQ} />
      <Route path="/legal" component={Terms} />
      <Route path="/gdpr" component={Privacy} />
      <Route path="/herramientas" component={Herramientas} />
      <Route path="/nutricionistas" component={Nutricionistas} />
      <Route path="/empresas" component={Empresas} />
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
      <Route path="/buddy-setup">{() => <ProtectedPage><BuddySetup /></ProtectedPage>}</Route>
      <Route path="/app/tour">{() => <ProtectedPage><OnboardingTour /></ProtectedPage>}</Route>
      {/* /app → redirect to /app/dashboard */}
      <Route path="/app">{() => <Redirect to="/app/dashboard" />}</Route>
      {/* Protected app routes */}
      <Route path="/app/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/app/recipes/new">{() => <ProtectedRoute component={RecipeForm} />}</Route>
      <Route path="/app/recipes/:id/edit">{(params) => <ProtectedRoute component={RecipeForm} params={params} />}</Route>
      <Route path="/app/recipes/:id">{(params) => <ProtectedRoute component={RecipeDetail} params={params} />}</Route>
      <Route path="/app/recipes">{() => <ProtectedRoute component={Recipes} />}</Route>
      <Route path="/app/menus">{() => <ProtectedRoute component={Menus} />}</Route>
      <Route path="/app/my-menus">{() => <ProtectedRoute component={MyMenus} />}</Route>
      <Route path="/app/shopping-lists">{() => <ProtectedRoute component={ShoppingLists} />}</Route>
      <Route path="/app/inventory">{() => <ProtectedRoute component={Inventory} />}</Route>
      <Route path="/app/meal-log">{() => <ProtectedRoute component={MealLog} />}</Route>
      <Route path="/app/diary">{() => <Redirect to="/app/meal-log" />}</Route>
      <Route path="/app/complements">{() => <ProtectedRoute component={Complements} />}</Route>
      <Route path="/app/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/app/badges">{() => <ProtectedRoute component={Badges} />}</Route>
      <Route path="/app/admin">{() => <ProtectedRoute component={Admin} />}</Route>
      <Route path="/app/admin/content">{() => <ProtectedRoute component={AdminContent} />}</Route>
      <Route path="/app/admin/logs">{() => <ProtectedRoute component={AdminLogs} />}</Route>
      <Route path="/app/subscription">{() => <ProtectedRoute component={Subscription} />}</Route>
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
      <Route path="/app/buddy-experts/:id">{() => <BuddyProfile />}</Route>
      <Route path="/app/buddy-makers/:id">{() => <BuddyProfile />}</Route>
      <Route path="/app/following">{() => <ProtectedRoute component={Following} />}</Route>
      <Route path="/app/buddy-expert-dashboard">{() => <ProtectedPage><BuddyExpertDashboard /></ProtectedPage>}</Route>
      <Route path="/app/buddy-maker-dashboard">{() => <ProtectedPage><BuddyMakerDashboard /></ProtectedPage>}</Route>
      <Route path="/app/buddy-maker-stats">{() => <ProtectedPage><BuddyMakerStats /></ProtectedPage>}</Route>
      <Route path="/app/buddy-expert-stats">{() => <ProtectedPage><BuddyExpertStats /></ProtectedPage>}</Route>
      <Route path="/app/referrals">{() => <ProtectedPage><AppLayout><Referrals /></AppLayout></ProtectedPage>}</Route>
      <Route path="/app/referrals/creator">{() => <ProtectedPage><ReferralDashboard /></ProtectedPage>}</Route>
      <Route path="/app/metrics">{() => <ProtectedRoute component={Metrics} />}</Route>
      <Route path="/app/connected-health">{() => <ProtectedRoute component={ConnectedHealth} />}</Route>
      <Route path="/app/stats">{() => <ProtectedRoute component={NutritionalStats} />}</Route>
      <Route path="/app/progress">{() => <ProtectedRoute component={Progress} />}</Route>
      <Route path="/app/notifications">{() => <ProtectedPage><Notifications /></ProtectedPage>}</Route>
      <Route path="/app/meal-notifications">{() => <ProtectedRoute component={MealNotifications} />}</Route>
      <Route path="/app/achievements">{() => <ProtectedRoute component={Achievements} />}</Route>
      <Route path="/app/buddy-application">{() => <ProtectedRoute component={BuddyApplication} />}</Route>
      <Route path="/app/event-menu">{() => <ProtectedPage><EventMenuPlanner /></ProtectedPage>}</Route>
      <Route path="/app/saved-events">{() => <ProtectedPage><SavedEvents /></ProtectedPage>}</Route>
      <Route path="/app/expert-plans">{() => <ProtectedPage><ExpertPlansManager /></ProtectedPage>}</Route>
      <Route path="/app/expert/patients">{() => <ProtectedPage><ExpertPatients /></ProtectedPage>}</Route>
      <Route path="/app/expert/patients/:id">{() => <ProtectedPage><ExpertPatientDetail /></ProtectedPage>}</Route>
      <Route path="/app/my-expert">{() => <ProtectedPage><MyExpert /></ProtectedPage>}</Route>
      <Route path="/app/maker-analytics">{() => <ProtectedPage><MakerAnalytics /></ProtectedPage>}</Route>
      <Route path="/app/my-plans">{() => <ProtectedPage><ClientPlanView /></ProtectedPage>}</Route>
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
