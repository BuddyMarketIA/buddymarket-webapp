import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeForm from "./pages/RecipeForm";
import Menus from "./pages/Menus";
import ShoppingLists from "./pages/ShoppingLists";
import Inventory from "./pages/Inventory";
import MealLog from "./pages/MealLog";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Subscription from "./pages/Subscription";
import BuddyExperts from "./pages/BuddyExperts";
import BuddyMakers from "./pages/BuddyMakers";
import BuddyIA from "./pages/BuddyIA";
import BuddyShop from "./pages/BuddyShop";
import MercadonaShop from "./pages/MercadonaShop";
import CarrefourShop from "./pages/CarrefourShop";
import MenuLibrary from "./pages/MenuLibrary";
import SpecializedMenus from "./pages/SpecializedMenus";
import Favorites from "./pages/Favorites";
import BuddyProfile from "./pages/BuddyProfile";
import Following from "./pages/Following";
import BuddyExpertDashboard from "./pages/BuddyExpertDashboard";
import BuddyMakerDashboard from "./pages/BuddyMakerDashboard";
import Metrics from "./pages/Metrics";
import BuddyApplication from "./pages/BuddyApplication";
import NutritionalStats from "./pages/NutritionalStats";
import MealNotifications from "./pages/MealNotifications";
import Achievements from "./pages/Achievements";
import EventMenuPlanner from "./pages/EventMenuPlanner";
import SavedEvents from "./pages/SavedEvents";
import Registration from "./pages/Registration";
import LandingPage from "./pages/LandingPage";
import Blog from "./pages/Blog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import { OnboardingModal } from "./components/OnboardingModal";
import InstallAppBanner from "./components/InstallAppBanner";
import Complements from "./pages/Complements";
import LoginPage from "./pages/LoginPage";

// Wraps a page component with AppLayout (for pages that don't include it themselves)
function WithLayout({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) {
  return (
    <AppLayout>
      <Component {...props} />
    </AppLayout>
  );
}

// Protects app routes — redirects to Manus login if not authenticated
function ProtectedRoute({ component: Component, params }: { component: React.ComponentType<any>; params?: any }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }
  return <WithLayout component={Component} params={params} />;
}

function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }
  return <>{children}</>;
}

function Router() {
  // On appbuddymarket.com, redirect root to Manus login directly
  const isAppDomain = typeof window !== 'undefined' && window.location.hostname.includes('appbuddymarket.com');
  return (
    <Switch>
      {/* Public landing — on appbuddymarket.com show LoginPage */}
      <Route path="/">{() => isAppDomain ? <LoginPage /> : <LandingPage />}</Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/legal" component={Terms} />
      <Route path="/gdpr" component={Privacy} />
      {/* /app → redirect to /app/dashboard */}
      <Route path="/app">{() => <Redirect to="/app/dashboard" />}</Route>
      {/* Protected app routes */}
      <Route path="/app/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/app/recipes/new">{() => <ProtectedRoute component={RecipeForm} />}</Route>
      <Route path="/app/recipes/:id/edit">{(params) => <ProtectedRoute component={RecipeForm} params={params} />}</Route>
      <Route path="/app/recipes/:id">{(params) => <ProtectedRoute component={RecipeDetail} params={params} />}</Route>
      <Route path="/app/recipes">{() => <ProtectedRoute component={Recipes} />}</Route>
      <Route path="/app/menus">{() => <ProtectedRoute component={Menus} />}</Route>
      <Route path="/app/shopping-lists">{() => <ProtectedRoute component={ShoppingLists} />}</Route>
      <Route path="/app/inventory">{() => <ProtectedRoute component={Inventory} />}</Route>
      <Route path="/app/meal-log">{() => <ProtectedRoute component={MealLog} />}</Route>
      <Route path="/app/complements">{() => <ProtectedRoute component={Complements} />}</Route>
      <Route path="/app/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/app/admin">{() => <ProtectedRoute component={Admin} />}</Route>
      <Route path="/app/subscription">{() => <ProtectedRoute component={Subscription} />}</Route>
      <Route path="/app/buddy-experts">{() => <ProtectedRoute component={BuddyExperts} />}</Route>
      <Route path="/app/buddy-makers">{() => <ProtectedRoute component={BuddyMakers} />}</Route>
      <Route path="/app/buddy-ia">{() => <ProtectedRoute component={BuddyIA} />}</Route>
      <Route path="/app/buddy-shop">{() => <ProtectedRoute component={BuddyShop} />}</Route>
      <Route path="/app/supermercados">{() => <ProtectedRoute component={MercadonaShop} />}</Route>
      <Route path="/app/carrefour">{() => <ProtectedRoute component={MercadonaShop} />}</Route>
      <Route path="/app/menu-library">{() => <ProtectedRoute component={MenuLibrary} />}</Route>
      <Route path="/app/specialized-menus">{() => <ProtectedPage><SpecializedMenus /></ProtectedPage>}</Route>
      <Route path="/app/favorites">{() => <ProtectedRoute component={Favorites} />}</Route>
      <Route path="/app/buddy-experts/:id">{() => <BuddyProfile />}</Route>
      <Route path="/app/buddy-makers/:id">{() => <BuddyProfile />}</Route>
      <Route path="/app/following">{() => <ProtectedRoute component={Following} />}</Route>
      <Route path="/app/buddy-expert-dashboard">{() => <ProtectedPage><BuddyExpertDashboard /></ProtectedPage>}</Route>
      <Route path="/app/buddy-maker-dashboard">{() => <ProtectedPage><BuddyMakerDashboard /></ProtectedPage>}</Route>
      <Route path="/app/metrics">{() => <ProtectedRoute component={Metrics} />}</Route>
      <Route path="/app/stats">{() => <ProtectedRoute component={NutritionalStats} />}</Route>
      <Route path="/app/notifications">{() => <ProtectedRoute component={MealNotifications} />}</Route>
      <Route path="/app/achievements">{() => <ProtectedRoute component={Achievements} />}</Route>
      <Route path="/app/buddy-application">{() => <ProtectedRoute component={BuddyApplication} />}</Route>
      <Route path="/app/event-menu">{() => <ProtectedPage><EventMenuPlanner /></ProtectedPage>}</Route>
      <Route path="/app/saved-events">{() => <ProtectedPage><SavedEvents /></ProtectedPage>}</Route>
      <Route path="/register">{() => <Registration />}</Route>
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <OnboardingModal />
          <AppBanners />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
