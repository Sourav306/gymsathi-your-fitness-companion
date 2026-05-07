export type RecipeTag = "vegetarian" | "chicken" | "egg" | "paneer" | "high-protein" | "low-calorie" | "fish" | "soya";

export interface Recipe {
  id: string;
  name: string;
  type: "Veg" | "Non-Veg" | "Egg";
  protein: number; // grams
  calories: number;
  time: number; // minutes
  ingredients: string[];
  steps: string[];
  emoji: string;
  tags: RecipeTag[];
}

// "high-protein" = >=30g, "low-calorie" = <=400 kcal — applied automatically below
const base: Omit<Recipe, "tags">[] = [
  { id: "paneer-bhurji", name: "High-Protein Paneer Bhurji", type: "Veg", protein: 32, calories: 420, time: 15, emoji: "🧀",
    ingredients: ["200g paneer, crumbled","1 onion, chopped","1 tomato, chopped","1 tsp ginger-garlic paste","1/2 tsp turmeric","1 tsp garam masala","1 tbsp oil","Salt, coriander"],
    steps: ["Heat oil, sauté onions till golden.","Add ginger-garlic, then tomatoes. Cook 3 min.","Add spices and crumbled paneer.","Stir 2–3 min, garnish with coriander."] },
  { id: "chicken-tikka-bowl", name: "Chicken Tikka Quinoa Bowl", type: "Non-Veg", protein: 45, calories: 520, time: 25, emoji: "🍗",
    ingredients: ["200g chicken breast, cubed","3 tbsp curd","1 tsp tikka masala","1/2 tsp chilli powder","1/2 cup quinoa","Salad veggies","Lemon"],
    steps: ["Marinate chicken in curd + spices for 15 min.","Cook quinoa as per pack.","Pan-grill chicken 8–10 min.","Assemble bowl with quinoa, chicken, salad."] },
  { id: "egg-bhurji-toast", name: "Egg Bhurji on Multigrain Toast", type: "Egg", protein: 28, calories: 380, time: 10, emoji: "🍳",
    ingredients: ["3 eggs","1 small onion","1 chilli","1/4 tsp turmeric","2 multigrain bread slices","1 tsp butter","Salt"],
    steps: ["Whisk eggs with salt and turmeric.","Sauté onion + chilli in butter.","Pour eggs, scramble till just set.","Serve over toast."] },
  { id: "rajma-rice", name: "Rajma + Brown Rice", type: "Veg", protein: 24, calories: 540, time: 30, emoji: "🍛",
    ingredients: ["1 cup soaked rajma","1/2 cup brown rice","1 onion, 2 tomatoes","Ginger-garlic, spices","1 tbsp oil"],
    steps: ["Pressure cook rajma 5 whistles.","Make masala with onion, tomato, spices.","Mix rajma in masala, simmer 10 min.","Serve over cooked brown rice."] },
  { id: "soya-curry", name: "Soya Chunk Masala", type: "Veg", protein: 38, calories: 410, time: 20, emoji: "🌱",
    ingredients: ["1 cup soya chunks","1 onion, 2 tomatoes","Ginger-garlic","Garam masala, chilli powder","1 tbsp oil"],
    steps: ["Boil soya chunks 5 min, squeeze water.","Cook onion-tomato masala.","Add chunks, simmer 8 min.","Garnish with coriander."] },
  { id: "greek-curd-bowl", name: "Hung Curd Protein Bowl", type: "Veg", protein: 22, calories: 320, time: 5, emoji: "🥣",
    ingredients: ["1 cup hung curd / Greek yogurt","1 tbsp honey","Mixed nuts","1/2 banana","Berries"],
    steps: ["Add hung curd to bowl.","Top with banana, berries, nuts.","Drizzle honey."] },
  { id: "fish-curry", name: "Light Fish Curry + Rice", type: "Non-Veg", protein: 40, calories: 480, time: 25, emoji: "🐟",
    ingredients: ["250g rohu / basa","1 onion, 1 tomato","Mustard oil, turmeric","1/2 cup rice"],
    steps: ["Marinate fish with salt + turmeric.","Cook onion-tomato base.","Add fish, simmer 8 min.","Serve with rice."] },
  { id: "moong-chilla", name: "Moong Dal Chilla", type: "Veg", protein: 20, calories: 300, time: 20, emoji: "🥞",
    ingredients: ["1 cup soaked moong dal","Ginger, chilli","Onion, coriander","Salt"],
    steps: ["Blend dal with ginger-chilli to batter.","Mix in onion and coriander.","Spread on hot tawa, cook both sides.","Serve with curd."] },
  { id: "chicken-egg-curry", name: "Egg Curry", type: "Egg", protein: 26, calories: 390, time: 20, emoji: "🥚",
    ingredients: ["4 boiled eggs","1 onion, 2 tomatoes","Spices","1 tbsp oil"],
    steps: ["Make onion-tomato masala.","Add halved eggs, simmer 5 min.","Garnish and serve with roti."] },
  { id: "protein-smoothie", name: "Banana Peanut Butter Shake", type: "Veg", protein: 30, calories: 410, time: 5, emoji: "🥤",
    ingredients: ["1 banana","1 scoop whey (or 3 tbsp peanut butter)","1 cup milk","Ice"],
    steps: ["Blend everything till smooth.","Serve cold."] },
];

const manualTags: Record<string, RecipeTag[]> = {
  "paneer-bhurji": ["vegetarian", "paneer"],
  "chicken-tikka-bowl": ["chicken"],
  "egg-bhurji-toast": ["egg"],
  "rajma-rice": ["vegetarian"],
  "soya-curry": ["vegetarian", "soya"],
  "greek-curd-bowl": ["vegetarian"],
  "fish-curry": ["fish"],
  "moong-chilla": ["vegetarian"],
  "chicken-egg-curry": ["egg"],
  "protein-smoothie": ["vegetarian"],
};

export const RECIPES: Recipe[] = base.map((r) => {
  const tags = new Set<RecipeTag>(manualTags[r.id] ?? []);
  if (r.protein >= 30) tags.add("high-protein");
  if (r.calories <= 400) tags.add("low-calorie");
  return { ...r, tags: Array.from(tags) };
});

export const RECIPE_FILTERS: { key: RecipeTag; label: string }[] = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "chicken", label: "Chicken" },
  { key: "egg", label: "Egg" },
  { key: "paneer", label: "Paneer" },
  { key: "high-protein", label: "High protein" },
  { key: "low-calorie", label: "Low calorie" },
];
