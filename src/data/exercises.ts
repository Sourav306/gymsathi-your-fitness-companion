export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms" | "Core" | "Full Body";

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  difficulty: Difficulty;
  equipment: string;
  youtubeId: string;
  summary: string;
  steps: string[];
  mistakes: string[];
  tips: string[];
}

export const EXERCISES: Exercise[] = [
  { id: "push-up", name: "Push-Up", muscle: "Chest", difficulty: "Beginner", equipment: "Bodyweight", youtubeId: "IODxDxX7oi4", summary: "Classic upper body builder. Works chest, shoulders, and triceps.", steps: ["Start in a high plank, hands under shoulders.","Keep body in a straight line from head to heels.","Lower chest until elbows are at 90°.","Push back up to start position."], mistakes: ["Sagging hips","Flaring elbows out wide","Not lowering full range"], tips: ["Start on knees if too hard","Squeeze glutes and core","Breathe in down, out up"] },
  { id: "bench-press", name: "Barbell Bench Press", muscle: "Chest", difficulty: "Intermediate", equipment: "Barbell + Bench", youtubeId: "rT7DgCr-3pg", summary: "King of chest exercises for strength and size.", steps: ["Lie flat, eyes under the bar.","Grip slightly wider than shoulders.","Unrack and lower bar to mid-chest.","Press up powerfully."], mistakes: ["Bouncing bar off chest","Flaring elbows 90°","Lifting hips off bench"], tips: ["Always use a spotter","Keep wrists straight","Tuck elbows ~45°"] },
  { id: "incline-db-press", name: "Incline Dumbbell Press", muscle: "Chest", difficulty: "Beginner", equipment: "Dumbbells", youtubeId: "8iPEnn-ltC8", summary: "Targets the upper chest for a fuller look.", steps: ["Set bench to 30–45°.","Press dumbbells overhead with palms forward.","Lower to chest with control.","Press back up."], mistakes: ["Bench too steep (becomes shoulder press)","Locking elbows hard"], tips: ["Keep slight bend in elbows at top","Squeeze chest at the top"] },

  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "Back", difficulty: "Beginner", equipment: "Cable Machine", youtubeId: "CAwf7n6Luuc", summary: "Builds wide back and lat development.", steps: ["Sit, knees under pad, grip wide.","Pull bar to upper chest, elbows down.","Squeeze lats, return slow."], mistakes: ["Leaning back too far","Pulling behind neck"], tips: ["Lead with elbows, not hands","Imagine pulling elbows into pockets"] },
  { id: "deadlift", name: "Conventional Deadlift", muscle: "Back", difficulty: "Advanced", equipment: "Barbell", youtubeId: "op9kVnSso6Q", summary: "Full-body strength builder. Master form first.", steps: ["Bar over mid-foot, shins close.","Hinge, grip bar shoulder-width.","Brace core, drive through floor.","Stand tall, lock out hips."], mistakes: ["Rounding lower back","Bar drifting away","Hyperextending at top"], tips: ["Start light and learn form","Keep neck neutral","Use a mirror or record yourself"] },
  { id: "seated-row", name: "Seated Cable Row", muscle: "Back", difficulty: "Beginner", equipment: "Cable Machine", youtubeId: "GZbfZ033f74", summary: "Thickens mid-back and improves posture.", steps: ["Sit tall, slight knee bend.","Pull handle to belly.","Squeeze shoulder blades."], mistakes: ["Using too much momentum","Hunching shoulders"], tips: ["Keep chest up","Pause 1 second at the squeeze"] },

  { id: "squat", name: "Barbell Back Squat", muscle: "Legs", difficulty: "Intermediate", equipment: "Barbell + Rack", youtubeId: "ultWZbUMPL8", summary: "Best lower body builder for strength and size.", steps: ["Bar on upper traps, feet shoulder-width.","Brace, sit hips back and down.","Thighs to parallel or below.","Drive up through mid-foot."], mistakes: ["Knees caving in","Heels lifting","Excessive forward lean"], tips: ["Warm up with bodyweight","Use shoes with flat sole","Keep chest proud"] },
  { id: "goblet-squat", name: "Goblet Squat", muscle: "Legs", difficulty: "Beginner", equipment: "Dumbbell", youtubeId: "MeIiIdhvXT4", summary: "Beginner-friendly squat to learn the pattern.", steps: ["Hold dumbbell at chest.","Squat down keeping chest tall.","Stand back up."], mistakes: ["Rounding back","Knees collapsing"], tips: ["Push knees out","Go as low as comfortable"] },
  { id: "lunges", name: "Walking Lunges", muscle: "Legs", difficulty: "Beginner", equipment: "Bodyweight / DBs", youtubeId: "L8fvypPrzzs", summary: "Builds legs and glutes with balance work.", steps: ["Step forward into a lunge.","Drop back knee toward floor.","Push off front foot to switch sides."], mistakes: ["Front knee past toes too far","Looking down"], tips: ["Take long enough steps","Keep torso upright"] },
  { id: "rdl", name: "Romanian Deadlift", muscle: "Legs", difficulty: "Intermediate", equipment: "Barbell / DBs", youtubeId: "JCXUYuzwNrM", summary: "Hamstring and glute focused hinge.", steps: ["Soft knees, hinge at hips.","Lower weight along legs.","Stop when you feel hamstring stretch.","Drive hips forward to stand."], mistakes: ["Squatting instead of hinging","Rounding back"], tips: ["Keep bar close to body","Push hips back, not down"] },

  { id: "ohp", name: "Overhead Press", muscle: "Shoulders", difficulty: "Intermediate", equipment: "Barbell", youtubeId: "2yjwXTZQDDI", summary: "Builds strong, capped shoulders.", steps: ["Bar at shoulders, elbows in front.","Brace core, press overhead.","Lock out, return controlled."], mistakes: ["Excessive back arch","Pressing in front, not overhead"], tips: ["Squeeze glutes","Get head 'through' at top"] },
  { id: "lateral-raise", name: "Dumbbell Lateral Raise", muscle: "Shoulders", difficulty: "Beginner", equipment: "Dumbbells", youtubeId: "3VcKaXpzqRo", summary: "Best isolation for side delts and shoulder width.", steps: ["Stand tall, slight elbow bend.","Raise arms out to shoulder height.","Lower with control."], mistakes: ["Using momentum","Going too heavy"], tips: ["Lead with elbows","Light weight, strict form"] },

  { id: "bicep-curl", name: "Dumbbell Bicep Curl", muscle: "Arms", difficulty: "Beginner", equipment: "Dumbbells", youtubeId: "ykJmrZ5v0Oo", summary: "Classic arm builder.", steps: ["Stand tall, palms forward.","Curl dumbbells up.","Squeeze biceps, lower slow."], mistakes: ["Swinging body","Half reps"], tips: ["Keep elbows pinned to sides","Slow on the way down"] },
  { id: "tricep-pushdown", name: "Tricep Rope Pushdown", muscle: "Arms", difficulty: "Beginner", equipment: "Cable Machine", youtubeId: "vB5OHsJ3EME", summary: "Builds the back of the arms.", steps: ["Grip rope, elbows pinned.","Push down and split rope at bottom.","Slowly return."], mistakes: ["Elbows flaring forward","Using shoulders to push"], tips: ["Keep upper arms still","Pause at the bottom"] },
  { id: "hammer-curl", name: "Hammer Curl", muscle: "Arms", difficulty: "Beginner", equipment: "Dumbbells", youtubeId: "zC3nLlEvin4", summary: "Targets brachialis for thicker arms.", steps: ["Palms facing each other.","Curl up keeping wrists neutral.","Lower with control."], mistakes: ["Swinging","Rotating wrists"], tips: ["Squeeze at the top","Use a moderate weight"] },

  { id: "plank", name: "Plank", muscle: "Core", difficulty: "Beginner", equipment: "Bodyweight", youtubeId: "ASdvN_XEl_c", summary: "Builds full core stability and posture.", steps: ["Forearms on floor, elbows under shoulders.","Body in a straight line.","Brace core and glutes.","Hold for time."], mistakes: ["Hips sagging or spiking","Holding breath"], tips: ["Start with 20s holds","Breathe normally"] },
  { id: "hanging-leg-raise", name: "Hanging Leg Raise", muscle: "Core", difficulty: "Intermediate", equipment: "Pull-up Bar", youtubeId: "Pr1ieGZ5atk", summary: "Builds lower abs and grip.", steps: ["Hang from bar, shoulders engaged.","Raise legs to 90° (or higher).","Lower slowly without swinging."], mistakes: ["Swinging body","Using momentum"], tips: ["Start with knee raises","Exhale as you lift"] },
  { id: "russian-twist", name: "Russian Twist", muscle: "Core", difficulty: "Beginner", equipment: "Bodyweight / Plate", youtubeId: "wkD8rjkodUI", summary: "Targets obliques and rotational strength.", steps: ["Sit with knees bent, lean back slightly.","Twist torso side to side."], mistakes: ["Just moving arms","Rounding back"], tips: ["Keep chest tall","Move from the core"] },

  { id: "burpee", name: "Burpee", muscle: "Full Body", difficulty: "Intermediate", equipment: "Bodyweight", youtubeId: "auBLPXO8Fww", summary: "High-intensity full-body conditioning.", steps: ["Squat down, hands on floor.","Jump feet back to plank.","Push-up, jump feet in, jump up."], mistakes: ["Sloppy plank","Skipping the push-up"], tips: ["Pace yourself","Land softly"] },
  { id: "kb-swing", name: "Kettlebell Swing", muscle: "Full Body", difficulty: "Intermediate", equipment: "Kettlebell", youtubeId: "YSxHifyI6s8", summary: "Powerful hip hinge for posterior chain and cardio.", steps: ["Hinge, hike kettlebell back.","Drive hips forward.","Let bell float to chest level."], mistakes: ["Squatting instead of hinging","Lifting with arms"], tips: ["Power comes from hips","Keep arms relaxed"] },
];

export const MUSCLES: MuscleGroup[] = ["Chest","Back","Legs","Shoulders","Arms","Core","Full Body"];
