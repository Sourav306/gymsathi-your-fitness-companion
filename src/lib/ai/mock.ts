import type { UserProfile, MealPlan, WorkoutPlan, DailyRecommendation } from "./schemas";
import { calcTargets } from "./targets";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pickMeals(p: UserProfile) {
  const veg = p.diet_preference === "vegetarian" || p.diet_preference === "vegan";
  const noEgg = p.diet_preference === "vegan" || p.diet_preference === "vegetarian";
  const dislikes = (p.disliked_foods || "").toLowerCase();
  const allergies = (p.allergies || "").toLowerCase();
  const blocked = (s: string) => {
    const l = s.toLowerCase();
    return (dislikes && dislikes.split(/[,\s]+/).some(w => w && l.includes(w))) ||
           (allergies && allergies.split(/[,\s]+/).some(w => w && l.includes(w)));
  };

  const protein = veg
    ? ["Paneer bhurji", "Soya chunk masala", "Rajma + rice", "Tofu stir-fry", "Moong dal chilla", "Chana masala"]
    : ["Grilled chicken + rice", "Chicken curry + roti", "Fish curry + rice", "Egg bhurji + roti", "Chicken tikka bowl", "Mutton keema"];
  const breakfast = noEgg
    ? ["Oats + milk + peanut butter + banana", "Besan chilla + curd", "Paneer paratha + curd", "Sprouts chaat + buttermilk"]
    : ["3 eggs + 2 multigrain rotis", "Egg bhurji + toast", "Oats + whey + banana", "Paneer paratha + 1 egg"];
  const snacks = ["Whey shake + 30g almonds", "Greek yogurt + apple", "Sprouts + buttermilk", "Boiled chana + cucumber"];

  return { protein: protein.filter(s => !blocked(s)), breakfast: breakfast.filter(s => !blocked(s)), snacks: snacks.filter(s => !blocked(s)) };
}

export function mockMealPlan(p: UserProfile): MealPlan {
  const { calories, protein } = calcTargets(p);
  const pool = pickMeals(p);
  const perMeal = Math.round(calories / 4);
  const proteinPerMeal = Math.round(protein / 4);
  const days = DAYS.map((d, i) => ({
    day: d,
    meals: [
      { name: pool.breakfast[i % pool.breakfast.length] || "Oats + milk", type: "breakfast" as const, calories: perMeal, protein: proteinPerMeal, ingredients: ["See instructions"], prep: "Cook fresh in the morning." },
      { name: pool.protein[i % pool.protein.length] || "Dal + rice", type: "lunch" as const, calories: perMeal, protein: proteinPerMeal + 5, ingredients: ["See instructions"], prep: "Pre-cook protein and grain in batches." },
      { name: pool.snacks[i % pool.snacks.length] || "Yogurt + nuts", type: "snack" as const, calories: Math.round(perMeal * 0.6), protein: Math.round(proteinPerMeal * 0.6), ingredients: ["See instructions"], prep: "Pre-portion in containers." },
      { name: pool.protein[(i + 1) % pool.protein.length] || "Soya + roti", type: "dinner" as const, calories: perMeal, protein: proteinPerMeal + 5, ingredients: ["See instructions"], prep: "Reheat from prep batch." },
    ],
    totalCalories: calories,
    totalProtein: protein,
  }));

  const veg = p.diet_preference === "vegetarian" || p.diet_preference === "vegan";
  return {
    name: `${p.goal.replace("_", " ")} 7-day plan`,
    summary: `Approx ${calories} kcal / ${protein}g protein per day. Adjusted to your ${p.diet_preference.replace("_", "-")} preference.`,
    days,
    grocery: [
      { category: "Protein", items: veg ? ["Paneer 1kg", "Soya chunks 500g", "Tofu 500g", "Greek yogurt 1kg", "Whey protein"] : ["Chicken breast 2kg", "Fish 500g", "Eggs 24", "Paneer 250g", "Whey protein"] },
      { category: "Grains", items: ["Brown rice 2kg", "Multigrain atta 1kg", "Oats 500g", "Quinoa 500g"] },
      { category: "Dal & Legumes", items: ["Rajma 500g", "Chana 500g", "Moong dal 500g"] },
      { category: "Veggies", items: ["Onion 2kg", "Tomato 1kg", "Spinach 500g", "Cucumber 500g", "Coriander"] },
      { category: "Pantry", items: ["Cooking oil", "Spices", "Peanut butter", "Almonds 250g", "Milk 4L"] },
    ],
    storage: "Cook proteins and grains in batches and store in airtight containers in the fridge for 3 days. Freeze portions for days 4–7.",
    budgetTips: [
      "Buy whole chicken or eggs in bulk to save money.",
      "Soaked dal and rajma are cheaper than packaged proteins.",
      "Use seasonal vegetables to keep costs low.",
    ],
  };
}

export function mockWorkoutPlan(p: UserProfile): WorkoutPlan {
  const homeOnly = p.gym_access === "home" || p.gym_access === "no_equipment";
  const beginner = p.experience === "beginner";
  const ex = (name: string, muscle: string, sets = 3, reps = "8-12", rest = "60 sec", tip = "Move with control.", mistake = "Rushing reps.") => ({
    name, muscle, sets, reps, rest, formTip: tip, commonMistake: mistake, difficulty: beginner ? "Beginner" : "Intermediate",
  });

  const fullGym = [
    { day: "Mon", focus: "Upper", durationMin: 45, exercises: [ex("Machine Chest Press", "Chest"), ex("Lat Pulldown", "Back"), ex("Shoulder Press Machine", "Shoulders"), ex("Bicep Curl", "Arms"), ex("Tricep Pushdown", "Arms")] },
    { day: "Tue", focus: "Lower", durationMin: 45, exercises: [ex("Leg Press", "Legs", 3, "10-12", "90 sec"), ex("Leg Curl", "Legs"), ex("Leg Extension", "Legs"), ex("Calf Raise", "Legs", 3, "12-15", "45 sec")] },
    { day: "Thu", focus: "Push", durationMin: 45, exercises: [ex("Incline Dumbbell Press", "Chest"), ex("Lateral Raise", "Shoulders"), ex("Cable Fly", "Chest"), ex("Overhead Tricep", "Arms")] },
    { day: "Fri", focus: "Pull + Core", durationMin: 45, exercises: [ex("Seated Row", "Back"), ex("Chest Supported Row", "Back"), ex("Hammer Curl", "Arms"), ex("Plank", "Core", 3, "30 sec", "45 sec")] },
  ];
  const home = [
    { day: "Mon", focus: "Full Body A", durationMin: 30, exercises: [ex("Push-Up", "Chest"), ex("Goblet Squat", "Legs", 3, "12", "60 sec"), ex("Plank", "Core", 3, "30 sec", "45 sec"), ex("Mountain Climbers", "Core", 3, "30 sec", "45 sec")] },
    { day: "Wed", focus: "Lower + Core", durationMin: 30, exercises: [ex("Walking Lunges", "Legs", 3, "10/leg", "60 sec"), ex("Romanian Deadlift", "Legs"), ex("Russian Twist", "Core", 3, "20", "45 sec"), ex("Plank", "Core", 3, "30 sec", "45 sec")] },
    { day: "Fri", focus: "Cardio + Push", durationMin: 30, exercises: [ex("Burpee", "Full Body", 4, "10", "45 sec"), ex("Push-Up", "Chest"), ex("Mountain Climbers", "Core", 3, "30 sec", "45 sec")] },
  ];

  const days = homeOnly ? home : fullGym;
  return {
    name: `${p.goal.replace("_", " ")} ${homeOnly ? "home" : "gym"} plan`,
    summary: `${beginner ? "Beginner-safe" : "Intermediate"} ${homeOnly ? "home" : "gym"} routine for ${p.goal.replace("_", " ")}. ${p.injuries ? `Avoid moves that aggravate: ${p.injuries}.` : ""}`,
    days,
  };
}

export function mockDailyRecommendation(p: UserProfile, recipeName: string, recipeId?: string): DailyRecommendation {
  const { calories, protein } = calcTargets(p);
  const today = new Date();
  return {
    date: today.toISOString().slice(0, 10),
    caloriesTarget: calories,
    proteinTarget: protein,
    workoutFocus: p.gym_access === "no_equipment" ? "Bodyweight full body" : p.goal === "lose_fat" ? "Strength + conditioning" : "Strength session",
    workoutSummary: "30–45 minute focused session. Warm up 5 min before lifting.",
    recipeName,
    recipeId,
    groceryNote: "Pick up Greek yogurt, eggs/paneer, oats, and a leafy vegetable to stay on track this week.",
    tip: p.goal === "gain_muscle"
      ? "Hit your protein target every day. Spread it over 3–4 meals."
      : p.goal === "lose_fat"
      ? "Stay in a small deficit. Walk 8k steps and prioritise protein."
      : "Be consistent. Sleep 7+ hours and train 3–4×/week.",
  };
}
