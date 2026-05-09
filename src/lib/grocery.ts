import type { MealPlan } from "@/lib/ai/schemas";

export function flattenGrocery(plan: MealPlan): string {
  const lines: string[] = [`Grocery List — ${plan.name}`, ""];
  for (const g of plan.grocery) {
    lines.push(`## ${g.category}`);
    for (const it of g.items) lines.push(`- ${it}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function flattenPrep(plan: MealPlan): string {
  const lines: string[] = [`Meal Prep — ${plan.name}`, "", plan.storage, ""];
  for (const d of plan.days) {
    lines.push(`## ${d.day}  (${d.totalCalories} kcal · ${d.totalProtein}g protein)`);
    for (const m of d.meals) {
      lines.push(`- [${m.type}] ${m.name} — ${m.calories} kcal, ${m.protein}g protein`);
      if (m.prep) lines.push(`    ${m.prep}`);
    }
    lines.push("");
  }
  if (plan.budgetTips.length) {
    lines.push("## Budget tips");
    for (const t of plan.budgetTips) lines.push(`- ${t}`);
  }
  return lines.join("\n").trim();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  return false;
}
