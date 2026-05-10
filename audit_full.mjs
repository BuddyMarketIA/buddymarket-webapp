const BASE = 'http://localhost:3000/api/trpc';
const INPUT = '?input=%7B%22json%22%3Anull%7D';
const INPUT_EMPTY_OBJ = '?input=%7B%22json%22%3A%7B%7D%7D';

const endpoints = [
  // Auth
  'auth.me',
  // Catalogs
  'catalogs.allergies',
  'catalogs.dietRestrictions',
  'catalogs.foodCategories',
  // Ingredients
  'ingredients.getAll',
  'ingredients.search',
  // Recipes
  'recipes.list',
  'recipes.search',
  'recipes.getPublic',
  // Menus
  'menus.list',
  'menus.getPublic',
  // Shopping
  'shoppingLists.getActive',
  // Inventory
  'inventory.getItems',
  // Meal logs
  'mealLogs.getByDate',
  // Subscriptions
  'subscriptions.getMySubscription',
  // Health
  'healthMetrics.getAll',
  // Admin
  'admin.stats',
  // BuddyExperts
  'buddyExperts.list',
  'buddyExperts.getMyProfile',
  // BuddyMakers
  'buddyMakers.list',
  // BuddyApplications
  'buddyApplications.getMyApplication',
  // Notifications
  'notifications.getReminders',
  // Achievements
  'achievements.getAll',
  // Progress
  'progress.getSummary',
  // Referrals
  'referrals.getMyCode',
  // Events
  'events.list',
  // Badges
  'badges.getAll',
  // Blog
  'blog.list',
  // Metrics
  'metrics.getAll',
  // Health (general)
  'health.getStatus',
  // UsageAnalytics
  'usageAnalytics.getSummary',
];

const results = await Promise.all(endpoints.map(async (p) => {
  try {
    const r = await fetch(`${BASE}/${p}${INPUT}`);
    const b = await r.json().catch(() => ({}));
    const msg = (b?.error?.json?.message ?? '').slice(0, 60);
    const noProc = msg.includes('No procedure') ? ' ← NO EXISTE' : '';
    const status = r.status === 401 ? 'OK(401-AUTH)' : r.status === 200 ? 'OK(200)' : r.status === 400 ? 'OK(400-INPUT)' : r.status === 405 ? 'OK(405-MUTATION)' : 'ERR(' + r.status + ')';
    return `${status} | ${p}${noProc}`;
  } catch (e) {
    return `ERR | ${p} | ${e.message}`;
  }
}));

results.forEach(r => console.log(r));
