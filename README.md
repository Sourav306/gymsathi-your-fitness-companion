# GymSathi

GymSathi is a beginner-friendly fitness companion built for people who want simple gym guidance, clear exercise education, and practical high-protein Indian meal ideas in one place. The MVP focuses on helping users discover workouts, learn safe exercise form, estimate calorie and protein targets, and save favorite content after signing in.

## Main Features

- **Exercise library**: Browse gym movements by muscle group and difficulty, with equipment details, summaries, step-by-step instructions, common mistakes, tips, and YouTube video previews.
- **Workout plans**: Follow structured beginner and intermediate routines, including full-body, push/pull/legs, and home fat-loss plans.
- **High-protein meals**: Explore Indian-friendly meal ideas with protein, calories, prep time, ingredients, steps, and dietary tags.
- **Calorie and protein calculator**: Estimate daily calorie, TDEE, and protein targets using user inputs such as age, height, weight, activity level, and goal.
- **Authentication**: Sign up, sign in, sign out, and use Google OAuth through Supabase/Lovable auth integration.
- **Saved favorites**: Save exercises, recipes, and plans to a personalized favorites page.
- **Responsive UI**: Desktop top navigation and mobile bottom navigation for a clean experience across screen sizes.

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router, TanStack Start, TanStack Query
- **Build tooling**: Vite, Lovable TanStack Vite config, Cloudflare Vite plugin
- **Styling**: Tailwind CSS, Radix UI primitives, lucide-react icons
- **Backend services**: Supabase Auth and Supabase database client
- **Developer tooling**: ESLint, Prettier
- **Package manager**: npm (`package-lock.json` is included)

## Run Locally

### Prerequisites

- Node.js 22 or newer is recommended, especially because the Cloudflare tooling in this project targets modern Node versions.
- A Supabase project with authentication enabled.

### Setup

1. Clone the repository:

```bash
git clone https://github.com/Sourav306/gymsathi-your-fitness-companion.git
cd gymsathi-your-fitness-companion
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
cp .env.example .env.local
```

If `.env.example` is not present yet, create `.env.local` manually and add the variables listed below.

4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown in your terminal, usually:

```text
http://localhost:5173
```

### Useful Scripts

```bash
npm run dev        # Start the Vite development server
npm run build      # Create a production build
npm run build:dev  # Create a development-mode build
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
npm run format     # Format files with Prettier
```

## Supabase Environment Variables

The Supabase client supports Vite client-side variables and server-side fallback variables.

For local Vite development, add these to `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
```

For server-side or deployment environments, the app can also read:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
```

Notes:

- Use the Supabase project URL from **Project Settings > API**.
- Use the publishable/anon key intended for browser clients.
- Do not commit `.env.local` or private service-role keys.
- Auth-backed features such as profile and saved favorites require Supabase Auth to be configured.

## Current MVP Status

GymSathi is currently an MVP with the core user journey in place:

- Static fitness content is available for exercises, workout plans, and recipes.
- Users can calculate calorie and protein targets.
- Users can create an account, sign in, and sign out.
- Signed-in users can save and view favorites.
- The UI is responsive and ready for early user testing.

Planned next steps could include progress tracking, custom workout generation, richer recipe filtering, user profile goals, and more complete Supabase database documentation.

## Project Structure

```text
src/
  components/          Reusable layout and UI components
  data/                Static exercise, recipe, and workout plan data
  hooks/               Auth and favorites hooks
  integrations/        Supabase and Lovable integration code
  routes/              TanStack Router pages
  styles.css           Global styling and design tokens
```
