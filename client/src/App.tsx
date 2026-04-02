import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
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

// Wraps a page component with AppLayout (for pages that don't include it themselves)
function WithLayout({ component: Component, ...props }: { component: React.ComponentType<any>; [key: string]: any }) {
  return (
    <AppLayout>
      <Component {...props} />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public landing */}
      <Route path="/" component={LandingPage} />
      <Route path="/blog" component={Blog} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/legal" component={Terms} />
      <Route path="/gdpr" component={Privacy} />
      {/* App routes — Dashboard and RecipeForm already include AppLayout internally */}
      <Route path="/dashboard">{() => <WithLayout component={Dashboard} />}</Route>
      <Route path="/recipes/new">{() => <WithLayout component={RecipeForm} />}</Route>
      <Route path="/recipes/:id/edit">{(params) => <WithLayout component={RecipeForm} params={params} />}</Route>
      {/* Pages that use vively-page but not AppLayout — wrap them */}
      <Route path="/recipes/:id">{(params) => <WithLayout component={RecipeDetail} params={params} />}</Route>
      <Route path="/recipes">{() => <WithLayout component={Recipes} />}</Route>
      <Route path="/menus">{() => <WithLayout component={Menus} />}</Route>
      <Route path="/shopping-lists">{() => <WithLayout component={ShoppingLists} />}</Route>
      <Route path="/inventory">{() => <WithLayout component={Inventory} />}</Route>
      <Route path="/meal-log">{() => <WithLayout component={MealLog} />}</Route>
      <Route path="/profile">{() => <WithLayout component={Profile} />}</Route>
      <Route path="/admin">{() => <WithLayout component={Admin} />}</Route>
      <Route path="/subscription">{() => <WithLayout component={Subscription} />}</Route>
      <Route path="/buddy-experts">{() => <WithLayout component={BuddyExperts} />}</Route>
      <Route path="/buddy-makers">{() => <WithLayout component={BuddyMakers} />}</Route>
      <Route path="/buddy-ia">{() => <WithLayout component={BuddyIA} />}</Route>
      <Route path="/buddy-shop">{() => <WithLayout component={BuddyShop} />}</Route>
      <Route path="/supermercados">{() => <WithLayout component={MercadonaShop} />}</Route>
      {/* /carrefour redirects to unified supermercados page */}
      <Route path="/carrefour">{() => <WithLayout component={MercadonaShop} />}</Route>
      <Route path="/menu-library">{() => <WithLayout component={MenuLibrary} />}</Route>
      <Route path="/specialized-menus">{() => <SpecializedMenus />}</Route>
      <Route path="/favorites">{() => <WithLayout component={Favorites} />}</Route>
      <Route path="/buddy-experts/:id">{() => <BuddyProfile />}</Route>
      <Route path="/buddy-makers/:id">{() => <BuddyProfile />}</Route>
      <Route path="/following">{() => <WithLayout component={Following} />}</Route>
      <Route path="/buddy-expert-dashboard">{() => <BuddyExpertDashboard />}</Route>
      <Route path="/buddy-maker-dashboard">{() => <BuddyMakerDashboard />}</Route>
      <Route path="/metrics">{() => <WithLayout component={Metrics} />}</Route>
      <Route path="/stats">{() => <WithLayout component={NutritionalStats} />}</Route>
      <Route path="/notifications">{() => <WithLayout component={MealNotifications} />}</Route>
      <Route path="/achievements">{() => <WithLayout component={Achievements} />}</Route>
      <Route path="/buddy-application">{() => <WithLayout component={BuddyApplication} />}</Route>
      <Route path="/event-menu">{() => <EventMenuPlanner />}</Route>
      <Route path="/saved-events">{() => <SavedEvents />}</Route>
      <Route path="/register">{() => <Registration />}</Route>
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <OnboardingModal />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
