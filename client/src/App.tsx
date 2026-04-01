import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />

      {/* App routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/recipes" component={Recipes} />
      <Route path="/recipes/new" component={RecipeForm} />
      <Route path="/recipes/:id/edit" component={RecipeForm} />
      <Route path="/recipes/:id" component={RecipeDetail} />
      <Route path="/menus" component={Menus} />
      <Route path="/shopping-lists" component={ShoppingLists} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/meal-log" component={MealLog} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route path="/subscription" component={Subscription} />

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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
