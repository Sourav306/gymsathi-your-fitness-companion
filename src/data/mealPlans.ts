export type DietType = "Vegetarian" | "Non-Vegetarian" | "Eggetarian";
export type MealPlanTag = "muscle-gain" | "fat-loss" | "vegetarian" | "non-veg" | "budget";

export interface MealDay {
  day: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  totalCalories: number;
  totalProtein: number;
}

export interface MealPlan {
  id: string;
  name: string;
  goal: string;
  dietType: DietType;
  calories: number;
  protein: number;
  description: string;
  tags: MealPlanTag[];
  days: MealDay[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function rotate(items: Omit<MealDay, "day">[]): MealDay[] {
  return DAYS.map((d, i) => ({ day: d, ...items[i % items.length] }));
}

export const MEAL_PLANS: MealPlan[] = [
  {
    id: "muscle-gain-7day",
    name: "7-Day Muscle Gain Meal Plan",
    goal: "Muscle gain",
    dietType: "Non-Vegetarian",
    calories: 2800,
    protein: 180,
    description: "High-calorie, protein-packed Indian meals to support training and recovery.",
    tags: ["muscle-gain", "non-veg"],
    days: rotate([
      { breakfast: "4 egg bhurji + 2 multigrain rotis + banana", lunch: "Chicken curry + 1 cup rice + dal + salad", snack: "Whey shake + 30g almonds", dinner: "Grilled chicken + roti + sabzi + curd", totalCalories: 2800, totalProtein: 185 },
      { breakfast: "Oats with milk, peanut butter & banana", lunch: "Rajma + rice + 2 boiled eggs + salad", snack: "Paneer sandwich + buttermilk", dinner: "Fish curry + roti + veggies", totalCalories: 2780, totalProtein: 175 },
      { breakfast: "Paneer paratha + curd + 2 eggs", lunch: "Chicken biryani + raita + salad", snack: "Whey shake + apple + nuts", dinner: "Egg curry + roti + dal", totalCalories: 2820, totalProtein: 188 },
      { breakfast: "Besan chilla + curd + boiled eggs", lunch: "Mutton curry + rice + salad", snack: "Sprouts chaat + buttermilk", dinner: "Tandoori chicken + roti + veggies", totalCalories: 2850, totalProtein: 190 },
    ]),
  },
  {
    id: "fat-loss-7day",
    name: "7-Day Fat Loss Meal Plan",
    goal: "Fat loss",
    dietType: "Non-Vegetarian",
    calories: 1700,
    protein: 140,
    description: "Calorie-controlled Indian meals that keep you full and protein high.",
    tags: ["fat-loss", "non-veg"],
    days: rotate([
      { breakfast: "3 egg-white omelet + 1 whole egg + 1 roti", lunch: "Grilled chicken + salad + dal", snack: "Greek yogurt + apple", dinner: "Chicken stew + 1 roti + sabzi", totalCalories: 1680, totalProtein: 142 },
      { breakfast: "Oats + whey + berries", lunch: "Fish curry + 1 cup rice + salad", snack: "Boiled chana + cucumber", dinner: "Egg curry + 1 roti + veggies", totalCalories: 1700, totalProtein: 138 },
      { breakfast: "Moong dal chilla + curd", lunch: "Chicken tikka + dal + salad", snack: "Buttermilk + handful nuts", dinner: "Soup + paneer bhurji + roti", totalCalories: 1690, totalProtein: 140 },
    ]),
  },
  {
    id: "veg-high-protein",
    name: "Vegetarian High-Protein Plan",
    goal: "Muscle gain (veg)",
    dietType: "Vegetarian",
    calories: 2400,
    protein: 150,
    description: "Pure veg, high-protein Indian meals using paneer, dal, soya, and dairy.",
    tags: ["muscle-gain", "vegetarian"],
    days: rotate([
      { breakfast: "Paneer paratha + curd + milk", lunch: "Rajma + rice + salad + curd", snack: "Whey shake + banana", dinner: "Soya chunks curry + 2 rotis + sabzi", totalCalories: 2420, totalProtein: 152 },
      { breakfast: "Besan chilla + curd + milk", lunch: "Chole + rice + paneer bhurji", snack: "Sprouts chaat + buttermilk", dinner: "Paneer tikka + roti + dal", totalCalories: 2400, totalProtein: 148 },
      { breakfast: "Oats + milk + peanut butter + banana", lunch: "Dal + rice + paneer sabzi + salad", snack: "Greek yogurt + nuts", dinner: "Tofu stir fry + 2 rotis", totalCalories: 2380, totalProtein: 150 },
    ]),
  },
  {
    id: "nonveg-muscle",
    name: "Non-Veg Muscle Gain Plan",
    goal: "Muscle gain",
    dietType: "Non-Vegetarian",
    calories: 3000,
    protein: 200,
    description: "Aggressive bulking plan built around chicken, eggs, and fish.",
    tags: ["muscle-gain", "non-veg"],
    days: rotate([
      { breakfast: "5 eggs + 3 rotis + banana + milk", lunch: "Chicken + rice + dal + salad", snack: "Whey + 30g almonds + 1 fruit", dinner: "Fish + roti + sabzi + curd", totalCalories: 3020, totalProtein: 205 },
      { breakfast: "Oats + whey + peanut butter + banana", lunch: "Chicken biryani + raita + salad", snack: "Paneer wrap + buttermilk", dinner: "Egg curry + roti + dal", totalCalories: 2990, totalProtein: 198 },
    ]),
  },
  {
    id: "budget-student",
    name: "Budget Student Meal Plan",
    goal: "Affordable & balanced",
    dietType: "Eggetarian",
    calories: 2200,
    protein: 130,
    description: "Cheap, simple Indian meals using eggs, dal, soya, and curd.",
    tags: ["budget", "muscle-gain"],
    days: rotate([
      { breakfast: "3 eggs + 2 rotis + tea", lunch: "Dal + rice + curd + salad", snack: "Peanuts + banana", dinner: "Soya curry + 2 rotis", totalCalories: 2200, totalProtein: 132 },
      { breakfast: "Poha + 2 boiled eggs", lunch: "Chana + rice + curd", snack: "Sprouts + buttermilk", dinner: "Egg curry + 2 rotis", totalCalories: 2180, totalProtein: 128 },
    ]),
  },
  {
    id: "work-shift",
    name: "Work Shift Meal Plan",
    goal: "Easy meals for long work hours",
    dietType: "Non-Vegetarian",
    calories: 2300,
    protein: 150,
    description: "Prep-friendly meals you can pack and eat between shifts.",
    tags: ["muscle-gain", "non-veg"],
    days: rotate([
      { breakfast: "Overnight oats + whey + banana", lunch: "Chicken + rice + salad (meal prepped)", snack: "Boiled eggs + fruit", dinner: "Dal + roti + paneer sabzi", totalCalories: 2300, totalProtein: 152 },
      { breakfast: "Egg sandwich + milk", lunch: "Chicken wrap + curd", snack: "Whey shake + nuts", dinner: "Khichdi + curd + omelet", totalCalories: 2280, totalProtein: 148 },
    ]),
  },
];

export const MEAL_PLAN_FILTERS: { key: MealPlanTag; label: string }[] = [
  { key: "muscle-gain", label: "Muscle gain" },
  { key: "fat-loss", label: "Fat loss" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "non-veg", label: "Non-veg" },
  { key: "budget", label: "Budget" },
];
