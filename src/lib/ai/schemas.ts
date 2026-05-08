import { z } from "zod";

export const UserProfileSchema = z.object({
  age: z.number().int().min(10).max(100),
  gender: z.enum(["male", "female", "other"]),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(250),
  goal: z.enum(["lose_fat", "gain_muscle", "maintain", "improve_fitness"]),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  gym_access: z.enum(["full_gym", "home", "no_equipment"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  injuries: z.string().max(500).optional().default(""),
  diet_preference: z.enum(["vegetarian", "non_vegetarian", "vegan", "eggetarian"]),
  allergies: z.string().max(300).optional().default(""),
  disliked_foods: z.string().max(300).optional().default(""),
  cuisine_preference: z.enum(["indian", "punjabi", "canadian_simple", "mixed"]),
  weekly_budget: z.number().min(0).max(2000).optional().nullable(),
  cooking_time_min: z.number().min(5).max(180).optional().nullable(),
  meal_prep_days: z.number().int().min(0).max(7).optional().nullable(),
  meals_per_day: z.number().int().min(2).max(6).optional().nullable(),
  target_protein: z.number().int().min(20).max(300).optional().nullable(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const MealSchema = z.object({
  name: z.string(),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number(),
  protein: z.number(),
  ingredients: z.array(z.string()),
  prep: z.string().optional().default(""),
});
export type Meal = z.infer<typeof MealSchema>;

export const MealDaySchema = z.object({
  day: z.string(),
  meals: z.array(MealSchema),
  totalCalories: z.number(),
  totalProtein: z.number(),
});

export const GroceryListSchema = z.array(z.object({
  category: z.string(),
  items: z.array(z.string()),
}));

export const MealPlanSchema = z.object({
  name: z.string(),
  summary: z.string(),
  days: z.array(MealDaySchema).min(1),
  grocery: GroceryListSchema,
  storage: z.string(),
  budgetTips: z.array(z.string()),
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export const WorkoutExerciseSchema = z.object({
  name: z.string(),
  muscle: z.string(),
  sets: z.number(),
  reps: z.string(),
  rest: z.string(),
  formTip: z.string(),
  commonMistake: z.string(),
  difficulty: z.string(),
});
export const WorkoutDaySchema = z.object({
  day: z.string(),
  focus: z.string(),
  durationMin: z.number(),
  exercises: z.array(WorkoutExerciseSchema),
});
export const WorkoutPlanSchema = z.object({
  name: z.string(),
  summary: z.string(),
  days: z.array(WorkoutDaySchema).min(1),
});
export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;

export const DailyRecommendationSchema = z.object({
  date: z.string(),
  caloriesTarget: z.number(),
  proteinTarget: z.number(),
  workoutFocus: z.string(),
  workoutSummary: z.string(),
  recipeName: z.string(),
  recipeId: z.string().optional(),
  groceryNote: z.string(),
  tip: z.string(),
});
export type DailyRecommendation = z.infer<typeof DailyRecommendationSchema>;

export const RecentProgressInputSchema = z.object({
  daysLogged: z.number().int().min(0),
  avgProtein: z.number().nullable(),
  avgCalories: z.number().nullable(),
  workoutCompletionRate: z.number().min(0).max(1).nullable(),
  mealCompletionRate: z.number().min(0).max(1).nullable(),
  latestWeightKg: z.number().nullable(),
  weightTrend: z.enum(["up", "down", "flat", "unknown"]),
}).optional().nullable();

export const CoachInputSchema = z.object({
  profile: UserProfileSchema,
  recentProgress: RecentProgressInputSchema,
});
export type CoachInput = z.infer<typeof CoachInputSchema>;
