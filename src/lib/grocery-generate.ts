import type { MealPlan } from "@/lib/ai/schemas";
import type { WeeklyPlanData } from "@/lib/weekly";

export type GroceryItemDraft = {
  category: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  position: number;
};

export type PrepTaskDraft = {
  task_date: string; // YYYY-MM-DD
  title: string;
  instructions?: string;
  storage?: string;
  reheating?: string;
  duration_min?: number;
  position: number;
};

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/(chicken|paneer|tofu|fish|egg|beef|mutton|soya|lentil|dal|chickpea|rajma|tempeh)/i, "Protein"],
  [/(milk|yogurt|curd|cheese|butter|ghee|cream)/i, "Dairy"],
  [/(rice|roti|chapati|bread|oats|quinoa|pasta|noodle|poha|atta|flour)/i, "Grains"],
  [
    /(spinach|broccoli|tomato|onion|cucumber|carrot|pepper|capsicum|cabbage|cauliflower|beans|peas|lettuce|salad|vegetable|veg)/i,
    "Vegetables",
  ],
  [/(banana|apple|berry|berries|orange|mango|grape|fruit|lemon|lime)/i, "Fruits"],
  [
    /(oil|salt|pepper|masala|spice|garam|cumin|haldi|turmeric|chilli|garlic|ginger|sauce|vinegar)/i,
    "Pantry",
  ],
  [/(almond|peanut|cashew|nut|seed|protein powder|whey)/i, "Nuts & Supplements"],
];

function categorize(name: string): string {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(name)) return cat;
  return "Other";
}

function normalize(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Build grocery items from a MealPlan or WeeklyPlanData. Deterministic, no AI. */
export function buildGroceryItems(source: {
  grocery?: MealPlan["grocery"];
  meals?: string[]; // optional flat ingredient list
}): GroceryItemDraft[] {
  const map = new Map<string, GroceryItemDraft>();
  let pos = 0;

  const add = (rawName: string, category?: string) => {
    const n = normalize(rawName);
    if (!n) return;
    const key = n;
    if (map.has(key)) return;
    map.set(key, {
      category: category ?? categorize(n),
      name: titleCase(n),
      position: pos++,
      quantity: null,
      unit: null,
    });
  };

  if (source.grocery?.length) {
    for (const g of source.grocery) {
      for (const it of g.items) add(it, g.category || categorize(it));
    }
  }
  if (source.meals?.length) {
    for (const ing of source.meals) add(ing);
  }

  // Sort by category then position
  return Array.from(map.values()).sort(
    (a, b) => a.category.localeCompare(b.category) || a.position - b.position,
  );
}

export function buildGroceryFromWeekly(data: WeeklyPlanData): GroceryItemDraft[] {
  const flat: string[] = [];
  for (const d of data.days) for (const m of d.meals) flat.push(...(m.ingredients || []));
  return buildGroceryItems({ grocery: data.grocery, meals: flat });
}

export function buildGroceryFromMealPlan(plan: MealPlan): GroceryItemDraft[] {
  const flat: string[] = [];
  for (const d of plan.days) for (const m of d.meals) flat.push(...(m.ingredients || []));
  return buildGroceryItems({ grocery: plan.grocery, meals: flat });
}

/** Generate Sunday + Wednesday prep tasks with safe storage / reheating guidance. */
export function buildPrepTasks(weekStartISO: string): PrepTaskDraft[] {
  const start = new Date(weekStartISO + "T00:00:00");
  const sunday = new Date(start);
  sunday.setDate(sunday.getDate() + 6); // Mon..Sun → Sunday is +6
  const wednesday = new Date(start);
  wednesday.setDate(wednesday.getDate() + 2);

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const sundayTasks: PrepTaskDraft[] = [
    {
      task_date: iso(sunday),
      title: "Cook proteins for Mon–Wed",
      instructions:
        "Cook chicken / paneer / tofu / lentils in larger batches. Season lightly so you can re-flavor later.",
      storage: "Cool fully, then refrigerate in airtight containers (≤4°C) for up to 3 days.",
      reheating:
        "Reheat to steaming hot (≥75°C internal) only once. Add a splash of water for moisture.",
      duration_min: 45,
      position: 0,
    },
    {
      task_date: iso(sunday),
      title: "Wash & chop vegetables",
      instructions:
        "Rinse, pat dry, and chop hardy vegetables (carrot, capsicum, onion, cabbage). Keep leafy greens whole until use.",
      storage:
        "Store chopped veg in glass containers lined with paper towel; refrigerate 3–4 days.",
      reheating: "Use raw or stir-fry briefly to keep texture.",
      duration_min: 20,
      position: 1,
    },
    {
      task_date: iso(sunday),
      title: "Portion grains & overnight oats",
      instructions:
        "Cook rice / quinoa / oats and divide into single-serving containers. Prep 2 jars of overnight oats for Mon & Tue.",
      storage: "Refrigerate cooked grains up to 4 days. Freeze beyond that.",
      reheating: "Microwave grains with 1 tsp water, covered, 60–90s. Eat oats cold.",
      duration_min: 25,
      position: 2,
    },
  ];

  const wednesdayTasks: PrepTaskDraft[] = [
    {
      task_date: iso(wednesday),
      title: "Mid-week refresh: cook fresh proteins",
      instructions:
        "Cook a fresh batch of protein for Thu–Sat. Discard any Sunday batch older than 3 days.",
      storage: "Refrigerate ≤4°C for up to 3 days, or freeze in single portions.",
      reheating: "Reheat once to ≥75°C. Do not refreeze thawed cooked protein.",
      duration_min: 30,
      position: 0,
    },
    {
      task_date: iso(wednesday),
      title: "Restock salads & fruit",
      instructions:
        "Wash leafy greens, slice fruit for snacks. Refresh chopped veg containers if needed.",
      storage: "Greens: paper-towel lined container, 2–3 days. Cut fruit: airtight, 2 days.",
      reheating: "Eat raw.",
      duration_min: 15,
      position: 1,
    },
  ];

  return [...sundayTasks, ...wednesdayTasks];
}
