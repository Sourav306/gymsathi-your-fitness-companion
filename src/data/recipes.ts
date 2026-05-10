// Diverse global high-protein recipe dataset (Phase 7.2)
// Backward-compatible with the original Recipe shape — additive fields only.

export type RecipeTag =
  // diet
  | "vegetarian"
  | "vegan"
  | "eggetarian"
  | "non-vegetarian"
  | "halal-friendly"
  | "dairy-free"
  | "gluten-free"
  // protein source
  | "chicken"
  | "egg"
  | "paneer"
  | "fish"
  | "soya"
  | "tofu"
  | "beef"
  | "turkey"
  | "lentil"
  | "chickpea"
  // lifestyle
  | "high-protein"
  | "low-calorie"
  | "budget"
  | "no-cook"
  | "quick"
  | "meal-prep"
  | "post-workout"
  | "sweet"
  | "global"
  // cuisine
  | "indian"
  | "punjabi"
  | "mediterranean"
  | "mexican-inspired"
  | "middle-eastern"
  | "asian-inspired"
  | "western-gym"
  | "canadian-grocery"
  | "student-budget";

export type RecipeCuisine =
  | "indian"
  | "punjabi"
  | "mediterranean"
  | "mexican-inspired"
  | "middle-eastern"
  | "asian-inspired"
  | "western-gym"
  | "canadian-grocery"
  | "global";

export type RecipeDietType = "veg" | "vegan" | "egg" | "non-veg";

export interface Recipe {
  id: string;
  name: string;
  // Legacy field — kept for backward compatibility
  type: "Veg" | "Non-Veg" | "Egg";
  protein: number; // grams
  calories: number;
  time: number; // minutes (alias of prep_time)
  ingredients: string[];
  steps: string[];
  emoji: string;
  tags: RecipeTag[];
  // Phase 7.2 additions (optional, future-friendly for internet recipe discovery)
  cuisine?: RecipeCuisine;
  diet_type?: RecipeDietType;
  estimated_protein?: number;
  estimated_calories?: number;
  prep_time?: number;
  missing_ingredients?: string[];
  source_type?: "local" | "spoonacular" | "edamam" | "web" | "youtube";
  source_name?: string;
  trusted_score?: number; // 0–100
}

interface RawRecipe {
  id: string;
  name: string;
  type: Recipe["type"];
  diet_type: RecipeDietType;
  cuisine: RecipeCuisine;
  protein: number;
  calories: number;
  time: number;
  emoji: string;
  ingredients: string[];
  steps: string[];
  extraTags?: RecipeTag[];
}

const base: RawRecipe[] = [
  // ---------- Indian / Punjabi ----------
  {
    id: "paneer-bhurji",
    name: "High-Protein Paneer Bhurji",
    type: "Veg",
    diet_type: "veg",
    cuisine: "indian",
    protein: 32,
    calories: 420,
    time: 15,
    emoji: "🧀",
    ingredients: [
      "200g paneer, crumbled",
      "1 onion, chopped",
      "1 tomato, chopped",
      "1 tsp ginger-garlic paste",
      "1/2 tsp turmeric",
      "1 tsp garam masala",
      "1 tbsp oil",
      "Salt, coriander",
    ],
    steps: [
      "Heat oil, sauté onions till golden.",
      "Add ginger-garlic, then tomatoes. Cook 3 min.",
      "Add spices and crumbled paneer.",
      "Stir 2–3 min, garnish with coriander.",
    ],
    extraTags: ["paneer", "vegetarian", "indian", "punjabi"],
  },
  {
    id: "rajma-rice",
    name: "Rajma + Brown Rice",
    type: "Veg",
    diet_type: "veg",
    cuisine: "punjabi",
    protein: 24,
    calories: 540,
    time: 30,
    emoji: "🍛",
    ingredients: [
      "1 cup soaked rajma",
      "1/2 cup brown rice",
      "1 onion, 2 tomatoes",
      "Ginger-garlic, spices",
      "1 tbsp oil",
    ],
    steps: [
      "Pressure cook rajma 5 whistles.",
      "Make masala with onion, tomato, spices.",
      "Mix rajma in masala, simmer 10 min.",
      "Serve over cooked brown rice.",
    ],
    extraTags: ["vegetarian", "indian", "punjabi", "budget", "meal-prep"],
  },
  {
    id: "soya-curry",
    name: "Soya Chunk Masala",
    type: "Veg",
    diet_type: "veg",
    cuisine: "indian",
    protein: 38,
    calories: 410,
    time: 20,
    emoji: "🌱",
    ingredients: [
      "1 cup soya chunks",
      "1 onion, 2 tomatoes",
      "Ginger-garlic",
      "Garam masala, chilli powder",
      "1 tbsp oil",
    ],
    steps: [
      "Boil soya chunks 5 min, squeeze water.",
      "Cook onion-tomato masala.",
      "Add chunks, simmer 8 min.",
      "Garnish with coriander.",
    ],
    extraTags: ["soya", "vegetarian", "indian", "budget", "dairy-free"],
  },
  {
    id: "moong-chilla",
    name: "Moong Dal Chilla",
    type: "Veg",
    diet_type: "veg",
    cuisine: "indian",
    protein: 20,
    calories: 300,
    time: 20,
    emoji: "🥞",
    ingredients: ["1 cup soaked moong dal", "Ginger, chilli", "Onion, coriander", "Salt"],
    steps: [
      "Blend dal with ginger-chilli to batter.",
      "Mix in onion and coriander.",
      "Spread on hot tawa, cook both sides.",
      "Serve with curd.",
    ],
    extraTags: ["lentil", "vegetarian", "indian", "budget", "gluten-free"],
  },
  {
    id: "dal-rice-bowl",
    name: "Dal + Rice Power Bowl",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "indian",
    protein: 22,
    calories: 480,
    time: 25,
    emoji: "🥘",
    ingredients: [
      "1/2 cup toor dal",
      "1/2 cup rice",
      "Onion, tomato, garlic",
      "Cumin, turmeric, chilli",
      "1 tbsp oil",
    ],
    steps: [
      "Pressure cook dal with turmeric.",
      "Cook rice separately.",
      "Temper cumin + garlic in oil, pour into dal.",
      "Serve dal over rice.",
    ],
    extraTags: ["vegan", "vegetarian", "indian", "budget", "dairy-free", "meal-prep"],
  },
  {
    id: "paneer-wrap",
    name: "Paneer Tikka Wrap",
    type: "Veg",
    diet_type: "veg",
    cuisine: "indian",
    protein: 30,
    calories: 470,
    time: 15,
    emoji: "🌯",
    ingredients: [
      "150g paneer, cubed",
      "1 whole-wheat tortilla",
      "2 tbsp yogurt",
      "Tikka spice",
      "Onion, capsicum, mint chutney",
    ],
    steps: [
      "Marinate paneer in yogurt + tikka spice 10 min.",
      "Pan-sear paneer with onion + capsicum.",
      "Spread mint chutney on tortilla, fill, roll.",
    ],
    extraTags: ["paneer", "vegetarian", "indian", "quick"],
  },
  {
    id: "chana-salad-bowl",
    name: "Chana Salad Bowl",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "indian",
    protein: 22,
    calories: 360,
    time: 10,
    emoji: "🥗",
    ingredients: [
      "1 cup boiled chickpeas",
      "Onion, tomato, cucumber",
      "Lemon, chaat masala",
      "Coriander, mint",
    ],
    steps: ["Mix all ingredients in a bowl.", "Squeeze lemon, sprinkle masala.", "Serve cold."],
    extraTags: ["chickpea", "vegan", "vegetarian", "indian", "no-cook", "budget", "gluten-free"],
  },
  {
    id: "egg-bhurji-toast",
    name: "Egg Bhurji on Multigrain Toast",
    type: "Egg",
    diet_type: "egg",
    cuisine: "indian",
    protein: 28,
    calories: 380,
    time: 10,
    emoji: "🍳",
    ingredients: [
      "3 eggs",
      "1 small onion",
      "1 chilli",
      "1/4 tsp turmeric",
      "2 multigrain bread slices",
      "1 tsp butter",
      "Salt",
    ],
    steps: [
      "Whisk eggs with salt and turmeric.",
      "Sauté onion + chilli in butter.",
      "Pour eggs, scramble till just set.",
      "Serve over toast.",
    ],
    extraTags: ["egg", "eggetarian", "indian", "quick"],
  },
  {
    id: "chicken-egg-curry",
    name: "Egg Curry",
    type: "Egg",
    diet_type: "egg",
    cuisine: "indian",
    protein: 26,
    calories: 390,
    time: 20,
    emoji: "🥚",
    ingredients: ["4 boiled eggs", "1 onion, 2 tomatoes", "Spices", "1 tbsp oil"],
    steps: [
      "Make onion-tomato masala.",
      "Add halved eggs, simmer 5 min.",
      "Garnish and serve with roti.",
    ],
    extraTags: ["egg", "eggetarian", "indian"],
  },
  {
    id: "chicken-tikka-bowl",
    name: "Chicken Tikka Quinoa Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "indian",
    protein: 45,
    calories: 520,
    time: 25,
    emoji: "🍗",
    ingredients: [
      "200g chicken breast, cubed",
      "3 tbsp curd",
      "1 tsp tikka masala",
      "1/2 tsp chilli powder",
      "1/2 cup quinoa",
      "Salad veggies",
      "Lemon",
    ],
    steps: [
      "Marinate chicken in curd + spices for 15 min.",
      "Cook quinoa as per pack.",
      "Pan-grill chicken 8–10 min.",
      "Assemble bowl with quinoa, chicken, salad.",
    ],
    extraTags: ["chicken", "indian", "halal-friendly", "post-workout", "meal-prep"],
  },
  {
    id: "fish-curry",
    name: "Light Fish Curry + Rice",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "indian",
    protein: 40,
    calories: 480,
    time: 25,
    emoji: "🐟",
    ingredients: ["250g rohu / basa", "1 onion, 1 tomato", "Mustard oil, turmeric", "1/2 cup rice"],
    steps: [
      "Marinate fish with salt + turmeric.",
      "Cook onion-tomato base.",
      "Add fish, simmer 8 min.",
      "Serve with rice.",
    ],
    extraTags: ["fish", "indian", "halal-friendly", "dairy-free"],
  },
  {
    id: "protein-lassi",
    name: "Protein Lassi",
    type: "Veg",
    diet_type: "veg",
    cuisine: "indian",
    protein: 28,
    calories: 320,
    time: 5,
    emoji: "🥛",
    ingredients: [
      "1 cup yogurt",
      "1 scoop whey or 3 tbsp peanut butter",
      "1/2 banana",
      "Cardamom",
      "Honey",
    ],
    steps: ["Blend everything till smooth.", "Serve chilled."],
    extraTags: ["sweet", "vegetarian", "indian", "quick", "post-workout"],
  },

  // ---------- North American / Canadian grocery ----------
  {
    id: "chicken-rice-bowl",
    name: "Chicken Rice Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "canadian-grocery",
    protein: 48,
    calories: 560,
    time: 20,
    emoji: "🍚",
    ingredients: [
      "200g chicken breast",
      "3/4 cup white rice",
      "Broccoli or mixed veg",
      "Olive oil, garlic, paprika, salt",
      "Lemon",
    ],
    steps: [
      "Season chicken, pan-sear 6–8 min per side.",
      "Cook rice; steam broccoli.",
      "Slice chicken, plate over rice with veg.",
      "Squeeze lemon on top.",
    ],
    extraTags: [
      "chicken",
      "western-gym",
      "canadian-grocery",
      "halal-friendly",
      "post-workout",
      "meal-prep",
    ],
  },
  {
    id: "turkey-wrap",
    name: "Turkey Avocado Wrap",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "canadian-grocery",
    protein: 36,
    calories: 450,
    time: 8,
    emoji: "🌯",
    ingredients: [
      "120g sliced turkey breast",
      "1 large whole-wheat tortilla",
      "1/2 avocado",
      "Spinach, tomato",
      "Mustard or hummus",
    ],
    steps: ["Spread mustard/hummus on tortilla.", "Layer turkey, avocado, veg.", "Roll and slice."],
    extraTags: ["turkey", "canadian-grocery", "western-gym", "quick"],
  },
  {
    id: "tuna-rice-bowl",
    name: "Tuna Rice Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "canadian-grocery",
    protein: 35,
    calories: 430,
    time: 10,
    emoji: "🐟",
    ingredients: [
      "1 can tuna in water",
      "3/4 cup rice",
      "Cucumber, edamame, carrot",
      "Soy sauce, sesame oil, sriracha",
    ],
    steps: [
      "Drain tuna, mix with soy + sesame oil.",
      "Top warm rice with tuna and veg.",
      "Drizzle sriracha.",
    ],
    extraTags: ["fish", "western-gym", "canadian-grocery", "budget", "quick"],
  },
  {
    id: "egg-sandwich",
    name: "High-Protein Egg Sandwich",
    type: "Egg",
    diet_type: "egg",
    cuisine: "canadian-grocery",
    protein: 28,
    calories: 380,
    time: 8,
    emoji: "🥪",
    ingredients: [
      "3 eggs",
      "2 slices whole-grain bread",
      "1 slice cheese",
      "Spinach",
      "Salt, pepper",
    ],
    steps: [
      "Scramble or fry eggs.",
      "Toast bread, add cheese to melt.",
      "Layer eggs and spinach. Close sandwich.",
    ],
    extraTags: ["egg", "eggetarian", "canadian-grocery", "student-budget", "quick", "budget"],
  },
  {
    id: "cottage-cheese-toast",
    name: "Cottage Cheese Toast",
    type: "Veg",
    diet_type: "veg",
    cuisine: "canadian-grocery",
    protein: 26,
    calories: 320,
    time: 5,
    emoji: "🍞",
    ingredients: [
      "1 cup cottage cheese",
      "2 slices sourdough",
      "Cherry tomatoes",
      "Black pepper, olive oil",
    ],
    steps: ["Toast bread.", "Spread cottage cheese.", "Top with tomatoes, pepper, drizzle oil."],
    extraTags: ["vegetarian", "canadian-grocery", "quick", "no-cook", "student-budget"],
  },
  {
    id: "beef-chili",
    name: "Lean Beef / Turkey Chili",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "western-gym",
    protein: 42,
    calories: 520,
    time: 35,
    emoji: "🌶️",
    ingredients: [
      "300g lean ground beef or turkey",
      "1 can kidney beans",
      "1 can diced tomato",
      "Onion, garlic, bell pepper",
      "Chili powder, cumin, paprika",
    ],
    steps: [
      "Brown the ground meat with onion + garlic.",
      "Add peppers, beans, tomato, spices.",
      "Simmer 20 min, salt to taste.",
    ],
    extraTags: [
      "beef",
      "turkey",
      "western-gym",
      "halal-friendly",
      "meal-prep",
      "post-workout",
      "canadian-grocery",
    ],
  },
  {
    id: "protein-pancakes",
    name: "Protein Pancakes",
    type: "Egg",
    diet_type: "egg",
    cuisine: "western-gym",
    protein: 35,
    calories: 420,
    time: 12,
    emoji: "🥞",
    ingredients: [
      "1 scoop whey",
      "1 banana",
      "2 eggs",
      "1/3 cup oats",
      "Cinnamon",
      "Berries to top",
    ],
    steps: [
      "Blend everything except berries.",
      "Cook small pancakes on low-medium heat.",
      "Top with berries.",
    ],
    extraTags: ["egg", "sweet", "western-gym", "post-workout", "quick"],
  },
  {
    id: "overnight-oats",
    name: "Peanut Butter Overnight Oats",
    type: "Veg",
    diet_type: "veg",
    cuisine: "western-gym",
    protein: 28,
    calories: 440,
    time: 5,
    emoji: "🥣",
    ingredients: [
      "1/2 cup oats",
      "1 cup milk (or soy milk)",
      "1 scoop whey or pea protein",
      "1 tbsp peanut butter",
      "Banana, berries",
    ],
    steps: [
      "Mix oats, milk, protein, PB in a jar.",
      "Refrigerate overnight.",
      "Top with fruit before eating.",
    ],
    extraTags: ["sweet", "vegetarian", "no-cook", "meal-prep", "western-gym", "post-workout"],
  },
  {
    id: "yogurt-parfait",
    name: "High-Protein Yogurt Parfait",
    type: "Veg",
    diet_type: "veg",
    cuisine: "western-gym",
    protein: 30,
    calories: 360,
    time: 5,
    emoji: "🍨",
    ingredients: ["1 cup Greek yogurt", "1/3 cup granola", "Berries", "Honey", "Chia seeds"],
    steps: ["Layer yogurt, granola, berries in a glass.", "Drizzle honey, sprinkle chia."],
    extraTags: ["sweet", "vegetarian", "no-cook", "quick", "western-gym"],
  },

  // ---------- Mediterranean ----------
  {
    id: "greek-chicken-bowl",
    name: "Greek Chicken Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "mediterranean",
    protein: 46,
    calories: 540,
    time: 25,
    emoji: "🥙",
    ingredients: [
      "200g chicken breast",
      "1/2 cup couscous or rice",
      "Cucumber, tomato, red onion",
      "Feta, olives",
      "Olive oil, lemon, oregano",
    ],
    steps: [
      "Marinate chicken in lemon, oregano, oil.",
      "Pan-grill 6–8 min per side.",
      "Plate over couscous with veg, feta, olives.",
    ],
    extraTags: [
      "chicken",
      "mediterranean",
      "halal-friendly",
      "meal-prep",
      "post-workout",
    ],
  },
  {
    id: "salmon-rice-bowl",
    name: "Salmon Rice Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "mediterranean",
    protein: 42,
    calories: 560,
    time: 20,
    emoji: "🍣",
    ingredients: [
      "180g salmon fillet",
      "3/4 cup rice",
      "Cucumber, avocado, edamame",
      "Soy sauce, sesame seeds",
    ],
    steps: [
      "Bake or pan-sear salmon 4 min per side.",
      "Flake over rice with veg.",
      "Drizzle soy, sprinkle sesame.",
    ],
    extraTags: ["fish", "mediterranean", "halal-friendly", "post-workout", "dairy-free"],
  },
  {
    id: "yogurt-protein-bowl",
    name: "Greek Yogurt Protein Bowl",
    type: "Veg",
    diet_type: "veg",
    cuisine: "mediterranean",
    protein: 32,
    calories: 380,
    time: 5,
    emoji: "🥣",
    ingredients: [
      "1.5 cups Greek yogurt",
      "Honey",
      "Mixed nuts",
      "Berries",
      "Chia seeds",
    ],
    steps: ["Add yogurt to bowl.", "Top with fruit, nuts, chia.", "Drizzle honey."],
    extraTags: [
      "vegetarian",
      "mediterranean",
      "no-cook",
      "quick",
      "sweet",
      "post-workout",
      "gluten-free",
    ],
  },

  // ---------- Mexican-inspired ----------
  {
    id: "burrito-bowl",
    name: "Chicken Burrito Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "mexican-inspired",
    protein: 44,
    calories: 580,
    time: 20,
    emoji: "🌯",
    ingredients: [
      "200g chicken breast, diced",
      "3/4 cup rice",
      "Black beans",
      "Corn, salsa, lettuce",
      "Cumin, paprika, lime",
    ],
    steps: [
      "Season chicken with cumin + paprika, sauté 8 min.",
      "Warm beans and rice.",
      "Layer rice, beans, chicken, salsa, corn, lettuce.",
      "Squeeze lime.",
    ],
    extraTags: [
      "chicken",
      "mexican-inspired",
      "halal-friendly",
      "meal-prep",
      "post-workout",
      "global",
    ],
  },
  {
    id: "chicken-fajita-bowl",
    name: "Chicken Fajita Bowl",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "mexican-inspired",
    protein: 42,
    calories: 500,
    time: 20,
    emoji: "🫑",
    ingredients: [
      "200g chicken strips",
      "Bell peppers, onion",
      "Fajita seasoning",
      "1/2 cup rice or tortillas",
      "Lime, cilantro",
    ],
    steps: [
      "Toss chicken with seasoning.",
      "Sear chicken; sauté peppers + onion.",
      "Plate over rice or with tortillas.",
    ],
    extraTags: ["chicken", "mexican-inspired", "halal-friendly", "quick", "post-workout"],
  },
  {
    id: "vegan-burrito-bowl",
    name: "Black Bean Burrito Bowl",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "mexican-inspired",
    protein: 24,
    calories: 480,
    time: 15,
    emoji: "🫘",
    ingredients: [
      "1 cup black beans",
      "3/4 cup brown rice",
      "Corn, salsa, lettuce",
      "Avocado",
      "Lime, cumin",
    ],
    steps: [
      "Warm beans with cumin.",
      "Layer rice, beans, corn, salsa, lettuce, avocado.",
      "Squeeze lime.",
    ],
    extraTags: [
      "vegan",
      "vegetarian",
      "mexican-inspired",
      "budget",
      "dairy-free",
      "meal-prep",
    ],
  },

  // ---------- Middle Eastern ----------
  {
    id: "hummus-chicken-wrap",
    name: "Hummus Chicken Wrap",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "middle-eastern",
    protein: 40,
    calories: 470,
    time: 12,
    emoji: "🌯",
    ingredients: [
      "150g grilled chicken",
      "1 large pita or wrap",
      "3 tbsp hummus",
      "Cucumber, tomato, lettuce",
      "Lemon",
    ],
    steps: [
      "Spread hummus on wrap.",
      "Layer chicken and veg.",
      "Squeeze lemon, roll tightly.",
    ],
    extraTags: ["chicken", "middle-eastern", "halal-friendly", "quick"],
  },
  {
    id: "falafel-bowl",
    name: "Falafel + Greek Yogurt Sauce Bowl",
    type: "Veg",
    diet_type: "veg",
    cuisine: "middle-eastern",
    protein: 28,
    calories: 520,
    time: 20,
    emoji: "🧆",
    ingredients: [
      "6 falafels (baked)",
      "1/2 cup couscous",
      "1/2 cup Greek yogurt",
      "Cucumber, tomato",
      "Garlic, lemon, mint",
    ],
    steps: [
      "Bake falafels per pack.",
      "Mix yogurt with garlic + lemon for sauce.",
      "Plate over couscous with veg, drizzle sauce.",
    ],
    extraTags: ["chickpea", "vegetarian", "middle-eastern", "meal-prep"],
  },

  // ---------- Asian-inspired ----------
  {
    id: "tofu-stir-fry",
    name: "Tofu Stir-Fry Bowl",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "asian-inspired",
    protein: 32,
    calories: 460,
    time: 18,
    emoji: "🥡",
    ingredients: [
      "200g firm tofu",
      "Mixed stir-fry veg",
      "3/4 cup rice or noodles",
      "Soy sauce, garlic, ginger",
      "Sesame oil",
    ],
    steps: [
      "Press tofu, cube, pan-fry till golden.",
      "Stir-fry veg with garlic + ginger.",
      "Toss with soy + sesame oil. Serve over rice.",
    ],
    extraTags: [
      "tofu",
      "soya",
      "vegan",
      "vegetarian",
      "asian-inspired",
      "dairy-free",
      "meal-prep",
      "post-workout",
    ],
  },
  {
    id: "edamame-noodle-bowl",
    name: "Edamame Soba Noodle Bowl",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "asian-inspired",
    protein: 24,
    calories: 420,
    time: 12,
    emoji: "🍜",
    ingredients: [
      "1 bundle soba noodles",
      "1 cup shelled edamame",
      "Carrot, scallion",
      "Soy sauce, lime, sesame",
    ],
    steps: [
      "Cook noodles per pack, rinse cold.",
      "Toss with edamame, veg, dressing.",
      "Serve cold or warm.",
    ],
    extraTags: ["vegan", "vegetarian", "asian-inspired", "dairy-free", "no-cook", "quick"],
  },

  // ---------- Vegetarian / vegan global ----------
  {
    id: "lentil-pasta-bowl",
    name: "Lentil Pasta Bowl",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "global",
    protein: 30,
    calories: 480,
    time: 15,
    emoji: "🍝",
    ingredients: [
      "100g red-lentil pasta",
      "1 cup marinara",
      "Spinach, garlic",
      "Olive oil, chili flakes",
      "Nutritional yeast (optional)",
    ],
    steps: [
      "Cook pasta per pack.",
      "Sauté garlic, wilt spinach, add marinara.",
      "Toss with pasta. Top with chili flakes.",
    ],
    extraTags: ["lentil", "vegan", "vegetarian", "global", "dairy-free", "quick", "meal-prep"],
  },
  {
    id: "chia-protein-pudding",
    name: "Cocoa Protein Chia Pudding",
    type: "Veg",
    diet_type: "vegan",
    cuisine: "global",
    protein: 24,
    calories: 340,
    time: 5,
    emoji: "🍫",
    ingredients: [
      "3 tbsp chia seeds",
      "1 cup soy milk",
      "1 scoop chocolate protein",
      "1 tsp cocoa",
      "Berries",
    ],
    steps: [
      "Whisk chia, milk, protein, cocoa.",
      "Refrigerate 4 hr or overnight.",
      "Top with berries.",
    ],
    extraTags: [
      "vegan",
      "vegetarian",
      "sweet",
      "no-cook",
      "meal-prep",
      "dairy-free",
      "global",
      "post-workout",
    ],
  },
  {
    id: "protein-smoothie",
    name: "Banana Peanut Butter Protein Smoothie",
    type: "Veg",
    diet_type: "veg",
    cuisine: "global",
    protein: 30,
    calories: 410,
    time: 5,
    emoji: "🥤",
    ingredients: [
      "1 banana",
      "1 scoop whey (or pea protein)",
      "1 cup milk or soy milk",
      "1 tbsp peanut butter",
      "Ice",
    ],
    steps: ["Blend everything till smooth.", "Serve cold."],
    extraTags: ["vegetarian", "sweet", "quick", "no-cook", "post-workout", "global"],
  },
  {
    id: "protein-mug-cake",
    name: "Chocolate Protein Mug Cake",
    type: "Egg",
    diet_type: "egg",
    cuisine: "global",
    protein: 28,
    calories: 320,
    time: 5,
    emoji: "🍰",
    ingredients: [
      "1 scoop chocolate whey",
      "1 egg",
      "2 tbsp oats",
      "1 tbsp cocoa",
      "Splash of milk",
    ],
    steps: ["Mix in mug.", "Microwave 60–90 s.", "Top with peanut butter."],
    extraTags: ["sweet", "egg", "quick", "post-workout", "global"],
  },
  {
    id: "cottage-cheesecake-bowl",
    name: "Cottage Cheese Cheesecake Bowl",
    type: "Veg",
    diet_type: "veg",
    cuisine: "global",
    protein: 30,
    calories: 310,
    time: 5,
    emoji: "🍰",
    ingredients: [
      "1 cup cottage cheese",
      "1/2 scoop vanilla whey",
      "Crushed graham cracker",
      "Berries",
      "Honey",
    ],
    steps: ["Blend cottage cheese + whey till smooth.", "Top with crackers, berries, honey."],
    extraTags: ["sweet", "vegetarian", "no-cook", "quick", "post-workout", "global"],
  },
  {
    id: "frozen-yogurt-bark",
    name: "Frozen Yogurt Protein Bark",
    type: "Veg",
    diet_type: "veg",
    cuisine: "global",
    protein: 22,
    calories: 280,
    time: 5,
    emoji: "🍓",
    ingredients: [
      "1 cup Greek yogurt",
      "1/2 scoop whey",
      "Berries",
      "Honey",
      "Granola",
    ],
    steps: [
      "Mix yogurt + whey + honey.",
      "Spread on tray, top with berries + granola.",
      "Freeze 2 hr; break into pieces.",
    ],
    extraTags: ["sweet", "vegetarian", "no-cook", "meal-prep", "global"],
  },
  {
    id: "apple-cinnamon-oats",
    name: "Apple Cinnamon Protein Oats",
    type: "Veg",
    diet_type: "veg",
    cuisine: "global",
    protein: 26,
    calories: 400,
    time: 8,
    emoji: "🍎",
    ingredients: [
      "1/2 cup oats",
      "1 cup milk",
      "1 scoop vanilla whey",
      "1 apple, diced",
      "Cinnamon",
    ],
    steps: [
      "Cook oats with milk.",
      "Stir in whey off heat.",
      "Top with apple + cinnamon.",
    ],
    extraTags: ["sweet", "vegetarian", "quick", "post-workout", "global"],
  },
  {
    id: "pb-yogurt-dip",
    name: "Peanut Butter Yogurt Dip with Fruit",
    type: "Veg",
    diet_type: "veg",
    cuisine: "global",
    protein: 22,
    calories: 320,
    time: 3,
    emoji: "🍌",
    ingredients: [
      "1 cup Greek yogurt",
      "2 tbsp peanut butter",
      "1 tsp honey",
      "Apple, banana, berries",
    ],
    steps: ["Whisk yogurt + PB + honey.", "Serve with fruit for dipping."],
    extraTags: ["sweet", "vegetarian", "no-cook", "quick", "global"],
  },

  // ---------- Student / budget ----------
  {
    id: "tuna-pasta",
    name: "Budget Tuna Pasta",
    type: "Non-Veg",
    diet_type: "non-veg",
    cuisine: "canadian-grocery",
    protein: 36,
    calories: 510,
    time: 15,
    emoji: "🍝",
    ingredients: [
      "100g pasta",
      "1 can tuna",
      "Frozen peas",
      "Olive oil, garlic, chili flakes",
      "Lemon",
    ],
    steps: [
      "Cook pasta + peas together.",
      "Toss with tuna, oil, garlic, chili.",
      "Squeeze lemon.",
    ],
    extraTags: [
      "fish",
      "student-budget",
      "budget",
      "canadian-grocery",
      "quick",
      "post-workout",
    ],
  },
];

const TYPE_TO_DIET_TAG: Record<Recipe["type"], RecipeTag> = {
  Veg: "vegetarian",
  Egg: "eggetarian",
  "Non-Veg": "non-vegetarian",
};

export const RECIPES: Recipe[] = base.map((r) => {
  const tags = new Set<RecipeTag>(r.extraTags ?? []);
  tags.add(TYPE_TO_DIET_TAG[r.type]);
  if (r.cuisine) tags.add(r.cuisine as RecipeTag);
  if (r.protein >= 30) tags.add("high-protein");
  if (r.calories <= 400) tags.add("low-calorie");
  if (r.time <= 15) tags.add("quick");
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    protein: r.protein,
    calories: r.calories,
    time: r.time,
    emoji: r.emoji,
    ingredients: r.ingredients,
    steps: r.steps,
    tags: Array.from(tags),
    cuisine: r.cuisine,
    diet_type: r.diet_type,
    estimated_protein: r.protein,
    estimated_calories: r.calories,
    prep_time: r.time,
    missing_ingredients: [],
    source_type: "local",
    source_name: "GymSathi curated",
    trusted_score: 95,
  };
});

export const RECIPE_FILTERS: { key: RecipeTag; label: string }[] = [
  { key: "high-protein", label: "High protein" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "eggetarian", label: "Eggetarian" },
  { key: "chicken", label: "Chicken" },
  { key: "fish", label: "Fish" },
  { key: "no-cook", label: "No-cook" },
  { key: "quick", label: "15-min" },
  { key: "meal-prep", label: "Meal prep" },
  { key: "budget", label: "Budget" },
  { key: "post-workout", label: "Post-workout" },
  { key: "sweet", label: "Sweet" },
  { key: "indian", label: "Indian" },
  { key: "mediterranean", label: "Mediterranean" },
  { key: "mexican-inspired", label: "Mexican" },
  { key: "middle-eastern", label: "Middle Eastern" },
  { key: "asian-inspired", label: "Asian" },
  { key: "canadian-grocery", label: "Canadian grocery" },
  { key: "western-gym", label: "Western gym" },
  { key: "halal-friendly", label: "Halal-friendly" },
  { key: "dairy-free", label: "Dairy-free" },
  { key: "gluten-free", label: "Gluten-free" },
];
