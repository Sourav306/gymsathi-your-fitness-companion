import type { UserProfile } from "./schemas";

export function calcTargets(
  p: Pick<
    UserProfile,
    "age" | "gender" | "height_cm" | "weight_kg" | "activity_level" | "goal" | "target_protein"
  >,
) {
  const s = p.gender === "female" ? -161 : 5;
  const bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + s;
  const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }[
    p.activity_level
  ];
  let calories = bmr * mult;
  if (p.goal === "lose_fat") calories -= 400;
  else if (p.goal === "gain_muscle") calories += 300;
  const protein =
    p.target_protein ?? Math.round(p.weight_kg * (p.goal === "gain_muscle" ? 2 : 1.8));
  return { calories: Math.round(calories), protein };
}
